// Stripe webhook: settles an invoice once the hosted checkout completes.
// Mounted before the JSON body parser because the signature is computed over
// the raw request body.
import { Router } from 'express';
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { query } from '../db.js';
import { logActivity } from '../activity.js';

export const stripeRouter = Router();

const TOLERANCE_SECONDS = 300;

export function webhookConfigured() {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

/** Verify Stripe's `Stripe-Signature` header against the raw payload. */
export function verifySignature(rawBody, header, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    String(header).split(',').map((kv) => kv.split('=').map((x) => x.trim()))
  );
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(nowSeconds - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`)
    .digest('hex');
  const given = String(parts.v1 || '');
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

/** Mark an invoice paid exactly once. Returns the invoice row, or null. */
export async function settleInvoice(number, paymentRef) {
  const { rows } = await query(
    `UPDATE invoices
        SET status = 'paid', paid_at = now(), payment_ref = $2
      WHERE number = $1 AND status <> 'paid'
      RETURNING number, amount_cents, currency, user_id`,
    [number, paymentRef || null]);
  return rows[0] || null;
}

stripeRouter.post('/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
  try {
    if (!webhookConfigured()) return res.status(503).json({ error: 'Stripe webhook is not configured' });
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''));
    if (!verifySignature(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(raw.toString('utf8'));
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data?.object || {};
      const number = session.metadata?.invoice_number || session.client_reference_id;
      if (number) {
        const invoice = await settleInvoice(number, session.payment_intent || session.id);
        if (invoice) {
          await logActivity({ kind: 'invoice', title: 'Invoice paid', body: `${invoice.number} — paid by card`, tone: 'green' });
          if (invoice.user_id) {
            await logActivity({
              kind: 'invoice', title: 'Payment received', body: `Thanks — ${invoice.number} is settled.`,
              tone: 'green', role: 'all', userId: invoice.user_id
            });
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err) { next(err); }
});
