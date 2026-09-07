import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { pool, closePool } from '../server/db.js';
import { hashPassword } from '../server/auth.js';
import { validGtin } from '../server/routes/products.js';

let server;
let base;
let adminCookie;
let memberCookie;
const testGtin = '5065027203099';

async function req(path, { method = 'GET', body, cookie } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

const cookieOf = (res) => (res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie') || '').split(';')[0];

before(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`Test database is not reachable. Start it with "docker compose up -d" and run "npm run migrate". Original error: ${err.message}`);
  }
  const hash = await hashPassword('password123');
  await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ('prod.admin@example.com',$1,'admin','Catalogue Admin','active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [hash]);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, status)
     VALUES ('prod.member@example.com',$1,'member','Catalogue Member','active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [hash]);

  await new Promise((resolve) => { server = createApp().listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  adminCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'prod.admin@example.com', password: 'password123' } }));
  memberCookie = cookieOf(await req('/api/auth/login', { method: 'POST', body: { email: 'prod.member@example.com', password: 'password123' } }));
});

after(async () => {
  await pool.query('DELETE FROM products WHERE gtin = $1', [testGtin]);
  await pool.query("DELETE FROM users WHERE email LIKE 'prod.%@example.com'");
  await new Promise((r) => server.close(r));
  await closePool();
});

test('GTIN check digits are validated', () => {
  // The GTINs supplied for the New York Cheesecake Co. range.
  for (const gtin of ['5070004422905', '5070004422912', '5070004422929', '5070004422936',
    '5070004422943', '5070004422967', '5065027203129', '5065027203006', '5065027203013',
    '5065027203020', '5065027203037', '5065027203044', '5065027203051', '5065027203068',
    '5065027203075']) {
    assert.equal(validGtin(gtin), true, `${gtin} should be valid`);
  }
  assert.equal(validGtin('5065027203007'), false, 'wrong check digit');
  assert.equal(validGtin('50650272030'), false, 'wrong length');
  assert.equal(validGtin('50650272O3068'), false, 'not all digits');
});

test('the seeded catalogue is browsable by any signed-in user', async () => {
  const res = await req('/api/products', { cookie: memberCookie });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.products.length >= 15, 'the fifteen supplied products are listed');
  const oreoCup = data.products.find((p) => p.gtin === '5070004422905');
  assert.match(oreoCup.name, /Oreo/);
  assert.equal(oreoCup.brand, 'New York Cheesecake Co.');
  assert.equal(oreoCup.verify_url, 'https://www.gs1.org/services/verified-by-gs1/results?gtin=5070004422905');
  assert.ok(data.categories.includes('Cheesecakes'));

  const anon = await req('/api/products');
  assert.equal(anon.status, 401);
});

test('an admin can add, edit and archive a product', async () => {
  const created = await req('/api/admin/products', {
    method: 'POST', cookie: adminCookie,
    body: { name: 'Test Cheesecake', gtin: testGtin, brand: 'New York Cheesecake Co.', category: 'Cheesecakes' }
  });
  assert.equal(created.status, 201);
  const { product } = await created.json();
  assert.equal(product.gtin, testGtin);

  const dupe = await req('/api/admin/products', {
    method: 'POST', cookie: adminCookie, body: { name: 'Again', gtin: testGtin }
  });
  assert.equal(dupe.status, 409);

  const edited = await req(`/api/admin/products/${product.id}`, {
    method: 'PATCH', cookie: adminCookie, body: { image: 'https://example.test/cake.jpg', description: 'Test description' }
  });
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).product.image, 'https://example.test/cake.jpg');

  const archived = await req(`/api/admin/products/${product.id}`, { method: 'DELETE', cookie: adminCookie });
  assert.equal(archived.status, 200);

  const list = await req('/api/products', { cookie: memberCookie });
  assert.ok(!(await list.json()).products.some((p) => p.gtin === testGtin), 'archived products drop out of the catalogue');
});

test('a bad GTIN is refused', async () => {
  const res = await req('/api/admin/products', {
    method: 'POST', cookie: adminCookie, body: { name: 'Bad barcode', gtin: '5065027203007' }
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /check digit/i);
});

test('members cannot change the catalogue', async () => {
  const create = await req('/api/admin/products', {
    method: 'POST', cookie: memberCookie, body: { name: 'Nope', gtin: testGtin }
  });
  assert.equal(create.status, 403);

  const { rows } = await pool.query("SELECT id FROM products WHERE gtin = '5065027203006'");
  const edit = await req(`/api/admin/products/${rows[0].id}`, {
    method: 'PATCH', cookie: memberCookie, body: { name: 'Hacked' }
  });
  assert.equal(edit.status, 403);
});

test('drafts are hidden from members but visible to admins', async () => {
  const { rows } = await pool.query("SELECT id FROM products WHERE gtin = '5065027203051'");
  await pool.query("UPDATE products SET status = 'draft' WHERE id = $1", [rows[0].id]);
  try {
    const asMember = await (await req('/api/products', { cookie: memberCookie })).json();
    const asAdmin = await (await req('/api/products', { cookie: adminCookie })).json();
    assert.ok(!asMember.products.some((p) => p.gtin === '5065027203051'));
    assert.ok(asAdmin.products.some((p) => p.gtin === '5065027203051'));
  } finally {
    await pool.query("UPDATE products SET status = 'active' WHERE id = $1", [rows[0].id]);
  }
});
