// Act 2: turn Act 1 mistakes into an attack chain. Pure functions.
import { CRISES, LIFELINE, BEATS } from '../data/crises.js';

const ORDER = [
  ['credential', 'takeover'],
  ['vendor', 'supplychain'],
  ['shadowai', 'aileak'],
  ['invoice', 'wire'],
  ['attachment', 'ransomware'],
];

export const EDR_FACTOR = 0.5;
export const WAIT_HOURS_PER_SEC = 0.25; // downtime that accrues while you hesitate

export function buildBreach(missed, owned) {
  const has = id => owned.includes(id);
  const steps = [{ kind: 'beat', ...BEATS.intro }];
  const crises = [];

  for (const [type, crisisId] of ORDER) {
    if (!missed.includes(type)) continue;
    if (type === 'credential' && has('mfa')) {
      steps.push({ kind: 'beat', ...BEATS.mfaSaved, defense: 'mfa' });
      continue;
    }
    crises.push({ kind: 'crisis', crisis: CRISES[crisisId] });
  }

  // Perfect (or fully defended) players still get hit through a third party.
  let twist = false;
  if (crises.length === 0) {
    twist = true;
    steps.push({
      kind: 'beat',
      ...BEATS.vendorTwist,
      title: missed.length === 0 ? BEATS.vendorTwist.title : 'THEN A VENDOR GETS HIT...',
      text: missed.length === 0 ? BEATS.vendorTwist.text
        : 'Your payroll vendor was breached. Attackers used its remote access to walk straight into your network.',
    });
    crises.push({ kind: 'crisis', crisis: CRISES.ransomware, twist: true });
  }

  if (has('edr')) steps.push({ kind: 'beat', ...BEATS.edrCaught, defense: 'edr' });
  steps.push(...crises);
  return { steps, twist };
}

export function choicesFor(crisis, owned, lifelineUsed) {
  const list = crisis.choices.map(c => ({ ...c, locked: !!c.requires && !owned.includes(c.requires) }));
  if (owned.includes('ir') && !lifelineUsed) list.push({ ...LIFELINE });
  return list;
}

export function resolveChoice(choice, { owned, headcount }) {
  const factor = owned.includes('edr') ? EDR_FACTOR : 1;
  return {
    choice: choice.id,
    quality: choice.quality,
    hours: choice.hours * factor,
    loss: (choice.loss || 0) + (choice.lossPerHead || 0) * headcount,
    lifeline: !!choice.lifeline,
    result: choice.result,
  };
}

// The best outcome available for a crisis if the player owned every defense.
export function bestCase(crisis, headcount) {
  const all = ['filter', 'training', 'mfa', 'edr', 'backups', 'ir'];
  const opts = choicesFor(crisis, all, false).filter(c => !c.locked && !c.lifeline);
  const best = opts.reduce((a, b) => (b.quality > a.quality || (b.quality === a.quality && b.hours < a.hours) ? b : a));
  return resolveChoice(best, { owned: all, headcount });
}
