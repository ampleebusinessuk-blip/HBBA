// Stripe payments via REST (no SDK dependency). Dormant unless STRIPE_SECRET_KEY is set.
// Verify against real test keys before relying on it (Phase 5).
const STRIPE_API = 'https://api.stripe.com/v1';

export function paymentsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function appUrl() {
  return process.env.APP_URL || 'https://hbba-three.vercel.app';
}

async function stripe(path, params) {
  const body = new URLSearchParams();
  const add = (k, v) => body.append(k, String(v));
  for (const [k, v] of Object.entries(params)) add(k, v);
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${res.status}`);
  return data;
}

// Build a Checkout session to pay a single invoice. Returns the hosted checkout URL.
export async function createInvoiceCheckout(invoice) {
  const session = await stripe('/checkout/sessions', {
    mode: 'payment',
    'line_items[0][quantity]': 1,
    'line_items[0][price_data][currency]': (invoice.currency || 'GBP').toLowerCase(),
    'line_items[0][price_data][unit_amount]': invoice.amount_cents,
    'line_items[0][price_data][product_data][name]': `Invoice ${invoice.number}`,
    success_url: `${appUrl()}/#invoices?paid=${invoice.number}`,
    cancel_url: `${appUrl()}/#invoices`,
    client_reference_id: invoice.number,
    'metadata[invoice_number]': invoice.number
  });
  return session.url;
}
