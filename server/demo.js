// Demo mode: lets the portal show the payment and email journeys end to end
// while no real provider is connected. It never claims a real charge or a real
// delivery — every demo action is labelled as such in the UI, the activity feed
// and the database.
//
// A real provider always wins: connect Stripe or Resend and the demo path for
// that capability switches itself off. Set DEMO_MODE=0 to disable it entirely
// (payments then return 503, emails are only recorded).
export function demoEnabled() {
  const flag = String(process.env.DEMO_MODE ?? '').toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;
  return true;
}

export function demoPayments(paymentsAreConfigured) {
  return !paymentsAreConfigured && demoEnabled();
}

export function demoEmail(emailIsConfigured) {
  return !emailIsConfigured && demoEnabled();
}
