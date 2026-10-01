// Administrator-managed workspace settings: business identity, bank accounts
// shown on invoices, and integration credentials.
//
// Credentials are write-only through this surface. A read tells you whether a
// key is configured and where it came from, never what it is.
import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import {
  settingsOverview, setManagedSecret, setBusinessSettings, businessProfile,
  listBankAccounts, saveBankAccount, deleteBankAccount, MANAGED_SECRETS
} from '../settings.js';
import { logActivity } from '../activity.js';
import { sendEmail, layout, verifyEmailTransport, emailTransport, emailFrom } from '../email.js';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

const adminOnly = requireRole('admin');

settingsRouter.get('/admin/settings', adminOnly, async (_req, res, next) => {
  try {
    const [overview, banks] = await Promise.all([settingsOverview(), listBankAccounts()]);
    res.json({ ...overview, bankAccounts: banks, managed: MANAGED_SECRETS });
  } catch (err) { next(err); }
});

settingsRouter.patch('/admin/settings/business', adminOnly, async (req, res, next) => {
  try {
    const written = await setBusinessSettings(req.body || {}, req.auth.sub);
    if (!written.length) return res.status(400).json({ error: 'Nothing to update' });
    await logActivity({ kind: 'settings', title: 'Business details updated', body: written.join(', '), tone: 'blue' });
    res.json({ business: (await settingsOverview()).business, profile: await businessProfile() });
  } catch (err) { next(err); }
});

settingsRouter.put('/admin/settings/integrations/:key', adminOnly, async (req, res, next) => {
  try {
    const result = await setManagedSecret(req.params.key, req.body?.value, req.auth.sub);
    await logActivity({
      kind: 'settings',
      title: result.configured ? `${req.params.key} connected` : `${req.params.key} disconnected`,
      body: 'Changed from Settings', tone: result.configured ? 'green' : 'orange'
    });
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

/* ===================== BANK ACCOUNTS ===================== */

settingsRouter.get('/admin/bank-accounts', adminOnly, async (_req, res, next) => {
  try {
    res.json({ accounts: await listBankAccounts() });
  } catch (err) { next(err); }
});

settingsRouter.post('/admin/bank-accounts', adminOnly, async (req, res, next) => {
  try {
    const account = await saveBankAccount(req.body || {});
    await logActivity({ kind: 'settings', title: 'Bank account added', body: account.label, tone: 'blue' });
    res.status(201).json({ account });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

settingsRouter.patch('/admin/bank-accounts/:id', adminOnly, async (req, res, next) => {
  try {
    res.json({ account: await saveBankAccount(req.body || {}, req.params.id) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

settingsRouter.delete('/admin/bank-accounts/:id', adminOnly, async (req, res, next) => {
  try {
    await deleteBankAccount(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

/* ===================== EMAIL SETUP ===================== */

// Prove the mail configuration works before relying on it for invites and
// invoices. Reports the provider's own error rather than a generic failure.
settingsRouter.post('/admin/settings/email/test', adminOnly, async (req, res, next) => {
  try {
    const to = String(req.body?.to || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ error: 'Valid email required' });

    const transport = emailTransport();
    if (!transport) {
      return res.status(400).json({ error: 'No email transport is configured. Add SMTP details or a Resend key first.' });
    }

    const check = await verifyEmailTransport();
    if (!check.ok) return res.status(502).json({ error: `Could not reach the mail server: ${check.error}`, transport });

    const out = await sendEmail({
      to,
      subject: 'HBBA Global test email',
      kind: 'test',
      html: layout({
        heading: 'Your email setup works',
        body: `<p>This message was sent from your HBBA Global portal over <strong>${transport.toUpperCase()}</strong> as ${emailFrom()}.</p>
               <p>Invites, password resets, invoice reminders and campaigns will use the same route.</p>`
      }),
      text: `Your HBBA Global email setup works. Sent over ${transport} as ${emailFrom()}.`
    });

    if (!out.sent) return res.status(502).json({ error: out.error || 'The provider rejected the message', transport });
    await logActivity({ kind: 'settings', title: 'Test email sent', body: `${to} over ${transport}`, tone: 'green' });
    res.json({ ok: true, transport, to, from: emailFrom() });
  } catch (err) { next(err); }
});
