// Eventbrite v3 client. Dormant unless EVENTBRITE_TOKEN + EVENTBRITE_ORG_ID are set.
// Built against the documented API; verify against a real org token before relying on it.
const BASE = 'https://www.eventbriteapi.com/v3';

export function ebConfig() {
  return {
    token: process.env.EVENTBRITE_TOKEN || '',
    orgId: process.env.EVENTBRITE_ORG_ID || ''
  };
}

export function ebConfigured() {
  const { token, orgId } = ebConfig();
  return Boolean(token && orgId);
}

async function ebFetch(path, { method = 'GET', body } = {}) {
  const { token } = ebConfig();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error_description || data?.error || `Eventbrite ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Map an Eventbrite event object to our events-table shape.
function mapEbEvent(e) {
  const startLocal = e.start?.local || '';
  const [datePart, timePart] = startLocal.split('T');
  const dateLabel = datePart
    ? new Date(datePart).toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })
    : 'TBC';
  const timeLabel = timePart
    ? new Date(`1970-01-01T${timePart}`).toLocaleTimeString('en-GB', { hour: 'numeric', minute: timePart.startsWith('00') ? undefined : '2-digit' }).replace(':00', '')
    : 'TBC';
  const status = e.status === 'live' ? 'Confirmed' : e.status === 'started' ? 'Selling' : 'Draft';
  return {
    eventbrite_id: e.id,
    title: e.name?.text || 'Untitled event',
    date_label: dateLabel,
    time_label: timeLabel,
    city: e.venue?.address?.city || 'Online',
    capacity: e.capacity || 100,
    img: e.logo?.url || null,
    status,
    url: e.url || null
  };
}

// Pull all org events (paginated).
export async function listOrgEvents() {
  const { orgId } = ebConfig();
  const out = [];
  let page = 1, more = true;
  while (more && page <= 20) {
    const data = await ebFetch(`/organizations/${orgId}/events/?status=live,draft,started,ended&page=${page}&expand=venue`);
    (data.events || []).forEach((e) => out.push(mapEbEvent(e)));
    more = data.pagination?.has_more_items;
    page = (data.pagination?.page_number || page) + 1;
  }
  return out;
}

// Attendee count for one Eventbrite event.
export async function eventAttendeeCount(eventbriteId) {
  const data = await ebFetch(`/events/${eventbriteId}/attendees/?page=1`);
  return data.pagination?.object_count ?? (data.attendees || []).length;
}

// Push a new event to Eventbrite. Returns { id, url }.
export async function createOrgEvent({ title, startUtc, endUtc, timezone = 'Europe/London', currency = 'GBP' }) {
  const { orgId } = ebConfig();
  const data = await ebFetch(`/organizations/${orgId}/events/`, {
    method: 'POST',
    body: {
      event: {
        name: { html: title },
        start: { timezone, utc: startUtc },
        end: { timezone, utc: endUtc },
        currency
      }
    }
  });
  return { id: data.id, url: data.url };
}
