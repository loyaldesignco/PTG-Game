// Act 1 deck building. Pure: pass an rng for deterministic tests.
import { EMAILS, PHISH_TYPES } from '../data/emails.js';
import { personalize, profileVars, clueIdsIn } from './text.js';

export const PER_TIER = { phish: 3, legit: 2 }; // 3 tiers x 5 = 15 emails

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 15 emails ordered by tier (difficulty curve), shuffled within each tier.
// Guarantees a malicious attachment appears so the ransomware chain is always possible.
export function buildDeck(profile, rng = Math.random, pool = EMAILS) {
  const vars = profileVars(profile);
  const tiers = [1, 2, 3].map(tier => {
    const phish = shuffle(pool.filter(e => e.tier === tier && e.phish), rng).slice(0, PER_TIER.phish);
    const legit = shuffle(pool.filter(e => e.tier === tier && !e.phish), rng).slice(0, PER_TIER.legit);
    return { tier, phish, legit };
  });

  const hasAttachment = tiers.some(t => t.phish.some(e => e.type === 'attachment'));
  if (!hasAttachment) {
    const t = tiers[1];
    const swapIn = pool.find(e => e.tier === t.tier && e.phish && e.type === 'attachment');
    if (swapIn) t.phish[t.phish.length - 1] = swapIn;
  }

  return tiers.flatMap(t => shuffle([...t.phish, ...t.legit], rng)).map(e => {
    const p = personalize(e, vars);
    p.clueIds = clueIdsIn(p);
    return p;
  });
}

// Email filtering removes 3 of 15: the first phish of each tier.
export function applyFilter(deck, hasFilter) {
  if (!hasFilter) return { shown: deck, filtered: [] };
  const filtered = [];
  for (const tier of [1, 2, 3]) {
    const hit = deck.find(e => e.tier === tier && e.phish && !filtered.includes(e));
    if (hit) filtered.push(hit);
  }
  return { shown: deck.filter(e => !filtered.includes(e)), filtered };
}

// decision: 'report' | 'trust' | 'timeout'
export function judge(email, decision) {
  const reported = decision === 'report';
  return reported === !!email.phish;
}

export function missedTypes(results) {
  const types = new Set();
  for (const r of results) if (r.phish && !r.correct) types.add(r.type);
  return PHISH_TYPES.filter(t => types.has(t));
}

export { PHISH_TYPES };
