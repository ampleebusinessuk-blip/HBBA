import { pool, closePool } from './server/db.js';
import { hashPassword } from './server/auth.js';

const DEMO_PASSWORD = 'hbbaglobal';

const accounts = [
  { email: 'admin@hbbaglobal.co.uk', role: 'admin', full_name: 'John Doe', org: 'HBBA Global' },
  { email: 'member@hbbaglobal.co.uk', role: 'member', full_name: 'Jane Cole', org: 'Cole & Co' },
  { email: 'sponsor@hbbaglobal.co.uk', role: 'sponsor', full_name: 'Acme Corp', org: 'Acme Corp' }
];

const photos = [
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=320&q=80',
  'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?auto=format&fit=crop&w=320&q=80'
];

const events = [
  ['E001', 'Global Business Networking Dinner', 'May 25', '6 PM', 'London, UK', 150, photos[0], 'Confirmed'],
  ['E002', 'International Trade Conference 2024', 'Jun 02', '9 AM', 'Budapest, Hungary', 320, photos[1], 'Selling'],
  ['E003', 'Embassy Business Forum', 'Jun 15', '2 PM', 'Dubai, UAE', 100, photos[2], 'Confirmed'],
  ['E004', 'VIP Investment Roundtable', 'Jun 28', '5 PM', 'Paris, France', 50, photos[3], 'Selling'],
  ['E005', 'Sponsor Strategy Workshop', 'Jul 10', '10 AM', 'London, UK', 60, photos[4], 'Draft'],
  ['E006', 'Member-Only Summer Mixer', 'Jul 22', '7 PM', 'Manchester, UK', 110, photos[5], 'Confirmed']
];

// number, ownerEmail, description, amount_cents, issued, status, pdf
const invoices = [
  ['INV-2026-00002', 'member@hbbaglobal.co.uk', 'Premium membership — annual', 48000, '12 Jan', 'paid', 'INV-2026-00002.pdf'],
  ['INV-2026-00017', 'member@hbbaglobal.co.uk', 'Trade Conference VIP ticket', 25000, '02 May', 'paid', null],
  ['INV-2026-00031', 'member@hbbaglobal.co.uk', 'Summer Mixer guest pass', 6000, '10 Jun', 'due', null],
  ['INV-SP-2026-014', 'sponsor@hbbaglobal.co.uk', 'Gold sponsorship — annual', 1500000, '01 Jun', 'paid', null],
  ['INV-SP-2026-022', 'sponsor@hbbaglobal.co.uk', 'Additional booth — Trade Conference', 240000, '10 May', 'due', null]
];

async function seed() {
  const hash = await hashPassword(DEMO_PASSWORD);
  for (const a of accounts) {
    await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, org, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             full_name = EXCLUDED.full_name,
             org = EXCLUDED.org,
             status = 'active'`,
      [a.email, hash, a.role, a.full_name, a.org]
    );
    console.log(`seeded ${a.email} (${a.role})`);
  }

  for (const [code, title, date, time, city, cap, img, status] of events) {
    await pool.query(
      `INSERT INTO events (code, title, date_label, time_label, city, capacity, img, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (code) DO UPDATE SET
         title=EXCLUDED.title, date_label=EXCLUDED.date_label, time_label=EXCLUDED.time_label,
         city=EXCLUDED.city, capacity=EXCLUDED.capacity, img=EXCLUDED.img, status=EXCLUDED.status`,
      [code, title, date, time, city, cap, img, status]
    );
  }
  console.log(`seeded ${events.length} events`);

  for (const [number, email, desc, cents, issued, status, pdf] of invoices) {
    const u = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    const userId = u.rows[0]?.id || null;
    await pool.query(
      `INSERT INTO invoices (number, user_id, description, amount_cents, issued_on, status, pdf_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (number) DO UPDATE SET
         user_id=EXCLUDED.user_id, description=EXCLUDED.description, amount_cents=EXCLUDED.amount_cents,
         issued_on=EXCLUDED.issued_on, status=EXCLUDED.status, pdf_url=EXCLUDED.pdf_url`,
      [number, userId, desc, cents, issued, status, pdf]
    );
  }
  console.log(`seeded ${invoices.length} invoices`);

  // --- Sponsor data (for sponsor@hbbaglobal.co.uk) ---
  const sp = await pool.query('SELECT id FROM users WHERE email=$1', ['sponsor@hbbaglobal.co.uk']);
  const sponsorId = sp.rows[0]?.id;
  if (sponsorId) {
    await pool.query(
      `INSERT INTO sponsorships (user_id, tier, value_cents, renews, since, impressions, placements, leads_count, meetings, inclusions)
       VALUES ($1,'Gold',1500000,'Jun 2027','Jun 2023',184200,46,128,23,$2)
       ON CONFLICT (user_id) DO UPDATE SET
         tier=EXCLUDED.tier, value_cents=EXCLUDED.value_cents, renews=EXCLUDED.renews, since=EXCLUDED.since,
         impressions=EXCLUDED.impressions, placements=EXCLUDED.placements, leads_count=EXCLUDED.leads_count,
         meetings=EXCLUDED.meetings, inclusions=EXCLUDED.inclusions`,
      [sponsorId, JSON.stringify([
        'Logo on all events', 'Keynote slot at flagship event', 'Dedicated booth at 6 events',
        'Member directory feature', 'Quarterly leads report'
      ])]
    );

    const leads = [
      ['Sarah Johnson', 'Global Bank Ltd.', 'Treasury services', '2d ago'],
      ['Lukas Meyer', 'TechVision Ltd.', 'Cloud migration', '3d ago'],
      ['Amina Hassan', 'Emirates Chamber', 'Trade finance', '5d ago'],
      ['Olivia Watson', 'City Finance', 'Advisory retainer', '1w ago']
    ];
    await pool.query('DELETE FROM sponsor_leads WHERE user_id=$1', [sponsorId]);
    for (const [name, company, interest, when] of leads) {
      await pool.query(
        'INSERT INTO sponsor_leads (user_id, name, company, interest, when_label) VALUES ($1,$2,$3,$4,$5)',
        [sponsorId, name, company, interest, when]
      );
    }

    const sponsored = [['E001', 'Booth A1', '120 reach'], ['E002', 'Main stage', '250 reach'], ['E005', 'Booth B3', '60 reach']];
    for (const [code, booth, reach] of sponsored) {
      const e = await pool.query('SELECT id FROM events WHERE code=$1', [code]);
      if (!e.rows[0]) continue;
      await pool.query(
        `INSERT INTO sponsored_events (user_id, event_id, booth, reach) VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id, event_id) DO UPDATE SET booth=EXCLUDED.booth, reach=EXCLUDED.reach`,
        [sponsorId, e.rows[0].id, booth, reach]
      );
    }
    console.log(`seeded sponsorship + ${leads.length} leads + ${sponsored.length} sponsored events`);
  }

  // --- Tasks (admin board) ---
  const taskCount = await pool.query('SELECT count(*)::int AS n FROM tasks');
  if (taskCount.rows[0].n === 0) {
    const tasks = [
      ['Follow up with TechVision lead', 'Lukas Meyer', 'high', 'todo', 'Today'],
      ['Draft sponsor renewal email', 'Sarah Johnson', 'med', 'todo', 'Tomorrow'],
      ['Prepare board pack section 3', 'Amina Hassan', 'high', 'todo', 'Fri'],
      ['Onboard Global Bank Gold sponsor', 'Sarah Johnson', 'high', 'doing', 'Wed'],
      ['Update CRM tagging rules', 'Elena Rossi', 'low', 'doing', 'Wed'],
      ['Send May newsletter', 'Peter Novak', 'med', 'done', 'Mon'],
      ['Reconcile April invoices', 'Olivia Watson', 'med', 'done', 'Mon']
    ];
    for (const [title, assignee, priority, status, due] of tasks) {
      await pool.query(
        'INSERT INTO tasks (title, assignee, priority, status, due) VALUES ($1,$2,$3,$4,$5)',
        [title, assignee, priority, status, due]
      );
    }
    console.log(`seeded ${tasks.length} tasks`);
  }

  // --- One demo support ticket from the member ---
  const memU = await pool.query('SELECT id, full_name FROM users WHERE email=$1', ['member@hbbaglobal.co.uk']);
  if (memU.rows[0]) {
    const existing = await pool.query('SELECT count(*)::int AS n FROM support_tickets');
    if (existing.rows[0].n === 0) {
      const t = await pool.query('INSERT INTO support_tickets (user_id, subject) VALUES ($1,$2) RETURNING id', [memU.rows[0].id, 'VAT receipt request']);
      await pool.query(
        'INSERT INTO support_messages (ticket_id, author_id, author_name, author_role, body) VALUES ($1,$2,$3,$4,$5)',
        [t.rows[0].id, memU.rows[0].id, memU.rows[0].full_name, 'member', 'Hi, could you resend a VAT receipt for my last invoice?']
      );
      console.log('seeded 1 support ticket');
    }
  }

  console.log(`demo password: ${DEMO_PASSWORD}`);
}

seed()
  .then(closePool)
  .catch(async (err) => {
    await closePool();
    console.error(err);
    process.exit(1);
  });
