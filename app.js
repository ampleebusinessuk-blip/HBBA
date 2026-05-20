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
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>'
};

const photos = [
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=240&q=80'
];

const pageMeta = {
  dashboard: ['Dashboard', 'Live insights, member growth, event performance, and relationship health - all in one place.'],
  crm: ['CRM', 'Manage contacts, companies, leads, and relationship health.'],
  memberships: ['Memberships', 'Track member tiers, renewals, applications, and benefits.'],
  events: ['Events', 'Plan upcoming programs and monitor attendance.'],
  tickets: ['Tickets', 'Manage ticket inventory, orders, and check-ins.'],
  sponsors: ['Sponsors', 'Coordinate sponsor packages, invoices, and deliverables.'],
  networking: ['Networking', 'Build introductions and relationship opportunities.'],
  tasks: ['Tasks & Activities', 'Prioritize team work and upcoming reminders.'],
  email: ['Email Marketing', 'Create campaigns and review engagement.'],
  support: ['Support Tickets', 'Resolve member questions and operational issues.'],
  invoices: ['Invoices & Payments', 'Monitor billing, collections, and payment status.'],
  reports: ['Reports & Analytics', 'Review organization performance and trends.'],
  settings: ['Settings', 'Configure workspace, users, permissions, and integrations.']
};

const metrics = [
  ['Total Members', '1,250', '12.5%', 'users', '#5b35f5'],
  ['Events', '24', '8.3%', 'calendar', '#2563eb'],
  ['Ticket Sales', '342', '18.7%', 'ticket', '#0f9f6e'],
  ['Revenue', '£78,450', '22.1%', 'chart', '#5b35f5'],
  ['New Leads', '186', '15.3%', 'users', '#f97316']
];

const events = [
  ['MAY', '25', 'Global Business Networking Dinner', '6:00 PM - 10:00 PM', 'London, UK', '120 Attendees'],
  ['JUN', '02', 'International Trade Conference 2024', '9:00 AM - 5:00 PM', 'Budapest, Hungary', '250 Attendees'],
  ['JUN', '15', 'Embassy Business Forum', '2:00 PM - 6:00 PM', 'Dubai, UAE', '80 Attendees'],
  ['JUN', '28', 'VIP Investment Roundtable', '5:00 PM - 9:00 PM', 'Paris, France', '40 Attendees']
];

const activities = [
  ['New member registered', 'Sarah Johnson joined as Gold Member', '2 mins ago', 'green'],
  ['New lead added', 'TechVision Ltd. from Germany', '15 mins ago', 'blue'],
  ['Ticket sold', '2 VIP tickets for Business Dinner', '1 hour ago', 'red'],
  ['Meeting scheduled', 'John Doe with Emirates Chamber', '2 hours ago', 'orange'],
  ['Sponsor onboarded', 'Global Bank Ltd. - Gold Sponsor', '3 hours ago', 'purple']
];

function initIcons() {
  document.querySelectorAll('[data-icon]').forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || icons.star;
  });
}

function spark(color) {
  return `<svg class="sparkline" viewBox="0 0 220 50" preserveAspectRatio="none"><path d="M0 38 C22 38 28 38 42 24 S70 42 92 35 S128 24 146 17 S168 33 190 27 S210 20 220 21" fill="none" stroke="${color}" stroke-width="3"/><path d="M0 48 C32 48 44 48 68 38 S112 41 142 28 S178 41 220 32 L220 50 L0 50Z" fill="${color}" opacity=".08"/></svg>`;
}

function metricCards() {
  return `<div class="metric-grid">${metrics.map(([label, value, trend, icon, color]) => `
    <button class="metric-card" type="button" data-toast="${label} details opened">
      <div class="metric-top">
        <span class="metric-icon" style="color:${color};background:${color}16">${icons[icon]}</span>
        <span class="trend">↑ ${trend}</span>
      </div>
      <h3>${value}</h3>
      <small>${label}<br />vs last month</small>
      ${spark(color)}
    </button>
  `).join('')}</div>`;
}

function noticeBar() {
  return `<div class="notice-bar">
    <strong>Verify your HBBA admin email.</strong>
    <span>A verification link is needed for john.doe@hbbaglobal.co.uk.</span>
    <button type="button" data-toast="Verification email resent">Resend</button>
  </div>`;
}

function briefingCard() {
  return `<section class="briefing-card">
    <div class="briefing-left">
      <span class="briefing-icon">${icons.gem}</span>
      <div>
        <span class="eyebrow">HBBA Daily Briefing</span>
        <small>20/05/2026, 22:35:13</small>
      </div>
    </div>
    <div class="briefing-body">
      <h2>UK network position next 30d: 24 events - 186 warm leads</h2>
      <div class="briefing-grid">
        <p><i></i> Gold member renewals remain healthy across London and regional chapters.</p>
        <p><i></i> Sponsor conversations are strongest in finance, trade, and technology.</p>
        <p><i></i> Business Dinner attendance is trending above the current venue target.</p>
        <p><i></i> Follow up with new leads before Friday to protect conversion momentum.</p>
      </div>
      <div class="briefing-tags">
        <span>Send sponsor follow-ups to top-3 open conversations today.</span>
        <span>Prepare London dinner guest list for board review.</span>
        <span>Check renewals due before the end of the month.</span>
      </div>
    </div>
    <button class="refresh-button" type="button" data-toast="Briefing refreshed">↻</button>
  </section>`;
}

function dashboardPage() {
  return `
    ${noticeBar()}
    ${briefingCard()}
    ${metricCards()}
    <div class="dashboard-grid">
      <section class="card">
        <div class="card-title"><h2>Upcoming Events</h2><button class="link-button" data-page-link="events">View all</button></div>
        ${events.map((event, index) => eventRow(event, index)).join('')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Membership Overview</h2><button class="link-button" data-page-link="reports">View report</button></div>
        <div class="donut-wrap">
          <div class="donut"></div>
          <div class="legend">
            <div><span style="background:var(--gold)"></span><strong>Gold</strong><p class="muted">450 (36%)</p></div>
            <div><span style="background:#cfd3dc"></span><strong>Silver</strong><p class="muted">500 (40%)</p></div>
            <div><span style="background:#bd6425"></span><strong>Bronze</strong><p class="muted">300 (24%)</p></div>
          </div>
        </div>
        <div class="mini-stats"><div><span class="muted">Renewals Due Soon</span><strong>32</strong></div><div><span class="muted">Expiring This Month</span><strong>18</strong></div></div>
      </section>
      <section class="card">
        <div class="card-title"><h2>Recent Activity</h2><button class="link-button" data-page-link="tasks">View all</button></div>
        ${activities.map(([title, text, time, tone]) => `
          <div class="activity"><span class="activity-icon" style="background:var(--${tone === 'purple' ? 'purple' : tone})">${icons.users}</span><div><h3>${title}</h3><span>${text}</span></div><small class="muted">${time}</small></div>
        `).join('')}
      </section>
    </div>
    <div class="lower-grid">
      <section class="card">
        <div class="card-title"><h2>Top Sponsors</h2><button class="link-button" data-page-link="sponsors">View all</button></div>
        ${sponsorRows()}
      </section>
      <section class="card">
        <div class="card-title"><h2>Tickets Overview</h2><button class="link-button" data-page-link="tickets">View report</button></div>
        ${ticketChart()}
      </section>
      <section class="card">
        <div class="card-title"><h2>Tasks & Reminders</h2><button class="link-button" data-page-link="tasks">View all</button></div>
        ${taskList()}
      </section>
    </div>
  `;
}

function eventRow(event, index) {
  const [month, day, title, time, place, badge] = event;
  return `<button class="event-row" type="button" data-toast="${title}">
    <span class="date-tile">${month}<strong>${day}</strong></span>
    <img src="${photos[index % photos.length]}" alt="" />
    <span><h3>${title}</h3><span class="event-meta">${time}<br />${place}</span><span class="chip">${badge}</span></span>
  </button>`;
}

function sponsorRows() {
  return [
    ['G', 'Global Bank Ltd.', 'Gold Sponsor', '£15,000'],
    ['T', 'Tech Solutions Inc.', 'Silver Sponsor', '£10,000'],
    ['B', 'Business World', 'Bronze Sponsor', '£5,000']
  ].map(([mark, name, type, amount]) => `<div class="sponsor-row"><span class="sponsor-mark">${mark}</span><div><h3>${name}</h3><span class="muted">${type}</span></div><strong>${amount}</strong></div>`).join('');
}

function ticketChart() {
  return `<div class="bar-chart">${[58, 42, 54, 38, 31].map((value) => `<span class="bar" style="--sold:${value}%"></span>`).join('')}</div>
  <div class="bar-labels"><span>May 25</span><span>Jun 02</span><span>Jun 15</span><span>Jun 28</span><span>Jul 10</span></div>`;
}

function taskList() {
  return [
    ['Follow up with new leads', '12 pending', ''],
    ['Send event invitation emails', 'Due in 2 days', 'blue'],
    ['Membership renewals', '18 pending', 'red'],
    ['Prepare report for board meeting', 'Due in 5 days', 'blue']
  ].map(([text, pill, tone]) => `<div class="task-item"><label><input type="checkbox" />${text}</label><span class="pill ${tone}">${pill}</span></div>`).join('');
}

function standardPage(type) {
  const pageSpecific = {
    crm: {
      cards: [['Active Contacts', '4,820'], ['Companies', '936'], ['Hot Leads', '186']],
      table: ['Sarah Johnson|Gold Member|London|Active', 'Lukas Meyer|TechVision Ltd.|Berlin|Warm', 'Amina Hassan|Emirates Chamber|Dubai|Active', 'Peter Novak|Trade Partners|Budapest|New'],
      side: 'Lead pipeline'
    },
    memberships: {
      cards: [['Total Members', '1,250'], ['Renewals Due', '32'], ['Applications', '18']],
      table: ['Sarah Johnson|Gold|May 2025|Active', 'Global Bank Ltd.|Corporate Gold|Jun 2025|Active', 'Tech Solutions Inc.|Silver|Jul 2024|Pending', 'Business World|Bronze|Sep 2024|Active'],
      side: 'Tier mix'
    },
    events: {
      cards: [['Upcoming', '24'], ['Attendees', '1,430'], ['Venues', '12']],
      custom: `<section class="card">${events.map((event, index) => eventRow(event, index)).join('')}</section>`,
      side: 'Event capacity'
    },
    tickets: {
      cards: [['Sold', '342'], ['Available', '618'], ['Revenue', '£24,600']],
      custom: `<section class="card"><div class="card-title"><h2>Sales by Event</h2><button class="link-button">Export</button></div>${ticketChart()}</section>`,
      side: 'Inventory'
    },
    sponsors: {
      cards: [['Sponsors', '42'], ['Pipeline', '£92k'], ['Deliverables', '17']],
      custom: `<section class="card">${sponsorRows()}</section>`,
      side: 'Package value'
    },
    networking: {
      cards: [['Introductions', '78'], ['Meetings', '34'], ['Match Score', '86%']],
      table: ['John Doe|Emirates Chamber|Investment|Scheduled', 'Sarah Johnson|Global Bank Ltd.|Finance|Matched', 'Amina Hassan|Tech Solutions Inc.|Technology|New', 'Lukas Meyer|Business World|Trade|Matched'],
      side: 'Match quality'
    },
    tasks: {
      cards: [['Open Tasks', '64'], ['Overdue', '8'], ['Completed', '212']],
      custom: `<section class="card">${taskList()}${taskList()}</section>`,
      side: 'Completion'
    },
    email: {
      cards: [['Campaigns', '14'], ['Open Rate', '42%'], ['Clicks', '1,860']],
      table: ['May Newsletter|Members|42%|Sent', 'Trade Dinner Invite|VIP Segment|57%|Active', 'Renewal Reminder|Expiring Members|38%|Draft', 'Sponsor Update|Partners|49%|Scheduled'],
      side: 'Engagement'
    },
    support: {
      cards: [['Open Tickets', '19'], ['Avg Response', '2h'], ['Resolved', '147']],
      table: ['SUP-1042|Payment receipt request|Finance|Open', 'SUP-1041|Event access question|Events|Pending', 'SUP-1038|Membership upgrade|Membership|Open', 'SUP-1034|Invoice correction|Finance|Resolved'],
      side: 'Response health'
    },
    invoices: {
      cards: [['Paid', '£78,450'], ['Outstanding', '£12,900'], ['Overdue', '£3,200']],
      table: ['INV-3021|Global Bank Ltd.|£15,000|Paid', 'INV-3020|Tech Solutions Inc.|£10,000|Paid', 'INV-3018|Business World|£5,000|Due', 'INV-3012|Trade Partners|£3,200|Overdue'],
      side: 'Collections'
    },
    reports: {
      cards: [['Growth', '12.5%'], ['Revenue', '22.1%'], ['Engagement', '68%']],
      custom: `<section class="card"><div class="card-title"><h2>Performance Trends</h2><button class="link-button">Download</button></div>${ticketChart()}</section>`,
      side: 'KPI score'
    },
    settings: {
      cards: [['Users', '12'], ['Roles', '5'], ['Integrations', '8']],
      table: ['Workspace profile|Branding and public details|Admin|Active', 'User access|Roles and permissions|Security|Active', 'Billing settings|Plan and invoices|Finance|Active', 'Integrations|Calendar, email, payments|Apps|Review'],
      side: 'Workspace health'
    }
  }[type];

  return `
    <div class="cards-grid">${pageSpecific.cards.map(([label, value]) => `<button class="compact-card" type="button" data-toast="${label} opened"><span class="muted">${label}</span><h2>${value}</h2>${spark('#5b35f5')}</button>`).join('')}</div>
    <div class="page-grid">
      ${pageSpecific.custom || tableCard(pageSpecific.table)}
      <aside class="card">
        <div class="card-title"><h2>${pageSpecific.side}</h2><button class="link-button">Details</button></div>
        <div class="stat-line">
          ${[82, 64, 48, 72].map((value, index) => `<div><div class="split-row"><strong>${['Gold', 'Silver', 'Bronze', 'New'][index]}</strong><span class="muted">${value}%</span></div><div class="progress"><i style="--value:${value}%"></i></div></div>`).join('')}
        </div>
      </aside>
    </div>
  `;
}

function tableCard(rows) {
  return `<section class="card"><div class="card-title"><h2>Records</h2><button class="link-button">Add new</button></div><table class="table"><thead><tr><th>Name</th><th>Type</th><th>Detail</th><th>Status</th></tr></thead><tbody>${rows.map((row) => {
    const [a, b, c, d] = row.split('|');
    const statusClass = d === 'Overdue' || d === 'Open' ? 'danger' : d === 'Pending' || d === 'Warm' || d === 'Due' || d === 'Review' ? 'warn' : '';
    return `<tr><td><strong>${a}</strong></td><td>${b}</td><td>${c}</td><td><span class="status ${statusClass}">${d}</span></td></tr>`;
  }).join('')}</tbody></table></section>`;
}

function render(page = 'dashboard') {
  const [title, subtitle] = pageMeta[page];
  document.querySelector('.eyebrow').textContent = page === 'dashboard' ? 'Dashboard' : 'HBBA Global';
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = subtitle;
  document.getElementById('pageRoot').innerHTML = page === 'dashboard' ? dashboardPage() : standardPage(page);
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.page === page));
  attachActions();
  history.replaceState(null, '', `#${page}`);
}

function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

function attachActions() {
  document.querySelectorAll('[data-page-link]').forEach((button) => {
    button.addEventListener('click', () => render(button.dataset.pageLink));
  });
  document.querySelectorAll('[data-toast]').forEach((button) => {
    button.addEventListener('click', () => showToast(button.dataset.toast));
  });
  document.querySelectorAll('.link-button:not([data-page-link]), .control, .primary-icon, .icon-button:not(.menu-toggle), .profile').forEach((button) => {
    button.addEventListener('click', () => showToast('Prototype action'));
  });
  document.querySelectorAll('.task-item input').forEach((input) => {
    input.addEventListener('change', () => showToast(input.checked ? 'Task marked complete' : 'Task reopened'));
  });
}

function showApp(page = 'dashboard') {
  document.getElementById('authScreen').classList.add('is-hidden');
  document.querySelector('.app-shell').classList.remove('is-hidden');
  render(page);
}

function showAuth(mode = 'login') {
  document.getElementById('authScreen').classList.remove('is-hidden');
  document.querySelector('.app-shell').classList.add('is-hidden');
  document.querySelectorAll('[data-auth-tab]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.authTab === mode);
  });
  document.querySelectorAll('.auth-form').forEach((form) => {
    form.classList.toggle('is-active', form.id === `${mode}Form`);
  });
  history.replaceState(null, '', `#${mode}`);
}

document.querySelectorAll('[data-auth-tab]').forEach((button) => {
  button.addEventListener('click', () => showAuth(button.dataset.authTab));
});

document.querySelectorAll('.auth-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showApp('dashboard');
    showToast(form.id === 'signupForm' ? 'Account created' : 'Logged in');
  });
});

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    render(button.dataset.page);
    document.getElementById('sidebar').classList.remove('is-open');
  });
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('is-open');
});

document.getElementById('globalSearch').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    showToast(`Searching for "${event.currentTarget.value || 'everything'}"`);
  }
});

initIcons();
const initialRoute = location.hash.replace('#', '');
document.querySelector('.app-shell').classList.add('is-hidden');
if (initialRoute && !['login', 'signup'].includes(initialRoute)) {
  showApp(initialRoute);
} else {
  showAuth(initialRoute || 'login');
}
