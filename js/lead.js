// Lead capture. CRM-agnostic: POSTs JSON to CONFIG.leadEndpoint when set,
// and always keeps a local copy so nothing is lost while the CRM is undecided.
import { CONFIG, FREE_MAIL } from './config.js';

export function validateEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'Enter a valid email address.';
  if (CONFIG.requireWorkEmail && FREE_MAIL.includes(e.split('@')[1])) return 'Please use your work email.';
  return null;
}

export async function submitLead(payload) {
  try {
    const all = JSON.parse(localStorage.getItem('click_leads') || '[]');
    all.push(payload);
    localStorage.setItem('click_leads', JSON.stringify(all.slice(-200)));
  } catch { /* storage may be blocked in private mode */ }

  if (!CONFIG.leadEndpoint) {
    console.info('[CLICK] lead captured (no endpoint configured):', payload);
    return { ok: true, stored: 'local' };
  }
  try {
    const res = await fetch(CONFIG.leadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, stored: 'remote' };
  } catch (err) {
    console.warn('[CLICK] lead POST failed, kept locally', err);
    return { ok: true, stored: 'local' };
  }
}
