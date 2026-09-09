/* ============================================================
   HBBA Global - Member, Sponsor, and Admin Portals
   ============================================================ */

/* ---------- Icons ---------- */
const icons = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 5 5 5-9 5 9 5-5-3 13H5L2 7Z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z"/></svg>',
  network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M10.4 7.6 6.6 16.4M13.6 7.6l3.8 8.8M8 19h8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m9 12 2 2 4-5"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-3"/><path d="M5 12h4v7H5zM15 12h4v7h-4z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16V8M12 16V5M17 16v-3"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 12L2 9l4-6Z"/><path d="M2 9h20M8 3l-2 6 6 12 6-12-2-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  command: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
};

/* ---------- Photos ---------- */


/* ---------- Page metadata ---------- */
const pageMeta = {
  dashboard:    ['Welcome back, John! <span class="wave">👋</span>', "Here's what's happening with your organization today."],
  crm:          ['CRM', 'Manage contacts, companies, leads, and relationship health.'],
  memberships:  ['Memberships', 'Track tiers, renewals, applications and benefits.'],
  events:       ['Events', 'Plan upcoming programs and monitor attendance.'],
  tickets:      ['Tickets', 'Manage ticket inventory, orders and check-ins.'],
  sponsors:     ['Sponsors', 'Coordinate sponsor packages, invoices and deliverables.'],
  networking:   ['Networking', 'Build introductions and relationship opportunities.'],
  tasks:        ['Tasks & Activities', 'Prioritize team work and upcoming reminders.'],
  email:        ['Email Marketing', 'Create campaigns and review engagement.'],
  support:      ['Support Tickets', 'Resolve member questions and operational issues.'],
  invoices:     ['Invoices & Payments', 'Monitor billing, collections and payment status.'],
  reports:      ['Reports & Analytics', 'Review organization performance and trends.'],
  settings:     ['Settings', 'Configure workspace, users, permissions and integrations.']
};

/* ---------- Data ---------- */
let metrics = [];


let activities = [];

let contacts = [];

let dealStages = [];

let membershipTiers = [];

let renewals = [];

let eventsCatalog = [];

let ticketRecords = [];

let sponsorList = [];

let introRequests = [];

let tasksData = { todo: [], doing: [], done: [] };

let campaigns = [];

let supportThreads = [];
let crmStats = { contacts: 0, companies: 0, hot: 0 };
let membershipStats = { members: 0, renewalsDue: 0, applications: 0 };
let campaignStats = { campaigns: 0, openRate: '—', clicks: 0 };
let campaignAudiences = [];
let outbox = [];
let networkStats = { introductions: 0, meetings: 0, matchRate: '—' };
let networkPeople = [];
let memberDirectory = [];
let crmFilter = 'All';
let statsRange = { label: 'This month', days: 30 };
const RANGE_DAYS = { Today: 1, 'This week': 7, 'This month': 30, 'This quarter': 90, 'This year': 365, 'All time': null };
let activeTicket = null;

let invoices = [];

let notifications = [];

/* ---------- Init icons ---------- */
function initIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || icons.star;
  });
}

/* ---------- Small components ---------- */
/* Events created in-app have no artwork; never emit <img src="null">. */
function eventImage(e, variant = 'row') {
  if (e.img) return `<img src="${e.img}" alt="" />`;
  return variant === 'card'
    ? '<div class="event-thumb-empty" aria-hidden="true"></div>'
    : '<span class="date-tile" style="background:var(--line)"></span>';
}

function avatar(src, presence) {
  const cls = presence ? `presence ${presence}` : '';
  return `<span class="${cls}"><img class="avatar" src="${src}" alt="" /></span>`;
}

function avatarGroup(srcs, more) {
  return `<div class="avatar-group">${srcs.slice(0, 4).map((s) => `<img class="avatar" src="${s}" alt="" />`).join('')}${more ? `<span class="more">+${more}</span>` : ''}</div>`;
}

function metricCards() {
  return `<div class="metric-grid">${metrics.map(([label, value, page, icon, color]) => `
    <button class="metric-card" type="button" data-page-link="${page}">
      <div class="metric-top">
        <span class="metric-icon" style="color:${color};background:${color}16">${icons[icon]}</span>
      </div>
      <h3>${value}</h3>
      <small>${label}</small>
    </button>`).join('')}</div>`;
}

function filterBar(searchPlaceholder, chips) {
  return `<div class="filterbar">
    <input class="search-input" type="search" placeholder="${searchPlaceholder}" />
    ${chips.map((c, i) => `<button class="filter-chip ${(c.active !== undefined ? c.active : i === 0) ? 'is-active' : ''}" type="button"${c.filter ? ` data-crm-filter="${c.filter}"` : ''}>${c.label}${c.count != null ? ` <i>${c.count}</i>` : ''}</button>`).join('')}
    <button class="control" type="button" data-export><span data-icon="download"></span>Export</button>
  </div>`;
}

function pagination(total, page = 1, perPage = 10) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);
  return `<div class="pagination">
    <small class="muted">Showing ${start}-${end} of ${total}</small>
    <div class="pages">
      <button type="button" ${page === 1 ? 'disabled' : ''}>‹</button>
      ${Array.from({ length: Math.min(pages, 5) }, (_, i) => `<button type="button" class="${i + 1 === page ? 'is-active' : ''}">${i + 1}</button>`).join('')}
      <button type="button" ${page === pages ? 'disabled' : ''}>›</button>
    </div>
  </div>`;
}

function emptyState(title, body, cta) {
  return `<div class="empty-state">
    <span class="emoji">📭</span>
    <h3>${title}</h3>
    <p>${body}</p>
    ${cta ? `<button class="primary-action" type="button" data-page-link="${cta.page}">${cta.label}</button>` : ''}
  </div>`;
}

function skeletonRows(n) {
  return Array.from({ length: n }, () => '<div class="skeleton skel-row"></div>').join('');
}

function donut() {
  const total = membershipTiers.reduce((n, t) => n + t.members, 0);
  if (!total) return emptyState('No members on a tier yet', 'Assign tiers from Memberships.');
  const shade = { gold: 'var(--gold)', silver: '#cfd3dc', bronze: '#bd6425' };
  return `<div class="donut-wrap">
    <div class="donut"></div>
    <div class="legend">
      ${membershipTiers.map((t) => `<div><span style="background:${shade[t.color] || 'var(--blue)'}"></span><strong>${t.name}</strong><p class="muted">${t.members} (${Math.round((t.members / total) * 100)}%)</p></div>`).join('')}
    </div>
  </div>
  <div class="mini-stats"><div><span class="muted">Renewals due (30d)</span><strong>${membershipStats.renewalsDue}</strong></div><div><span class="muted">Applications pending</span><strong>${membershipStats.applications}</strong></div></div>`;
}

function noticeBar() {
  if (adminIntegrations.email) return '';
  return `<div class="notice-bar">
    <strong>Email delivery is not connected.</strong>
    <span>Campaigns, invoice reminders and verification emails are recorded but not delivered until an email provider is configured.</span>
    <button type="button" data-page-link="settings">Open settings</button>
  </div>`;
}

function briefingCard() {
  const live = eventsCatalog.filter((e) => e.status !== 'Cancelled').length;
  const owed = invoices.filter((i) => i.status === 'due' || i.status === 'overdue').length;
  const pendingIntros = introRequests.filter((r) => r.status === 'pending').length;
  const lines = [
    `${live} live event(s) in the calendar, ${eventsCatalog.reduce((n, e) => n + (Number(e.attendees) || 0), 0)} booking(s) across them.`,
    `${crmStats.hot} active or warm contact(s) out of ${crmStats.contacts} in the CRM.`,
    `${membershipStats.renewalsDue} membership renewal(s) fall due in the next 30 days.`,
    owed ? `${owed} invoice(s) are still outstanding.` : 'Every issued invoice is settled.',
    pendingIntros ? `${pendingIntros} introduction request(s) waiting on you.` : 'No introduction requests waiting.'
  ];
  return `<section class="briefing-card">
    <div class="briefing-left">
      <span class="briefing-icon">${icons.gem}</span>
      <div>
        <span class="eyebrow">HBBA Daily Briefing</span>
        <small>${new Date().toLocaleString('en-GB')}</small>
      </div>
    </div>
    <div class="briefing-body">
      <h2>${live} event(s) · ${crmStats.contacts} contact(s) · ${membershipStats.members} member(s)</h2>
      <div class="briefing-grid">
        ${lines.slice(0, 4).map((l) => `<p><i></i> ${l}</p>`).join('')}
      </div>
    </div>
  </section>`;
}

function lineChart(color = '#1f3a73', vals = []) {
  if (!vals.length) return emptyState('No data yet', 'This chart fills in as activity is recorded.');
  const w = 600, h = 220, pad = 30;
  const max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => [pad + (i * (w - pad * 2) / (vals.length - 1)), h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts.at(-1)[0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    ${[0, 1, 2, 3].map((i) => `<line x1="${pad}" x2="${w - pad}" y1="${pad + i * (h - pad * 2) / 3}" y2="${pad + i * (h - pad * 2) / 3}" stroke="var(--line)" stroke-dasharray="2 4"/>`).join('')}
    <path d="${area}" fill="${color}" opacity="0.12"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
    ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${color}"/>`).join('')}
  </svg>`;
}

function statusPill(s) {
  const map = { Active: '', Confirmed: '', Paid: '', Resolved: '', In: '',
                Warm: 'warn', Renewal: 'warn', Pending: 'warn', Selling: 'warn', Due: 'warn',
                Open: 'danger', Overdue: 'danger', Refunded: 'danger', New: '', Draft: '' };
  return `<span class="status ${map[s] || ''}">${s}</span>`;
}

/* ===================== PAGE RENDERERS ===================== */

function dashboardPage() {
  const soon = eventsCatalog.filter((e) => e.status !== 'Cancelled').slice(0, 4);
  const openTasks = [...(tasksData.todo || []), ...(tasksData.doing || [])].slice(0, 4);
  return `
    ${noticeBar()}
    ${briefingCard()}
    ${metricCards()}
    <div class="dashboard-grid">
      <section class="card">
        <div class="card-title"><h2>Upcoming Events</h2><button class="link-button" data-page-link="events">View all</button></div>
        ${soon.length ? soon.map((e) => {
          const [mon, day] = String(e.date || '').split(' ');
          return `<button class="event-row" type="button" data-event-id="${e.id}">
            <span class="date-tile">${(mon || '').toUpperCase()}<strong>${day || ''}</strong></span>
            ${e.img ? `<img src="${e.img}" alt="" />` : '<span class="date-tile" style="background:var(--line)"></span>'}
            <span><h3>${e.title}</h3><span class="event-meta">${e.time}<br />${e.city}</span><span class="chip">${e.attendees}/${e.capacity} attending</span></span>
          </button>`;
        }).join('') : emptyState('No events yet', 'Create an event and it appears here.')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Membership Overview</h2><button class="link-button" data-page-link="memberships">View report</button></div>
        ${donut()}
      </section>
      <section class="card">
        <div class="card-title"><h2>Recent Activity</h2><button class="link-button" data-page-link="tasks">View all</button></div>
        ${activities.length ? activities.map((a) => `
          <div class="activity"><span class="activity-icon" style="background:var(--${a.tone === 'purple' ? 'purple' : a.tone})">${icons.users}</span><div><h3>${a.title}</h3><span>${a.body}</span></div><small class="muted">${a.time}</small></div>
        `).join('') : emptyState('Nothing yet', 'Signups, bookings and invoices show up here as they happen.')}
      </section>
    </div>
    <div class="lower-grid">
      <section class="card">
        <div class="card-title"><h2>Top Sponsors</h2><button class="link-button" data-page-link="sponsors">View all</button></div>
        ${sponsorList.length ? sponsorList.slice(0, 3).map((sp) => `<div class="sponsor-row"><span class="sponsor-mark">${sp.name[0]}</span><div><h3>${sp.name}</h3><span class="muted">${sp.tier} Sponsor</span></div><strong>${sp.amount}</strong></div>`).join('') : emptyState('No sponsors yet', 'Add a sponsor contract to see it here.')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Bookings per event</h2><button class="link-button" data-page-link="reports">View report</button></div>
        ${realBars((adminCharts?.bookingsPerEvent || []).map((e) => ({ label: e.title, value: e.count })), '#0f9f6e')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Tasks & Reminders</h2><button class="link-button" data-page-link="tasks">View all</button></div>
        ${openTasks.length ? openTasks.map((t) => `<div class="task-item"><label><input type="checkbox" data-task-done="${t.id}" />${t.title}</label><span class="pill ${t.priority === 'high' ? 'red' : t.priority === 'low' ? '' : 'blue'}">${t.due || t.priority}</span></div>`).join('') : emptyState('No open tasks', 'Add one from the Tasks board.')}
      </section>
    </div>
  `;
}

/* --- CRM --- */
function crmPage() {
  const shown = crmFilter === 'All' ? contacts : contacts.filter((c) => c.status === crmFilter);
  const counts = { All: contacts.length, Active: 0, Warm: 0, New: 0, Cold: 0 };
  contacts.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
  return `
    <div class="cards-grid">
      ${[['Contacts', crmStats.contacts, 'All'], ['Companies', crmStats.companies, null], ['Active & warm', crmStats.hot, 'Active']].map(([l, v, filter]) => `<button class="compact-card" type="button" ${filter ? `data-crm-filter="${filter}"` : 'data-page-link="crm"'}><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    ${filterBar('Search contacts, companies, emails…', ['All', 'Active', 'Warm', 'New', 'Cold'].map((label) => ({ label, count: counts[label] || 0, active: crmFilter === label, filter: label })))}
    <section class="card">
      <div class="card-title"><h2>Contacts</h2><button class="primary-action" type="button" data-modal="new-contact"><span data-icon="plus"></span>Add Contact</button></div>
      ${shown.length ? shown.map((c, i) => `
        <div class="contact-row" data-contact="${contacts.indexOf(c)}">
          <span class="presence ${c.presence}"><img class="avatar" src="${c.avatar}" alt="" /></span>
          <div><h4>${c.name}</h4><small>${c.email}</small></div>
          <div><strong style="font-size:13px">${c.company || '—'}</strong><small style="display:block;color:var(--muted)">${c.city || '—'}</small></div>
          <span class="chip">${c.tier}</span>
          ${statusPill(c.status)}
          <button class="icon-button" type="button" aria-label="More"><span data-icon="chevron"></span></button>
        </div>
      `).join('') : emptyState('No contacts here', crmFilter === 'All' ? 'Add your first contact to start the pipeline.' : `No contacts with status “${crmFilter}”.`)}
    </section>
    <section class="card" style="margin-top:14px">
      <div class="card-title"><h2>Deal Pipeline</h2><button class="primary-action" type="button" data-modal="new-deal"><span data-icon="plus"></span>New deal</button></div>
      <div class="pipeline">
        ${dealStages.map((st) => `
          <div class="pipe-col" data-stage="${st.key || ''}">
            <div class="pipe-col-head"><strong>${st.name}</strong><span>${st.cards.length} · ${st.total}</span></div>
            ${st.cards.map((c) => `<div class="pipe-card" draggable="true" data-deal-id="${c.id || ''}"><h5>${c.title}</h5><small class="muted">${c.owner || ''}</small><div class="meta"><span class="chip">${c.tier || ''}</span><strong>${c.value}</strong></div></div>`).join('')}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/* --- Memberships --- */
function membershipsPage() {
  return `
    <div class="cards-grid">
      ${[['Members on a tier', membershipStats.members], ['Renewals due (30d)', membershipStats.renewalsDue], ['Applications pending', membershipStats.applications]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="memberships"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    <div class="tier-grid">
      ${membershipTiers.map((t) => `
        <div class="tier-card ${t.color}">
          <span class="chip">${t.members} member(s)</span>
          <h3>${t.name}</h3>
          <div class="price">${t.price}</div>
          <ul>${(t.perks || []).map((perk) => `<li>✓ ${perk}</li>`).join('')}</ul>
          <button class="secondary-action" type="button" data-tier-manage="${t.name}">Manage tier</button>
        </div>
      `).join('')}
    </div>
    <div class="page-grid">
      <section class="card">
        <div class="card-title"><h2>Renewal calendar — next 60 days</h2><span class="chip">${renewals.length} renewal(s)</span></div>
        ${calendarGrid()}
      </section>
      <aside class="card">
        <div class="card-title"><h2>Expiry alerts</h2>${renewals.length ? '<button class="link-button" data-remind-renewals>Send reminders</button>' : ''}</div>
        ${renewals.length ? renewals.map((r) => `
          <div class="activity"><span class="activity-icon" style="background:var(--${r.days < 7 ? 'red' : r.days < 14 ? 'orange' : 'green'})">${icons.crown}</span><div><h3>${r.name}</h3><span>${r.tier} · ${r.days < 0 ? `expired ${Math.abs(r.days)} day(s) ago` : `expires in ${r.days} day(s)`}</span></div>${r.nudged ? '<span class="chip">Nudged</span>' : `<button class="link-button" data-nudge="${r.email}">Nudge</button>`}</div>
        `).join('') : emptyState('No renewals due', 'Memberships with a renewal date inside 60 days appear here.')}
      </aside>
    </div>
  `;
}

function calendarGrid() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const start = new Date();
  const offset = (start.getDay() + 6) % 7;
  const byDay = {};
  renewals.forEach((r) => {
    const d = Math.round((new Date(r.renews_on) - start) / 86400000);
    if (d >= 0 && d < 60) byDay[d] = (byDay[d] || 0) + 1;
  });
  let cells = '';
  for (let i = 0; i < offset; i++) cells += '<div class="cal-day muted"></div>';
  for (let d = 0; d < 42; d++) {
    const date = new Date(start.getTime() + d * 86400000);
    const marks = byDay[d] || 0;
    cells += `<div class="cal-day ${d === 0 ? 'today' : ''}" title="${date.toLocaleDateString('en-GB')}${marks ? ` — ${marks} renewal(s)` : ''}">${date.getDate()}${marks ? `<div class="events">${Array.from({ length: Math.min(marks, 3) }, () => '<span class="dot"></span>').join('')}</div>` : ''}</div>`;
  }
  return `<div class="cal-grid">${days.map((d) => `<div class="head">${d}</div>`).join('')}${cells}</div>`;
}

/* --- Events --- */
function eventsPage() {
  return `
    <div class="page-head" style="padding:0;margin-bottom:14px">
      <div></div>
      <div class="head-actions">
        <button class="control" type="button" data-eb-sync><span data-icon="download"></span>Sync from Eventbrite</button>
        <button class="primary-action" type="button" data-modal="new-event"><span data-icon="plus"></span>New Event</button>
      </div>
    </div>
    <div class="cards-grid">
      ${[['Upcoming', String(eventsCatalog.length)], ['On Eventbrite', String(eventsCatalog.filter((e) => e.source === 'eventbrite').length)], ['Cities', String(new Set(eventsCatalog.map((e) => e.city)).size)]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="events"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    ${filterBar('Search events…', [{ label: 'All', count: eventsCatalog.length }, { label: 'Confirmed' }, { label: 'Selling' }, { label: 'Draft' }])}
    <div class="event-grid">
      ${eventsCatalog.map((e) => `
        <article class="event-card" data-event-id="${e.id}">
          ${e.img ? `<img src="${e.img}" alt="" />` : '<div class="placeholder" style="height:120px"></div>'}
          <div class="body">
            <h3>${e.title} ${e.source === 'eventbrite' ? '<span class="chip" style="background:#f6562210;color:#f05537">Eventbrite</span>' : ''}</h3>
            <div class="meta">${e.date} · ${e.time} · ${e.city}</div>
            <div class="progress" style="margin-bottom:10px"><i style="--value:${Math.round(e.attendees / Math.max(1, e.capacity) * 100)}%"></i></div>
            <footer><span>${e.attendees}/${e.capacity} attendees</span>${e.url ? `<a class="link-button" href="${e.url}" target="_blank" rel="noopener">View ↗</a>` : statusPill(e.status)}</footer>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

/* --- Tickets --- */
function ticketsPage() {
  const live = ticketRecords.filter((t) => t.status !== 'Refunded');
  const inCount = live.filter((t) => t.checked_in).length;
  return `
    <div class="cards-grid">
      ${[['Tickets', String(live.length)], ['Checked in', String(inCount)], ['To arrive', String(live.length - inCount)]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="tickets"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    <section class="card">
      <div class="card-title"><h2>Ticket desk — check-in</h2><div style="display:flex;gap:10px;align-items:center"><span class="chip">${inCount}/${live.length} in</span><button class="primary-action" type="button" data-modal="new-ticket"><span data-icon="plus"></span>Issue ticket</button></div></div>
      ${ticketRecords.length ? `<table class="table">
        <thead><tr><th>Event</th><th>Attendee</th><th>Tier</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${ticketRecords.map((t) => `
            <tr>
              <td><strong>${t.event}</strong></td>
              <td>${t.buyer}</td>
              <td><span class="chip">${t.tier}</span></td>
              <td>${t.status === 'Refunded' ? '<span class="invoice-status draft">Refunded</span>' : t.checked_in ? '<span class="invoice-status paid">Checked in</span>' : '<span class="invoice-status due">Booked</span>'}</td>
              <td style="white-space:nowrap">${t.status === 'Refunded' ? '' : `<button class="${t.checked_in ? 'control' : 'primary-action'}" type="button" data-checkin="${t.id}:${t.checked_in ? '0' : '1'}"><span data-icon="check"></span>${t.checked_in ? 'Undo' : 'Check in'}</button> <button class="control" type="button" data-refund="${t.id}">Refund</button>`}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>` : emptyState('No bookings yet', 'Member bookings and tickets you issue show up here.')}
    </section>
  `;
}

/* --- Sponsors --- */
function sponsorsPage() {
  const cents = (v) => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
  const pipeline = sponsorList.reduce((n, sp) => n + cents(sp.amount), 0);
  const byTier = { Gold: 0, Silver: 0, Bronze: 0 };
  sponsorList.forEach((sp) => { byTier[sp.tier] = (byTier[sp.tier] || 0) + 1; });
  const tiers = [
    ['gold', 'Gold Tier', 'Logo on all events', 'Keynote slot', 'Dedicated activations'],
    ['silver', 'Silver Tier', 'Logo on tier events', 'Workshop slot', 'Member directory feature'],
    ['bronze', 'Bronze Tier', 'Logo on materials', '4 event passes', 'Newsletter mention']
  ];
  return `
    <div class="cards-grid">
      ${[['Sponsors', sponsorList.length], ['Contract value', '£' + pipeline.toLocaleString('en-GB')], ['Renewals tracked', sponsorList.filter((sp) => sp.renewal && sp.renewal !== '—').length]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="sponsors"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    <div class="tier-grid">
      ${tiers.map(([color, name, ...perks]) => `<div class="tier-card ${color}"><span class="chip">${byTier[name.split(' ')[0]] || 0} sponsor(s)</span><h3>${name}</h3><ul>${perks.map((perk) => `<li>✓ ${perk}</li>`).join('')}</ul></div>`).join('')}
    </div>
    <section class="card">
      <div class="card-title"><h2>Sponsor contracts</h2><button class="primary-action" type="button" data-modal="new-sponsor"><span data-icon="plus"></span>New sponsor</button></div>
      ${sponsorList.length ? `<table class="table">
        <thead><tr><th>Sponsor</th><th>Tier</th><th>Amount</th><th>Renewal</th><th>Contact</th><th>Status</th></tr></thead>
        <tbody>
          ${sponsorList.map((sp) => `<tr><td><strong>${sp.name}</strong></td><td><span class="chip">${sp.tier}</span></td><td>${sp.amount}</td><td>${sp.renewal}</td><td>${sp.contact}</td><td>${statusPill(sp.status)}</td></tr>`).join('')}
        </tbody>
      </table>` : emptyState('No sponsors yet', 'Add a sponsor contract and it appears here with its package.')}
    </section>
  `;
}

/* --- Networking --- */
function networkingPage() {
  const isAdmin = currentRole === 'admin';
  const pending = introRequests.filter((r) => r.status === 'pending');
  return `
    <div class="cards-grid">
      ${[['Introductions', networkStats.introductions], ['Matched', networkStats.meetings], ['Match rate', networkStats.matchRate]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="networking"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    <div class="intro-grid">
      <section class="card graph-card">
        <div class="card-title"><h2>Network graph</h2><button class="primary-action" type="button" data-modal="new-intro"><span data-icon="plus"></span>Request intro</button></div>
        ${networkGraph()}
      </section>
      <aside class="card">
        <div class="card-title"><h2>Intro requests</h2><span class="chip">${pending.length} pending</span></div>
        ${introRequests.length ? introRequests.map((r) => `
          <div class="intro-item">
            <img class="avatar" src="${r.avatar}" alt="" />
            <div><strong>${r.from}</strong> → ${r.to}<p>${r.reason || 'No note added.'}</p></div>
            <div class="intro-actions">
              ${r.status === 'pending'
                ? (isAdmin
                    ? `<button class="accept" data-intro="${r.id}:matched">Accept</button><button class="decline" data-intro="${r.id}:declined">Skip</button>`
                    : '<span class="chip">Pending</span>')
                : `<span class="chip">${cap(r.status)}</span>`}
            </div>
          </div>
        `).join('') : emptyState('No introductions yet', 'Request an intro and it lands here for the team.')}
      </aside>
    </div>
  `;
}

function networkGraph() {
  const people = networkPeople.slice(0, 7);
  if (!people.length) return emptyState('No network yet', 'Members and sponsors appear here as they join.');
  const tone = { admin: '#1f3a73', member: '#0f9f6e', sponsor: '#f97316' };
  const nodes = people.map((person, i) => {
    if (i === 0) return { x: 300, y: 60, r: 28, label: person.name.split(' ')[0], color: tone[person.role] || '#94a3b8' };
    const spread = people.length - 1;
    const angle = Math.PI * (0.15 + (0.7 * (i - 1)) / Math.max(1, spread - 1));
    return {
      x: Math.round(300 + Math.cos(angle) * 230),
      y: Math.round(150 + Math.sin(angle) * 120),
      r: 20,
      label: person.name.split(' ')[0],
      color: tone[person.role] || '#94a3b8'
    };
  });
  return `<svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet">
    ${nodes.slice(1).map((n) => `<line x1="${nodes[0].x}" y1="${nodes[0].y}" x2="${n.x}" y2="${n.y}" stroke="#cbd5e1" stroke-width="1.4"/>`).join('')}
    ${nodes.map((n) => `<g><circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.color}" opacity="0.18"/><circle cx="${n.x}" cy="${n.y}" r="${n.r - 8}" fill="${n.color}"/><text x="${n.x}" y="${n.y + n.r + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">${n.label}</text></g>`).join('')}
  </svg>`;
}

/* --- Tasks (kanban) --- */
function tasksPage() {
  const cols = [
    { name: 'To do', key: 'todo' },
    { name: 'In progress', key: 'doing' },
    { name: 'Done', key: 'done' }
  ];
  return `
    <div class="cards-grid">
      ${[['To do', tasksData.todo.length], ['In progress', tasksData.doing.length], ['Completed', tasksData.done.length]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="tasks"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    ${filterBar('Search tasks…', [{ label: 'All' }, { label: 'Mine' }, { label: 'High priority' }, { label: 'Due today' }])}
    <div class="kanban">
      ${cols.map((c) => `
        <div class="kanban-col" data-col="${c.key}">
          <div class="kanban-col-head"><strong>${c.name}</strong><span class="count">${tasksData[c.key].length}</span></div>
          ${tasksData[c.key].map((t) => `
            <div class="kanban-card" draggable="true" data-task-id="${t.id || ''}">
              <h5>${t.title}</h5>
              <span class="chip" style="background:${t.priority === 'high' ? '#ffe7ec' : t.priority === 'med' ? '#fff5df' : '#e9efff'};color:${t.priority === 'high' ? 'var(--red)' : t.priority === 'med' ? '#b45309' : 'var(--blue)'}">${t.priority}</span>
              <div class="footer"><span class="sponsor-mark" style="width:24px;height:24px;font-size:11px">${(t.assignee || '?').charAt(0)}</span><span>${t.assignee || ''} · Due ${t.due || '—'}</span></div>
            </div>
          `).join('')}
          <button class="link-button" data-modal="new-task" style="width:100%;text-align:left;padding:6px"><span data-icon="plus" style="vertical-align:middle"></span> Add task</button>
        </div>
      `).join('')}
    </div>
  `;
}

/* --- Email marketing --- */
function emailPage() {
  return `
    <div class="cards-grid">
      ${[['Campaigns', campaignStats.campaigns], ['Open rate', campaignStats.openRate], ['Clicks', campaignStats.clicks]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="email"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    <div class="email-grid">
      <section class="card">
        <div class="card-title"><h2>Campaigns</h2><button class="primary-action" type="button" data-modal="new-campaign"><span data-icon="plus"></span>New campaign</button></div>
        ${campaigns.length ? `<table class="table">
          <thead><tr><th>Name</th><th>Segment</th><th>Sent</th><th>Open</th><th>Click</th><th>Status</th><th></th></tr></thead>
          <tbody>${campaigns.map((c) => `<tr><td><strong>${c.name}</strong><small style="display:block;color:var(--muted)">${c.subject || 'No subject line'}</small></td><td>${c.segment}</td><td>${c.sent}</td><td>${c.open}</td><td>${c.click}</td><td>${statusPill(c.status)}</td><td>${c.status === 'Sent' ? '' : `<button class="link-button" data-send-campaign="${c.id}">Send</button>`}</td></tr>`).join('')}</tbody>
        </table>` : emptyState('No campaigns yet', 'Create one and pick the audience it goes to.')}
      </section>
      <aside class="card">
        <div class="card-title"><h2>${adminIntegrations.demo?.email ? 'Demo outbox' : 'Outbox'}</h2><span class="chip">${outbox.length}</span></div>
        <p class="muted" style="font-size:12px;margin:0 0 10px">${adminIntegrations.demo?.email ? 'Nothing is delivered while email is in demo mode — this is exactly what would be sent.' : 'Recent deliveries through your email provider.'}</p>
        ${outbox.length ? outbox.slice(0, 8).map((m) => `
          <div class="activity"><span class="activity-icon" style="background:var(--${m.status === 'sent' ? 'green' : m.status === 'failed' ? 'red' : 'orange'})">${icons.mail}</span><div><h3>${m.subject}</h3><span>${m.to} · ${m.kind}</span></div><small class="muted">${m.time}</small></div>
        `).join('') : emptyState('Nothing queued yet', 'Invites, reminders and campaigns show up here.')}

        <div class="card-title" style="margin-top:18px"><h2>Templates</h2></div>
        <div class="template-grid">
          ${['Welcome', 'Renewal', 'Event Invite', 'Newsletter'].map((n) => `<div class="template-card" data-template="${n}"><div class="template-thumb">${n}</div><strong style="font-size:13px">${n}</strong><p class="muted" style="font-size:12px;margin:4px 0 0">Start a campaign</p></div>`).join('')}
        </div>
        <div class="card-title" style="margin-top:18px"><h2>Audiences</h2></div>
        ${campaignAudiences.map((a) => `<div class="task-item"><label>${a.segment}</label><span class="muted" style="font-size:12px">${a.size}</span></div>`).join('')}
      </aside>
    </div>
  `;
}

/* --- Support --- */
function supportPage() {
  const isAdmin = currentRole === 'admin';
  const count = (s) => supportThreads.filter((t) => t.status === s).length;
  const sChip = (s) => `<span class="chip" style="background:${s === 'resolved' ? '#0f9f6e18' : s === 'pending' ? '#f2aa0018' : '#e5486318'};color:${s === 'resolved' ? 'var(--green)' : s === 'pending' ? '#b45309' : 'var(--red)'}">${cap(s)}</span>`;

  const queue = supportThreads.length ? supportThreads.map((t) => `
    <div class="support-item ${activeTicket && activeTicket.id === t.id ? 'is-active' : ''}" data-thread="${t.id}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h4 style="margin:0">${t.subject}</h4>${sChip(t.status)}</div>
      <p>${isAdmin ? t.from + ' · ' : ''}${t.messages} message${t.messages === 1 ? '' : 's'} · ${t.last}</p>
    </div>`).join('') : emptyState('No tickets yet', isAdmin ? 'Member and sponsor tickets land here.' : 'Raise a ticket and our team will reply.');

  const thread = activeTicket ? `
    <div>
      <div class="card-title"><h2>${activeTicket.subject}</h2>${sChip(activeTicket.status)}</div>
      <p class="muted" style="font-size:13px;margin:0">${activeTicket.from}</p>
      ${isAdmin ? `<div style="display:flex;gap:8px;margin-top:8px">
        <button class="control" type="button" data-ticket-status="${activeTicket.id}:pending">Mark pending</button>
        <button class="control" type="button" data-ticket-status="${activeTicket.id}:resolved">Mark resolved</button>
        <button class="control" type="button" data-ticket-status="${activeTicket.id}:open">Reopen</button>
      </div>` : ''}
    </div>
    <div style="margin:14px 0;overflow-y:auto;max-height:340px">
      ${activeTicket.messages.map((m) => `
        <div class="thread-msg ${m.role === currentRole ? 'me' : ''}">
          <span class="sponsor-mark" style="width:32px;height:32px;font-size:12px">${(m.who || '?').charAt(0)}</span>
          <div><strong style="font-size:13px">${m.who}</strong> <small class="muted">${m.role} · ${m.time}</small><div class="bubble">${m.text}</div></div>
        </div>`).join('')}
    </div>
    <div class="thread-reply">
      <input type="text" id="replyInput" placeholder="Type a reply…" onkeydown="if(event.key==='Enter')sendReply()" />
      <button class="primary-action" type="button" data-send-reply><span data-icon="send"></span>Send</button>
    </div>` : emptyState('Select a ticket', 'Pick a conversation on the left to read and reply.');

  return `
    <div class="page-head" style="padding:0;margin-bottom:14px"><div></div><div class="head-actions">${!isAdmin ? '<button class="primary-action" type="button" data-new-ticket><span data-icon="plus"></span>New ticket</button>' : ''}</div></div>
    <div class="cards-grid">
      ${[['Open', count('open')], ['Pending', count('pending')], ['Resolved', count('resolved')]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="support"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    <div class="support-grid">
      <section class="card">
        <div class="card-title"><h2>${isAdmin ? 'All tickets' : 'My tickets'}</h2><span class="chip">${count('open')} open</span></div>
        <div class="support-queue">${queue}</div>
      </section>
      <section class="card support-thread" id="threadView">${thread}</section>
    </div>`;
}

async function loadSupport() {
  const { ok, data } = await api('/api/support/tickets');
  if (ok && data.tickets) supportThreads = data.tickets;
  if (activeTicket) {
    const d = await api(`/api/support/tickets/${activeTicket.id}`);
    if (d.ok) activeTicket = d.data.ticket; else activeTicket = null;
  }
  if ((location.hash.replace('#', '') || 'dashboard') === 'support') {
    const root = document.getElementById('pageRoot');
    root.innerHTML = supportPage();
    initIcons(root);
  }
}

async function openTicket(id) {
  const { ok, data } = await api(`/api/support/tickets/${id}`);
  if (!ok) { showToast(data?.error || 'Could not open ticket', 'error'); return; }
  activeTicket = data.ticket;
  const root = document.getElementById('pageRoot');
  root.innerHTML = supportPage();
  initIcons(root);
}

async function sendReply() {
  if (!activeTicket) return;
  const input = document.getElementById('replyInput');
  const body = input?.value.trim();
  if (!body) return;
  const { ok, data } = await api(`/api/support/tickets/${activeTicket.id}/messages`, { method: 'POST', body: { body } });
  if (!ok) { showToast(data?.error || 'Could not send', 'error'); return; }
  await openTicket(activeTicket.id);
}

function openNewTicket() {
  openModal('New support ticket',
    `<label>Subject<input type="text" data-nt="subject" placeholder="What do you need help with?" /></label><label>Message<textarea data-nt="message" placeholder="Describe your question…"></textarea></label>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-submit-ticket>Send ticket</button>`);
}

async function submitTicket() {
  const m = document.getElementById('modalBody');
  const subject = m.querySelector('[data-nt="subject"]').value;
  const message = m.querySelector('[data-nt="message"]').value;
  const { ok, data } = await api('/api/support/tickets', { method: 'POST', body: { subject, message } });
  if (!ok) { showToast(data?.error || 'Could not create ticket', 'error'); return; }
  closeModal();
  showToast('Ticket raised', 'success');
  activeTicket = { id: data.id };
  await loadSupport();
}

async function setTicketStatus(spec) {
  const [id, status] = spec.split(':');
  const { ok, data } = await api(`/api/support/tickets/${id}`, { method: 'PATCH', body: { status } });
  if (!ok) { showToast(data?.error || 'Failed', 'error'); return; }
  showToast(`Ticket ${status}`, 'success');
  await loadSupport();
}

/* --- Invoices --- */
function invoicesPage() {
  return `
    <div class="cards-grid">
      ${[['Paid', sumInvoices(invoices, ['paid'])], ['Outstanding', sumInvoices(invoices, ['due', 'sent'])], ['Overdue', sumInvoices(invoices, ['overdue'])]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="invoices"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    ${filterBar('Search invoices…', [{ label: 'All', count: invoices.length }, { label: 'Paid' }, { label: 'Due' }, { label: 'Overdue' }, { label: 'Draft' }])}
    <section class="card">
      <div class="card-title"><h2>Invoices</h2><button class="primary-action" type="button" data-modal="new-invoice"><span data-icon="plus"></span>New invoice</button></div>
      <table class="table">
        <thead><tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${invoices.map((inv) => `
            <tr data-view-invoice="${inv.id}" style="cursor:pointer">
              <td><strong>${inv.id}</strong></td>
              <td>${inv.client || '—'}</td>
              <td><strong>${inv.amount}</strong></td>
              <td>${inv.issued || '—'}</td>
              <td>${inv.due || '—'}</td>
              <td><span class="invoice-status ${inv.status === 'void' ? 'draft' : inv.status === 'sent' ? 'due' : inv.status}">${cap(inv.status)}</span></td>
              <td style="white-space:nowrap">
                ${inv.status !== 'paid' && inv.status !== 'void' ? `<button class="link-button" data-pay="${inv.id}">Mark paid</button> · <button class="link-button" data-remind-invoice="${inv.id}">Remind</button> · <button class="link-button" data-void-invoice="${inv.id}">Void</button>` : `<button class="link-button" data-view-invoice="${inv.id}">View</button>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${pagination(invoices.length, 1, 10)}
    </section>
  `;
}

/* --- Reports --- */
function reportsPage() {
  const months = adminCharts?.activityByMonth || [];
  const paid = (adminCharts?.revenueByStatus || []).find((r) => r.status === 'paid');
  const accounts = (adminCharts?.usersByRole || []).reduce((n, r) => n + r.count, 0);
  const bookings = (adminCharts?.bookingsPerEvent || []).reduce((n, e) => n + e.count, 0);
  return `
    <div class="cards-grid">
      ${[['Accounts', String(accounts), 'settings'], ['Revenue collected', fmtMoney(paid?.total || 0), 'invoices'], ['Bookings', String(bookings), 'tickets']].map(([l, v, page]) => `<button class="compact-card" type="button" data-page-link="${page}"><span class="muted">${l}</span><h2>${v}</h2></button>`).join('')}
    </div>
    <div class="reports-grid">
      <section class="card full">
        <div class="card-title"><h2>Revenue by invoice status</h2><button class="link-button" data-export><span data-icon="download"></span> Export CSV</button></div>
        ${realBars((adminCharts?.revenueByStatus || []).map((r) => ({ label: r.status, value: Math.round(r.total / 100) })), '#1f3a73')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Accounts by role</h2></div>
        ${realBars((adminCharts?.usersByRole || []).map((r) => ({ label: r.role, value: r.count })), '#f2aa00')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Bookings per event</h2></div>
        ${realBars((adminCharts?.bookingsPerEvent || []).map((e) => ({ label: e.title, value: e.count })), '#0f9f6e')}
      </section>
      <section class="card full">
        <div class="card-title"><h2>Bookings per month (last 12)</h2><span class="chip">${months.reduce((n, m) => n + m.bookings, 0)} in 12 months</span></div>
        ${months.length ? lineChart('#0f9f6e', months.map((m) => m.bookings)) : emptyState('No history yet', 'Bookings build this trend as they come in.')}
      </section>
    </div>
  `;
}

/* --- Settings (tabs) --- */
let settingsTab = 'profile';
function settingsPage() {
  const tabs = ['profile', 'team', 'roles', 'billing', 'integrations'];
  return `
    <div class="tabs">
      ${tabs.map((t) => `<button type="button" data-settings-tab="${t}" class="${t === settingsTab ? 'is-active' : ''}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join('')}
    </div>
    <div id="settingsBody">${settingsBody(settingsTab)}</div>
  `;
}

function settingsBody(tab) {
  if (tab === 'profile') {
    return `<div class="settings-grid">
      <section class="card full">
        <div class="card-title"><h2>Your profile</h2><button class="primary-action" type="button" data-save-profile>Save changes</button></div>
        <div class="form-row">
          <label>Full name<input type="text" data-pf="full_name" value="${currentUser?.full_name || ''}" /></label>
          <label>Organisation<input type="text" data-pf="org" value="${currentUser?.org || ''}" /></label>
          <label>Email<input type="email" value="${currentUser?.email || ''}" disabled /></label>
          <label>Account type<input type="text" value="${ROLES[currentRole].label}" disabled /></label>
        </div>
      </section>
    </div>`;
  }
  if (tab === 'team') {
    return `<section class="card">
      <div class="card-title"><h2>Team & members</h2><button class="primary-action" type="button" data-modal="new-user"><span data-icon="plus"></span>Invite user</button></div>
      ${adminUsers.length ? adminUsers.map((u) => `
        <div class="role-row">
          <div style="display:flex;align-items:center;gap:10px"><span class="sponsor-mark">${(u.name || '?').charAt(0)}</span><div><strong>${u.name}</strong><br /><small class="muted">${u.email}</small></div></div>
          <span class="chip">${ROLES[u.role]?.label || cap(u.role)}</span>
          <span class="invoice-status ${u.status === 'active' ? 'paid' : 'due'}">${cap(u.status)}</span>
          <span style="display:flex;gap:8px"><button class="link-button" data-reset-link="${u.email}">${u.status === 'pending' ? 'Set-up link' : 'Reset link'}</button>${u.email === currentUser?.email ? '<span class="muted" style="font-size:12px">You</span>' : `<button class="link-button" data-user-status="${u.email}|${u.status === 'suspended' ? 'active' : 'suspended'}">${u.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>${u.role === 'admin' ? '' : `<button class="link-button" data-remove-user="${u.email}" style="color:var(--red)">Remove</button>`}`}</span>
        </div>
      `).join('') : emptyState('No users yet', 'Invite your first user.')}
    </section>`;
  }
  if (tab === 'roles') {
    const byRole = (r) => adminUsers.filter((u) => u.role === r).length;
    const roleDefs = [
      ['admin', 'Full access — manage members, events, sponsors, invoicing, settings.'],
      ['member', 'Member portal — membership, event booking, own invoices, support.'],
      ['sponsor', 'Sponsor portal — package, leads, sponsored events, own invoices, support.']
    ];
    return `<div class="tier-grid">
      ${roleDefs.map(([r, desc]) => `<div class="tier-card ${r === 'admin' ? 'gold' : r === 'member' ? 'silver' : 'bronze'}"><span class="chip">${byRole(r)} user${byRole(r) === 1 ? '' : 's'}</span><h3>${ROLES[r].label}</h3><ul><li>${desc}</li></ul></div>`).join('')}
    </div>`;
  }
  if (tab === 'billing') {
    const paid = invoices.filter((i) => i.status === 'paid').length;
    return `<div class="settings-grid">
      <section class="card">
        <div class="card-title"><h2>Billing summary</h2></div>
        <h3 style="font-size:24px">${invoices.length} invoice${invoices.length === 1 ? '' : 's'}</h3>
        <p class="muted">${paid} paid · ${invoices.length - paid} outstanding</p>
        <button class="primary-action" type="button" data-page-link="invoices" style="margin-top:12px">Open invoicing</button>
      </section>
      <section class="card">
        <div class="card-title"><h2>Recent invoices</h2><button class="control" type="button" data-export><span data-icon="download"></span> Export</button></div>
        ${invoices.slice(0, 5).map((i) => `<div class="role-row"><strong>${i.id}</strong><span>${i.amount}</span><span>${i.issued || ''}</span><span class="invoice-status ${i.status === 'void' ? 'draft' : i.status === 'sent' ? 'due' : i.status}">${cap(i.status)}</span></div>`).join('') || emptyState('No invoices', 'Create one from the Invoices page.')}
      </section>
    </div>`;
  }
  // integrations — live connection status
  const apps = [
    { key: 'eventbrite', name: 'Eventbrite', desc: 'Sync events and ticketing', env: 'EVENTBRITE_TOKEN + EVENTBRITE_ORG_ID' },
    { key: 'stripe', name: 'Stripe', desc: 'Card payments for invoices', env: 'STRIPE_SECRET_KEY' },
    { key: 'stripeWebhook', name: 'Stripe webhook', desc: 'Marks invoices paid when checkout completes', env: 'STRIPE_WEBHOOK_SECRET' },
    { key: 'email', name: 'Email (Resend)', desc: 'Invites, password resets, reminders, campaigns', env: 'RESEND_API_KEY + EMAIL_FROM' },
    { key: 'google', name: 'Sign in with Google', desc: 'Optional social login', env: 'GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET' }
  ];
  const demo = adminIntegrations.demo || {};
  const demoFor = { stripe: demo.payments, email: demo.email };
  return `<div class="settings-grid">${apps.map((a) => {
    const on = !!adminIntegrations[a.key];
    const inDemo = !on && demoFor[a.key];
    const label = on ? 'Connected' : inDemo ? 'Demo mode' : 'Not connected';
    return `<section class="card"><div class="card-title"><h2>${a.name}</h2><span class="invoice-status ${on ? 'paid' : inDemo ? 'due' : 'draft'}">${label}</span></div><p class="muted" style="font-size:13px">${a.desc}</p><p class="muted" style="font-size:12px;margin-top:6px">${inDemo ? `Running in demo mode: ${a.key === 'stripe' ? 'invoices can be marked paid without a card' : 'messages are queued to the outbox, never delivered'}. Set <code>${a.env}</code> to go live.` : `Set <code>${a.env}</code> in your Vercel env to connect.`}</p></section>`;
  }).join('')}</div>`;
}

/* ===================== ROUTING ===================== */

/* ===================== ROLES (multi-portal) ===================== */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
let currentRole = 'admin';
let currentUser = null;

/* Thin API wrapper. Cookies are same-origin httpOnly; credentials:'include' keeps
   them flowing. Returns { ok, status, data }. */
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { ok: res.ok, status: res.status, data };
}

const ROLES = {
  admin: {
    label: 'HBBA Admin',
    landing: 'dashboard',
    profile: { name: 'John Doe', role: 'HBBA Admin', email: 'john.doe@hbbaglobal.co.uk', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&q=80' },
    nav: [
      ['dashboard', 'home', 'Dashboard'], ['crm', 'users', 'CRM'], ['memberships', 'crown', 'Memberships'],
      ['events', 'calendar', 'Events'], ['tickets', 'ticket', 'Tickets'], ['sponsors', 'star', 'Sponsors'],
      ['networking', 'network', 'Networking'], ['tasks', 'check', 'Tasks & Activities'], ['email', 'mail', 'Email Marketing'],
      ['support', 'headset', 'Support Tickets'], ['invoices', 'file', 'Invoices & Payments'], ['reports', 'chart', 'Reports & Analytics'],
      ['settings', 'settings', 'Settings']
    ],
    bottomNav: [['dashboard', 'home', 'Home'], ['crm', 'users', 'CRM'], ['events', 'calendar', 'Events'], ['tasks', 'check', 'Tasks'], ['settings', 'settings', 'More']]
  },
  member: {
    label: 'Premium Member',
    landing: 'dashboard',
    profile: { name: 'Jane Cole', role: 'Premium Member', email: 'member@hbbaglobal.co.uk', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80' },
    nav: [
      ['dashboard', 'home', 'Dashboard'], ['myMembership', 'crown', 'My Membership'], ['myEvents', 'calendar', 'Events & Tickets'],
      ['networking', 'network', 'Networking'], ['myInvoices', 'file', 'My Invoices'], ['support', 'headset', 'Support']
    ],
    bottomNav: [['dashboard', 'home', 'Home'], ['myEvents', 'calendar', 'Events'], ['networking', 'network', 'Network'], ['myInvoices', 'file', 'Invoices'], ['support', 'headset', 'Help']]
  },
  sponsor: {
    label: 'Gold Sponsor',
    landing: 'dashboard',
    profile: { name: 'Acme Corp', role: 'Gold Sponsor', email: 'sponsor@hbbaglobal.co.uk', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=96&q=80' },
    nav: [
      ['dashboard', 'home', 'Dashboard'], ['sponsorOverview', 'star', 'Sponsorship'], ['brandVisibility', 'chart', 'Brand & Leads'],
      ['sponsoredEvents', 'calendar', 'Sponsored Events'], ['myInvoices', 'file', 'My Invoices'], ['support', 'headset', 'Support']
    ],
    bottomNav: [['dashboard', 'home', 'Home'], ['sponsorOverview', 'star', 'Package'], ['brandVisibility', 'chart', 'Leads'], ['sponsoredEvents', 'calendar', 'Events'], ['support', 'headset', 'Help']]
  }
};

function roleFromEmail(email) {
  const e = (email || '').toLowerCase();
  if (e.includes('sponsor')) return 'sponsor';
  if (e.includes('member')) return 'member';
  return 'admin';
}

/* ---------- Member data (hydrated from the API in loadMemberData) ---------- */
let memberProfile = {
  tier: 'Premium', price: '£480 / year', renews: '12 Jan 2027', since: 'Jan 2024',
  benefits: ['All member events', 'Priority event booking', 'Member directory access', 'Quarterly business briefings', '2 guest passes per year']
};
let memberTickets = [];
let memberInvoices = [];

async function loadMemberData() {
  const [ev, tk, inv, mem] = await Promise.all([
    api('/api/events'),
    api('/api/me/bookings'),
    api('/api/me/invoices'),
    api('/api/me/membership')
  ]);
  if (ev.ok && ev.data?.events) eventsCatalog = ev.data.events;
  if (tk.ok && tk.data?.tickets) memberTickets = tk.data.tickets;
  if (inv.ok && inv.data?.invoices) memberInvoices = inv.data.invoices;
  if (mem.ok && mem.data?.membership) memberProfile = mem.data.membership;
  await Promise.all([loadNotifications(), loadNetworking()]);
}

async function bookEvent(code) {
  const { ok, data } = await api(`/api/events/${code}/book`, { method: 'POST', body: { tier: 'Standard' } });
  if (!ok) { showToast(data?.error || 'Booking failed', 'error'); return; }
  showToast(`Ticket booked for ${data.event}`, 'success');
  await loadMemberData();
  render('myEvents');
}

async function cancelBooking(code) {
  const { ok, data } = await api(`/api/events/${code}/book`, { method: 'DELETE' });
  if (!ok) { showToast(data?.error || 'Could not cancel', 'error'); return; }
  showToast('Booking cancelled', 'info');
  await loadMemberData();
  render('myEvents');
}

async function payInvoice(number) {
  const { ok, data } = await api(`/api/admin/invoices/${number}`, { method: 'PATCH', body: { status: 'paid' } });
  if (!ok) { showToast(data?.error || 'Failed', 'error'); return; }
  showToast(`${number} marked paid`, 'success');
  await loadAdminData();
  render('invoices');
}

function sumInvoices(rows, statuses) {
  const cents = rows.filter((i) => statuses.includes(i.status))
    .reduce((n, i) => n + (Number(i.amount_cents) || 0), 0);
  return fmtMoney(cents);
}

const fmtMoney = (cents) => '£' + (Number(cents) / 100).toLocaleString('en-GB');

let adminCharts = null;
let adminUsers = [];
let adminIntegrations = {};

/* CSV export of whatever the active page is showing. */
function exportCSV() {
  const page = (location.hash.replace('#', '') || 'dashboard');
  const sets = {
    dashboard: [['Metric', 'Value'], metrics.map((m) => [m[0], m[1]])],
    reports: [['Metric', 'Value'], metrics.map((m) => [m[0], m[1]])],
    invoices: [['Invoice', 'Client', 'Amount', 'Issued', 'Due', 'Status'], invoices.map((i) => [i.id, i.client || '', i.amount, i.issued || '', i.due || '', i.status])],
    events: [['Event', 'Date', 'City', 'Attendees', 'Capacity', 'Status'], eventsCatalog.map((e) => [e.title, e.date, e.city, e.attendees, e.capacity, e.status])],
    crm: [['Name', 'Email', 'Company', 'Status'], contacts.map((c) => [c.name, c.email, c.company, c.status])],
    sponsors: [['Sponsor', 'Tier', 'Amount', 'Renewal', 'Contact'], sponsorList.map((s) => [s.name, s.tier, s.amount, s.renewal, s.contact])],
    myInvoices: [['Invoice', 'Description', 'Amount', 'Issued', 'Status'], (currentRole === 'sponsor' ? sponsorInvoices : memberInvoices).map((i) => [i.id, i.desc, i.amount, i.issued, i.status])],
    brandVisibility: [['Contact', 'Company', 'Interest', 'When'], sponsorLeads.map((l) => [l.name, l.company, l.interest, l.when])],
    sponsoredEvents: [['Event', 'Date', 'City', 'Booth', 'Attendees'], sponsoredEventsData.map((e) => [e.title, e.date, e.city, e.booth || '', e.attendees])],
    memberships: [['Member', 'Tier', 'Renews in (days)', 'Email'], renewals.map((r) => [r.name, r.tier, r.days, r.email])],
    email: [['Campaign', 'Segment', 'Sent', 'Open', 'Click', 'Status'], campaigns.map((c) => [c.name, c.segment, c.sent, c.open, c.click, c.status])],
    tickets: [['Event', 'Attendee', 'Tier', 'Status', 'Checked in'], ticketRecords.map((t) => [t.event, t.buyer, t.tier, t.status, t.checked_in ? 'yes' : 'no'])],
    networking: [['From', 'To', 'Reason', 'Status'], introRequests.map((i) => [i.from, i.to, i.reason, i.status])],
    tasks: [['Task', 'Column', 'Assignee', 'Due', 'Priority'], ['todo', 'doing', 'done'].flatMap((col) => (tasksData[col] || []).map((t) => [t.title, col, t.assignee || '', t.due || '', t.priority]))]
  };
  const set = sets[page];
  if (!set) { showToast('Nothing to export on this page', 'info'); return; }
  const [head, rows] = set;
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = `hbba-${page}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length} row(s)`, 'success');
}

/* Data-driven bar chart from [{label,value}] (real numbers, scaled to the max). */
function realBars(items, color = '#1f3a73') {
  if (!items || !items.length) return emptyState('No data yet', 'Charts fill in as activity happens.');
  const max = Math.max(1, ...items.map((i) => i.value));
  return `
    <div class="bar-chart">${items.map((i) => `<span class="bar" style="--sold:${Math.round((i.value / max) * 100)}%;background:${color}" title="${i.label}: ${i.value}"></span>`).join('')}</div>
    <div class="bar-labels">${items.map((i) => `<span>${String(i.label).split(' ')[0]}</span>`).join('')}</div>`;
}

/* Roll numbers up from 0 on the dashboard/stat cards for a live feel. */
function animateNumbers(root) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const els = root.querySelectorAll('.metric-card h3, .compact-card h2');
  els.forEach((el) => {
    const raw = el.textContent.trim();
    const m = raw.match(/^([£$]?)([\d,]+)(%?)$/);
    if (!m) return;
    const target = Number(m[2].replace(/,/g, ''));
    if (!Number.isFinite(target) || target === 0) return;
    const [pre, , post] = [m[1], m[2], m[3]];
    el.classList.add('count-anim');
    const dur = 750, start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = pre + Math.round(target * eased).toLocaleString('en-GB') + post;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function loadAdminData() {
  const rangeQS = statsRange.days ? `?range=${statsRange.days}` : '';
  const [st, mem, spo, inv, ev] = await Promise.all([
    api(`/api/admin/stats${rangeQS}`),
    api('/api/admin/members'),
    api('/api/admin/sponsors'),
    api('/api/admin/invoices'),
    api('/api/events')
  ]);
  if (st.ok && st.data?.stats) {
    const s = st.data.stats;
    metrics = [
      ['Total Members', String(s.members), 'memberships', 'users', '#1f3a73'],
      ['Sponsors', String(s.sponsors), 'sponsors', 'star', '#f2aa00'],
      ['Events', String(s.events), 'events', 'calendar', '#2563eb'],
      ['Bookings', String(s.bookings), 'tickets', 'ticket', '#0f9f6e'],
      ['Revenue collected', fmtMoney(s.revenue_cents), 'invoices', 'chart', '#1f3a73']
    ];
  }
  if (mem.ok && mem.data?.members) memberDirectory = mem.data.members;
  if (spo.ok && spo.data?.sponsors) sponsorList = spo.data.sponsors;
  if (inv.ok && inv.data?.invoices) invoices = inv.data.invoices;
  if (ev.ok && ev.data?.events) eventsCatalog = ev.data.events;
  const [ch, tk, dl, tix, us, intg] = await Promise.all([
    api(`/api/admin/charts${rangeQS}`), api('/api/admin/tasks'), api('/api/admin/deals'),
    api('/api/admin/tickets'), api('/api/admin/users'), api('/api/admin/integrations')
  ]);
  if (ch.ok && ch.data) adminCharts = ch.data;
  if (tk.ok && tk.data?.board) tasksData = tk.data.board;
  if (dl.ok && dl.data?.stages) dealStages = dl.data.stages;
  if (tix.ok && tix.data?.tickets) ticketRecords = tix.data.tickets;
  if (us.ok && us.data?.users) adminUsers = us.data.users;
  if (intg.ok && intg.data) adminIntegrations = intg.data;

  const [ct, ms, cp, nw, act] = await Promise.all([
    api('/api/admin/contacts'), api('/api/admin/memberships'), api('/api/admin/campaigns'),
    api('/api/networking'), api('/api/admin/activity')
  ]);
  if (ct.ok && ct.data?.contacts) { contacts = ct.data.contacts; crmStats = ct.data.stats; }
  if (ms.ok && ms.data?.tiers) {
    membershipTiers = ms.data.tiers;
    renewals = ms.data.renewals;
    membershipStats = ms.data.stats;
  }
  if (cp.ok && cp.data?.campaigns) {
    campaigns = cp.data.campaigns;
    campaignAudiences = cp.data.audiences;
    campaignStats = cp.data.stats;
  }
  if (nw.ok && nw.data?.intros) { introRequests = nw.data.intros; networkPeople = nw.data.people; networkStats = nw.data.stats; }
  const ob = await api('/api/admin/outbox');
  if (ob.ok && ob.data?.messages) outbox = ob.data.messages;
  if (act.ok && act.data?.activity) activities = act.data.activity;
  await loadNotifications();
}

/* Notification bell + panel, for every role. */
async function loadNotifications() {
  const { ok, data } = await api('/api/notifications');
  if (!ok || !data?.notifications) return;
  notifications = data.notifications;
  const badge = document.querySelector('.has-badge i');
  if (badge) badge.textContent = String(data.unread);
}

async function loadNetworking() {
  const { ok, data } = await api('/api/networking');
  if (!ok) return;
  introRequests = data.intros || [];
  networkPeople = data.people || [];
  networkStats = data.stats || networkStats;
}

async function inviteUser(fields) {
  const { ok, data } = await api('/api/admin/users', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not invite user', 'error'); return false; }
  showToast(data.emailConnected ? 'Invite emailed' : 'User created — share the set-up link', 'success');
  await loadAdminData();
  if ((location.hash.replace('#', '')) === 'settings') render('settings');
  // With no email provider connected the link has to reach them some other way,
  // so show it rather than stranding the account.
  if (data.invite_link) showLinkModal('Invite link', `${fields.full_name} can set their password with this link. It is valid for 7 days.`, data.invite_link);
  return true;
}

/* A one-off link the admin has to pass on by hand (no email provider). */
function showLinkModal(title, note, link) {
  openModal(title,
    `<p class="muted" style="font-size:13px;margin:0 0 10px">${note}</p>
     <input type="text" id="linkValue" value="${link}" readonly style="width:100%" />`,
    '<button class="control" type="button" data-modal-close>Close</button><button class="primary-action" type="button" data-copy-link>Copy link</button>');
}

async function issueResetLink(email) {
  const { ok, data } = await api(`/api/admin/users/${encodeURIComponent(email)}/reset-link`, { method: 'POST' });
  if (!ok) { showToast(data?.error || 'Could not create a reset link', 'error'); return; }
  if (data.emailed) { showToast(`Reset link emailed to ${email}`, 'success'); return; }
  showLinkModal('Password reset link', `${data.user} can set a new password with this link. It expires in an hour.`, data.link);
}

async function checkInTicket(spec) {
  const [id, on] = spec.split(':');
  const { ok, data } = await api(`/api/admin/tickets/${id}/checkin`, { method: 'PATCH', body: { checked_in: on === '1' } });
  if (!ok) { showToast(data?.error || 'Failed', 'error'); return; }
  showToast(on === '1' ? 'Checked in' : 'Check-in undone', on === '1' ? 'success' : 'info');
  await loadAdminData();
  render('tickets');
}

async function createDeal(fields) {
  const { ok, data } = await api('/api/admin/deals', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not create deal', 'error'); return false; }
  showToast('Deal added to pipeline', 'success');
  await loadAdminData();
  render('crm');
  return true;
}

async function createTask(fields) {
  const { ok, data } = await api('/api/admin/tasks', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not create task', 'error'); return false; }
  showToast('Task added', 'success');
  await loadAdminData();
  render('tasks');
  return true;
}

async function syncEventbrite() {
  showToast('Syncing from Eventbrite…', 'info');
  const { ok, data } = await api('/api/admin/eventbrite/sync', { method: 'POST' });
  if (!ok) { showToast(data?.error || 'Sync failed', 'error'); return; }
  showToast(`Synced ${data.imported} event(s) from Eventbrite`, 'success');
  await loadAdminData();
  render('events');
}

async function saveProfile(fields) {
  const { ok, data } = await api('/api/me/profile', { method: 'PATCH', body: fields });
  if (!ok) { showToast(data?.error || 'Could not save', 'error'); return; }
  currentUser = data.user;
  applyRoleIdentity(currentRole);
  showToast('Profile saved', 'success');
}

/* ===================== INVOICING ===================== */
function invoiceItemRow(desc = '', qty = 1, unit = '') {
  return `<div class="inv-item" style="display:grid;grid-template-columns:1fr 64px 96px 28px;gap:8px;align-items:center;margin-bottom:8px">
    <input type="text" data-iv="desc" placeholder="Description" value="${desc}" />
    <input type="number" data-iv="qty" min="1" value="${qty}" />
    <input type="number" data-iv="unit" step="0.01" placeholder="0.00" value="${unit}" />
    <button type="button" class="icon-button" data-del-item aria-label="Remove"><span data-icon="trash"></span></button>
  </div>`;
}

function recalcInvoice() {
  const body = document.getElementById('modalBody');
  if (!body) return;
  let subtotal = 0;
  body.querySelectorAll('.inv-item').forEach((row) => {
    const qty = Number(row.querySelector('[data-iv="qty"]').value) || 0;
    const unit = Number(row.querySelector('[data-iv="unit"]').value) || 0;
    subtotal += qty * unit;
  });
  const vat = Number(body.querySelector('[data-iv="vat"]')?.value) || 0;
  const tax = subtotal * vat / 100;
  const el = body.querySelector('#invTotals');
  if (el) el.innerHTML = `<span>Subtotal £${subtotal.toFixed(2)}</span><span>VAT (${vat}%) £${tax.toFixed(2)}</span><strong>Total £${(subtotal + tax).toFixed(2)}</strong>`;
}

function openInvoiceForm() {
  openModal('New invoice',
    `<div class="form-row"><label>Client email<input type="email" data-iv="client" placeholder="member@hbbaglobal.co.uk" /></label><label>Due date<input type="date" data-iv="due" /></label><label>VAT %<input type="number" data-iv="vat" value="20" oninput="recalcInvoice()" /></label><label>Status<select data-iv="status"><option value="due">Due</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option></select></label></div>
     <div class="label" style="margin:8px 0 6px">Line items</div>
     <div id="invItems">${invoiceItemRow('', 1, '')}</div>
     <button type="button" class="link-button" data-add-item><span data-icon="plus" style="vertical-align:middle"></span> Add line</button>
     <label style="margin-top:10px">Notes<textarea data-iv="notes" placeholder="Payment terms, PO number…"></textarea></label>
     <div id="invTotals" style="display:flex;gap:16px;justify-content:flex-end;margin-top:12px;align-items:baseline"></div>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-invoice>Create invoice</button>`);
  recalcInvoice();
}

async function createInvoice() {
  const body = document.getElementById('modalBody');
  const items = [...body.querySelectorAll('.inv-item')].map((row) => ({
    description: row.querySelector('[data-iv="desc"]').value,
    qty: row.querySelector('[data-iv="qty"]').value,
    unit: row.querySelector('[data-iv="unit"]').value
  })).filter((it) => it.description.trim() && Number(it.unit) > 0);
  if (!items.length) { showToast('Add at least one line item', 'error'); return; }
  const get = (k) => body.querySelector(`[data-iv="${k}"]`)?.value || '';
  const { ok, data } = await api('/api/admin/invoices', { method: 'POST', body: {
    client: get('client'), items, vat_rate: get('vat'), due_on: get('due') || null, status: get('status'), notes: get('notes')
  } });
  if (!ok) { showToast(data?.error || 'Could not create invoice', 'error'); return; }
  showToast(`Invoice ${data.number} created`, 'success');
  closeModal();
  await loadAdminData();
  render('invoices');
}

const STATUS_PILL = (s) => `<span class="invoice-status ${s === 'void' ? 'draft' : s}">${cap(s)}</span>`;

// Branded, printable invoice document.
async function openInvoice(number) {
  const { ok, data } = await api(`/api/invoices/${number}`);
  if (!ok) { showToast(data?.error || 'Could not load invoice', 'error'); return; }
  const inv = data.invoice;
  const c = inv.client || {};
  const rows = (inv.items || []).map((it) => `<tr><td>${it.description}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${it.unit}</td><td style="text-align:right">${it.line}</td></tr>`).join('');
  openModal(`Invoice ${inv.number}`,
    `<div class="invoice-doc">
      <div class="inv-head">
        <div><img src="logo.svg" alt="HBBA Global" style="height:34px" /><div class="muted" style="margin-top:6px">HBBA Global · UK Business Network</div></div>
        <div style="text-align:right"><h2 style="margin:0">INVOICE</h2><div class="muted">${inv.number}</div>${STATUS_PILL(inv.status)}</div>
      </div>
      <div class="inv-meta">
        <div><span class="label">Bill to</span><strong>${c.full_name || inv.client?.full_name || '—'}</strong><br /><span class="muted">${c.org || ''}</span><br /><span class="muted">${c.email || ''}</span></div>
        <div style="text-align:right"><span class="label">Issued</span> ${inv.issued || '—'}<br /><span class="label">Due</span> ${inv.due || '—'}</div>
      </div>
      <table class="table inv-table"><thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="inv-totals">
        <div><span class="muted">Subtotal</span><span>${inv.subtotal}</span></div>
        <div><span class="muted">VAT (${inv.vat_rate}%)</span><span>${inv.tax}</span></div>
        <div class="grand"><strong>Total</strong><strong>${inv.total}</strong></div>
      </div>
      ${inv.notes ? `<div class="inv-notes"><span class="label">Notes</span><p>${inv.notes}</p></div>` : ''}
    </div>`,
    `<button class="control" type="button" data-modal-close>Close</button><button class="control" type="button" data-print-invoice><span data-icon="download"></span>Print / Save PDF</button>${inv.status !== 'paid' && inv.status !== 'void' ? `<button class="primary-action" type="button" data-pay-invoice="${inv.number}">Pay now</button>` : ''}`);
}

async function payInvoiceOnline(number) {
  const { ok, status, data } = await api(`/api/invoices/${number}/pay`, { method: 'POST' });
  if (status === 503) { showToast('Card payments are switched off for this deployment', 'info'); return; }
  if (!ok) { showToast(data?.error || 'Payment failed', 'error'); return; }
  if (data.demo) {
    closeModal();
    openConfirm('Record a demo payment?',
      `${data.message} Invoice ${number} for ${data.amount} will be marked paid so you can walk through the rest of the flow.`,
      () => settleDemoPayment(number));
    return;
  }
  if (data.url) window.location.href = data.url;
}

async function settleDemoPayment(number) {
  const { ok, data } = await api(`/api/invoices/${number}/pay/demo`, { method: 'POST' });
  if (!ok) { showToast(data?.error || 'Could not record the demo payment', 'error'); return; }
  showToast(`${data.number} marked paid — demo only, no card charged`, 'success');
  if (currentRole === 'admin') await refreshAdmin('invoices');
  else if (currentRole === 'sponsor') { await loadSponsorData(); render('myInvoices'); }
  else { await loadMemberData(); render('myInvoices'); }
}

async function remindInvoice(number) {
  const { ok, data } = await api(`/api/admin/invoices/${number}/remind`, { method: 'POST' });
  if (!ok) { showToast(data?.error || 'Failed', 'error'); return; }
  showToast(`Reminder logged for ${number}`, 'info');
  await loadAdminData();
  render('invoices');
}

async function voidInvoice(number) {
  const { ok, data } = await api(`/api/admin/invoices/${number}`, { method: 'DELETE' });
  if (!ok) { showToast(data?.error || 'Failed', 'error'); return; }
  showToast(`${number} voided`, 'info');
  await loadAdminData();
  render('invoices');
}

async function requestIntro(id) {
  const { ok, data } = await api(`/api/sponsor/leads/${id}/contact`, { method: 'POST' });
  if (!ok) { showToast(data?.error || 'Failed', 'error'); return; }
  showToast('Intro requested — our team will connect you', 'success');
  await loadSponsorData();
  render('brandVisibility');
}

/* Filter whatever the current page is listing, by free text. */
function filterVisibleRows(term) {
  const q = String(term || '').trim().toLowerCase();
  const root = document.getElementById('pageRoot');
  if (!root) return;
  const rows = root.querySelectorAll('.contact-row, tbody tr, .event-card, .event-row, .kanban-card, .support-item, .sponsor-row, .intro-item, .pipe-card');
  rows.forEach((row) => {
    // Match on the row's data, not on its action buttons ("Mark paid" must not
    // make every invoice look Paid).
    const clone = row.cloneNode(true);
    clone.querySelectorAll('button, a, input, select, textarea').forEach((el) => el.remove());
    const hide = q ? !clone.textContent.toLowerCase().includes(q) : false;
    row.classList.toggle('filtered-out', hide);
  });
}

function activePage() { return location.hash.replace('#', '') || ROLES[currentRole].landing; }

async function refreshAdmin(page) {
  await loadAdminData();
  render(page || activePage());
}

/* ---------- CRM ---------- */
async function createContact(fields) {
  const { ok, data } = await api('/api/admin/contacts', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not add contact', 'error'); return false; }
  showToast(`${data.contact.name} added to the CRM`, 'success');
  await refreshAdmin('crm');
  return true;
}

async function logContactTouch(id, kind) {
  const { ok, data } = await api(`/api/admin/contacts/${id}/log`, { method: 'POST', body: { kind } });
  if (!ok) { showToast(data?.error || 'Could not log that', 'error'); return; }
  showToast(kind === 'call' ? 'Call logged' : 'Email logged against the contact', 'success');
  closeDrawer();
  await refreshAdmin('crm');
}

async function deleteContact(id) {
  const { ok, data } = await api(`/api/admin/contacts/${id}`, { method: 'DELETE' });
  if (!ok) { showToast(data?.error || 'Could not delete contact', 'error'); return; }
  closeDrawer();
  showToast('Contact deleted', 'info');
  await refreshAdmin('crm');
}

/* ---------- Memberships ---------- */
async function saveTier(name, fields) {
  const { ok, data } = await api(`/api/admin/tiers/${encodeURIComponent(name)}`, { method: 'PATCH', body: fields });
  if (!ok) { showToast(data?.error || 'Could not save tier', 'error'); return false; }
  showToast(`${name} tier updated`, 'success');
  await refreshAdmin('memberships');
  return true;
}

async function remindRenewals(email) {
  const { ok, data } = await api('/api/admin/renewals/remind', { method: 'POST', body: email ? { email } : {} });
  if (!ok) { showToast(data?.error || 'Could not send reminders', 'error'); return; }
  showToast(data.reminded ? `${data.reminded} reminder(s) queued` : 'Nobody is due a reminder', data.reminded ? 'success' : 'info');
  await refreshAdmin('memberships');
}

/* ---------- Tickets ---------- */
async function issueTicket(fields) {
  const { ok, data } = await api('/api/admin/tickets', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not issue ticket', 'error'); return false; }
  showToast(`Ticket issued to ${data.ticket.buyer}`, 'success');
  await refreshAdmin('tickets');
  return true;
}

async function refundTicket(id) {
  const { ok, data } = await api(`/api/admin/tickets/${id}/refund`, { method: 'POST' });
  if (!ok) { showToast(data?.error || 'Could not refund', 'error'); return; }
  showToast('Ticket refunded', 'warn');
  await refreshAdmin('tickets');
}

/* ---------- Events ---------- */
async function cancelEvent(id) {
  const { ok, data } = await api(`/api/admin/events/${id}`, { method: 'PATCH', body: { status: 'Cancelled' } });
  if (!ok) { showToast(data?.error || 'Could not cancel event', 'error'); return; }
  closeDrawer();
  showToast('Event cancelled — ticket holders notified', 'warn');
  await refreshAdmin('events');
}

async function saveEvent(id, fields) {
  const { ok, data } = await api(`/api/admin/events/${id}`, { method: 'PATCH', body: fields });
  if (!ok) { showToast(data?.error || 'Could not save event', 'error'); return false; }
  showToast('Event updated', 'success');
  await refreshAdmin('events');
  return true;
}

/* ---------- Sponsors ---------- */
async function createSponsor(fields) {
  const { ok, data } = await api('/api/admin/sponsors', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not create contract', 'error'); return false; }
  showToast(`${data.sponsor.name} onboarded as ${data.sponsor.tier} sponsor`, 'success');
  await refreshAdmin('sponsors');
  return true;
}

/* ---------- Campaigns ---------- */
async function createCampaign(fields) {
  const { ok, data } = await api('/api/admin/campaigns', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not save campaign', 'error'); return false; }
  showToast(`Campaign ${data.campaign.status.toLowerCase()}`, 'success');
  await refreshAdmin('email');
  return true;
}

async function sendCampaign(id) {
  const { ok, data } = await api(`/api/admin/campaigns/${id}/send`, { method: 'POST' });
  if (!ok) { showToast(data?.error || 'Could not send campaign', 'error'); return; }
  showToast(`Audience of ${data.sent} — ${data.delivery}`, 'success');
  await refreshAdmin('email');
}

/* ---------- Networking ---------- */
async function decideIntro(id, status) {
  const { ok, data } = await api(`/api/admin/intros/${id}`, { method: 'PATCH', body: { status } });
  if (!ok) { showToast(data?.error || 'Could not update intro', 'error'); return; }
  showToast(status === 'matched' ? 'Introduction made' : 'Intro declined', status === 'matched' ? 'success' : 'info');
  await loadNetworking();
  await loadNotifications();
  render('networking');
}

async function requestNetworkIntro(fields) {
  const { ok, data } = await api('/api/networking/intros', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not send request', 'error'); return false; }
  showToast(`Intro to ${data.intro.to} requested`, 'success');
  await loadNetworking();
  render('networking');
  return true;
}

/* ---------- Member membership ---------- */
async function requestTierChange(tier) {
  const { ok, data } = await api('/api/me/membership/upgrade', { method: 'POST', body: { tier } });
  if (!ok) { showToast(data?.error || 'Could not send request', 'error'); return; }
  showToast(`${tier} requested — our team will confirm`, 'success');
  await loadNotifications();
}

/* ---------- Users ---------- */
async function removeUser(email) {
  const { ok, data } = await api(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
  if (!ok) { showToast(data?.error || 'Could not remove user', 'error'); return; }
  showToast('User removed', 'info');
  await refreshAdmin('settings');
}

async function setUserStatus(email, status) {
  const { ok, data } = await api(`/api/admin/users/${encodeURIComponent(email)}/status`, { method: 'PATCH', body: { status } });
  if (!ok) { showToast(data?.error || 'Could not update account', 'error'); return; }
  showToast(status === 'suspended' ? 'Account suspended' : 'Account reactivated', status === 'suspended' ? 'warn' : 'success');
  await refreshAdmin('settings');
}

async function setTaskStatus(id, status) {
  const { ok, data } = await api(`/api/admin/tasks/${id}`, { method: 'PATCH', body: { status } });
  if (!ok) { showToast(data?.error || 'Could not update task', 'error'); return; }
  showToast(status === 'done' ? 'Task complete' : 'Task reopened', status === 'done' ? 'success' : 'info');
  await refreshAdmin();
}

async function createEvent(fields) {
  const { ok, data } = await api('/api/admin/events', { method: 'POST', body: fields });
  if (!ok) { showToast(data?.error || 'Could not create event', 'error'); return false; }
  showToast(`Event "${data.event.title}" created`, 'success');
  await loadAdminData();
  render('events');
  return true;
}

/* ---------- Sponsor data (hydrated from the API in loadSponsorData) ---------- */
let sponsorProfile = { name: '', tier: '—', value: '—', renews: '—', since: '—', inclusions: [] };
let sponsorStats = [];
let sponsorLeads = [];
let sponsoredEventsData = [];
let sponsorInvoices = [];
let sponsorCharts = { leadsByMonth: [], reachByEvent: [] };

async function loadSponsorData() {
  const [ov, ld, ev, inv, ch] = await Promise.all([
    api('/api/sponsor/overview'),
    api('/api/sponsor/leads'),
    api('/api/sponsor/events'),
    api('/api/me/invoices'),
    api('/api/sponsor/charts')
  ]);
  if (ov.ok && ov.data?.overview) sponsorProfile = { ...sponsorProfile, ...ov.data.overview };
  if (ov.ok && Array.isArray(ov.data?.stats) && ov.data.stats.length) sponsorStats = ov.data.stats;
  if (ld.ok && ld.data?.leads) sponsorLeads = ld.data.leads;
  if (ev.ok && ev.data?.events) sponsoredEventsData = ev.data.events;
  if (inv.ok && inv.data?.invoices) sponsorInvoices = inv.data.invoices;
  if (ch.ok && ch.data) sponsorCharts = ch.data;
  await Promise.all([loadNotifications(), loadNetworking()]);
}

/* ---------- Member pages ---------- */
function memberDashboardPage() {
  return `
    <div class="cards-grid">
      ${[['Membership', memberProfile.tier], ['Renews', memberProfile.renews], ['Events booked', memberTickets.length], ['Member since', memberProfile.since]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="myMembership"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="dashboard-grid">
      <section class="card">
        <div class="card-title"><h2>Upcoming events</h2><button class="link-button" data-page-link="myEvents">View all</button></div>
        ${eventsCatalog.slice(0, 4).map((e) => `<button class="event-row" type="button" data-event-id="${e.id}"><span class="date-tile">${e.date.split(' ')[0].toUpperCase()}<strong>${e.date.split(' ')[1]}</strong></span>${eventImage(e)}<span><h3>${e.title}</h3><span class="event-meta">${e.time}<br />${e.city}</span><span class="chip">${e.attendees}/${e.capacity}</span></span></button>`).join('')}
      </section>
      <section class="card">
        <div class="card-title"><h2>My membership</h2><button class="link-button" data-page-link="myMembership">Manage</button></div>
        <div class="tier-card gold" style="margin:0"><span class="chip">${memberProfile.tier}</span><h3>${memberProfile.tier} Member</h3><div class="price">${memberProfile.price}</div><ul>${memberProfile.benefits.slice(0, 4).map((b) => `<li>✓ ${b}</li>`).join('')}</ul><button class="secondary-action" type="button" data-page-link="myMembership">Change plan</button></div>
      </section>
      <section class="card">
        <div class="card-title"><h2>My tickets</h2><button class="link-button" data-page-link="myEvents">View</button></div>
        ${memberTickets.length ? memberTickets.map((t) => `<div class="sponsor-row"><span class="sponsor-mark">${t.event[0]}</span><div><h3>${t.event}</h3><span class="muted">${t.date} · ${t.tier}</span></div><span class="chip">${t.status}</span></div>`).join('') : emptyState('No tickets yet', 'Book an event and it shows up here.')}
      </section>
    </div>`;
}

function myMembershipPage() {
  const p = memberProfile;
  const options = p.options || [];
  return `
    <div class="cards-grid">
      ${[['Current tier', p.tier], ['Annual fee', p.price], ['Renews', p.renews]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="myMembership"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="tier-grid">
      ${options.length ? options.map((t) => {
        const current = t.name === p.tier;
        return `<div class="tier-card ${t.color}">
          <span class="chip">${current ? 'Current' : 'Switch'}</span>
          <h3>${t.name}</h3>
          <div class="price">${t.price}</div>
          <ul>${(t.perks || []).map((perk) => `<li>✓ ${perk}</li>`).join('')}</ul>
          ${current ? '<button class="secondary-action" type="button" disabled>Current plan</button>' : `<button class="secondary-action" type="button" data-upgrade-tier="${t.name}">Request ${t.name}</button>`}
        </div>`;
      }).join('') : emptyState('No plans published', 'Membership tiers appear here once the team publishes them.')}
    </div>
    <section class="card">
      <div class="card-title"><h2>Membership details</h2><button class="link-button" data-page-link="myInvoices">Billing history</button></div>
      <table class="table"><tbody>
        <tr><td><strong>Member since</strong></td><td>${p.since}</td></tr>
        <tr><td><strong>Next renewal</strong></td><td>${p.renews}</td></tr>
        <tr><td><strong>Tier</strong></td><td>${p.tier}</td></tr>
        <tr><td><strong>Status</strong></td><td>${statusPill('Active')}</td></tr>
      </tbody></table>
    </section>`;
}

function myEventsPage() {
  return `
    ${filterBar('Search events…', [{ label: 'All', count: eventsCatalog.length }, { label: 'Booked', count: memberTickets.length }, { label: 'This month' }])}
    <div class="event-grid">
      ${eventsCatalog.map((e) => {
        const booked = memberTickets.some((t) => t.event === e.title);
        return `
        <article class="event-card" data-event-id="${e.id}">
          ${eventImage(e, 'card')}
          <div class="body">
            <h3>${e.title}</h3>
            <div class="meta">${e.date} · ${e.time} · ${e.city}</div>
            <footer><span>${e.attendees}/${e.capacity} attending</span>${booked ? `<span class="chip" style="margin-right:8px">Booked</span><button class="control" type="button" data-cancel="${e.id}">Cancel</button>` : (e.source === 'eventbrite' && e.url) ? `<a class="primary-action" href="${e.url}" target="_blank" rel="noopener">Book on Eventbrite ↗</a>` : `<button class="primary-action" type="button" data-book="${e.id}">Book</button>`}</footer>
          </div>
        </article>`;
      }).join('')}
    </div>`;
}

function memberInvoicesPage() {
  return `
    <div class="cards-grid">
      ${[['Paid', sumInvoices(memberInvoices, ['paid'])], ['Outstanding', sumInvoices(memberInvoices, ['due', 'sent', 'overdue'])], ['Invoices', memberInvoices.length]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="myInvoices"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <section class="card">
      <div class="card-title"><h2>My invoices</h2><span class="chip">${memberProfile.tier} member</span></div>
      <table class="table">
        <thead><tr><th>Invoice</th><th>Description</th><th>Amount</th><th>Issued</th><th>Status</th><th></th></tr></thead>
        <tbody>${memberInvoices.map((inv) => `<tr><td><strong>${inv.id}</strong></td><td>${inv.desc}</td><td><strong>${inv.amount}</strong></td><td>${inv.issued}</td><td><span class="invoice-status ${inv.status === 'void' ? 'draft' : inv.status === 'sent' ? 'due' : inv.status}">${cap(inv.status)}</span></td><td style="white-space:nowrap"><button class="link-button" data-view-invoice="${inv.id}">View</button>${inv.status !== 'paid' && inv.status !== 'void' ? ` · <button class="link-button" data-pay-invoice="${inv.id}">Pay</button>` : ''}</td></tr>`).join('')}</tbody>
      </table>
    </section>`;
}

/* ---------- Sponsor pages ---------- */
function sponsorDashboardPage() {
  return `
    <div class="cards-grid">
      ${sponsorStats.map(([l, v]) => `<button class="compact-card" type="button" data-page-link="sponsorOverview"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="dashboard-grid">
      <section class="card">
        <div class="card-title"><h2>Sponsorship package</h2><button class="link-button" data-page-link="sponsorOverview">Details</button></div>
        <div class="tier-card gold" style="margin:0"><span class="chip">${sponsorProfile.tier} tier</span><h3>${sponsorProfile.value}</h3><ul>${sponsorProfile.inclusions.slice(0, 4).map((b) => `<li>✓ ${b}</li>`).join('')}</ul><button class="secondary-action" type="button" data-page-link="sponsorOverview">View package</button></div>
      </section>
      <section class="card">
        <div class="card-title"><h2>Recent leads</h2><button class="link-button" data-page-link="brandVisibility">View all</button></div>
        ${sponsorLeads.slice(0, 4).map((l) => `<div class="sponsor-row"><span class="sponsor-mark">${l.name[0]}</span><div><h3>${l.name}</h3><span class="muted">${l.company} · ${l.interest}</span></div><small class="muted">${l.when}</small></div>`).join('')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Sponsored events</h2><button class="link-button" data-page-link="sponsoredEvents">View all</button></div>
        ${sponsoredEventsData.map((e) => `<button class="event-row" type="button" data-event-id="${e.id}"><span class="date-tile">${e.date.split(' ')[0].toUpperCase()}<strong>${e.date.split(' ')[1]}</strong></span>${eventImage(e)}<span><h3>${e.title}</h3><span class="event-meta">${e.booth}<br />${e.city}</span><span class="chip">${e.reach}</span></span></button>`).join('')}
      </section>
    </div>`;
}

function sponsorOverviewPage() {
  const p = sponsorProfile;
  return `
    <div class="cards-grid">
      ${[['Tier', p.tier], ['Contract value', p.value], ['Renews', p.renews]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="sponsorOverview"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="page-grid">
      <section class="card">
        <div class="card-title"><h2>What's included</h2><span class="chip">${p.tier} tier</span></div>
        <ul style="list-style:none;padding:0;margin:0;display:grid;gap:12px">${p.inclusions.map((b) => `<li style="display:flex;gap:10px;align-items:center"><span class="sponsor-mark" style="background:var(--green)">✓</span><strong>${b}</strong></li>`).join('')}</ul>
      </section>
      <aside class="card">
        <div class="card-title"><h2>Contract</h2></div>
        <table class="table"><tbody>
          <tr><td><strong>Sponsor since</strong></td><td>${p.since}</td></tr>
          <tr><td><strong>Renewal</strong></td><td>${p.renews}</td></tr>
          <tr><td><strong>Annual value</strong></td><td>${p.value}</td></tr>
          <tr><td><strong>Status</strong></td><td>${statusPill('Active')}</td></tr>
        </tbody></table>
        <button class="primary-action" type="button" data-renewal-enquiry style="width:100%;margin-top:12px">Discuss renewal</button>
      </aside>
    </div>`;
}

function brandVisibilityPage() {
  const months = sponsorCharts.leadsByMonth || [];
  const events = sponsorCharts.reachByEvent || [];
  return `
    <div class="cards-grid">
      ${sponsorStats.map(([l, v]) => `<button class="compact-card" type="button" data-page-link="brandVisibility"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="reports-grid">
      <section class="card full">
        <div class="card-title"><h2>Leads — last 12 months</h2><button class="link-button" data-export><span data-icon="download"></span> Export</button></div>
        ${months.some((m) => m.count) ? lineChart('#f2aa00', months.map((m) => m.count)) : emptyState('No leads yet', 'Leads from your sponsorship show up here as they arrive.')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Reach by sponsored event</h2><button class="link-button" data-page-link="sponsoredEvents">Details</button></div>
        ${realBars(events.map((e) => ({ label: e.title, value: e.attendees })), '#f2aa00')}
      </section>
    </div>
    <section class="card">
      <div class="card-title"><h2>Leads generated</h2><span class="chip">${sponsorLeads.length} on file</span></div>
      <table class="table">
        <thead><tr><th>Contact</th><th>Company</th><th>Interest</th><th>When</th><th></th></tr></thead>
        <tbody>${sponsorLeads.length ? sponsorLeads.map((l) => `<tr><td><strong>${l.name}</strong></td><td>${l.company}</td><td>${l.interest}</td><td>${l.when}</td><td>${l.id ? `<button class="link-button" data-lead-intro="${l.id}">Request intro</button>` : '<span class="muted">—</span>'}</td></tr>`).join('') : `<tr><td colspan="5">${emptyState('No open leads', 'New leads from your sponsorship appear here.')}</td></tr>`}</tbody>
      </table>
    </section>`;
}

function sponsoredEventsPage() {
  return `
    <div class="cards-grid">
      ${[['Sponsored', sponsoredEventsData.length], ['Total attendees', sponsoredEventsData.reduce((n, e) => n + (Number(e.attendees) || 0), 0)], ['Booths', sponsoredEventsData.filter((e) => e.booth).length]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="sponsoredEvents"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="event-grid">
      ${sponsoredEventsData.map((e) => `
        <article class="event-card" data-event-id="${e.id}">
          ${eventImage(e, 'card')}
          <div class="body">
            <h3>${e.title}</h3>
            <div class="meta">${e.date} · ${e.city}</div>
            <footer><span>${e.booth} · ${e.reach}</span><span class="chip">${e.status}</span></footer>
          </div>
        </article>`).join('')}
    </div>`;
}

function sponsorInvoicesPage() {
  return `
    <div class="cards-grid">
      ${[['Paid', sumInvoices(sponsorInvoices, ['paid'])], ['Outstanding', sumInvoices(sponsorInvoices, ['due', 'sent', 'overdue'])], ['Invoices', sponsorInvoices.length]].map(([l, v]) => `<button class="compact-card" type="button" data-page-link="myInvoices"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <section class="card">
      <div class="card-title"><h2>Sponsorship invoices</h2><span class="chip">${sponsorProfile.tier} sponsor</span></div>
      <table class="table">
        <thead><tr><th>Invoice</th><th>Description</th><th>Amount</th><th>Issued</th><th>Status</th><th></th></tr></thead>
        <tbody>${sponsorInvoices.map((inv) => `<tr><td><strong>${inv.id}</strong></td><td>${inv.desc}</td><td><strong>${inv.amount}</strong></td><td>${inv.issued}</td><td><span class="invoice-status ${inv.status === 'void' ? 'draft' : inv.status === 'sent' ? 'due' : inv.status}">${cap(inv.status)}</span></td><td style="white-space:nowrap"><button class="link-button" data-view-invoice="${inv.id}">View</button>${inv.status !== 'paid' && inv.status !== 'void' ? ` · <button class="link-button" data-pay-invoice="${inv.id}">Pay</button>` : ''}</td></tr>`).join('')}</tbody>
      </table>
    </section>`;
}

/* ---------- Per-role page maps + meta ---------- */
const roleRenderers = {
  member: { dashboard: memberDashboardPage, myMembership: myMembershipPage, myEvents: myEventsPage, networking: networkingPage, myInvoices: memberInvoicesPage, support: supportPage },
  sponsor: { dashboard: sponsorDashboardPage, sponsorOverview: sponsorOverviewPage, brandVisibility: brandVisibilityPage, sponsoredEvents: sponsoredEventsPage, myInvoices: sponsorInvoicesPage, support: supportPage }
};

const roleMeta = {
  member: {
    dashboard: ['Welcome back, Jane! <span class="wave">👋</span>', "Here's your HBBA membership at a glance."],
    myMembership: ['My Membership', 'Your plan, renewal and benefits.'],
    myEvents: ['Events & Tickets', 'Browse events and manage your tickets.'],
    networking: ['Networking', 'Connect with other HBBA members.'],
    myInvoices: ['My Invoices', 'Your payments and receipts.'],
    support: ['Support', 'Get help from the HBBA team.']
  },
  sponsor: {
    dashboard: ['Welcome, Acme Corp <span class="wave">👋</span>', "Here's your sponsorship performance."],
    sponsorOverview: ['Sponsorship', 'Your package, value and renewal.'],
    brandVisibility: ['Brand & Leads', 'Impressions, placements and leads generated.'],
    sponsoredEvents: ['Sponsored Events', 'Events you sponsor and your reach.'],
    myInvoices: ['My Invoices', 'Your sponsorship invoices.'],
    support: ['Support', 'Get help from the HBBA team.']
  }
};

function pageRendererFor(role, page) {
  if (roleRenderers[role] && roleRenderers[role][page]) return roleRenderers[role][page];
  if (role === 'admin' && pageRenderers[page]) return pageRenderers[page];
  return null;
}
function metaFor(role, page) {
  return (roleMeta[role] && roleMeta[role][page]) || pageMeta[page] || pageMeta.dashboard;
}

const pageRenderers = {
  dashboard: dashboardPage,
  crm: crmPage,
  memberships: membershipsPage,
  events: eventsPage,
  tickets: ticketsPage,
  sponsors: sponsorsPage,
  networking: networkingPage,
  tasks: tasksPage,
  email: emailPage,
  support: supportPage,
  invoices: invoicesPage,
  reports: reportsPage,
  settings: settingsPage
};

function showSkeleton() {
  document.getElementById('pageRoot').innerHTML = `
    <div class="cards-grid">${Array.from({ length: 3 }, () => '<div class="skeleton skel-block"></div>').join('')}</div>
    <div class="card">${skeletonRows(8)}</div>
  `;
}

function render(page) {
  if (!page) page = ROLES[currentRole].landing;
  let fn = pageRendererFor(currentRole, page);
  if (!fn) { page = ROLES[currentRole].landing; fn = pageRendererFor(currentRole, page); }

  const [title, subtitle] = metaFor(currentRole, page);
  document.querySelector('.eyebrow').textContent = currentRole === 'admin'
    ? (page === 'dashboard' ? 'Dashboard' : (pageMeta[page]?.[0] || 'HBBA Global'))
    : ROLES[currentRole].label;
  document.getElementById('pageTitle').innerHTML = title;
  document.getElementById('pageSubtitle').textContent = subtitle;
  showSkeleton();
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.page === page));
  document.querySelectorAll('#bottomNav button').forEach((item) => item.classList.toggle('is-active', item.dataset.page === page));

  setTimeout(() => {
    const root = document.getElementById('pageRoot');
    root.innerHTML = fn();
    initIcons(root);
    attachActions();
    root.classList.remove('page-enter');
    void root.offsetWidth; // restart entrance animation
    root.classList.add('page-enter');
    animateNumbers(root);
    if (page === 'support') loadSupport();
  }, 180);
  history.replaceState(null, '', `#${page}`);
}

/* ===================== TOAST ===================== */
function showToast(text, variant = 'info') {
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className = `toast ${variant}`;
  t.innerHTML = `<span>${text}</span><button class="close" aria-label="Dismiss">×</button>`;
  stack.appendChild(t);
  const remove = () => { t.style.opacity = '0'; setTimeout(() => t.remove(), 200); };
  t.querySelector('.close').addEventListener('click', remove);
  setTimeout(remove, 3200);
}

/* ===================== MODAL ===================== */
function openModal(title, body, footer) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFoot').innerHTML = footer || '<button class="control" type="button" data-modal-close>Close</button>';
  const overlay = document.getElementById('modalOverlay');
  overlay.hidden = false;
  initIcons(overlay);
  overlay.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', closeModal));
  overlay.querySelectorAll('[data-modal-submit]').forEach((b) => b.addEventListener('click', closeModal));
}
function closeModal() { document.getElementById('modalOverlay').hidden = true; }

const modalForms = {
  'new-contact': () => openModal('Add contact',
    `<div class="form-row"><label>Full name<input type="text" data-ct="name" placeholder="Jane Smith" required /></label><label>Email<input type="email" data-ct="email" placeholder="jane@example.com" /></label><label>Company<input type="text" data-ct="company" /></label><label>City<input type="text" data-ct="city" /></label><label>Phone<input type="text" data-ct="phone" /></label><label>Tier<select data-ct="tier"><option>Gold</option><option>Silver</option><option selected>Bronze</option></select></label><label>Status<select data-ct="status"><option>Active</option><option>Warm</option><option selected>New</option><option>Cold</option></select></label><label>Owner<input type="text" data-ct="owner" placeholder="Relationship manager" /></label></div>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-contact>Add contact</button>`),
  'new-event': () => openModal('Create event',
    `<label>Event title<input type="text" data-field="title" placeholder="Networking Dinner" /></label><div class="form-row"><label>Date<input type="text" data-field="date_label" placeholder="Aug 12" /></label><label>Time<input type="text" data-field="time_label" placeholder="6 PM" /></label><label>City<input type="text" data-field="city" placeholder="London, UK" /></label><label>Capacity<input type="number" data-field="capacity" placeholder="120" /></label></div>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-event>Create event</button>`),
  'new-ticket': () => openModal('Issue ticket',
    eventsCatalog.length
      ? `<div class="form-row"><label>Event<select data-tk="event">${eventsCatalog.filter((e) => e.status !== 'Cancelled').map((e) => `<option value="${e.id}">${e.title}</option>`).join('')}</select></label><label>Attendee email<input type="email" data-tk="email" list="memberEmails" placeholder="member@example.com" /><datalist id="memberEmails">${memberDirectory.map((m) => `<option value="${m.email}">${m.name}</option>`).join('')}</datalist></label><label>Tier<select data-tk="tier"><option>Standard</option><option>VIP</option></select></label></div>
         <p class="muted" style="font-size:12px;margin:8px 0 0">The attendee needs an account — invite them from Settings first if they have none.</p>`
      : '<p class="muted">Create an event before issuing tickets.</p>',
    eventsCatalog.length
      ? `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-issue-ticket>Issue ticket</button>`
      : '<button class="control" type="button" data-modal-close>Close</button>'),
  'new-sponsor': () => openModal('New sponsor',
    `<label>Sponsor name<input type="text" data-sp="name" placeholder="Global Bank Ltd." /></label><div class="form-row"><label>Contact email<input type="email" data-sp="email" placeholder="partnerships@globalbank.co.uk" /></label><label>Contact name<input type="text" data-sp="contact" placeholder="Sarah Johnson" /></label><label>Tier<select data-sp="tier"><option>Gold</option><option>Silver</option><option>Bronze</option></select></label><label>Amount (£)<input type="number" data-sp="amount" placeholder="15000" /></label><label>Renewal<input type="text" data-sp="renewal" placeholder="Jun 2027" /></label></div>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-sponsor>Create contract</button>`),
  'new-task': () => openModal('New task',
    `<label>Task<input type="text" data-field="title" placeholder="What needs doing?" /></label><div class="form-row"><label>Assignee<select data-field="assignee"><option value="">Unassigned</option>${adminUsers.map((u) => `<option>${u.name}</option>`).join('')}</select></label><label>Due<input type="text" data-field="due" placeholder="Fri" /></label><label>Priority<select data-field="priority"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select></label></div>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-task>Add task</button>`),
  'new-campaign': (preset = '') => openModal('New campaign',
    `<label>Campaign name<input type="text" data-cp="name" value="${preset}" placeholder="May newsletter" /></label><label>Subject line<input type="text" data-cp="subject" placeholder="What lands in the inbox" /></label><div class="form-row"><label>Audience<select data-cp="segment">${(campaignAudiences.length ? campaignAudiences : [{ segment: 'All members', size: 0 }]).map((a) => `<option value="${a.segment}">${a.segment} (${a.size})</option>`).join('')}</select></label><label>Send time<input type="datetime-local" data-cp="scheduled_for" /></label></div>
     <p class="muted" style="font-size:12px;margin:8px 0 0">Scheduling records the campaign now; delivery runs once an email provider is connected.</p>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-campaign>Save campaign</button>`),
  'new-intro': () => openModal('Request an introduction',
    `<label>Who would you like to meet?<input type="text" data-in="to" list="networkPeople" placeholder="Name or company" /><datalist id="networkPeople">${networkPeople.map((n) => `<option value="${n.name}"></option>`).join('')}</datalist></label><label>Why<textarea data-in="reason" placeholder="What you would like to explore together…"></textarea></label>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-intro>Request intro</button>`),
  'new-invoice': () => openInvoiceForm(),
  'new-deal': () => openModal('New deal',
    `<label>Deal title<input type="text" data-df="title" placeholder="Acme sponsorship" /></label><div class="form-row"><label>Value (£)<input type="number" data-df="value" placeholder="10000" /></label><label>Owner<input type="text" data-df="owner" placeholder="Sarah Johnson" /></label><label>Tier<select data-df="tier"><option>Gold</option><option>Silver</option><option>Bronze</option></select></label><label>Stage<select data-df="stage"><option value="lead">Lead</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="won">Won</option></select></label></div>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-deal>Create deal</button>`),
  'new-user': () => openModal('Invite user',
    `<label>Full name<input type="text" data-iu="full_name" placeholder="Jane Cole" /></label><label>Email<input type="email" data-iu="email" placeholder="jane@company.com" /></label><label>Role<select data-iu="role"><option value="member">Member</option><option value="sponsor">Sponsor</option><option value="admin">Admin</option></select></label>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-invite-user>Send invite</button>`)
};

function openTierForm(name) {
  const tier = membershipTiers.find((t) => t.name === name);
  if (!tier) return;
  openModal(`Manage ${tier.name} tier`,
    `<div class="form-row"><label>Annual price (£)<input type="number" data-tr="price" value="${(tier.price_cents / 100).toFixed(2)}" step="0.01" /></label></div>
     <label>Benefits (one per line)<textarea data-tr="perks" rows="5">${(tier.perks || []).join('\n')}</textarea></label>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-save-tier="${tier.name}">Save tier</button>`);
}

function openEventForm(id) {
  const e = eventsCatalog.find((x) => x.id === id);
  if (!e) return;
  openModal(`Edit ${e.title}`,
    `<label>Event title<input type="text" data-ef="title" value="${e.title}" /></label>
     <div class="form-row"><label>Date<input type="text" data-ef="date_label" value="${e.date || ''}" /></label><label>Time<input type="text" data-ef="time_label" value="${e.time || ''}" /></label><label>City<input type="text" data-ef="city" value="${e.city || ''}" /></label><label>Capacity<input type="number" data-ef="capacity" value="${e.capacity || 0}" /></label></div>
     <label>Status<select data-ef="status">${['Confirmed', 'Selling', 'Draft', 'Cancelled'].map((st) => `<option${st === e.status ? ' selected' : ''}>${st}</option>`).join('')}</select></label>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-save-event="${e.id}">Save event</button>`);
}

/* ===================== DRAWER ===================== */
function openDrawer(title, body) {
  document.getElementById('drawerTitle').textContent = title;
  document.getElementById('drawerBody').innerHTML = body;
  const overlay = document.getElementById('drawerOverlay');
  overlay.hidden = false;
  initIcons(overlay);
}
function closeDrawer() { document.getElementById('drawerOverlay').hidden = true; }

function contactDrawer(i) {
  const c = contacts[i];
  if (!c) return;
  return openDrawer(c.name, `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px"><span class="presence ${c.presence}"><img class="avatar" src="${c.avatar}" style="width:62px;height:62px;border-radius:50%" alt="" /></span>
    <div><h2 style="margin:0">${c.name}</h2><small class="muted">${c.company || '—'} · ${c.city || '—'}</small></div></div>
    <div class="drawer-section"><h3>Contact</h3><dl class="drawer-kv"><dt>Email</dt><dd>${c.email}</dd><dt>Phone</dt><dd>${c.phone || '—'}</dd><dt>Tier</dt><dd>${c.tier}</dd><dt>Status</dt><dd>${statusPill(c.status)}</dd><dt>Owner</dt><dd>${c.owner || 'Unassigned'}</dd><dt>Open deals</dt><dd>${c.deals}</dd><dt>Last activity</dt><dd>${c.last}</dd></dl></div>
    ${c.notes ? `<div class="drawer-section"><h3>Notes</h3><p>${c.notes}</p></div>` : ''}
    <div style="display:flex;gap:10px">
      <a class="primary-action" href="mailto:${c.email}" data-log-contact="${c.id}:email"><span data-icon="mail"></span>Email</a>
      <button class="control" type="button" data-log-contact="${c.id}:call"><span data-icon="message"></span>Log call</button>
      <button class="control" type="button" data-delete-contact="${c.id}" aria-label="Delete contact"><span data-icon="trash"></span></button>
    </div>
  `);
}

function invoiceDrawer(i) {
  const inv = invoices[i];
  if (!inv) return;
  return openDrawer(inv.id, `
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:18px"><div><h2 style="margin:0;font-size:30px">${inv.amount}</h2><small class="muted">Issued ${inv.issued || '—'} · Due ${inv.due || '—'}</small></div><span class="invoice-status ${inv.status === 'void' ? 'draft' : inv.status}">${cap(inv.status)}</span></div>
    <div class="drawer-section"><h3>Client</h3><strong>${inv.client || '—'}</strong></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="primary-action" type="button" data-view-invoice="${inv.id}"><span data-icon="file"></span>Open invoice</button>
      ${inv.status !== 'paid' && inv.status !== 'void' ? `<button class="control" type="button" data-remind-invoice="${inv.id}"><span data-icon="send"></span>Send reminder</button><button class="control" type="button" data-mark-paid="${inv.id}">Mark paid</button>` : ''}
    </div>
  `);
}

function eventDrawer(id) {
  const e = eventsCatalog.find((x) => x.id === id);
  if (!e) return;
  const isAdmin = currentRole === 'admin';
  const booked = memberTickets.some((t) => t.event === e.title);
  return openDrawer(e.title, `
    ${e.img ? `<img src="${e.img}" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:14px" />` : ''}
    <div class="drawer-section"><h3>Details</h3><dl class="drawer-kv"><dt>Date</dt><dd>${e.date} · ${e.time}</dd><dt>Venue</dt><dd>${e.city}</dd><dt>Status</dt><dd>${statusPill(e.status)}</dd><dt>Attendees</dt><dd>${e.attendees}/${e.capacity}</dd>${e.source === 'eventbrite' ? '<dt>Source</dt><dd>Eventbrite</dd>' : ''}</dl></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      ${isAdmin
        ? `<button class="primary-action" type="button" data-modal="new-ticket"><span data-icon="ticket"></span>Issue ticket</button>
           <button class="control" type="button" data-edit-event="${e.id}"><span data-icon="edit"></span>Edit</button>
           ${e.status !== 'Cancelled' ? `<button class="control" type="button" data-cancel-event="${e.id}"><span data-icon="trash"></span>Cancel event</button>` : ''}`
        : e.status === 'Cancelled'
          ? '<span class="chip">This event was cancelled</span>'
          : booked
            ? `<button class="control" type="button" data-cancel="${e.id}">Cancel my booking</button>`
            : (e.source === 'eventbrite' && e.url)
              ? `<a class="primary-action" href="${e.url}" target="_blank" rel="noopener">Book on Eventbrite ↗</a>`
              : `<button class="primary-action" type="button" data-book="${e.id}">Book this event</button>`}
    </div>
  `);
}

/* ===================== CONFIRM ===================== */
let confirmHandler = null;
function openConfirm(title, body, onOk) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmBody').textContent = body;
  confirmHandler = onOk;
  const o = document.getElementById('confirmOverlay');
  o.hidden = false;
  initIcons(o);
}
function closeConfirm() { document.getElementById('confirmOverlay').hidden = true; confirmHandler = null; }

const confirmConfig = {
  refund: { title: 'Refund this ticket?', body: 'The booking is marked refunded, the seat is released and the attendee is notified.' },
  'cancel-event': { title: 'Cancel this event?', body: 'The event is marked cancelled and everyone holding a ticket is notified.' },
  'delete-contact': { title: 'Delete contact?', body: 'This permanently removes the contact from the CRM.' },
  'remove-user': { title: 'Remove team member?', body: 'They lose access to the workspace immediately.' }
};

/* ===================== NOTIFICATIONS ===================== */
function renderNotifPanel() {
  const panel = document.getElementById('notifPanel');
  panel.innerHTML = `
    <div class="notif-head"><h3>Notifications</h3>${notifications.some((n) => n.unread) ? '<button class="link-button" data-mark-read>Mark all read</button>' : ''}</div>
    <div class="notif-list">
      ${notifications.length ? notifications.map((n) => `<div class="notif-item ${n.unread ? 'unread' : ''}"><span class="${n.unread ? 'notif-dot' : ''}"></span><div><h4>${n.title}</h4><p>${n.body}</p></div><small>${n.time}</small></div>`).join('') : emptyState('All clear', 'Activity on your account shows up here.')}
    </div>
  `;
  const mark = panel.querySelector('[data-mark-read]');
  if (mark) {
    mark.addEventListener('click', async () => {
      const { ok } = await api('/api/notifications/read', { method: 'POST' });
      if (!ok) { showToast('Could not mark as read', 'error'); return; }
      await loadNotifications();
      renderNotifPanel();
      showToast('All notifications marked read', 'success');
    });
  }
}

/* ===================== PROFILE MENU ===================== */
function renderProfileMenu() {
  const p = ROLES[currentRole].profile;
  const name = currentUser?.full_name || p.name;
  const email = currentUser?.email || p.email;
  const settingsItem = currentRole === 'admin' ? `<button class="menu-item" type="button" data-page-link="settings"><span data-icon="settings"></span>Settings</button>` : '';
  document.getElementById('profileMenu').innerHTML = `
    <div style="padding:10px 12px;border-bottom:1px solid var(--line);margin-bottom:6px"><strong>${name}</strong><br /><small class="muted">${email}</small></div>
    ${settingsItem}
    ${currentRole === 'admin' ? '' : '<button class="menu-item" type="button" data-page-link="support"><span data-icon="users"></span>My account</button>'}
    <button class="menu-item" type="button" data-page-link="support"><span data-icon="message"></span>Help & support</button>
    <button class="menu-item" type="button" data-toggle-theme><span data-icon="moon"></span>Toggle theme</button>
    <div class="menu-divider"></div>
    <button class="menu-item" type="button" data-logout style="color:var(--red)"><span data-icon="logout"></span>Sign out</button>
  `;
  initIcons(document.getElementById('profileMenu'));
}

/* ===================== COMMAND PALETTE ===================== */
function openCommand() {
  const overlay = document.getElementById('commandOverlay');
  overlay.hidden = false;
  const input = document.getElementById('commandInput');
  input.value = '';
  renderCommandResults('');
  setTimeout(() => input.focus(), 50);
}
function closeCommand() { document.getElementById('commandOverlay').hidden = true; }

function renderCommandResults(q) {
  const ql = q.toLowerCase();
  const navItems = ROLES[currentRole].nav.map(([key, , label]) => ({ group: 'Navigate', label, key, kbd: '↵' }));
  const actions = currentRole === 'admin' ? [
    { group: 'Actions', label: 'New event', mod: 'new-event' },
    { group: 'Actions', label: 'New contact', mod: 'new-contact' },
    { group: 'Actions', label: 'New invoice', mod: 'new-invoice' },
    { group: 'Actions', label: 'New campaign', mod: 'new-campaign' },
    { group: 'Actions', label: 'Toggle theme', theme: true },
    { group: 'Actions', label: 'Sign out', logout: true }
  ] : [
    { group: 'Actions', label: 'Toggle theme', theme: true },
    { group: 'Actions', label: 'Sign out', logout: true }
  ];
  const contactRes = currentRole === 'admin' ? contacts.map((c, i) => ({ group: 'Contacts', label: c.name, contact: i, kbd: c.company })) : [];
  const all = [...navItems, ...actions, ...contactRes];
  const filtered = ql ? all.filter((x) => x.label.toLowerCase().includes(ql) || (x.kbd && String(x.kbd).toLowerCase().includes(ql))) : all.slice(0, 15);
  const grouped = filtered.reduce((acc, x) => { (acc[x.group] = acc[x.group] || []).push(x); return acc; }, {});
  const html = Object.entries(grouped).map(([g, items]) => `
    <div class="command-group">${g}</div>
    ${items.map((x) => `<button class="command-item" type="button"
      ${x.key ? `data-cmd-page="${x.key}"` : ''}
      ${x.mod ? `data-cmd-modal="${x.mod}"` : ''}
      ${x.contact != null ? `data-cmd-contact="${x.contact}"` : ''}
      ${x.theme ? 'data-cmd-theme' : ''}
      ${x.logout ? 'data-cmd-logout' : ''}>${x.label}${x.kbd ? `<kbd>${x.kbd}</kbd>` : ''}</button>`).join('')}
  `).join('');
  document.getElementById('commandResults').innerHTML = html || `<div class="command-empty">No matches for “${q}”</div>`;
  document.querySelectorAll('#commandResults .command-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.cmdPage) { render(btn.dataset.cmdPage); closeCommand(); }
      else if (btn.dataset.cmdModal) { closeCommand(); modalForms[btn.dataset.cmdModal](); }
      else if (btn.dataset.cmdContact != null) { closeCommand(); contactDrawer(Number(btn.dataset.cmdContact)); }
      else if (btn.hasAttribute('data-cmd-theme')) { toggleTheme(); closeCommand(); }
      else if (btn.hasAttribute('data-cmd-logout')) { closeCommand(); signOut(); }
    });
  });
}

/* ===================== THEME ===================== */
function toggleTheme() {
  const body = document.body;
  const next = body.dataset.theme === 'dark' ? 'light' : 'dark';
  body.dataset.theme = next;
  localStorage.setItem('hbba-theme', next);
  document.querySelector('#themeToggle [data-icon]').dataset.icon = next === 'dark' ? 'sun' : 'moon';
  initIcons(document.getElementById('themeToggle'));
  showToast(`${next.charAt(0).toUpperCase() + next.slice(1)} theme`, 'info');
}

/* ===================== SIGN OUT ===================== */
async function signOut() {
  await api('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  currentRole = 'admin';
  showAuth('login');
  showToast('Signed out', 'info');
}

/* ===================== AUTH validation ===================== */
function attachAuthValidation() {
  document.querySelectorAll('.auth-form input').forEach((input) => {
    input.addEventListener('blur', () => {
      const label = input.closest('label');
      if (!label) return;
      label.classList.remove('has-error', 'has-success');
      label.querySelector('.form-error')?.remove();
      if (input.type === 'email' && input.value && !/.+@.+\..+/.test(input.value)) {
        label.classList.add('has-error');
        label.insertAdjacentHTML('beforeend', '<span class="form-error">Enter a valid email address</span>');
      } else if (input.type === 'password' && input.value && input.value.length < 6) {
        label.classList.add('has-error');
        label.insertAdjacentHTML('beforeend', '<span class="form-error">At least 6 characters</span>');
      } else if (input.value) {
        label.classList.add('has-success');
      }
    });
  });
}

/* ===================== ACTION WIRING (delegated, attach-once) ===================== */
function attachActions() {
  // dynamic-content wiring per render: drag-and-drop targets need their own listeners
  const root = document.getElementById('pageRoot');
  root.querySelectorAll('.kanban-card').forEach((card) => {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  root.querySelectorAll('.kanban-col').forEach((col) => {
    col.addEventListener('dragover', (e) => e.preventDefault());
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      const card = root.querySelector('.kanban-card.dragging');
      if (!card) return;
      col.insertBefore(card, col.querySelector('.link-button'));
      const id = card.dataset.taskId;
      const status = col.dataset.col;
      if (id) {
        api(`/api/admin/tasks/${id}`, { method: 'PATCH', body: { status } })
          .then((r) => showToast(r.ok ? 'Task moved' : 'Could not save move', r.ok ? 'success' : 'error'));
      } else {
        showToast('Task moved', 'success');
      }
    });
  });

  // CRM pipeline drag — persists the deal's stage.
  root.querySelectorAll('.pipe-card').forEach((card) => {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  root.querySelectorAll('.pipe-col').forEach((col) => {
    col.addEventListener('dragover', (e) => e.preventDefault());
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      const card = root.querySelector('.pipe-card.dragging');
      if (!card) return;
      col.appendChild(card);
      const id = card.dataset.dealId;
      const stage = col.dataset.stage;
      if (id && stage) {
        api(`/api/admin/deals/${id}`, { method: 'PATCH', body: { stage } })
          .then((r) => { showToast(r.ok ? 'Deal moved' : 'Could not save move', r.ok ? 'success' : 'error'); if (r.ok) loadAdminData().then(() => { if ((location.hash.replace('#', '')) === 'crm') { const rt = document.getElementById('pageRoot'); rt.innerHTML = crmPage(); initIcons(rt); attachActions(); } }); });
      }
    });
  });
}

function installDelegate() {
  document.body.addEventListener('click', (ev) => {
    const t = ev.target;
    const find = (sel) => t.closest(sel);

    const pageLink = find('[data-page-link]');
    if (pageLink) { render(pageLink.dataset.pageLink); document.querySelectorAll('.dropdown').forEach((d) => d.hidden = true); return; }

    const bookBtn = find('[data-book]');
    if (bookBtn) { ev.stopPropagation(); bookEvent(bookBtn.dataset.book); return; }

    const cancelBtn = find('[data-cancel]');
    if (cancelBtn) { ev.stopPropagation(); cancelBooking(cancelBtn.dataset.cancel); return; }

    const payBtn = find('[data-pay]');
    if (payBtn) { ev.stopPropagation(); payInvoice(payBtn.dataset.pay); return; }

    if (find('[data-create-event]')) {
      ev.stopPropagation();
      const m = document.getElementById('modalBody');
      const get = (f) => m.querySelector(`[data-field="${f}"]`)?.value || '';
      createEvent({ title: get('title'), date_label: get('date_label'), time_label: get('time_label'), city: get('city'), capacity: get('capacity') })
        .then((ok) => { if (ok) closeModal(); });
      return;
    }

    if (find('[data-create-invoice]')) { ev.stopPropagation(); createInvoice(); return; }
    if (find('[data-invite-user]')) {
      ev.stopPropagation();
      const m = document.getElementById('modalBody');
      const get = (f) => m.querySelector(`[data-iu="${f}"]`)?.value || '';
      const fields = { full_name: get('full_name'), email: get('email'), role: get('role') };
      // Close first: a successful invite may open the set-up link modal, and
      // closing afterwards would take that link straight back off the screen.
      closeModal();
      inviteUser(fields).then((ok) => { if (!ok) modalForms['new-user'](); });
      return;
    }
    if (find('[data-create-deal]')) {
      ev.stopPropagation();
      const m = document.getElementById('modalBody');
      const get = (f) => m.querySelector(`[data-df="${f}"]`)?.value || '';
      createDeal({ title: get('title'), value: get('value'), owner: get('owner'), tier: get('tier'), stage: get('stage') })
        .then((ok) => { if (ok) closeModal(); });
      return;
    }
    if (find('[data-add-item]')) {
      ev.stopPropagation();
      document.getElementById('invItems').insertAdjacentHTML('beforeend', invoiceItemRow());
      initIcons(document.getElementById('invItems'));
      recalcInvoice();
      return;
    }
    const delItem = find('[data-del-item]');
    if (delItem) { ev.stopPropagation(); delItem.closest('.inv-item').remove(); recalcInvoice(); return; }
    if (find('[data-print-invoice]')) { ev.stopPropagation(); window.print(); return; }
    const payInv = find('[data-pay-invoice]');
    if (payInv) { ev.stopPropagation(); payInvoiceOnline(payInv.dataset.payInvoice); return; }
    const viewInv = find('[data-view-invoice]');
    if (viewInv) { ev.stopPropagation(); openInvoice(viewInv.dataset.viewInvoice); return; }
    const remindInv = find('[data-remind-invoice]');
    if (remindInv) { ev.stopPropagation(); remindInvoice(remindInv.dataset.remindInvoice); return; }
    const voidInv = find('[data-void-invoice]');
    if (voidInv) { ev.stopPropagation(); voidInvoice(voidInv.dataset.voidInvoice); return; }

    const leadIntroBtn = find('[data-lead-intro]');
    if (leadIntroBtn) { ev.stopPropagation(); requestIntro(leadIntroBtn.dataset.leadIntro); return; }

    const checkinBtn = find('[data-checkin]');
    if (checkinBtn) { ev.stopPropagation(); checkInTicket(checkinBtn.dataset.checkin); return; }

    if (find('[data-eb-sync]')) { ev.stopPropagation(); syncEventbrite(); return; }

    if (find('[data-create-task]')) {
      ev.stopPropagation();
      const m = document.getElementById('modalBody');
      const get = (f) => m.querySelector(`[data-field="${f}"]`)?.value || '';
      createTask({ title: get('title'), assignee: get('assignee'), due: get('due'), priority: get('priority') })
        .then((ok) => { if (ok) closeModal(); });
      return;
    }

    if (find('[data-save-profile]')) {
      ev.stopPropagation();
      const root = document.getElementById('pageRoot');
      const get = (f) => root.querySelector(`[data-pf="${f}"]`)?.value || '';
      saveProfile({ full_name: get('full_name'), org: get('org') });
      return;
    }

    const val = (sel, attr) => {
      const box = document.getElementById(sel);
      return (field) => box?.querySelector(`[${attr}="${field}"]`)?.value?.trim() || '';
    };

    if (find('[data-create-contact]')) {
      ev.stopPropagation();
      const get = val('modalBody', 'data-ct');
      createContact({
        name: get('name'), email: get('email'), company: get('company'), city: get('city'),
        phone: get('phone'), tier: get('tier'), status: get('status'), owner: get('owner')
      }).then((ok) => { if (ok) closeModal(); });
      return;
    }

    if (find('[data-issue-ticket]')) {
      ev.stopPropagation();
      const get = val('modalBody', 'data-tk');
      issueTicket({ event: get('event'), email: get('email'), tier: get('tier') })
        .then((ok) => { if (ok) closeModal(); });
      return;
    }

    if (find('[data-create-sponsor]')) {
      ev.stopPropagation();
      const get = val('modalBody', 'data-sp');
      createSponsor({
        name: get('name'), email: get('email'), contact: get('contact'),
        tier: get('tier'), amount: get('amount'), renewal: get('renewal')
      }).then((ok) => { if (ok) closeModal(); });
      return;
    }

    if (find('[data-create-campaign]')) {
      ev.stopPropagation();
      const get = val('modalBody', 'data-cp');
      createCampaign({
        name: get('name'), subject: get('subject'), segment: get('segment'), scheduled_for: get('scheduled_for') || null
      }).then((ok) => { if (ok) closeModal(); });
      return;
    }

    if (find('[data-create-intro]')) {
      ev.stopPropagation();
      const get = val('modalBody', 'data-in');
      requestNetworkIntro({ to: get('to'), reason: get('reason') }).then((ok) => { if (ok) closeModal(); });
      return;
    }

    const saveTierBtn = find('[data-save-tier]');
    if (saveTierBtn) {
      ev.stopPropagation();
      const body = document.getElementById('modalBody');
      const price = Number(body.querySelector('[data-tr="price"]')?.value || 0);
      const perks = (body.querySelector('[data-tr="perks"]')?.value || '').split('\n').map((x) => x.trim()).filter(Boolean);
      saveTier(saveTierBtn.dataset.saveTier, { price_cents: Math.round(price * 100), perks })
        .then((ok) => { if (ok) closeModal(); });
      return;
    }

    const saveEventBtn = find('[data-save-event]');
    if (saveEventBtn) {
      ev.stopPropagation();
      const get = val('modalBody', 'data-ef');
      saveEvent(saveEventBtn.dataset.saveEvent, {
        title: get('title'), date_label: get('date_label'), time_label: get('time_label'),
        city: get('city'), capacity: Number(get('capacity')) || 0, status: get('status')
      }).then((ok) => { if (ok) closeModal(); });
      return;
    }

    const tierBtn = find('[data-tier-manage]');
    if (tierBtn) { ev.stopPropagation(); openTierForm(tierBtn.dataset.tierManage); return; }

    const editEventBtn = find('[data-edit-event]');
    if (editEventBtn) { ev.stopPropagation(); closeDrawer(); openEventForm(editEventBtn.dataset.editEvent); return; }

    if (find('[data-remind-renewals]')) { ev.stopPropagation(); remindRenewals(); return; }
    const nudgeBtn = find('[data-nudge]');
    if (nudgeBtn) { ev.stopPropagation(); remindRenewals(nudgeBtn.dataset.nudge); return; }

    const sendCampaignBtn = find('[data-send-campaign]');
    if (sendCampaignBtn) { ev.stopPropagation(); sendCampaign(sendCampaignBtn.dataset.sendCampaign); return; }

    const templateCard = find('[data-template]');
    if (templateCard) { ev.stopPropagation(); modalForms['new-campaign'](`${templateCard.dataset.template} campaign`); return; }

    const introBtn = find('[data-intro]');
    if (introBtn) {
      ev.stopPropagation();
      const [id, status] = introBtn.dataset.intro.split(':');
      decideIntro(id, status);
      return;
    }

    const upgradeBtn = find('[data-upgrade-tier]');
    if (upgradeBtn) { ev.stopPropagation(); requestTierChange(upgradeBtn.dataset.upgradeTier); return; }

    const logBtn = find('[data-log-contact]');
    if (logBtn) {
      const [id, kind] = logBtn.dataset.logContact.split(':');
      logContactTouch(id, kind);
      if (kind !== 'email') ev.stopPropagation();
      return;
    }

    const delContact = find('[data-delete-contact]');
    if (delContact) {
      ev.stopPropagation();
      const cfg = confirmConfig['delete-contact'];
      openConfirm(cfg.title, cfg.body, () => deleteContact(delContact.dataset.deleteContact));
      return;
    }

    const refundBtn = find('[data-refund]');
    if (refundBtn) {
      ev.stopPropagation();
      const cfg = confirmConfig.refund;
      openConfirm(cfg.title, cfg.body, () => refundTicket(refundBtn.dataset.refund));
      return;
    }

    const cancelEventBtn = find('[data-cancel-event]');
    if (cancelEventBtn) {
      ev.stopPropagation();
      const cfg = confirmConfig['cancel-event'];
      openConfirm(cfg.title, cfg.body, () => cancelEvent(cancelEventBtn.dataset.cancelEvent));
      return;
    }

    const removeUserBtn = find('[data-remove-user]');
    if (removeUserBtn) {
      ev.stopPropagation();
      const cfg = confirmConfig['remove-user'];
      openConfirm(cfg.title, cfg.body, () => removeUser(removeUserBtn.dataset.removeUser));
      return;
    }

    if (find('[data-copy-link]')) {
      ev.stopPropagation();
      const field = document.getElementById('linkValue');
      field.select();
      navigator.clipboard?.writeText(field.value)
        .then(() => showToast('Link copied', 'success'))
        .catch(() => showToast('Select the link and copy it manually', 'info'));
      return;
    }

    const resetLinkBtn = find('[data-reset-link]');
    if (resetLinkBtn) { ev.stopPropagation(); issueResetLink(resetLinkBtn.dataset.resetLink); return; }

    const statusBtn = find('[data-user-status]');
    if (statusBtn) {
      ev.stopPropagation();
      const [email, status] = statusBtn.dataset.userStatus.split('|');
      setUserStatus(email, status);
      return;
    }

    if (find('[data-renewal-enquiry]')) {
      ev.stopPropagation();
      api('/api/support/tickets', { method: 'POST', body: {
        subject: 'Sponsorship renewal enquiry',
        message: `Please get in touch about renewing our ${sponsorProfile.tier} sponsorship (renews ${sponsorProfile.renews}).`
      } }).then(async ({ ok, data }) => {
        if (!ok) { showToast(data?.error || 'Could not send enquiry', 'error'); return; }
        showToast('Renewal enquiry sent — our team will reply in Support', 'success');
        await loadSupport();
      });
      return;
    }

    if (find('[data-send-reset]')) { ev.stopPropagation(); requestPasswordReset(); return; }

    const remindInvBtn = find('[data-remind-invoice]');
    if (remindInvBtn) { ev.stopPropagation(); remindInvoice(remindInvBtn.dataset.remindInvoice); return; }

    const markPaidBtn = find('[data-mark-paid]');
    if (markPaidBtn) { ev.stopPropagation(); payInvoice(markPaidBtn.dataset.markPaid); return; }

    const crmChip = find('[data-crm-filter]');
    if (crmChip) { ev.stopPropagation(); crmFilter = crmChip.dataset.crmFilter; render('crm'); return; }

    const modalBtn = find('[data-modal]');
    if (modalBtn) { ev.stopPropagation(); modalForms[modalBtn.dataset.modal]?.(); return; }

    const confirmBtn = find('[data-confirm]');
    if (confirmBtn) {
      ev.stopPropagation();
      const cfg = confirmConfig[confirmBtn.dataset.confirm];
      if (cfg) openConfirm(cfg.title, cfg.body, () => showToast(cfg.toast[0], cfg.toast[1]));
      return;
    }

    const contactRow = find('.contact-row[data-contact]');
    if (contactRow) { contactDrawer(Number(contactRow.dataset.contact)); return; }
    const invRow = find('[data-invoice]');
    if (invRow && !find('.link-button')) { invoiceDrawer(Number(invRow.dataset.invoice)); return; }
    const evtEl = find('[data-event-id]');
    if (evtEl) { eventDrawer(evtEl.dataset.eventId); return; }

    const sup = find('.support-item');
    if (sup) { openTicket(sup.dataset.thread); return; }
    if (find('[data-send-reply]')) { ev.stopPropagation(); sendReply(); return; }
    if (find('[data-new-ticket]')) { ev.stopPropagation(); openNewTicket(); return; }
    if (find('[data-submit-ticket]')) { ev.stopPropagation(); submitTicket(); return; }
    const tkStatus = find('[data-ticket-status]');
    if (tkStatus) { ev.stopPropagation(); setTicketStatus(tkStatus.dataset.ticketStatus); return; }

    const tab = find('[data-settings-tab]');
    if (tab) {
      settingsTab = tab.dataset.settingsTab;
      document.querySelectorAll('[data-settings-tab]').forEach((x) => x.classList.toggle('is-active', x.dataset.settingsTab === settingsTab));
      const body = document.getElementById('settingsBody');
      if (body) { body.innerHTML = settingsBody(settingsTab); initIcons(body); }
      return;
    }

    const chip = find('.filter-chip');
    if (chip) {
      chip.parentElement.querySelectorAll('.filter-chip').forEach((x) => x.classList.remove('is-active'));
      chip.classList.add('is-active');
      const label = chip.textContent.replace(/\d+$/, '').trim();
      filterVisibleRows(/^all$/i.test(label) ? '' : label);
      return;
    }

    const pageBtn = find('.pagination .pages button');
    if (pageBtn && !pageBtn.disabled && /^\d+$/.test(pageBtn.textContent)) {
      pageBtn.parentElement.querySelectorAll('button').forEach((x) => x.classList.remove('is-active'));
      pageBtn.classList.add('is-active');
      return;
    }

    if (find('[data-toggle-theme]')) { toggleTheme(); document.querySelectorAll('.dropdown').forEach((d) => d.hidden = true); return; }
    if (find('[data-logout]')) { document.querySelectorAll('.dropdown').forEach((d) => d.hidden = true); signOut(); return; }

    const toastBtn = find('[data-toast]');
    if (toastBtn) { ev.stopPropagation(); showToast(toastBtn.dataset.toast, toastBtn.dataset.toastVariant || 'info'); return; }

    if (find('[data-export]')) { ev.stopPropagation(); exportCSV(); return; }

    const quickTask = find('[data-quick-task]');
    if (quickTask) {
      ev.stopPropagation();
      quickTask.disabled = true;
      api('/api/admin/tasks', { method: 'POST', body: { title: quickTask.dataset.quickTask, priority: 'med' } })
        .then((r) => {
          showToast(r.ok ? 'Added to your tasks board' : 'Could not add task', r.ok ? 'success' : 'error');
          if (r.ok) quickTask.textContent = '✓ ' + quickTask.textContent;
        });
      return;
    }

    const rangeBtn = find('[data-range]');
    if (rangeBtn) {
      ev.stopPropagation();
      const label = rangeBtn.dataset.range;
      statsRange = { label, days: RANGE_DAYS[label] ?? null };
      const lbl = document.getElementById('rangeLabel');
      if (lbl) lbl.textContent = label;
      document.querySelectorAll('.dropdown').forEach((d) => { d.hidden = true; });
      refreshAdmin().then(() => showToast(`Showing ${label.toLowerCase()}`, 'info'));
      return;
    }

    // Catch-all: any action button that reached here has no wired behaviour yet —
    // give honest feedback instead of a silent dead click. Skip modal/close/submit
    // controls and links, which are handled elsewhere.
    const dead = find('.control, .auth-secondary, .secondary-action');
    if (dead && !dead.closest('.modal-foot') && !dead.hasAttribute('data-modal-close') && !dead.hasAttribute('data-page-link')) {
      ev.stopPropagation();
      showToast('Not available yet', 'info');
      return;
    }
  });

  document.body.addEventListener('change', (ev) => {
    const cb = ev.target.closest('.task-item input[type="checkbox"][data-task-done]');
    if (cb) setTaskStatus(cb.dataset.taskDone, cb.checked ? 'done' : 'todo');
  });
  document.body.addEventListener('input', (ev) => {
    if (ev.target.closest('.inv-item') || ev.target.matches('[data-iv="vat"]')) recalcInvoice();
    const search = ev.target.closest('.filterbar .search-input');
    if (search) filterVisibleRows(search.value);
  });
}

/* ===================== APP SHELL ===================== */
/* Set the active session from a server user record (from /signup, /login, /me). */
function setSession(user) {
  currentUser = user;
  currentRole = ROLES[user.role] ? user.role : 'member';
}

function applyRoleIdentity(role) {
  const p = ROLES[role].profile;
  const img = document.querySelector('#profileToggle img');
  if (img) { img.src = p.avatar; img.alt = (currentUser?.full_name || p.name); }
  const strong = document.querySelector('#profileToggle strong');
  const small = document.querySelector('#profileToggle small');
  if (strong) strong.textContent = currentUser?.full_name || p.name;
  if (small) small.textContent = p.role;
}

function renderSidebarNav(role) {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = ROLES[role].nav.map(([page, icon, label]) => `<button class="nav-item" data-page="${page}"><span data-icon="${icon}"></span>${label}</button>`).join('');
  initIcons(nav);
  nav.querySelectorAll('.nav-item').forEach((b) => b.addEventListener('click', () => {
    render(b.dataset.page);
    document.getElementById('sidebar').classList.remove('is-open');
  }));
}

async function showApp(page) {
  document.getElementById('authScreen').classList.add('is-hidden');
  document.querySelector('.app-shell').classList.remove('is-hidden');
  document.body.dataset.role = currentRole;
  applyRoleIdentity(currentRole);
  renderSidebarNav(currentRole);
  renderBottomNav(currentRole);
  showSkeleton();
  try {
    if (currentRole === 'member') await loadMemberData();
    else if (currentRole === 'sponsor') await loadSponsorData();
    else if (currentRole === 'admin') await loadAdminData();
  } catch { showToast('Could not load your data', 'error'); }
  render(page || ROLES[currentRole].landing);
}
function showAuth(mode = 'login') {
  document.getElementById('authScreen').classList.remove('is-hidden');
  document.querySelector('.app-shell').classList.add('is-hidden');
  document.querySelectorAll('[data-auth-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.authTab === mode));
  document.querySelectorAll('.auth-form').forEach((f) => f.classList.toggle('is-active', f.id === `${mode}Form`));
  if (mode !== 'reset') history.replaceState(null, '', `#${mode}`);
}

/* ===================== BOTTOM NAV ===================== */
function renderBottomNav(role = currentRole) {
  const items = ROLES[role].bottomNav;
  document.getElementById('bottomNav').innerHTML = items.map(([key, icon, label]) => `<button type="button" data-page="${key}"><span data-icon="${icon}"></span>${label}</button>`).join('');
  initIcons(document.getElementById('bottomNav'));
  document.querySelectorAll('#bottomNav button').forEach((b) => b.addEventListener('click', () => render(b.dataset.page)));
}

/* ===================== GLOBAL WIRING ===================== */
document.querySelectorAll('[data-auth-tab]').forEach((b) => b.addEventListener('click', () => showAuth(b.dataset.authTab)));

function enterApp(user, message) {
  setSession(user);
  showApp(ROLES[currentRole].landing);
  showToast(message, 'success');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  if (f.querySelector('label.has-error')) { showToast('Please fix the highlighted fields', 'error'); return; }
  const email = f.querySelector('input[type="email"]').value;
  const password = f.querySelector('input[type="password"]').value;
  const submit = f.querySelector('.auth-submit');
  submit.disabled = true;
  const remember = document.getElementById('rememberMe')?.checked !== false;
  const { ok, data } = await api('/api/auth/login', { method: 'POST', body: { email, password, remember } });
  submit.disabled = false;
  if (!ok) { showToast(data?.error || 'Login failed', 'error'); return; }
  enterApp(data.user, `Logged in as ${ROLES[data.user.role].label}`);
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  if (f.querySelector('label.has-error')) { showToast('Please fix the highlighted fields', 'error'); return; }
  const get = (sel) => f.querySelector(sel)?.value || '';
  const body = {
    full_name: get('input[autocomplete="name"]'),
    email: get('input[type="email"]'),
    password: get('input[type="password"]'),
    org: get('[data-field="org"]'),
    role: get('[data-field="role"]'),
    remember: true
  };
  const submit = f.querySelector('.auth-submit');
  submit.disabled = true;
  const { ok, data } = await api('/api/auth/signup', { method: 'POST', body });
  submit.disabled = false;
  if (!ok) { showToast(data?.error || 'Signup failed', 'error'); return; }
  enterApp(data.user, 'Account created');
});

document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('is-open'));
document.getElementById('globalSearch').addEventListener('input', (e) => filterVisibleRows(e.currentTarget.value));
document.getElementById('globalSearch').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); openCommand(); }
});

/* dropdowns */
function toggleDropdown(btn, panel) {
  const open = panel.hidden;
  document.querySelectorAll('.dropdown').forEach((d) => d.hidden = true);
  panel.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}
document.getElementById('notifToggle').addEventListener('click', (e) => {
  e.stopPropagation();
  renderNotifPanel();
  toggleDropdown(e.currentTarget, document.getElementById('notifPanel'));
});
document.getElementById('rangeToggle')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown(e.currentTarget, document.getElementById('rangePanel'));
});
document.getElementById('profileToggle').addEventListener('click', (e) => {
  e.stopPropagation();
  renderProfileMenu();
  toggleDropdown(e.currentTarget, document.getElementById('profileMenu'));
});
document.addEventListener('click', () => document.querySelectorAll('.dropdown').forEach((d) => d.hidden = true));

/* theme */
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
const savedTheme = localStorage.getItem('hbba-theme') || 'light';
document.body.dataset.theme = savedTheme;
document.querySelector('#themeToggle [data-icon]').dataset.icon = savedTheme === 'dark' ? 'sun' : 'moon';

/* command palette */
document.getElementById('commandOpen').addEventListener('click', openCommand);
document.getElementById('commandInput').addEventListener('input', (e) => renderCommandResults(e.target.value));
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommand(); }
  if (e.key === 'Escape') {
    if (!document.getElementById('commandOverlay').hidden) closeCommand();
    if (!document.getElementById('modalOverlay').hidden) closeModal();
    if (!document.getElementById('drawerOverlay').hidden) closeDrawer();
    if (!document.getElementById('confirmOverlay').hidden) closeConfirm();
  }
});

/* overlay close on backdrop click */
['modalOverlay', 'drawerOverlay', 'commandOverlay', 'confirmOverlay'].forEach((id) => {
  document.getElementById(id).addEventListener('click', (e) => {
    if (e.target.id === id) {
      if (id === 'modalOverlay') closeModal();
      if (id === 'drawerOverlay') closeDrawer();
      if (id === 'commandOverlay') closeCommand();
      if (id === 'confirmOverlay') closeConfirm();
    }
  });
});
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('confirmCancel').addEventListener('click', closeConfirm);
document.getElementById('confirmOk').addEventListener('click', () => {
  if (confirmHandler) confirmHandler();
  closeConfirm();
});

/* boot */
initIcons();
installDelegate();
attachAuthValidation();
document.querySelector('.app-shell').classList.add('is-hidden');
document.getElementById('authScreen').classList.add('is-hidden');

/* ---------- Password reset / invite links ---------- */
let resetToken = null;

function readHashParam(name) {
  const raw = location.hash.replace('#', '');
  const qs = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  return new URLSearchParams(qs).get(name);
}

document.getElementById('forgotPassword').addEventListener('click', () => {
  openModal('Reset your password',
    `<label>Email address<input type="email" data-fp="email" placeholder="you@company.com" value="${document.querySelector('#loginForm input[type=\'email\']')?.value || ''}" /></label>
     <p class="muted" style="font-size:12px;margin-top:8px">We send a single-use link that expires in an hour.</p>`,
    '<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-send-reset>Send reset link</button>');
});

async function requestPasswordReset() {
  const email = document.getElementById('modalBody')?.querySelector('[data-fp="email"]')?.value?.trim();
  const { ok, data } = await api('/api/auth/forgot', { method: 'POST', body: { email } });
  if (!ok) { showToast(data?.error || 'Could not start the reset', 'error'); return; }
  closeModal();
  showToast(data.message, data.delivered ? 'success' : 'info');
}

document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const [pw, confirm] = [...f.querySelectorAll('input[type="password"]')].map((i) => i.value);
  if (pw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
  if (pw !== confirm) { showToast('Those passwords do not match', 'error'); return; }
  const submit = f.querySelector('.auth-submit');
  submit.disabled = true;
  const { ok, data } = await api('/api/auth/reset', { method: 'POST', body: { token: resetToken, password: pw } });
  submit.disabled = false;
  if (!ok) { showToast(data?.error || 'That link is no longer valid', 'error'); return; }
  resetToken = null;
  history.replaceState(null, '', '#dashboard');
  enterApp(data.user, 'Password set — you are signed in');
});

/* Only offer Google when this deployment has it configured. */
async function showAvailableProviders() {
  const { ok, data } = await api('/api/auth/providers');
  const btn = document.getElementById('googleSignIn');
  if (btn) btn.hidden = !(ok && data?.google);
}

/* Coming back from Stripe checkout: #invoices?paid=INV-123 */
async function handlePaymentReturn() {
  const paid = readHashParam('paid');
  if (!paid) return;
  const { ok, data } = await api(`/api/invoices/${paid}`);
  const settled = ok && data?.invoice?.status === 'paid';
  showToast(settled ? `Payment received for ${paid}` : `Payment for ${paid} is still settling`, settled ? 'success' : 'info');
  history.replaceState(null, '', `#${location.hash.replace('#', '').split('?')[0] || 'dashboard'}`);
}

(async function boot() {
  // Restore session from the server (httpOnly cookie). No client-side role guessing.
  const route = location.hash.replace('#', '').split('?')[0];
  const token = readHashParam('token');
  const { ok, data } = await api('/api/auth/me');

  if (route === 'reset' && token) {
    resetToken = token;
    showAuth('reset');
    showAvailableProviders();
    return;
  }

  if (ok && data?.user) {
    setSession(data.user);
    await showApp(route && pageRendererFor(currentRole, route) ? route : ROLES[currentRole].landing);
    await handlePaymentReturn();
  } else {
    showAuth(route === 'signup' ? 'signup' : 'login');
    showAvailableProviders();
    const err = readHashParam('error');
    if (err) showToast(err === 'suspended' ? 'That account is suspended' : 'Google sign-in did not complete', 'error');
  }
})();
