// Text helpers: personalization and clue-marker parsing. Pure functions.

export const DEFAULT_PROFILE = {
  company: 'Bayview Partners',
  headcount: 35,
  industry: 'professional',
};

export const CEO = { name: 'Dana Reyes', first: 'dana' };

export function slugDomain(company) {
  const slug = String(company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return (slug || 'bayviewpartners') + '.com';
}

// A believable lookalike of the player's domain ("rn" for "m", zero for "o"...).
export function lookalike(domain) {
  const [name, tld = 'com'] = domain.split(/\.(?=[^.]+$)/);
  let fake;
  if (name.includes('m')) fake = name.replace('m', 'rn');
  else if (name.includes('l')) fake = name.replace('l', 'I');
  else if (name.includes('o')) fake = name.replace('o', '0');
  else fake = name + '-inc';
  return `${fake}.${tld === 'com' ? 'co' : tld}`;
}

export function profileVars(profile) {
  const company = (profile && profile.company) || DEFAULT_PROFILE.company;
  const domain = slugDomain(company);
  return {
    company,
    domain,
    lookalike: lookalike(domain),
    ceo: CEO.name,
    ceoFirst: CEO.first,
  };
}

export function fill(str, vars) {
  if (str == null) return str;
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// "[[id|text]]" -> [{t:'text', v}, {t:'clue', id, v}]
export function parseRich(str) {
  const out = [];
  if (!str) return out;
  const re = /\[\[([\w-]+)\|([^\]]+)\]\]/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ t: 'text', v: str.slice(last, m.index) });
    out.push({ t: 'clue', id: m[1], v: m[2] });
    last = re.lastIndex;
  }
  if (last < str.length) out.push({ t: 'text', v: str.slice(last) });
  return out;
}

export function stripMarkers(str) {
  return parseRich(str).map(s => s.v).join('');
}

// Fill every text field of an email with the player's details.
export function personalize(email, vars) {
  const e = { ...email };
  for (const k of ['fromName', 'from', 'subject', 'body', 'attachment', 'lesson']) e[k] = fill(e[k], vars);
  if (e.link) e.link = { label: fill(e.link.label, vars), url: fill(e.link.url, vars) };
  e.clues = Object.fromEntries(Object.entries(e.clues || {}).map(([k, v]) => [k, fill(v, vars)]));
  return e;
}

// Clue ids actually present in an email's text (some explanations may be unused).
export function clueIdsIn(email) {
  const fields = [email.from, email.subject, email.body, email.attachment, email.link && email.link.url];
  const ids = new Set();
  for (const f of fields) for (const s of parseRich(f)) if (s.t === 'clue') ids.add(s.id);
  return [...ids];
}

export function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function moneyShort(n) {
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'k';
  return money(n);
}
