// Resilience Score, downtime cost, achievements and the gated report. Pure functions.
import { BUDGET, DEFENSES, defenseById } from '../data/defenses.js';
import { CRISES } from '../data/crises.js';
import { WAIT_HOURS_PER_SEC, EDR_FACTOR, bestCase } from './breach.js';
import { money, moneyShort } from './text.js';

export const INDUSTRIES = [
  { id: 'professional', label: 'Professional services', mult: 1.0 },
  { id: 'healthcare',   label: 'Healthcare',            mult: 1.3 },
  { id: 'manufacturing', label: 'Manufacturing',        mult: 1.5 },
  { id: 'finance',      label: 'Finance / family office', mult: 1.6 },
  { id: 'hospitality',  label: 'Hospitality',           mult: 1.1 },
  { id: 'other',        label: 'Other',                 mult: 1.0 },
];

export const COST_PER_EMPLOYEE_HOUR = 55;

export function hourlyCost(profile) {
  const ind = INDUSTRIES.find(i => i.id === profile.industry) || INDUSTRIES[0];
  return Math.round(profile.headcount * COST_PER_EMPLOYEE_HOUR * ind.mult);
}

export function breachTotals(run) {
  const decisions = (run.breach && run.breach.decisions) || [];
  const hours = decisions.reduce((s, d) => s + d.hours + (d.waitHours || 0), 0);
  const loss = decisions.reduce((s, d) => s + d.loss, 0);
  return { hours, loss, cost: hours * hourlyCost(run.profile) + loss };
}

export const WEIGHTS = { phish: 30, legit: 10, clues: 15, speed: 10, decisions: 25, budget: 10 };

export function computeScore(run) {
  const res = run.results || [];
  const filtered = (run.filtered || []).length;
  const phishRes = res.filter(r => r.phish);
  const legitRes = res.filter(r => !r.phish);
  // Filtered phish count as caught: buying the filter is a legitimate way to stop them.
  const phishTotal = phishRes.length + filtered;
  const phishCaught = phishRes.filter(r => r.correct).length + filtered;
  const phish = phishTotal ? phishCaught / phishTotal : 0;
  const legit = legitRes.length ? legitRes.filter(r => r.correct).length / legitRes.length : 0;
  const accuracy = res.length ? res.filter(r => r.correct).length / res.length : 0;

  const cluesTotal = res.reduce((s, r) => s + (r.phish ? r.cluesTotal : 0), 0);
  const cluesFound = res.reduce((s, r) => s + r.cluesFound.length, 0);
  const clues = cluesTotal ? Math.min(1, cluesFound / cluesTotal) : 0;

  // Speed only pays when you're also right: racing through on "trust" earns nothing.
  const timed = res.filter(r => r.decision !== 'timeout');
  const avgSec = timed.length ? timed.reduce((s, r) => s + r.ms, 0) / timed.length / 1000 : 10;
  const speed = res.length ? Math.max(0, Math.min(1, (10 - avgSec) / 7)) * accuracy : 0;

  const decisions = (run.breach && run.breach.decisions) || [];
  const decisionQ = decisions.length ? decisions.reduce((s, d) => s + d.quality, 0) / decisions.length : 1;

  // Money left in the budget only counts in proportion to how well the office held up.
  const cost = breachTotals(run).cost;
  const ideal = run.breach && run.breach.steps ? fullStackCost(run) : 0;
  const heldUp = cost > 0 ? Math.min(1, ideal / cost) : 1;
  const budget = (Math.max(0, run.budgetLeft) / BUDGET) * heldUp;

  const parts = {
    phish: phish * WEIGHTS.phish,
    legit: legit * WEIGHTS.legit,
    clues: clues * WEIGHTS.clues,
    speed: speed * WEIGHTS.speed,
    decisions: decisionQ * WEIGHTS.decisions,
    budget: budget * WEIGHTS.budget,
  };
  const total = Math.round(Object.values(parts).reduce((a, b) => a + b, 0));
  return {
    total: Math.max(0, Math.min(100, total)),
    parts,
    stats: {
      phishCaught, phishTotal, accuracy,
      falseAlarms: res.filter(r => !r.phish && !r.correct).length,
      cluesFound, cluesTotal, avgSec,
    },
  };
}

export const ACHIEVEMENTS = [
  { id: 'zeroclicks', name: 'ZERO CLICKS', desc: 'Let no phish through',
    test: (run) => (run.results || []).every(r => !r.phish || r.correct) },
  { id: 'backuphero', name: 'BACKUP HERO', desc: 'Restore from backup',
    test: (run) => run.breach.decisions.some(d => d.choice === 'restore') },
  { id: 'calledptg', name: 'CALLED PTG FIRST', desc: 'Use the PTG hotline',
    test: (run) => run.breach.decisions.some(d => d.lifeline) },
  { id: 'cluehunter', name: 'CLUE HUNTER', desc: 'Find 80% of clues',
    test: (run, s) => s.stats.cluesTotal > 0 && s.stats.cluesFound / s.stats.cluesTotal >= 0.8 },
  { id: 'speedrun', name: 'SPEED RUN', desc: 'Under 4s per email, 70%+ right',
    test: (run, s) => (run.results || []).length > 0 && s.stats.avgSec < 4 && s.stats.accuracy >= 0.7 },
  { id: 'fullstack', name: 'FULL STACK', desc: 'Defenses for every attack you faced',
    test: (run) => neededDefenses(run).every(id => run.owned.includes(id)) },
];

export function unlockedAchievements(run, score = computeScore(run)) {
  return ACHIEVEMENTS.filter(a => a.test(run, score)).map(a => a.id);
}

// Defenses that would have changed the outcome of this run.
export function neededDefenses(run) {
  const need = new Set();
  const missed = run.missed || [];
  if (missed.length) need.add('filter').add('training');
  if (missed.includes('credential')) need.add('mfa');
  const crises = run.breach.steps.filter(s => s.kind === 'crisis');
  if (crises.length) need.add('edr').add('ir');
  if (crises.some(c => c.crisis.id === 'ransomware')) need.add('backups');
  return DEFENSES.map(d => d.id).filter(id => need.has(id));
}

// What each skipped defense would have done in *this* run.
export function wouldHave(run, defenseId, hourly) {
  const missed = run.missed || [];
  const decisions = run.breach.decisions;
  const crisisIds = run.breach.steps.filter(s => s.kind === 'crisis').map(s => s.crisis.id);
  const hours = decisions.reduce((s, d) => s + d.hours + (d.waitHours || 0), 0);
  switch (defenseId) {
    case 'filter': return 'Blocked 3 phishing emails before anyone could click them.';
    case 'training': {
      const missedClues = (run.results || []).reduce((s, r) => s + (r.phish ? r.cluesTotal - r.cluesFound.length : 0), 0);
      return missedClues ? `Highlighted the ${missedClues} clues you didn't spot.` : 'Made every clue easier to see for your whole team.';
    }
    case 'mfa': return missed.includes('credential')
      ? 'Stopped the account takeover cold, even with the stolen password.'
      : 'Stops stolen passwords from becoming stolen accounts.';
    case 'edr': return crisisIds.length
      ? `Caught the attack early and cut ~${Math.round(hours * (1 - EDR_FACTOR))} hours of downtime (${moneyShort(hours * (1 - EDR_FACTOR) * hourly)}).`
      : 'Watches your network 24/7 so attacks are caught early.';
    case 'backups': return crisisIds.includes('ransomware')
      ? 'Unlocked "Restore from backup": back in hours instead of rebuilding for days.'
      : 'Keeps a clean copy of your data that ransomware can\'t touch.';
    case 'ir': return crisisIds.length
      ? 'Gave you a "Call PTG" lifeline to resolve a crisis with experts on the line.'
      : 'Puts an incident response team one phone call away.';
    default: return '';
  }
}

export function fullStackCost(run) {
  const hourly = hourlyCost(run.profile);
  let cost = 0;
  for (const s of run.breach.steps) {
    if (s.kind !== 'crisis') continue;
    if (s.crisis.id === 'takeover') continue; // MFA prevents it outright
    const b = bestCase(s.crisis, run.profile.headcount);
    cost += b.hours * hourly + b.loss;
  }
  return cost;
}

export function salesOpener(run) {
  const hourly = hourlyCost(run.profile);
  const owned = run.owned;
  const worst = run.breach.decisions
    .map(d => ({ ...d, cost: (d.hours + (d.waitHours || 0)) * hourly + d.loss }))
    .sort((a, b) => b.cost - a.cost)[0];
  if (!worst) return 'You made it through clean. Let\'s make sure your real team would too.';
  const crisis = CRISES[worst.crisis];
  const fix = { ransomware: 'backups', takeover: 'mfa', wire: 'training', supplychain: 'edr' }[worst.crisis];
  const name = crisis.title.toLowerCase();
  if (fix && !owned.includes(fix)) {
    return `You skipped ${defenseById[fix].name.toLowerCase()} and the ${name} cost you ${moneyShort(worst.cost)}. Let's talk about that.`;
  }
  return `Even with ${owned.map(id => defenseById[id].name.toLowerCase()).join(', ') || 'no defenses'}, the ${name} cost you ${moneyShort(worst.cost)}. Let's talk about closing the gap.`;
}

export function buildReport(run) {
  const score = computeScore(run);
  const totals = breachTotals(run);
  const hourly = hourlyCost(run.profile);
  const gotThrough = (run.results || []).filter(r => r.phish && !r.correct).map(r => r.email);
  const falseAlarms = (run.results || []).filter(r => !r.phish && !r.correct).map(r => r.email);
  const skipped = DEFENSES.filter(d => !run.owned.includes(d.id))
    .map(d => ({ ...d, would: wouldHave(run, d.id, hourly) }));
  return {
    score, totals, hourly, gotThrough, falseAlarms, skipped,
    fullStack: fullStackCost(run),
    opener: salesOpener(run),
    achievements: unlockedAchievements(run, score),
  };
}

export function leadPayload(run, contact) {
  const r = buildReport(run);
  return {
    source: 'click-game',
    submittedAt: new Date().toISOString(),
    contact,
    company: run.profile.company,
    headcount: run.profile.headcount,
    industry: run.profile.industry,
    score: r.score.total,
    scoreParts: r.score.parts,
    defensesBought: run.owned,
    defensesSkipped: r.skipped.map(d => d.id),
    budgetLeft: run.budgetLeft,
    phishMissed: r.gotThrough.map(e => ({ id: e.id, type: e.type, subject: e.subject })),
    falseAlarms: r.falseAlarms.length,
    breachDecisions: run.breach.decisions.map(d => ({ crisis: d.crisis, choice: d.choice })),
    downtimeHours: Math.round(r.totals.hours * 10) / 10,
    downtimeCost: Math.round(r.totals.cost),
    fullStackCost: Math.round(r.fullStack),
    achievements: r.achievements,
    salesOpener: r.opener,
  };
}

export { money, WAIT_HOURS_PER_SEC };
