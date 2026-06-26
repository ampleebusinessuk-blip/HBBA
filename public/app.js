/* ============================================================
   HBBA Global Prototype — UI Only (no backend)
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
const photos = [
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?auto=format&fit=crop&w=320&q=80'
];

const avatars = [
  'https://i.pravatar.cc/96?img=12',
  'https://i.pravatar.cc/96?img=24',
  'https://i.pravatar.cc/96?img=33',
  'https://i.pravatar.cc/96?img=47',
  'https://i.pravatar.cc/96?img=51',
  'https://i.pravatar.cc/96?img=65',
  'https://i.pravatar.cc/96?img=14',
  'https://i.pravatar.cc/96?img=68'
];

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
let metrics = [
  ['Total Members', '1,250', '12.5%', 'users', '#5b35f5'],
  ['Events', '24', '8.3%', 'calendar', '#2563eb'],
  ['Ticket Sales', '342', '18.7%', 'ticket', '#0f9f6e'],
  ['Revenue', '£78,450', '22.1%', 'chart', '#5b35f5'],
  ['New Leads', '186', '15.3%', 'users', '#f97316']
];

const upcomingEvents = [
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

let contacts = [
  { name: 'Sarah Johnson', email: 'sarah@globalbank.co.uk', company: 'Global Bank Ltd.', city: 'London', status: 'Active', tier: 'Gold', avatar: avatars[0], presence: 'online', phone: '+44 20 7946 0991', deals: 3, last: '2h ago' },
  { name: 'Lukas Meyer', email: 'l.meyer@techvision.de', company: 'TechVision Ltd.', city: 'Berlin', status: 'Warm', tier: 'Silver', avatar: avatars[1], presence: 'away', phone: '+49 30 1234 5678', deals: 1, last: '1d ago' },
  { name: 'Amina Hassan', email: 'amina@emiratesch.ae', company: 'Emirates Chamber', city: 'Dubai', status: 'Active', tier: 'Gold', avatar: avatars[2], presence: 'online', phone: '+971 4 200 3000', deals: 2, last: '3h ago' },
  { name: 'Peter Novak', email: 'pnovak@tradepartners.hu', company: 'Trade Partners', city: 'Budapest', status: 'New', tier: 'Bronze', avatar: avatars[3], presence: 'busy', phone: '+36 1 555 0123', deals: 0, last: '4d ago' },
  { name: 'Elena Rossi', email: 'erossi@italtrade.it', company: 'Italtrade SRL', city: 'Milan', status: 'Active', tier: 'Silver', avatar: avatars[4], presence: 'online', phone: '+39 02 1234 5678', deals: 4, last: '1h ago' },
  { name: 'Marcus Chen', email: 'marcus@chenholdings.sg', company: 'Chen Holdings', city: 'Singapore', status: 'Warm', tier: 'Gold', avatar: avatars[5], presence: 'offline', phone: '+65 6789 0123', deals: 2, last: '2d ago' },
  { name: 'Olivia Watson', email: 'olivia@cityfin.co.uk', company: 'City Finance', city: 'London', status: 'Active', tier: 'Silver', avatar: avatars[6], presence: 'online', phone: '+44 20 7946 7711', deals: 1, last: '5h ago' },
  { name: 'Daniel Park', email: 'd.park@koreabiz.kr', company: 'Korea Biz Group', city: 'Seoul', status: 'New', tier: 'Bronze', avatar: avatars[7], presence: 'away', phone: '+82 2 555 1234', deals: 0, last: '6d ago' }
];

const dealStages = [
  { name: 'Lead', total: '£24k', cards: [
    { title: 'TechVision intro', value: '£8k', owner: 'Lukas Meyer', tier: 'Silver' },
    { title: 'City Finance pitch', value: '£6k', owner: 'Olivia Watson', tier: 'Silver' },
    { title: 'Korea Biz exploration', value: '£10k', owner: 'Daniel Park', tier: 'Bronze' }
  ]},
  { name: 'Qualified', total: '£36k', cards: [
    { title: 'Global Bank renewal', value: '£15k', owner: 'Sarah Johnson', tier: 'Gold' },
    { title: 'Italtrade expansion', value: '£12k', owner: 'Elena Rossi', tier: 'Silver' },
    { title: 'Emirates partnership', value: '£9k', owner: 'Amina Hassan', tier: 'Gold' }
  ]},
  { name: 'Proposal', total: '£28k', cards: [
    { title: 'Chen Holdings VIP', value: '£18k', owner: 'Marcus Chen', tier: 'Gold' },
    { title: 'Trade Partners sponsor', value: '£10k', owner: 'Peter Novak', tier: 'Bronze' }
  ]},
  { name: 'Won', total: '£42k', cards: [
    { title: 'Global Bank Sponsor 2024', value: '£25k', owner: 'Sarah Johnson', tier: 'Gold' },
    { title: 'Emirates Forum Sponsor', value: '£17k', owner: 'Amina Hassan', tier: 'Gold' }
  ]}
];

const membershipTiers = [
  { name: 'Gold', price: '£2,400/yr', members: 450, color: 'gold', perks: ['VIP event access', 'Dedicated relationship manager', 'Quarterly briefings', 'Sponsor introductions'] },
  { name: 'Silver', price: '£1,200/yr', members: 500, color: 'silver', perks: ['Premium event access', 'Member directory', 'Monthly newsletter', 'Trade missions'] },
  { name: 'Bronze', price: '£480/yr', members: 300, color: 'bronze', perks: ['Standard event access', 'Online community', 'Resource library'] }
];

const renewals = [
  { name: 'Sarah Johnson', tier: 'Gold', days: 4 },
  { name: 'Global Bank Ltd.', tier: 'Corporate Gold', days: 9 },
  { name: 'Tech Solutions Inc.', tier: 'Silver', days: 14 },
  { name: 'Business World', tier: 'Bronze', days: 21 },
  { name: 'TechVision Ltd.', tier: 'Silver', days: 28 }
];

let eventsCatalog = [
  { id: 'E001', title: 'Global Business Networking Dinner', date: 'May 25', time: '6 PM', city: 'London, UK', attendees: 120, capacity: 150, status: 'Confirmed', img: photos[0] },
  { id: 'E002', title: 'International Trade Conference 2024', date: 'Jun 02', time: '9 AM', city: 'Budapest, Hungary', attendees: 250, capacity: 320, status: 'Selling', img: photos[1] },
  { id: 'E003', title: 'Embassy Business Forum', date: 'Jun 15', time: '2 PM', city: 'Dubai, UAE', attendees: 80, capacity: 100, status: 'Confirmed', img: photos[2] },
  { id: 'E004', title: 'VIP Investment Roundtable', date: 'Jun 28', time: '5 PM', city: 'Paris, France', attendees: 40, capacity: 50, status: 'Selling', img: photos[3] },
  { id: 'E005', title: 'Sponsor Strategy Workshop', date: 'Jul 10', time: '10 AM', city: 'London, UK', attendees: 22, capacity: 60, status: 'Draft', img: photos[4] },
  { id: 'E006', title: 'Member-Only Summer Mixer', date: 'Jul 22', time: '7 PM', city: 'Manchester, UK', attendees: 90, capacity: 110, status: 'Confirmed', img: photos[5] }
];

const ticketRecords = [
  { id: 'T-9821', event: 'Global Business Networking Dinner', buyer: 'Sarah Johnson', tier: 'VIP', price: '£250', status: 'Paid', checkin: 'In' },
  { id: 'T-9820', event: 'International Trade Conference', buyer: 'Lukas Meyer', tier: 'Standard', price: '£120', status: 'Paid', checkin: 'Pending' },
  { id: 'T-9819', event: 'Embassy Business Forum', buyer: 'Amina Hassan', tier: 'VIP', price: '£300', status: 'Paid', checkin: 'In' },
  { id: 'T-9818', event: 'VIP Investment Roundtable', buyer: 'Marcus Chen', tier: 'VIP', price: '£450', status: 'Pending', checkin: 'Pending' },
  { id: 'T-9817', event: 'Sponsor Strategy Workshop', buyer: 'Elena Rossi', tier: 'Standard', price: '£90', status: 'Refunded', checkin: '—' }
];

let sponsorList = [
  { name: 'Global Bank Ltd.', tier: 'Gold', amount: '£15,000', renewal: 'Jun 2025', contact: 'Sarah Johnson', status: 'Active' },
  { name: 'Tech Solutions Inc.', tier: 'Silver', amount: '£10,000', renewal: 'Jul 2024', contact: 'Lukas Meyer', status: 'Renewal' },
  { name: 'Business World', tier: 'Bronze', amount: '£5,000', renewal: 'Sep 2024', contact: 'Peter Novak', status: 'Active' },
  { name: 'Emirates Chamber', tier: 'Gold', amount: '£18,000', renewal: 'Dec 2024', contact: 'Amina Hassan', status: 'Active' },
  { name: 'Italtrade SRL', tier: 'Silver', amount: '£8,500', renewal: 'Aug 2024', contact: 'Elena Rossi', status: 'Renewal' }
];

const introRequests = [
  { from: 'Sarah Johnson', to: 'Marcus Chen', reason: 'Looking to expand investment portfolio into Asia.', status: 'pending', avatar: avatars[0] },
  { from: 'Lukas Meyer', to: 'Elena Rossi', reason: 'EU trade partnership exploration.', status: 'pending', avatar: avatars[1] },
  { from: 'Amina Hassan', to: 'Olivia Watson', reason: 'City Finance cross-listing intro.', status: 'pending', avatar: avatars[2] },
  { from: 'Peter Novak', to: 'Daniel Park', reason: 'Joint manufacturing scoping call.', status: 'matched', avatar: avatars[3] }
];

const tasksData = {
  todo: [
    { title: 'Follow up with TechVision lead', assignee: avatars[1], due: 'Today', priority: 'high' },
    { title: 'Draft sponsor renewal email', assignee: avatars[0], due: 'Tomorrow', priority: 'med' },
    { title: 'Prepare board pack section 3', assignee: avatars[2], due: 'Fri', priority: 'high' }
  ],
  doing: [
    { title: 'Onboard Global Bank Gold sponsor', assignee: avatars[0], due: 'Wed', priority: 'high' },
    { title: 'Update CRM tagging rules', assignee: avatars[4], due: 'Wed', priority: 'low' }
  ],
  done: [
    { title: 'Send May newsletter', assignee: avatars[3], due: 'Mon', priority: 'med' },
    { title: 'Reconcile April invoices', assignee: avatars[6], due: 'Mon', priority: 'med' },
    { title: 'Confirm London venue', assignee: avatars[0], due: 'Last week', priority: 'med' }
  ]
};

const campaigns = [
  { name: 'May Newsletter', segment: 'All members', sent: '1,245', open: '42%', click: '11%', status: 'Sent' },
  { name: 'Trade Dinner Invite', segment: 'VIP Segment', sent: '180', open: '57%', click: '24%', status: 'Active' },
  { name: 'Renewal Reminder', segment: 'Expiring Members', sent: '—', open: '—', click: '—', status: 'Draft' },
  { name: 'Sponsor Update Q2', segment: 'Partners', sent: '52', open: '49%', click: '18%', status: 'Scheduled' }
];

const supportThreads = [
  { id: 'SUP-1042', subject: 'Payment receipt request', from: 'Sarah Johnson', status: 'Open', last: '12 min ago', messages: [
    { who: 'Sarah Johnson', avatar: avatars[0], time: '09:42', text: 'Hi, I need a VAT receipt for invoice INV-3021 — can you resend?' },
    { who: 'You', me: true, avatar: avatars[2], time: '09:55', text: 'Sending now. PDF will land in your inbox shortly with VAT line itemised.' }
  ]},
  { id: 'SUP-1041', subject: 'Event access question', from: 'Marcus Chen', status: 'Pending', last: '1 h ago', messages: [
    { who: 'Marcus Chen', avatar: avatars[5], time: 'Yesterday', text: 'Are guest passes transferable for the VIP roundtable?' }
  ]},
  { id: 'SUP-1038', subject: 'Membership upgrade', from: 'Peter Novak', status: 'Open', last: '3 h ago', messages: [
    { who: 'Peter Novak', avatar: avatars[3], time: 'Mon', text: 'I would like to move from Bronze to Silver mid-cycle.' }
  ]},
  { id: 'SUP-1034', subject: 'Invoice correction', from: 'Elena Rossi', status: 'Resolved', last: 'Mon', messages: [
    { who: 'Elena Rossi', avatar: avatars[4], time: 'Mon', text: 'Resolved — corrected line on INV-3018, thank you.' }
  ]}
];

let invoices = [
  { id: 'INV-3021', client: 'Global Bank Ltd.', amount: '£15,000', issued: '01 May', due: '31 May', status: 'paid' },
  { id: 'INV-3020', client: 'Tech Solutions Inc.', amount: '£10,000', issued: '01 May', due: '31 May', status: 'paid' },
  { id: 'INV-3019', client: 'Emirates Chamber', amount: '£18,000', issued: '03 May', due: '02 Jun', status: 'due' },
  { id: 'INV-3018', client: 'Business World', amount: '£5,000', issued: '15 Apr', due: '15 May', status: 'due' },
  { id: 'INV-3017', client: 'Italtrade SRL', amount: '£8,500', issued: '10 Apr', due: '10 May', status: 'overdue' },
  { id: 'INV-3016', client: 'Trade Partners', amount: '£3,200', issued: '02 Apr', due: '02 May', status: 'overdue' },
  { id: 'INV-3015', client: 'Chen Holdings', amount: '£12,000', issued: '20 May', due: '19 Jun', status: 'draft' }
];

const notifications = [
  { title: 'Sponsor renewed', body: 'Global Bank Ltd. renewed Gold sponsorship.', time: '2m', unread: true },
  { title: 'Event nearly full', body: 'International Trade Conference at 78% capacity.', time: '1h', unread: true },
  { title: 'New support ticket', body: 'SUP-1042 from Sarah Johnson.', time: '3h', unread: true },
  { title: 'Invoice overdue', body: 'INV-3017 to Italtrade SRL is 4 days overdue.', time: '6h', unread: true },
  { title: 'Lead assigned', body: 'TechVision Ltd. assigned to you.', time: 'Yesterday', unread: true },
  { title: 'Briefing ready', body: 'Daily intelligence briefing generated.', time: 'Yesterday', unread: false }
];

/* ---------- Init icons ---------- */
function initIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || icons.star;
  });
}

/* ---------- Small components ---------- */
function spark(color) {
  return `<svg class="sparkline" viewBox="0 0 220 50" preserveAspectRatio="none"><path d="M0 38 C22 38 28 38 42 24 S70 42 92 35 S128 24 146 17 S168 33 190 27 S210 20 220 21" fill="none" stroke="${color}" stroke-width="3"/><path d="M0 48 C32 48 44 48 68 38 S112 41 142 28 S178 41 220 32 L220 50 L0 50Z" fill="${color}" opacity=".08"/></svg>`;
}

function avatar(src, presence) {
  const cls = presence ? `presence ${presence}` : '';
  return `<span class="${cls}"><img class="avatar" src="${src}" alt="" /></span>`;
}

function avatarGroup(srcs, more) {
  return `<div class="avatar-group">${srcs.slice(0, 4).map((s) => `<img class="avatar" src="${s}" alt="" />`).join('')}${more ? `<span class="more">+${more}</span>` : ''}</div>`;
}

function metricCards() {
  return `<div class="metric-grid">${metrics.map(([label, value, trend, icon, color]) => `
    <button class="metric-card" type="button" data-toast="${label} details">
      <div class="metric-top">
        <span class="metric-icon" style="color:${color};background:${color}16">${icons[icon]}</span>
        <span class="trend">↑ ${trend}</span>
      </div>
      <h3>${value}</h3>
      <small>${label}<br />vs last month</small>
      ${spark(color)}
    </button>`).join('')}</div>`;
}

function filterBar(searchPlaceholder, chips) {
  return `<div class="filterbar">
    <input class="search-input" type="search" placeholder="${searchPlaceholder}" />
    ${chips.map((c, i) => `<button class="filter-chip ${i === 0 ? 'is-active' : ''}" type="button">${c.label}${c.count != null ? ` <i>${c.count}</i>` : ''}</button>`).join('')}
    <button class="control" type="button"><span data-icon="filter"></span>Filter</button>
    <button class="control" type="button"><span data-icon="download"></span>Export</button>
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
    ${cta ? `<button class="primary-action" type="button" data-toast="${cta}">${cta}</button>` : ''}
  </div>`;
}

function skeletonRows(n) {
  return Array.from({ length: n }, () => '<div class="skeleton skel-row"></div>').join('');
}

function donut() {
  return `<div class="donut-wrap">
    <div class="donut"></div>
    <div class="legend">
      <div><span style="background:var(--gold)"></span><strong>Gold</strong><p class="muted">450 (36%)</p></div>
      <div><span style="background:#cfd3dc"></span><strong>Silver</strong><p class="muted">500 (40%)</p></div>
      <div><span style="background:#bd6425"></span><strong>Bronze</strong><p class="muted">300 (24%)</p></div>
    </div>
  </div>
  <div class="mini-stats"><div><span class="muted">Renewals Due Soon</span><strong>32</strong></div><div><span class="muted">Expiring This Month</span><strong>18</strong></div></div>`;
}

function noticeBar() {
  return `<div class="notice-bar">
    <strong>Verify your HBBA admin email.</strong>
    <span>A verification link is needed for john.doe@hbbaglobal.co.uk.</span>
    <button type="button" data-toast="Verification email resent" data-toast-variant="success">Resend</button>
  </div>`;
}

function briefingCard() {
  return `<section class="briefing-card">
    <div class="briefing-left">
      <span class="briefing-icon">${icons.gem}</span>
      <div>
        <span class="eyebrow">HBBA Daily Briefing</span>
        <small>${new Date().toLocaleString('en-GB')}</small>
      </div>
    </div>
    <div class="briefing-body">
      <h2>UK network position next 30d: 24 events · 186 warm leads</h2>
      <div class="briefing-grid">
        <p><i></i> Gold member renewals remain healthy across London and regional chapters.</p>
        <p><i></i> Sponsor conversations are strongest in finance, trade and technology.</p>
        <p><i></i> Business Dinner attendance is trending above the current venue target.</p>
        <p><i></i> Follow up with new leads before Friday to protect conversion momentum.</p>
      </div>
      <div class="briefing-tags">
        <span>Send sponsor follow-ups to top-3 open conversations today.</span>
        <span>Prepare London dinner guest list for board review.</span>
        <span>Check renewals due before the end of the month.</span>
      </div>
    </div>
    <button class="refresh-button" type="button" data-toast="Briefing refreshed" data-toast-variant="info">↻</button>
  </section>`;
}

function lineChart(color = '#5b35f5', vals = [22, 38, 32, 48, 41, 58, 52, 68, 62, 78, 74, 92]) {
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
  return `
    ${noticeBar()}
    ${briefingCard()}
    ${metricCards()}
    <div class="dashboard-grid">
      <section class="card">
        <div class="card-title"><h2>Upcoming Events</h2><button class="link-button" data-page-link="events">View all</button></div>
        ${upcomingEvents.map((e, i) => {
          const [m, d, t, time, place, badge] = e;
          return `<button class="event-row" type="button" data-event-id="E00${i+1}">
            <span class="date-tile">${m}<strong>${d}</strong></span>
            <img src="${photos[i % photos.length]}" alt="" />
            <span><h3>${t}</h3><span class="event-meta">${time}<br />${place}</span><span class="chip">${badge}</span></span>
          </button>`;
        }).join('')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Membership Overview</h2><button class="link-button" data-page-link="reports">View report</button></div>
        ${donut()}
      </section>
      <section class="card">
        <div class="card-title"><h2>Recent Activity</h2><button class="link-button" data-page-link="tasks">View all</button></div>
        ${activities.map(([t, b, time, tone]) => `
          <div class="activity"><span class="activity-icon" style="background:var(--${tone === 'purple' ? 'purple' : tone})">${icons.users}</span><div><h3>${t}</h3><span>${b}</span></div><small class="muted">${time}</small></div>
        `).join('')}
      </section>
    </div>
    <div class="lower-grid">
      <section class="card">
        <div class="card-title"><h2>Top Sponsors</h2><button class="link-button" data-page-link="sponsors">View all</button></div>
        ${sponsorList.slice(0, 3).map((s) => `<div class="sponsor-row"><span class="sponsor-mark">${s.name[0]}</span><div><h3>${s.name}</h3><span class="muted">${s.tier} Sponsor</span></div><strong>${s.amount}</strong></div>`).join('')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Tickets Overview</h2><button class="link-button" data-page-link="tickets">View report</button></div>
        <div class="bar-chart">${[58, 42, 54, 38, 31].map((v) => `<span class="bar" style="--sold:${v}%"></span>`).join('')}</div>
        <div class="bar-labels"><span>May 25</span><span>Jun 02</span><span>Jun 15</span><span>Jun 28</span><span>Jul 10</span></div>
      </section>
      <section class="card">
        <div class="card-title"><h2>Tasks & Reminders</h2><button class="link-button" data-page-link="tasks">View all</button></div>
        ${[
          ['Follow up with new leads', '12 pending', ''],
          ['Send event invitation emails', 'Due in 2 days', 'blue'],
          ['Membership renewals', '18 pending', 'red'],
          ['Prepare report for board meeting', 'Due in 5 days', 'blue']
        ].map(([txt, pill, tone]) => `<div class="task-item"><label><input type="checkbox" />${txt}</label><span class="pill ${tone}">${pill}</span></div>`).join('')}
      </section>
    </div>
  `;
}

/* --- CRM --- */
function crmPage() {
  return `
    <div class="cards-grid">
      ${[['Active Contacts', '4,820'], ['Companies', '936'], ['Hot Leads', '186']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#5b35f5')}</button>`).join('')}
    </div>
    ${filterBar('Search contacts, companies, emails…', [{ label: 'All', count: contacts.length }, { label: 'Active' }, { label: 'Warm' }, { label: 'New' }])}
    <section class="card">
      <div class="card-title"><h2>Contacts</h2><button class="primary-action" type="button" data-modal="new-contact"><span data-icon="plus"></span>Add Contact</button></div>
      ${contacts.map((c, i) => `
        <div class="contact-row" data-contact="${i}">
          <span class="presence ${c.presence}"><img class="avatar" src="${c.avatar}" alt="" /></span>
          <div><h4>${c.name}</h4><small>${c.email}</small></div>
          <div><strong style="font-size:13px">${c.company}</strong><small style="display:block;color:var(--muted)">${c.city}</small></div>
          <span class="chip">${c.tier}</span>
          ${statusPill(c.status)}
          <button class="icon-button" type="button" aria-label="More"><span data-icon="chevron"></span></button>
        </div>
      `).join('')}
      ${pagination(contacts.length, 1, 8)}
    </section>
    <section class="card" style="margin-top:14px">
      <div class="card-title"><h2>Deal Pipeline</h2><button class="link-button">Manage stages</button></div>
      <div class="pipeline">
        ${dealStages.map((s) => `
          <div class="pipe-col">
            <div class="pipe-col-head"><strong>${s.name}</strong><span>${s.cards.length} · ${s.total}</span></div>
            ${s.cards.map((c) => `<div class="pipe-card" draggable="true"><h5>${c.title}</h5><small class="muted">${c.owner}</small><div class="meta"><span class="chip">${c.tier}</span><strong>${c.value}</strong></div></div>`).join('')}
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
      ${[['Total Members', '1,250'], ['Renewals Due', '32'], ['Applications', '18']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#5b35f5')}</button>`).join('')}
    </div>
    <div class="tier-grid">
      ${membershipTiers.map((t) => `
        <div class="tier-card ${t.color}">
          <span class="chip">${t.members} members</span>
          <h3>${t.name}</h3>
          <div class="price">${t.price}</div>
          <ul>${t.perks.map((p) => `<li>✓ ${p}</li>`).join('')}</ul>
          <button class="secondary-action" type="button" data-toast="${t.name} tier opened">Manage tier</button>
        </div>
      `).join('')}
    </div>
    <div class="page-grid">
      <section class="card">
        <div class="card-title"><h2>Renewal calendar — next 30 days</h2><button class="link-button">View all</button></div>
        ${calendarGrid()}
      </section>
      <aside class="card">
        <div class="card-title"><h2>Expiry alerts</h2><button class="link-button" data-toast="Reminders sent" data-toast-variant="success">Send reminders</button></div>
        ${renewals.map((r) => `
          <div class="activity"><span class="activity-icon" style="background:var(--${r.days < 7 ? 'red' : r.days < 14 ? 'orange' : 'green'})">${icons.crown}</span><div><h3>${r.name}</h3><span>${r.tier} · expires in ${r.days} days</span></div><button class="link-button" data-toast="Renewal nudge queued">Nudge</button></div>
        `).join('')}
      </aside>
    </div>
  `;
}

function calendarGrid() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = 14;
  const offset = 2;
  const total = 30;
  const eventsOnDay = { 4: 1, 9: 1, 14: 1, 21: 2, 28: 1, 18: 1 };
  let cells = '';
  for (let i = 0; i < offset; i++) cells += `<div class="cal-day muted"></div>`;
  for (let d = 1; d <= total; d++) {
    const cls = d === today ? 'today' : '';
    const evs = eventsOnDay[d] || 0;
    cells += `<div class="cal-day ${cls}">${d}${evs ? `<div class="events">${Array.from({ length: evs }, () => '<span class="dot"></span>').join('')}</div>` : ''}</div>`;
  }
  return `<div class="cal-grid">${days.map((d) => `<div class="head">${d}</div>`).join('')}${cells}</div>`;
}

/* --- Events --- */
function eventsPage() {
  return `
    <div class="cards-grid">
      ${[['Upcoming', '24'], ['Attendees', '1,430'], ['Venues', '12']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#2563eb')}</button>`).join('')}
    </div>
    ${filterBar('Search events…', [{ label: 'All', count: eventsCatalog.length }, { label: 'Confirmed' }, { label: 'Selling' }, { label: 'Draft' }])}
    <div class="event-grid">
      ${eventsCatalog.map((e) => `
        <article class="event-card" data-event-id="${e.id}">
          <img src="${e.img}" alt="" />
          <div class="body">
            <h3>${e.title}</h3>
            <div class="meta">${e.date} · ${e.time} · ${e.city}</div>
            <div class="progress" style="margin-bottom:10px"><i style="--value:${Math.round(e.attendees / e.capacity * 100)}%"></i></div>
            <footer><span>${e.attendees}/${e.capacity} attendees</span>${statusPill(e.status)}</footer>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

/* --- Tickets --- */
function ticketsPage() {
  return `
    <div class="cards-grid">
      ${[['Sold', '342'], ['Available', '618'], ['Revenue', '£24,600']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#0f9f6e')}</button>`).join('')}
    </div>
    <div class="checkin-grid">
      <section class="card">
        <div class="card-title"><h2>Ticket orders</h2><button class="primary-action" type="button" data-modal="new-ticket"><span data-icon="plus"></span>Issue ticket</button></div>
        <table class="table">
          <thead><tr><th>Ticket</th><th>Event</th><th>Buyer</th><th>Tier</th><th>Price</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${ticketRecords.map((t) => `
              <tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.event}</td>
                <td>${t.buyer}</td>
                <td><span class="chip">${t.tier}</span></td>
                <td>${t.price}</td>
                <td>${statusPill(t.status)}</td>
                <td><button class="link-button" data-confirm="refund" data-id="${t.id}">Refund</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      <aside class="card">
        <div class="card-title"><h2>Check-in</h2><span class="chip">Scanner ready</span></div>
        <div class="qr-placeholder" aria-label="QR scanner placeholder"><div><strong style="display:block;font-size:28px">⌐■_■</strong>Scan QR to check in</div></div>
        <p class="muted" style="margin-top:10px;font-size:13px">Last scanned: <strong style="color:var(--text)">T-9821 · Sarah Johnson</strong></p>
        <button class="primary-action" type="button" data-toast="Check-in recorded" data-toast-variant="success" style="width:100%;margin-top:10px"><span data-icon="check"></span>Confirm check-in</button>
      </aside>
    </div>
  `;
}

/* --- Sponsors --- */
function sponsorsPage() {
  return `
    <div class="cards-grid">
      ${[['Sponsors', '42'], ['Pipeline', '£92k'], ['Deliverables', '17']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#f2aa00')}</button>`).join('')}
    </div>
    <div class="tier-grid">
      <div class="tier-card gold"><span class="chip">12 sponsors</span><h3>Gold Tier</h3><div class="price">£15k+</div><ul><li>✓ Logo on all events</li><li>✓ Keynote slot</li><li>✓ Dedicated activations</li></ul></div>
      <div class="tier-card silver"><span class="chip">18 sponsors</span><h3>Silver Tier</h3><div class="price">£8k+</div><ul><li>✓ Logo on tier events</li><li>✓ Workshop slot</li><li>✓ Member directory feature</li></ul></div>
      <div class="tier-card bronze"><span class="chip">12 sponsors</span><h3>Bronze Tier</h3><div class="price">£3k+</div><ul><li>✓ Logo on materials</li><li>✓ 4 event passes</li></ul></div>
    </div>
    <section class="card">
      <div class="card-title"><h2>Sponsor contracts</h2><button class="primary-action" type="button" data-modal="new-sponsor"><span data-icon="plus"></span>New sponsor</button></div>
      <table class="table">
        <thead><tr><th>Sponsor</th><th>Tier</th><th>Amount</th><th>Renewal</th><th>Contact</th><th>Status</th></tr></thead>
        <tbody>
          ${sponsorList.map((s) => `<tr><td><strong>${s.name}</strong></td><td><span class="chip">${s.tier}</span></td><td>${s.amount}</td><td>${s.renewal}</td><td>${s.contact}</td><td>${statusPill(s.status)}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>
  `;
}

/* --- Networking --- */
function networkingPage() {
  return `
    <div class="cards-grid">
      ${[['Introductions', '78'], ['Meetings', '34'], ['Match Score', '86%']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#8b5cf6')}</button>`).join('')}
    </div>
    <div class="intro-grid">
      <section class="card graph-card">
        <div class="card-title"><h2>Network graph</h2><button class="link-button">Filters</button></div>
        ${networkGraph()}
      </section>
      <aside class="card">
        <div class="card-title"><h2>Intro requests</h2><span class="chip">${introRequests.filter((r) => r.status === 'pending').length} pending</span></div>
        ${introRequests.map((r) => `
          <div class="intro-item">
            <img class="avatar" src="${r.avatar}" alt="" />
            <div><strong>${r.from}</strong> → ${r.to}<p>${r.reason}</p></div>
            <div class="intro-actions">
              ${r.status === 'pending' ? `<button class="accept" data-toast="Intro accepted" data-toast-variant="success">Accept</button><button class="decline" data-toast="Intro declined">Skip</button>` : `<span class="chip">Matched</span>`}
            </div>
          </div>
        `).join('')}
      </aside>
    </div>
  `;
}

function networkGraph() {
  const nodes = [
    { x: 300, y: 60, r: 28, label: 'You', color: '#5b35f5' },
    { x: 120, y: 140, r: 22, label: 'Sarah', color: '#0f9f6e' },
    { x: 480, y: 140, r: 22, label: 'Amina', color: '#0f9f6e' },
    { x: 80, y: 260, r: 18, label: 'Lukas', color: '#f97316' },
    { x: 240, y: 280, r: 18, label: 'Elena', color: '#0f9f6e' },
    { x: 380, y: 280, r: 18, label: 'Marcus', color: '#f97316' },
    { x: 520, y: 270, r: 18, label: 'Peter', color: '#94a3b8' }
  ];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 5]];
  return `<svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet">
    ${edges.map(([a, b]) => `<line x1="${nodes[a].x}" y1="${nodes[a].y}" x2="${nodes[b].x}" y2="${nodes[b].y}" stroke="#cbd5e1" stroke-width="1.4"/>`).join('')}
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
      ${[['Open', tasksData.todo.length + tasksData.doing.length], ['Overdue', 2], ['Completed', tasksData.done.length]].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#5b35f5')}</button>`).join('')}
    </div>
    ${filterBar('Search tasks…', [{ label: 'All' }, { label: 'Mine' }, { label: 'High priority' }, { label: 'Due today' }])}
    <div class="kanban">
      ${cols.map((c) => `
        <div class="kanban-col" data-col="${c.key}">
          <div class="kanban-col-head"><strong>${c.name}</strong><span class="count">${tasksData[c.key].length}</span></div>
          ${tasksData[c.key].map((t) => `
            <div class="kanban-card" draggable="true">
              <h5>${t.title}</h5>
              <span class="chip" style="background:${t.priority === 'high' ? '#ffe7ec' : t.priority === 'med' ? '#fff5df' : '#e9efff'};color:${t.priority === 'high' ? 'var(--red)' : t.priority === 'med' ? '#b45309' : 'var(--blue)'}">${t.priority}</span>
              <div class="footer"><img class="avatar" src="${t.assignee}" alt="" style="width:24px;height:24px;border-radius:50%" /><span>Due ${t.due}</span></div>
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
      ${[['Campaigns', '14'], ['Open rate', '42%'], ['Clicks', '1,860']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#2563eb')}</button>`).join('')}
    </div>
    <div class="email-grid">
      <section class="card">
        <div class="card-title"><h2>Campaigns</h2><button class="primary-action" type="button" data-modal="new-campaign"><span data-icon="plus"></span>New campaign</button></div>
        <table class="table">
          <thead><tr><th>Name</th><th>Segment</th><th>Sent</th><th>Open</th><th>Click</th><th>Status</th></tr></thead>
          <tbody>${campaigns.map((c) => `<tr><td><strong>${c.name}</strong></td><td>${c.segment}</td><td>${c.sent}</td><td>${c.open}</td><td>${c.click}</td><td>${statusPill(c.status)}</td></tr>`).join('')}</tbody>
        </table>
      </section>
      <aside class="card">
        <div class="card-title"><h2>Templates</h2><button class="link-button">Browse all</button></div>
        <div class="template-grid">
          ${['Welcome', 'Renewal', 'Event Invite', 'Newsletter'].map((n) => `<div class="template-card" data-toast="${n} template opened"><div class="template-thumb">${n}</div><strong style="font-size:13px">${n}</strong><p class="muted" style="font-size:12px;margin:4px 0 0">Last edited 2d ago</p></div>`).join('')}
        </div>
        <div class="card-title" style="margin-top:18px"><h2>Audience picker</h2></div>
        ${['All members', 'Gold tier', 'Expiring soon', 'Sponsors', 'London chapter'].map((a, i) => `<div class="task-item"><label><input type="checkbox" ${i < 2 ? 'checked' : ''}/>${a}</label><span class="muted" style="font-size:12px">${[1250, 450, 32, 42, 380][i]}</span></div>`).join('')}
      </aside>
    </div>
  `;
}

/* --- Support --- */
function supportPage() {
  const active = supportThreads[0];
  return `
    <div class="cards-grid">
      ${[['Open tickets', '19'], ['Avg response', '2h'], ['Resolved', '147']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#e54863')}</button>`).join('')}
    </div>
    <div class="support-grid">
      <section class="card">
        <div class="card-title"><h2>Queue</h2><span class="chip">${supportThreads.filter((t) => t.status === 'Open').length} open</span></div>
        <div class="support-queue">
          ${supportThreads.map((t, i) => `
            <div class="support-item ${i === 0 ? 'is-active' : ''}" data-thread="${t.id}">
              <div style="display:flex;justify-content:space-between;align-items:center"><h4>${t.id}</h4>${statusPill(t.status)}</div>
              <p><strong style="color:var(--text)">${t.subject}</strong></p>
              <p>${t.from} · ${t.last}</p>
            </div>
          `).join('')}
        </div>
      </section>
      <section class="card support-thread" id="threadView">
        <div>
          <div class="card-title"><h2>${active.subject}</h2>${statusPill(active.status)}</div>
          <p class="muted" style="font-size:13px;margin:0">${active.id} · ${active.from}</p>
        </div>
        <div style="margin:14px 0;overflow-y:auto;max-height:340px">
          ${active.messages.map((m) => `
            <div class="thread-msg ${m.me ? 'me' : ''}">
              <img class="avatar" src="${m.avatar}" alt="" style="width:32px;height:32px;border-radius:50%" />
              <div><strong style="font-size:13px">${m.who}</strong> <small class="muted">${m.time}</small><div class="bubble">${m.text}</div></div>
            </div>
          `).join('')}
        </div>
        <div class="thread-reply">
          <input type="text" placeholder="Type a reply…" />
          <button class="primary-action" type="button" data-toast="Reply sent" data-toast-variant="success"><span data-icon="send"></span>Send</button>
        </div>
      </section>
    </div>
  `;
}

/* --- Invoices --- */
function invoicesPage() {
  return `
    <div class="cards-grid">
      ${[['Paid', '£78,450'], ['Outstanding', '£12,900'], ['Overdue', '£3,200']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#0f9f6e')}</button>`).join('')}
    </div>
    ${filterBar('Search invoices…', [{ label: 'All', count: invoices.length }, { label: 'Paid' }, { label: 'Due' }, { label: 'Overdue' }, { label: 'Draft' }])}
    <section class="card">
      <div class="card-title"><h2>Invoices</h2><button class="primary-action" type="button" data-modal="new-invoice"><span data-icon="plus"></span>New invoice</button></div>
      <table class="table">
        <thead><tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${invoices.map((inv, i) => `
            <tr data-invoice="${i}" style="cursor:pointer">
              <td><strong>${inv.id}</strong></td>
              <td>${inv.client}</td>
              <td><strong>${inv.amount}</strong></td>
              <td>${inv.issued}</td>
              <td>${inv.due}</td>
              <td><span class="invoice-status ${inv.status}">${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span></td>
              <td><button class="link-button" data-toast="Reminder sent" data-toast-variant="info" onclick="event.stopPropagation()">Remind</button></td>
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
  return `
    <div class="cards-grid">
      ${[['Growth', '12.5%'], ['Revenue', '22.1%'], ['Engagement', '68%']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l} opened"><span class="muted">${l}</span><h2>${v}</h2>${spark('#5b35f5')}</button>`).join('')}
    </div>
    <div class="reports-grid">
      <section class="card full">
        <div class="card-title"><h2>Member growth — last 12 months</h2><button class="link-button"><span data-icon="download"></span> Export CSV</button></div>
        ${lineChart('#5b35f5', [22, 38, 32, 48, 41, 58, 52, 68, 62, 78, 74, 92])}
      </section>
      <section class="card">
        <div class="card-title"><h2>Revenue by source</h2><button class="link-button">Details</button></div>
        ${donut()}
      </section>
      <section class="card">
        <div class="card-title"><h2>Event ROI</h2><button class="link-button">Details</button></div>
        <div class="bar-chart">${[58, 42, 54, 38, 72].map((v) => `<span class="bar" style="--sold:${v}%"></span>`).join('')}</div>
        <div class="bar-labels"><span>Dinner</span><span>Trade</span><span>Forum</span><span>VIP</span><span>Mixer</span></div>
      </section>
      <section class="card full">
        <div class="card-title"><h2>Engagement breakdown</h2><button class="link-button">Filters</button></div>
        ${lineChart('#0f9f6e', [45, 52, 48, 58, 62, 55, 67, 71, 68, 74, 78, 82])}
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
        <div class="card-title"><h2>Workspace profile</h2><button class="link-button" data-toast="Saved" data-toast-variant="success">Save changes</button></div>
        <div class="form-row">
          <label>Workspace name<input type="text" value="HBBA Global" /></label>
          <label>Public URL<input type="text" value="hbba.global" /></label>
          <label>Country<input type="text" value="United Kingdom" /></label>
          <label>VAT number<input type="text" value="GB 123 4567 89" /></label>
          <label class="full" style="grid-column:1/-1">Description<textarea>HBBA Global is the UK business network connecting members, sponsors and embassies.</textarea></label>
        </div>
      </section>
    </div>`;
  }
  if (tab === 'team') {
    return `<section class="card">
      <div class="card-title"><h2>Team members</h2><button class="primary-action" type="button" data-modal="new-user"><span data-icon="plus"></span>Invite user</button></div>
      ${contacts.slice(0, 5).map((c) => `
        <div class="role-row">
          <div style="display:flex;align-items:center;gap:10px"><img class="avatar" src="${c.avatar}" alt="" style="width:36px;height:36px;border-radius:50%" /><div><strong>${c.name}</strong><br /><small class="muted">${c.email}</small></div></div>
          <span class="chip">Admin</span>
          ${statusPill(c.status)}
          <button class="link-button" data-confirm="remove-user" data-id="${c.name}"><span data-icon="trash" style="vertical-align:middle"></span></button>
        </div>
      `).join('')}
    </section>`;
  }
  if (tab === 'roles') {
    return `<section class="card">
      <div class="card-title"><h2>Roles & permissions</h2><button class="link-button" data-toast="Saved" data-toast-variant="success">Save</button></div>
      <table class="table">
        <thead><tr><th>Permission</th><th>Admin</th><th>Ops</th><th>Finance</th><th>Viewer</th></tr></thead>
        <tbody>
          ${['Manage members', 'Manage events', 'Send emails', 'View reports', 'Manage billing'].map((p) => `<tr><td><strong>${p}</strong></td>${['admin','ops','finance','viewer'].map((r) => `<td><label class="toggle"><input type="checkbox" ${r === 'admin' || (r === 'ops' && p !== 'Manage billing') || (r === 'finance' && p === 'Manage billing') ? 'checked' : ''} /><span class="slider"></span></label></td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </section>`;
  }
  if (tab === 'billing') {
    return `<div class="settings-grid">
      <section class="card">
        <div class="card-title"><h2>Plan</h2><button class="link-button" data-toast="Upgrade flow opened">Change plan</button></div>
        <h3 style="font-size:24px">Business · £1,200/mo</h3>
        <p class="muted">Next charge 01 Jun · Visa •••• 4242</p>
        <ul style="padding:0;list-style:none;margin:14px 0 0;font-size:13px">
          <li>✓ Unlimited members</li>
          <li>✓ Unlimited events</li>
          <li>✓ Priority support</li>
        </ul>
      </section>
      <section class="card">
        <div class="card-title"><h2>Recent invoices</h2><button class="link-button"><span data-icon="download"></span> Statements</button></div>
        ${invoices.slice(0, 4).map((i) => `<div class="role-row"><strong>${i.id}</strong><span>${i.amount}</span><span>${i.issued}</span><span class="invoice-status ${i.status}">${i.status}</span></div>`).join('')}
      </section>
    </div>`;
  }
  // integrations
  const apps = [
    { name: 'Google Calendar', desc: 'Sync events to team calendars', on: true },
    { name: 'Stripe', desc: 'Process ticket and sponsor payments', on: true },
    { name: 'Mailchimp', desc: 'Send marketing campaigns', on: false },
    { name: 'Zapier', desc: 'Automate workflows', on: true },
    { name: 'Slack', desc: 'Push notifications to channels', on: false },
    { name: 'HubSpot', desc: 'Sync CRM contacts', on: false }
  ];
  return `<div class="settings-grid">${apps.map((a) => `
    <section class="card"><div class="card-title"><h2>${a.name}</h2><label class="toggle"><input type="checkbox" ${a.on ? 'checked' : ''} /><span class="slider"></span></label></div><p class="muted" style="font-size:13px">${a.desc}</p><button class="control" type="button" style="margin-top:10px" data-toast="${a.name} settings">Configure</button></section>
  `).join('')}</div>`;
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
}

async function bookEvent(code) {
  const { ok, data } = await api(`/api/events/${code}/book`, { method: 'POST', body: { tier: 'Standard' } });
  if (!ok) { showToast(data?.error || 'Booking failed', 'error'); return; }
  showToast(`Ticket booked for ${data.event}`, 'success');
  await loadMemberData();
  render('myEvents');
}

const fmtMoney = (cents) => '£' + (Number(cents) / 100).toLocaleString('en-GB');

async function loadAdminData() {
  const [st, mem, spo, inv, ev] = await Promise.all([
    api('/api/admin/stats'),
    api('/api/admin/members'),
    api('/api/admin/sponsors'),
    api('/api/admin/invoices'),
    api('/api/events')
  ]);
  if (st.ok && st.data?.stats) {
    const s = st.data.stats;
    metrics = [
      ['Total Members', String(s.members), '12.5%', 'users', '#5b35f5'],
      ['Sponsors', String(s.sponsors), '8.3%', 'star', '#f2aa00'],
      ['Events', String(s.events), '6.1%', 'calendar', '#2563eb'],
      ['Bookings', String(s.bookings), '18.7%', 'ticket', '#0f9f6e'],
      ['Revenue', fmtMoney(s.revenue_cents), '22.1%', 'chart', '#5b35f5']
    ];
  }
  if (mem.ok && mem.data?.members) contacts = mem.data.members;
  if (spo.ok && spo.data?.sponsors) sponsorList = spo.data.sponsors;
  if (inv.ok && inv.data?.invoices) invoices = inv.data.invoices;
  if (ev.ok && ev.data?.events) eventsCatalog = ev.data.events;
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
let sponsorProfile = {
  name: 'Acme Corp', tier: 'Gold', value: '£15,000 / year', renews: 'Jun 2027', since: 'Jun 2023',
  inclusions: ['Logo on all events', 'Keynote slot at flagship event', 'Dedicated booth at 6 events', 'Member directory feature', 'Quarterly leads report']
};
let sponsorStats = [['Impressions', '184,200'], ['Logo placements', '46'], ['Leads generated', '128'], ['Meetings booked', '23']];
let sponsorLeads = [
  { name: 'Sarah Johnson', company: 'Global Bank Ltd.', interest: 'Treasury services', when: '2d ago' },
  { name: 'Lukas Meyer', company: 'TechVision Ltd.', interest: 'Cloud migration', when: '3d ago' },
  { name: 'Amina Hassan', company: 'Emirates Chamber', interest: 'Trade finance', when: '5d ago' },
  { name: 'Olivia Watson', company: 'City Finance', interest: 'Advisory retainer', when: '1w ago' }
];
let sponsoredEventsData = [
  { ...eventsCatalog[0], booth: 'Booth A1', reach: '120 reach' },
  { ...eventsCatalog[1], booth: 'Main stage', reach: '250 reach' },
  { ...eventsCatalog[4], booth: 'Booth B3', reach: '60 reach' }
];
let sponsorInvoices = [
  { id: 'INV-SP-2026-014', desc: 'Gold sponsorship — annual', amount: '£15,000', issued: '01 Jun', status: 'paid' },
  { id: 'INV-SP-2026-022', desc: 'Additional booth — Trade Conference', amount: '£2,400', issued: '10 May', status: 'due' }
];

async function loadSponsorData() {
  const [ov, ld, ev, inv] = await Promise.all([
    api('/api/sponsor/overview'),
    api('/api/sponsor/leads'),
    api('/api/sponsor/events'),
    api('/api/me/invoices')
  ]);
  if (ov.ok && ov.data?.overview) sponsorProfile = { ...sponsorProfile, ...ov.data.overview };
  if (ov.ok && Array.isArray(ov.data?.stats) && ov.data.stats.length) sponsorStats = ov.data.stats;
  if (ld.ok && ld.data?.leads) sponsorLeads = ld.data.leads;
  if (ev.ok && ev.data?.events) sponsoredEventsData = ev.data.events;
  if (inv.ok && inv.data?.invoices) sponsorInvoices = inv.data.invoices;
}

/* ---------- Member pages ---------- */
function memberDashboardPage() {
  return `
    <div class="cards-grid">
      ${[['Membership', 'Premium'], ['Renews', '12 Jan 2027'], ['Events booked', memberTickets.length], ['Member since', 'Jan 2024']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="dashboard-grid">
      <section class="card">
        <div class="card-title"><h2>Upcoming events</h2><button class="link-button" data-page-link="myEvents">View all</button></div>
        ${eventsCatalog.slice(0, 4).map((e) => `<button class="event-row" type="button" data-event-id="${e.id}"><span class="date-tile">${e.date.split(' ')[0].toUpperCase()}<strong>${e.date.split(' ')[1]}</strong></span><img src="${e.img}" alt="" /><span><h3>${e.title}</h3><span class="event-meta">${e.time}<br />${e.city}</span><span class="chip">${e.attendees}/${e.capacity}</span></span></button>`).join('')}
      </section>
      <section class="card">
        <div class="card-title"><h2>My membership</h2><button class="link-button" data-page-link="myMembership">Manage</button></div>
        <div class="tier-card gold" style="margin:0"><span class="chip">${memberProfile.tier}</span><h3>${memberProfile.tier} Member</h3><div class="price">${memberProfile.price}</div><ul>${memberProfile.benefits.slice(0, 4).map((b) => `<li>✓ ${b}</li>`).join('')}</ul><button class="secondary-action" type="button" data-toast="Upgrade options opened">Upgrade plan</button></div>
      </section>
      <section class="card">
        <div class="card-title"><h2>My tickets</h2><button class="link-button" data-page-link="myEvents">View</button></div>
        ${memberTickets.map((t) => `<div class="sponsor-row"><span class="sponsor-mark">${t.event[0]}</span><div><h3>${t.event}</h3><span class="muted">${t.date} · ${t.tier}</span></div><span class="chip">${t.status}</span></div>`).join('')}
      </section>
    </div>`;
}

function myMembershipPage() {
  const p = memberProfile;
  return `
    <div class="cards-grid">
      ${[['Current tier', p.tier], ['Annual fee', p.price], ['Renews', p.renews]].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="tier-grid">
      <div class="tier-card gold"><span class="chip">Current</span><h3>Premium</h3><div class="price">£480/yr</div><ul>${p.benefits.map((b) => `<li>✓ ${b}</li>`).join('')}</ul><button class="secondary-action" type="button" data-toast="You're already on Premium">Current plan</button></div>
      <div class="tier-card silver"><span class="chip">Upgrade</span><h3>Executive</h3><div class="price">£960/yr</div><ul><li>✓ Everything in Premium</li><li>✓ VIP event access</li><li>✓ 6 guest passes per year</li><li>✓ 1:1 intro concierge</li></ul><button class="secondary-action" type="button" data-toast="Upgrade to Executive requested" data-toast-variant="success">Upgrade</button></div>
      <div class="tier-card bronze"><span class="chip">Downgrade</span><h3>Associate</h3><div class="price">£180/yr</div><ul><li>✓ Core events</li><li>✓ Member directory</li></ul><button class="secondary-action" type="button" data-toast="Downgrade requested">Switch</button></div>
    </div>
    <section class="card">
      <div class="card-title"><h2>Membership details</h2><button class="link-button" data-page-link="myInvoices">Billing history</button></div>
      <table class="table"><tbody>
        <tr><td><strong>Member since</strong></td><td>${p.since}</td></tr>
        <tr><td><strong>Next renewal</strong></td><td>${p.renews}</td></tr>
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
          <img src="${e.img}" alt="" />
          <div class="body">
            <h3>${e.title}</h3>
            <div class="meta">${e.date} · ${e.time} · ${e.city}</div>
            <footer><span>${e.attendees}/${e.capacity} attending</span>${booked ? `<span class="chip">Booked</span>` : `<button class="primary-action" type="button" data-book="${e.id}" onclick="event.stopPropagation()">Book</button>`}</footer>
          </div>
        </article>`;
      }).join('')}
    </div>`;
}

function memberInvoicesPage() {
  return `
    <div class="cards-grid">
      ${[['Paid', '£730'], ['Outstanding', '£60'], ['Invoices', memberInvoices.length]].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <section class="card">
      <div class="card-title"><h2>My invoices</h2><span class="chip">${memberProfile.tier} member</span></div>
      <table class="table">
        <thead><tr><th>Invoice</th><th>Description</th><th>Amount</th><th>Issued</th><th>Status</th><th></th></tr></thead>
        <tbody>${memberInvoices.map((inv) => `<tr><td><strong>${inv.id}</strong></td><td>${inv.desc}</td><td><strong>${inv.amount}</strong></td><td>${inv.issued}</td><td><span class="invoice-status ${inv.status}">${cap(inv.status)}</span></td><td>${inv.pdf ? `<a class="link-button" href="${inv.pdf}" target="_blank" rel="noopener">PDF</a>` : `<button class="link-button" data-toast="PDF downloaded">PDF</button>`}</td></tr>`).join('')}</tbody>
      </table>
    </section>`;
}

/* ---------- Sponsor pages ---------- */
function sponsorDashboardPage() {
  return `
    <div class="cards-grid">
      ${sponsorStats.map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2>${spark('#f2aa00')}</button>`).join('')}
    </div>
    <div class="dashboard-grid">
      <section class="card">
        <div class="card-title"><h2>Sponsorship package</h2><button class="link-button" data-page-link="sponsorOverview">Details</button></div>
        <div class="tier-card gold" style="margin:0"><span class="chip">${sponsorProfile.tier} tier</span><h3>${sponsorProfile.value}</h3><ul>${sponsorProfile.inclusions.slice(0, 4).map((b) => `<li>✓ ${b}</li>`).join('')}</ul><button class="secondary-action" type="button" data-toast="Package details opened">View package</button></div>
      </section>
      <section class="card">
        <div class="card-title"><h2>Recent leads</h2><button class="link-button" data-page-link="brandVisibility">View all</button></div>
        ${sponsorLeads.slice(0, 4).map((l) => `<div class="sponsor-row"><span class="sponsor-mark">${l.name[0]}</span><div><h3>${l.name}</h3><span class="muted">${l.company} · ${l.interest}</span></div><small class="muted">${l.when}</small></div>`).join('')}
      </section>
      <section class="card">
        <div class="card-title"><h2>Sponsored events</h2><button class="link-button" data-page-link="sponsoredEvents">View all</button></div>
        ${sponsoredEventsData.map((e) => `<button class="event-row" type="button" data-event-id="${e.id}"><span class="date-tile">${e.date.split(' ')[0].toUpperCase()}<strong>${e.date.split(' ')[1]}</strong></span><img src="${e.img}" alt="" /><span><h3>${e.title}</h3><span class="event-meta">${e.booth}<br />${e.city}</span><span class="chip">${e.reach}</span></span></button>`).join('')}
      </section>
    </div>`;
}

function sponsorOverviewPage() {
  const p = sponsorProfile;
  return `
    <div class="cards-grid">
      ${[['Tier', p.tier], ['Contract value', p.value], ['Renews', p.renews]].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
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
        <button class="primary-action" type="button" data-toast="Renewal enquiry sent" data-toast-variant="success" style="width:100%;margin-top:12px">Discuss renewal</button>
      </aside>
    </div>`;
}

function brandVisibilityPage() {
  return `
    <div class="cards-grid">
      ${sponsorStats.map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2>${spark('#5b35f5')}</button>`).join('')}
    </div>
    <div class="reports-grid">
      <section class="card full">
        <div class="card-title"><h2>Impressions — last 12 months</h2><button class="link-button"><span data-icon="download"></span> Export</button></div>
        ${lineChart('#f2aa00', [8, 12, 10, 16, 14, 19, 17, 22, 20, 26, 24, 31])}
      </section>
      <section class="card">
        <div class="card-title"><h2>Logo placements</h2><button class="link-button">Details</button></div>
        <div class="bar-chart">${[58, 42, 54, 38, 31, 46].map((v) => `<span class="bar" style="--sold:${v}%"></span>`).join('')}</div>
        <div class="bar-labels"><span>Web</span><span>Email</span><span>Events</span><span>Print</span><span>Social</span><span>App</span></div>
      </section>
    </div>
    <section class="card">
      <div class="card-title"><h2>Leads generated</h2><span class="chip">${sponsorLeads.length} this quarter</span></div>
      <table class="table">
        <thead><tr><th>Contact</th><th>Company</th><th>Interest</th><th>When</th><th></th></tr></thead>
        <tbody>${sponsorLeads.map((l) => `<tr><td><strong>${l.name}</strong></td><td>${l.company}</td><td>${l.interest}</td><td>${l.when}</td><td><button class="link-button" data-toast="Intro requested with ${l.name}" data-toast-variant="success">Request intro</button></td></tr>`).join('')}</tbody>
      </table>
    </section>`;
}

function sponsoredEventsPage() {
  return `
    <div class="cards-grid">
      ${[['Sponsored', sponsoredEventsData.length], ['Total reach', '430'], ['Booths', '6']].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <div class="event-grid">
      ${sponsoredEventsData.map((e) => `
        <article class="event-card" data-event-id="${e.id}">
          <img src="${e.img}" alt="" />
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
      ${[['Paid', '£15,000'], ['Outstanding', '£2,400'], ['Invoices', sponsorInvoices.length]].map(([l, v]) => `<button class="compact-card" type="button" data-toast="${l}"><span class="muted">${l}</span><h2 style="font-size:22px">${v}</h2></button>`).join('')}
    </div>
    <section class="card">
      <div class="card-title"><h2>Sponsorship invoices</h2><span class="chip">${sponsorProfile.tier} sponsor</span></div>
      <table class="table">
        <thead><tr><th>Invoice</th><th>Description</th><th>Amount</th><th>Issued</th><th>Status</th><th></th></tr></thead>
        <tbody>${sponsorInvoices.map((inv) => `<tr><td><strong>${inv.id}</strong></td><td>${inv.desc}</td><td><strong>${inv.amount}</strong></td><td>${inv.issued}</td><td><span class="invoice-status ${inv.status}">${cap(inv.status)}</span></td><td><button class="link-button" data-toast="PDF downloaded">PDF</button></td></tr>`).join('')}</tbody>
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
    document.getElementById('pageRoot').innerHTML = fn();
    initIcons(document.getElementById('pageRoot'));
    attachActions();
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
  document.getElementById('modalFoot').innerHTML = footer || `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-modal-submit>Save</button>`;
  const overlay = document.getElementById('modalOverlay');
  overlay.hidden = false;
  initIcons(overlay);
  overlay.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', closeModal));
  overlay.querySelectorAll('[data-modal-submit]').forEach((b) => b.addEventListener('click', () => { closeModal(); showToast('Saved successfully', 'success'); }));
}
function closeModal() { document.getElementById('modalOverlay').hidden = true; }

const modalForms = {
  'new-contact': () => openModal('Add contact',
    `<div class="form-row"><label>Full name<input type="text" placeholder="Jane Smith" required /></label><label>Email<input type="email" placeholder="jane@example.com" /></label><label>Company<input type="text" /></label><label>City<input type="text" /></label><label>Tier<select><option>Gold</option><option>Silver</option><option>Bronze</option></select></label><label>Status<select><option>Active</option><option>Warm</option><option>New</option></select></label></div>`),
  'new-event': () => openModal('Create event',
    `<label>Event title<input type="text" data-field="title" placeholder="Networking Dinner" /></label><div class="form-row"><label>Date<input type="text" data-field="date_label" placeholder="Aug 12" /></label><label>Time<input type="text" data-field="time_label" placeholder="6 PM" /></label><label>City<input type="text" data-field="city" placeholder="London, UK" /></label><label>Capacity<input type="number" data-field="capacity" placeholder="120" /></label></div><label>Description<textarea placeholder="Brief overview…"></textarea></label>`,
    `<button class="control" type="button" data-modal-close>Cancel</button><button class="primary-action" type="button" data-create-event>Create event</button>`),
  'new-ticket': () => openModal('Issue ticket',
    `<div class="form-row"><label>Event<select>${eventsCatalog.map((e) => `<option>${e.title}</option>`).join('')}</select></label><label>Buyer<input type="text" /></label><label>Tier<select><option>VIP</option><option>Standard</option></select></label><label>Price<input type="number" placeholder="250" /></label></div>`),
  'new-sponsor': () => openModal('New sponsor',
    `<label>Sponsor name<input type="text" /></label><div class="form-row"><label>Tier<select><option>Gold</option><option>Silver</option><option>Bronze</option></select></label><label>Amount<input type="number" /></label><label>Renewal date<input type="date" /></label><label>Primary contact<input type="text" /></label></div>`),
  'new-task': () => openModal('New task',
    `<label>Task<input type="text" placeholder="What needs doing?" /></label><div class="form-row"><label>Assignee<select>${contacts.slice(0,5).map((c) => `<option>${c.name}</option>`).join('')}</select></label><label>Due<input type="date" /></label><label>Priority<select><option>High</option><option>Medium</option><option>Low</option></select></label><label>Status<select><option>To do</option><option>In progress</option><option>Done</option></select></label></div>`),
  'new-campaign': () => openModal('New campaign',
    `<label>Campaign name<input type="text" /></label><label>Subject line<input type="text" /></label><div class="form-row"><label>Audience<select><option>All members</option><option>Gold tier</option><option>Expiring soon</option></select></label><label>Send time<input type="datetime-local" /></label></div>`),
  'new-invoice': () => openModal('New invoice',
    `<div class="form-row"><label>Client<input type="text" /></label><label>Amount<input type="number" placeholder="1000" /></label><label>Issued<input type="date" /></label><label>Due<input type="date" /></label></div><label>Line items<textarea placeholder="1× Gold membership · £2,400"></textarea></label>`),
  'new-user': () => openModal('Invite user',
    `<label>Email<input type="email" /></label><label>Role<select><option>Admin</option><option>Ops</option><option>Finance</option><option>Viewer</option></select></label>`)
};

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
  return openDrawer(c.name, `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px"><span class="presence ${c.presence}"><img class="avatar" src="${c.avatar}" style="width:62px;height:62px;border-radius:50%" alt="" /></span>
    <div><h2 style="margin:0">${c.name}</h2><small class="muted">${c.company} · ${c.city}</small></div></div>
    <div class="drawer-section"><h3>Contact</h3><dl class="drawer-kv"><dt>Email</dt><dd>${c.email}</dd><dt>Phone</dt><dd>${c.phone}</dd><dt>Tier</dt><dd>${c.tier}</dd><dt>Status</dt><dd>${statusPill(c.status)}</dd><dt>Open deals</dt><dd>${c.deals}</dd><dt>Last activity</dt><dd>${c.last}</dd></dl></div>
    <div class="drawer-section"><h3>Recent activity</h3>${activities.slice(0, 3).map(([t, b, time, tone]) => `<div class="activity"><span class="activity-icon" style="background:var(--${tone === 'purple' ? 'purple' : tone})">${icons.users}</span><div><h3>${t}</h3><span>${b}</span></div><small class="muted">${time}</small></div>`).join('')}</div>
    <div style="display:flex;gap:10px"><button class="primary-action" type="button" data-toast="Email composer opened"><span data-icon="mail"></span>Email</button><button class="control" type="button" data-toast="Call started"><span data-icon="message"></span>Call</button><button class="control" type="button" data-confirm="delete-contact"><span data-icon="trash"></span></button></div>
  `);
}

function invoiceDrawer(i) {
  const inv = invoices[i];
  return openDrawer(inv.id, `
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:18px"><div><h2 style="margin:0;font-size:30px">${inv.amount}</h2><small class="muted">Issued ${inv.issued} · Due ${inv.due}</small></div><span class="invoice-status ${inv.status}">${inv.status}</span></div>
    <div class="drawer-section"><h3>Client</h3><strong>${inv.client}</strong><p class="muted" style="margin:2px 0 0;font-size:13px">Billing contact pending</p></div>
    <div class="drawer-section"><h3>Line items</h3>
      <table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
      <tbody><tr><td>Gold sponsorship — annual</td><td>1</td><td>${inv.amount}</td></tr></tbody></table>
    </div>
    <div style="display:flex;gap:10px"><button class="primary-action" type="button" data-toast="Reminder sent" data-toast-variant="info"><span data-icon="send"></span>Send reminder</button><button class="control" type="button" data-toast="PDF downloaded"><span data-icon="download"></span>PDF</button>${inv.status !== 'paid' ? `<button class="control" type="button" data-confirm="mark-paid" data-id="${inv.id}">Mark paid</button>` : ''}</div>
  `);
}

function eventDrawer(id) {
  const e = eventsCatalog.find((x) => x.id === id) || eventsCatalog[0];
  return openDrawer(e.title, `
    <img src="${e.img}" alt="" style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:14px" />
    <div class="drawer-section"><h3>Details</h3><dl class="drawer-kv"><dt>Date</dt><dd>${e.date} · ${e.time}</dd><dt>Venue</dt><dd>${e.city}</dd><dt>Status</dt><dd>${statusPill(e.status)}</dd><dt>Attendees</dt><dd>${e.attendees}/${e.capacity}</dd></dl></div>
    <div class="drawer-section"><h3>Attendees preview</h3>${avatarGroup(avatars, e.attendees - avatars.length)}</div>
    <div style="display:flex;gap:10px"><button class="primary-action" type="button" data-toast="Invites sent" data-toast-variant="success"><span data-icon="send"></span>Send invites</button><button class="control" type="button" data-toast="Edit opened"><span data-icon="edit"></span>Edit</button><button class="control" type="button" data-confirm="cancel-event"><span data-icon="trash"></span></button></div>
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
  refund: { title: 'Refund ticket?', body: 'This will refund the ticket and notify the buyer.', toast: ['Ticket refunded', 'warn'] },
  'mark-paid': { title: 'Mark invoice as paid?', body: 'This action records a manual payment for the invoice.', toast: ['Invoice marked paid', 'success'] },
  'cancel-event': { title: 'Cancel this event?', body: 'All confirmed attendees will be notified and refunds may apply.', toast: ['Event cancelled', 'error'] },
  'delete-contact': { title: 'Delete contact?', body: 'This permanently removes the contact and unlinks their data.', toast: ['Contact deleted', 'error'] },
  'remove-user': { title: 'Remove team member?', body: 'They will lose access to the workspace immediately.', toast: ['User removed', 'error'] }
};

/* ===================== NOTIFICATIONS ===================== */
function renderNotifPanel() {
  const unread = notifications.filter((n) => n.unread).length;
  document.getElementById('notifPanel').innerHTML = `
    <div class="notif-head"><h3>Notifications</h3><button class="link-button" data-mark-read>Mark all read</button></div>
    <div class="notif-list">
      ${notifications.map((n) => `<div class="notif-item ${n.unread ? 'unread' : ''}"><span class="${n.unread ? 'notif-dot' : ''}"></span><div><h4>${n.title}</h4><p>${n.body}</p></div><small>${n.time}</small></div>`).join('')}
    </div>
    <div class="notif-foot"><button class="link-button" data-toast="All notifications opened">View all</button></div>
  `;
  document.getElementById('notifPanel').querySelector('[data-mark-read]').addEventListener('click', () => {
    notifications.forEach((n) => n.unread = false);
    document.querySelector('.has-badge i').textContent = '0';
    renderNotifPanel();
    showToast('All notifications marked read', 'success');
  });
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
    <button class="menu-item" type="button" data-toast="Profile opened"><span data-icon="users"></span>Profile</button>
    <button class="menu-item" type="button" data-toast="Help center opened"><span data-icon="message"></span>Help</button>
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
      if (card) { col.insertBefore(card, col.querySelector('.link-button')); showToast('Task moved', 'success'); }
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

    if (find('[data-create-event]')) {
      ev.stopPropagation();
      const m = document.getElementById('modalBody');
      const get = (f) => m.querySelector(`[data-field="${f}"]`)?.value || '';
      createEvent({ title: get('title'), date_label: get('date_label'), time_label: get('time_label'), city: get('city'), capacity: get('capacity') })
        .then((ok) => { if (ok) closeModal(); });
      return;
    }

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
    if (sup) {
      document.querySelectorAll('.support-item').forEach((x) => x.classList.remove('is-active'));
      sup.classList.add('is-active');
      showToast('Thread opened', 'info');
      return;
    }

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
  });

  document.body.addEventListener('change', (ev) => {
    const cb = ev.target.closest('.task-item input[type="checkbox"]');
    if (cb) showToast(cb.checked ? 'Task complete' : 'Task reopened', cb.checked ? 'success' : 'info');
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
  history.replaceState(null, '', `#${mode}`);
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
  const { ok, data } = await api('/api/auth/login', { method: 'POST', body: { email, password } });
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
    role: get('[data-field="role"]')
  };
  const submit = f.querySelector('.auth-submit');
  submit.disabled = true;
  const { ok, data } = await api('/api/auth/signup', { method: 'POST', body });
  submit.disabled = false;
  if (!ok) { showToast(data?.error || 'Signup failed', 'error'); return; }
  enterApp(data.user, 'Account created');
});

document.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
  const form = document.getElementById('loginForm');
  form.querySelector('input[type="email"]').value = b.dataset.demo;
  form.querySelector('input[type="password"]').value = 'hbbaglobal';
  form.querySelectorAll('input').forEach((i) => i.dispatchEvent(new Event('blur')));
}));
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('is-open'));
document.getElementById('globalSearch').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') showToast(`Searching for "${e.currentTarget.value || 'everything'}"`, 'info');
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

(async function boot() {
  // Restore session from the server (httpOnly cookie). No client-side role guessing.
  const { ok, data } = await api('/api/auth/me');
  if (ok && data?.user) {
    setSession(data.user);
    const route = location.hash.replace('#', '');
    showApp(route && pageRendererFor(currentRole, route) ? route : ROLES[currentRole].landing);
  } else {
    const route = location.hash.replace('#', '');
    showAuth(route === 'signup' ? 'signup' : 'login');
  }
})();
