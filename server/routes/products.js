import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { logActivity } from '../activity.js';

export const productsRouter = Router();
productsRouter.use(requireAuth);

const adminOnly = requireRole('admin');
const STATUSES = ['active', 'draft', 'archived'];

/**
 * GTIN-8/12/13/14 check-digit validation, so a typo cannot enter the catalogue
 * and later fail to scan.
 */
export function validGtin(value) {
  const digits = String(value || '').replace(/\s|-/g, '');
  if (!/^\d+$/.test(digits) || ![8, 12, 13, 14].includes(digits.length)) return false;
  const body = digits.slice(0, -1).split('').reverse().map(Number);
  const check = Number(digits.slice(-1));
  const sum = body.reduce((total, digit, i) => total + digit * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

function productDTO(row) {
  return {
    id: row.id,
    gtin: row.gtin,
    name: row.name,
    brand: row.brand || '',
    category: row.category || 'Uncategorised',
    description: row.description || '',
    image: row.image_url || null,
    status: row.status,
    verify_url: `https://www.gs1.org/services/verified-by-gs1/results?gtin=${row.gtin}`
  };
}

// Catalogue. Everyone signed in can browse; admins also see drafts.
productsRouter.get('/products', async (req, res, next) => {
  try {
    const isAdmin = req.auth.role === 'admin';
    const { rows } = await query(
      isAdmin
        ? `SELECT * FROM products WHERE status <> 'archived' ORDER BY sort, name`
        : `SELECT * FROM products WHERE status = 'active' ORDER BY sort, name`);
    const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))];
    res.json({
      products: rows.map(productDTO),
      categories,
      stats: {
        products: rows.length,
        categories: categories.length,
        withImages: rows.filter((r) => r.image_url).length
      }
    });
  } catch (err) { next(err); }
});

productsRouter.post('/admin/products', adminOnly, async (req, res, next) => {
  try {
    const gtin = String(req.body?.gtin || '').replace(/\s|-/g, '');
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Product name required' });
    if (!validGtin(gtin)) return res.status(400).json({ error: 'That GTIN is not valid (check digit failed)' });
    const status = STATUSES.includes(req.body?.status) ? req.body.status : 'active';
    let rows;
    try {
      ({ rows } = await query(
        `INSERT INTO products (gtin, name, brand, category, description, image_url, status, sort)
         VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE((SELECT max(sort) + 10 FROM products), 10))
         RETURNING *`,
        [gtin, name, String(req.body?.brand || '').trim() || null,
          String(req.body?.category || '').trim() || null,
          String(req.body?.description || '').trim() || null,
          String(req.body?.image || '').trim() || null, status]));
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'A product with that GTIN already exists' });
      throw err;
    }
    await logActivity({ kind: 'product', title: 'Product added', body: `${name} · ${gtin}`, tone: 'blue' });
    res.status(201).json({ product: productDTO(rows[0]) });
  } catch (err) { next(err); }
});

productsRouter.patch('/admin/products/:id', adminOnly, async (req, res, next) => {
  try {
    const fields = [];
    const values = [];
    const columns = { name: 'name', brand: 'brand', category: 'category', description: 'description', image: 'image_url' };
    for (const [key, column] of Object.entries(columns)) {
      if (req.body?.[key] !== undefined) { values.push(String(req.body[key]) || null); fields.push(`${column} = $${values.length}`); }
    }
    if (req.body?.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
      values.push(req.body.status); fields.push(`status = $${values.length}`);
    }
    if (req.body?.gtin !== undefined) {
      const gtin = String(req.body.gtin).replace(/\s|-/g, '');
      if (!validGtin(gtin)) return res.status(400).json({ error: 'That GTIN is not valid (check digit failed)' });
      values.push(gtin); fields.push(`gtin = $${values.length}`);
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE products SET ${fields.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: productDTO(rows[0]) });
  } catch (err) { next(err); }
});

productsRouter.delete('/admin/products/:id', adminOnly, async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE products SET status = 'archived', updated_at = now() WHERE id = $1 RETURNING name`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
    await logActivity({ kind: 'product', title: 'Product archived', body: rows[0].name, tone: 'orange' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
