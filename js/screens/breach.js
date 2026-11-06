import { buildBreach, choicesFor, resolveChoice, WAIT_HOURS_PER_SEC, EDR_FACTOR } from '../engine/breach.js';
import { breachTotals, hourlyCost } from '../engine/score.js';
import { money } from '../engine/text.js';
import { esc, img, typewriter, shake } from './ui.js';

export function mount({ el, go, state, sfx, config, game }) {
  const run = state.run;
  const built = buildBreach(run.missed, run.owned);
  run.breach = { steps: built.steps, twist: built.twist, decisions: [] };
  const hourly = hourlyCost(run.profile);
  const waitRate = WAIT_HOURS_PER_SEC * (run.owned.includes('edr') ? EDR_FACTOR : 1);

  el.innerHTML = `
    <header class="hud hud-breach">
      <i class="siren" aria-hidden="true"></i>
      <div class="downtime">DOWNTIME: <b id="cost">$0</b></div>
    </header>
    <div class="breach-art" id="art"></div>
    <div class="scanlines" aria-hidden="true"></div>
    <div class="dialog breach-box" id="box">
      <div class="crisis-tag" id="tag"></div>
      <p class="say" id="say"></p>
      <div class="choices" id="choices" role="menu"></div>
      <div class="decision-timer" id="dtimer" hidden><i></i></div>
    </div>
    <div class="act-flash" id="flash"><span>ACT 2</span><b>THE BREACH</b></div>`;

  const art = el.querySelector('#art');
  const costEl = el.querySelector('#cost');
  const tag = el.querySelector('#tag');
  const say = el.querySelector('#say');
  const choicesEl = el.querySelector('#choices');
  const dtimer = el.querySelector('#dtimer');
  const dfill = dtimer.querySelector('i');

  let stepIdx = -1, shownCost = 0, waitHours = 0, deciding = null, lifelineUsed = false;
  let raf = 0, last = 0, lastTickSound = 0;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function setArt(kind) {
    art.className = 'breach-art art-' + kind;
    art.style.backgroundImage = `url(${img(kind === 'breach' ? 'breach' : 'office')})`;
  }
  setArt('office');

  function targetCost() {
    return breachTotals(run).cost + waitHours * hourly;
  }

  function loop(now) {
    if (!last) last = now;
    const dt = (now - last) / 1000;
    last = now;
    if (deciding) {
      waitHours += waitRate * dt;
      deciding.left -= dt;
      dfill.style.width = Math.max(0, deciding.left / config.crisisSeconds) * 100 + '%';
      if (now - lastTickSound > 1000) { lastTickSound = now; sfx.tick(); }
      if (deciding.left <= 0) {
        const c = deciding.options.find(o => o.id === deciding.crisis.timeoutChoice);
        choose(c, true);
      }
    }
    const t = targetCost();
    shownCost += (t - shownCost) * Math.min(1, dt * 4);
    if (Math.abs(t - shownCost) < 1) shownCost = t;
    costEl.textContent = money(shownCost);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  function nextButton(label, onClick) {
    choicesEl.innerHTML = `<button class="choice next" role="menuitem">${esc(label)} ▸</button>`;
    const b = choicesEl.querySelector('button');
    b.addEventListener('click', () => { sfx.blip(); onClick(); });
    b.focus({ preventScroll: true });
  }

  function showText(title, text, then) {
    tag.textContent = title;
    choicesEl.innerHTML = '';
    let skip;
    const done = () => then();
    skip = typewriter(say, text, 70, done);
    say.onclick = () => skip();
  }

  function nextStep() {
    stepIdx += 1;
    const step = run.breach.steps[stepIdx];
    if (!step) return end();
    if (step.kind === 'beat') {
      tag.className = 'crisis-tag' + (step.defense ? ' saved' : '');
      if (step.defense) sfx.good();
      showText(step.title, step.text, () => nextButton('NEXT', nextStep));
      return;
    }
    startCrisis(step);
  }

  function startCrisis(step) {
    const crisis = step.crisis;
    setArt(crisis.art);
    tag.className = 'crisis-tag danger';
    sfx.alarm();
    shake(game, 500);
    game.classList.add('alarm');
    const options = choicesFor(crisis, run.owned, lifelineUsed);
    showText(crisis.title, crisis.prompt, () => {
      choicesEl.innerHTML = options.map((o, i) => `
        <button class="choice ${o.lifeline ? 'lifeline' : ''}" role="menuitem" data-i="${i}" ${o.locked ? 'disabled aria-disabled="true"' : ''}>
          ${esc(o.label)}${o.locked ? ' <small>LOCKED: NO BACKUPS</small>' : ''}
        </button>`).join('');
      choicesEl.querySelectorAll('.choice').forEach(b => {
        b.addEventListener('click', () => choose(options[+b.dataset.i]));
        b.addEventListener('pointerenter', () => { if (!b.disabled) b.focus({ preventScroll: true }); });
      });
      const first = choicesEl.querySelector('.choice:not([disabled])');
      if (first) first.focus({ preventScroll: true });
      dtimer.hidden = false;
      deciding = { crisis, options, left: config.crisisSeconds };
    });
  }

  function choose(option, timedOut = false) {
    if (!deciding || !option || option.locked) return;
    const crisis = deciding.crisis;
    deciding = null;
    dtimer.hidden = true;
    const res = resolveChoice(option, { owned: run.owned, headcount: run.profile.headcount });
    run.breach.decisions.push({ crisis: crisis.id, ...res, waitHours, timedOut });
    waitHours = 0;
    if (res.lifeline) lifelineUsed = true;
    if (res.quality >= 1) { sfx.good(); } else { sfx.bad(); shake(game, 400); }
    tag.className = 'crisis-tag ' + (res.quality >= 1 ? 'saved' : res.quality > 0 ? '' : 'danger');
    const head = timedOut ? 'YOU FROZE...' : res.quality >= 1 ? 'GOOD CALL' : res.quality > 0 ? 'PARTLY CONTAINED' : 'OUCH';
    const extra = res.loss ? ` Direct loss: ${money(res.loss)}.` : '';
    showText(head, (timedOut ? `No decision, so it defaulted to "${option.label}". ` : '') + res.result + extra, () => {
      game.classList.remove('alarm');
      nextButton('NEXT', nextStep);
    });
  }

  function end() {
    const t = breachTotals(run);
    setArt('office');
    game.classList.remove('alarm');
    tag.className = 'crisis-tag saved';
    const hrs = Math.round(t.hours * 10) / 10;
    showText('SYSTEMS RESTORED', `The office is back online after ${hrs} hours of downtime. Total damage: ${money(t.cost)}.`, () =>
      nextButton('SEE MY SCORE', () => go('results')));
  }

  const onKey = e => {
    if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const btns = [...choicesEl.querySelectorAll('.choice:not([disabled])')];
    if (!btns.length) return;
    e.preventDefault();
    const i = btns.indexOf(document.activeElement);
    const n = e.key === 'ArrowDown' ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
    btns[n].focus();
  };
  window.addEventListener('keydown', onKey);

  // Act transition: glitch flash, then the first beat.
  sfx.alarm();
  shake(game, 600);
  later(() => { el.querySelector('#flash').classList.add('gone'); nextStep(); }, 1500);

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    game.classList.remove('alarm');
  };
}
