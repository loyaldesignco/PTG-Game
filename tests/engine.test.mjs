import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMAILS } from '../js/data/emails.js';
import { DEFENSES, BUDGET } from '../js/data/defenses.js';
import { parseRich, fill, lookalike, slugDomain, clueIdsIn, personalize, profileVars } from '../js/engine/text.js';
import { buildDeck, applyFilter, judge, missedTypes, mulberry32 } from '../js/engine/inbox.js';
import { buildBreach, choicesFor, resolveChoice } from '../js/engine/breach.js';
import { computeScore, breachTotals, hourlyCost, buildReport, leadPayload, unlockedAchievements, salesOpener } from '../js/engine/score.js';

const profile = { company: 'Harbor Dental', headcount: 35, industry: 'healthcare' };

test('parseRich splits clue markers', () => {
  assert.deepEqual(parseRich('a [[x|bad.co]] b'), [
    { t: 'text', v: 'a ' }, { t: 'clue', id: 'x', v: 'bad.co' }, { t: 'text', v: ' b' }]);
  assert.equal(fill('{company} hi {nope}', { company: 'Z' }), 'Z hi {nope}');
});

test('lookalike domain differs from the real one', () => {
  const d = slugDomain('Harbor Dental');
  assert.equal(d, 'harbordental.com');
  assert.notEqual(lookalike(d), d);
});

test('every clue marker has an explanation and every phish has clues', () => {
  const vars = profileVars(profile);
  for (const e of EMAILS) {
    const p = personalize(e, vars);
    const ids = clueIdsIn(p);
    for (const id of ids) assert.ok(p.clues[id], `${e.id} missing explanation for ${id}`);
    if (e.phish) assert.ok(ids.length >= 1 && ids.length <= 5, `${e.id} clue count`);
    else assert.equal(ids.length, 0, `${e.id} legit email should have no clues`);
    assert.ok(!/\{\w+\}/.test(JSON.stringify(p)), `${e.id} has unfilled placeholder`);
  }
});

test('deck: 15 emails, tiered, includes an attachment phish', () => {
  for (let seed = 1; seed < 200; seed++) {
    const deck = buildDeck(profile, mulberry32(seed));
    assert.equal(deck.length, 15);
    assert.deepEqual(deck.map(e => e.tier), [1,1,1,1,1,2,2,2,2,2,3,3,3,3,3]);
    assert.equal(deck.filter(e => e.phish).length, 9);
    assert.ok(deck.some(e => e.type === 'attachment'));
    assert.equal(new Set(deck.map(e => e.id)).size, 15);
  }
});

test('email filter removes 3 phish', () => {
  const deck = buildDeck(profile, mulberry32(7));
  const { shown, filtered } = applyFilter(deck, true);
  assert.equal(shown.length, 12);
  assert.equal(filtered.length, 3);
  assert.ok(filtered.every(e => e.phish));
  assert.equal(applyFilter(deck, false).shown.length, 15);
});

test('judge and missed types', () => {
  const phish = { phish: true, type: 'invoice' };
  assert.equal(judge(phish, 'report'), true);
  assert.equal(judge(phish, 'trust'), false);
  assert.equal(judge(phish, 'timeout'), false);
  assert.equal(judge({ phish: false }, 'trust'), true);
  assert.deepEqual(missedTypes([{ phish: true, correct: false, type: 'attachment' }, { phish: true, correct: false, type: 'credential' }]),
    ['credential', 'attachment']);
});

test('breach: perfect players still get the vendor twist', () => {
  const b = buildBreach([], []);
  assert.ok(b.twist);
  assert.ok(b.steps.some(s => s.kind === 'crisis' && s.crisis.id === 'ransomware'));
});

test('breach: MFA blocks takeover, misses stack, EDR beat appears', () => {
  const b = buildBreach(['credential', 'invoice', 'attachment'], ['mfa', 'edr']);
  const crises = b.steps.filter(s => s.kind === 'crisis').map(s => s.crisis.id);
  assert.deepEqual(crises, ['wire', 'ransomware']);
  assert.ok(b.steps.some(s => s.defense === 'mfa'));
  assert.ok(b.steps.some(s => s.defense === 'edr'));
  const noMfa = buildBreach(['credential'], []).steps.filter(s => s.kind === 'crisis').map(s => s.crisis.id);
  assert.deepEqual(noMfa, ['takeover']);
});

test('backups unlock restore, IR adds a lifeline, EDR halves hours', () => {
  const rw = buildBreach(['attachment'], []).steps.find(s => s.kind === 'crisis').crisis;
  assert.ok(choicesFor(rw, [], false).find(c => c.id === 'restore').locked);
  assert.ok(!choicesFor(rw, ['backups'], false).find(c => c.id === 'restore').locked);
  assert.ok(choicesFor(rw, ['ir'], false).some(c => c.lifeline));
  assert.ok(!choicesFor(rw, ['ir'], true).some(c => c.lifeline));
  const unplug = rw.choices.find(c => c.id === 'unplug');
  assert.equal(resolveChoice(unplug, { owned: ['edr'], headcount: 10 }).hours, unplug.hours / 2);
  const pay = rw.choices.find(c => c.id === 'pay');
  assert.equal(resolveChoice(pay, { owned: [], headcount: 35 }).loss, 35000);
});

function simulate({ owned = [], catchAll = false, seed = 3 }) {
  const run = { profile, owned, budgetLeft: BUDGET - DEFENSES.filter(d => owned.includes(d.id)).reduce((s, d) => s + d.cost, 0) };
  const { shown, filtered } = applyFilter(buildDeck(profile, mulberry32(seed)), owned.includes('filter'));
  run.filtered = filtered;
  run.results = shown.map(e => {
    const decision = catchAll ? (e.phish ? 'report' : 'trust') : 'trust';
    return { id: e.id, email: e, phish: e.phish, type: e.type, decision, correct: judge(e, decision),
      cluesFound: catchAll ? e.clueIds : [], cluesTotal: e.clueIds.length, ms: 3000 };
  });
  run.missed = missedTypes(run.results);
  const b = buildBreach(run.missed, owned);
  run.breach = { steps: b.steps, decisions: [] };
  let lifeline = false;
  for (const s of b.steps.filter(s => s.kind === 'crisis')) {
    const opts = choicesFor(s.crisis, owned, lifeline).filter(o => !o.locked);
    const pick = opts.sort((a, c) => c.quality - a.quality)[0];
    const r = resolveChoice(pick, { owned, headcount: profile.headcount });
    if (r.lifeline) lifeline = true;
    run.breach.decisions.push({ crisis: s.crisis.id, ...r, waitHours: 0.5 });
  }
  return run;
}

test('score is 0-100 and rewards good play', () => {
  const good = simulate({ owned: ['backups', 'edr', 'mfa'], catchAll: true });
  const bad = simulate({ owned: [], catchAll: false });
  const g = computeScore(good), b = computeScore(bad);
  assert.ok(g.total >= 0 && g.total <= 100 && b.total >= 0 && b.total <= 100);
  assert.ok(g.total > b.total, `${g.total} > ${b.total}`);
  assert.ok(breachTotals(bad).cost > breachTotals(good).cost);
  assert.equal(hourlyCost(profile), Math.round(35 * 55 * 1.3));
});

test('report, lead payload, achievements and sales opener', () => {
  const run = simulate({ owned: ['training'], catchAll: false });
  const r = buildReport(run);
  assert.ok(r.gotThrough.length > 0);
  assert.equal(r.skipped.length, 5);
  assert.ok(r.fullStack <= r.totals.cost);
  const lead = leadPayload(run, { email: 'a@harbordental.com' });
  assert.equal(lead.company, 'Harbor Dental');
  assert.ok(lead.downtimeCost > 0);
  assert.match(lead.salesOpener, /\$\d+k/);
  assert.match(salesOpener(run), /skipped backups and the ransomware/);
  const perfect = simulate({ owned: ['backups', 'ir'], catchAll: true });
  const ach = unlockedAchievements(perfect);
  assert.ok(ach.includes('zeroclicks'));
  assert.ok(ach.includes('cluehunter'));
});

test('missing every phish scores low even with good breach decisions', () => {
  const run = simulate({ owned: ['ir'], catchAll: false });
  const s = computeScore(run);
  assert.ok(s.total < 45, `score ${s.total}`);
  assert.ok(!unlockedAchievements(run, s).includes('speedrun'));
  const perfect = computeScore(simulate({ owned: ['backups', 'edr', 'mfa'], catchAll: true }));
  assert.ok(perfect.total >= 85, `perfect ${perfect.total}`);
});
