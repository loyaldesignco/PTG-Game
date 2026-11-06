import { computeScore, breachTotals, unlockedAchievements, ACHIEVEMENTS } from '../engine/score.js';
import { money } from '../engine/text.js';
import { esc, img } from './ui.js';

export function mount({ el, go, state, sfx, config }) {
  const run = state.run;
  const score = computeScore(run);
  const totals = breachTotals(run);
  const unlocked = unlockedAchievements(run, score);
  run.score = score.total;
  run.achievements = unlocked;
  const s = score.stats;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const meter = p => `<span class="meter" style="--p:${p}%"></span>`;

  el.innerHTML = `
    <h1 class="res-title">RESILIENCE SCORE</h1>
    <div class="badge"><b id="num">0</b><span>/100</span></div>
    <ul class="stats">
      <li><img src="${img('icon-phish')}" alt=""><span>PHISH CAUGHT</span><b>${s.phishCaught}/${s.phishTotal}${meter(pct(s.phishCaught, s.phishTotal))}</b></li>
      <li><img src="${img('icon-clues')}" alt=""><span>CLUES FOUND</span><b>${s.cluesFound}/${s.cluesTotal}${meter(pct(s.cluesFound, s.cluesTotal))}</b></li>
      <li><img src="${img('icon-cost')}" alt=""><span>DOWNTIME COST</span><b class="cost">${money(totals.cost)}</b></li>
    </ul>
    <ul class="trophies">
      ${ACHIEVEMENTS.map(a => {
        const on = unlocked.includes(a.id);
        return `<li class="${on ? 'on' : ''}" title="${esc(a.desc)}">
          <img src="${img(on ? 'trophy-gold' : 'trophy-locked')}" alt="">
          <span>${esc(a.name)}</span></li>`;
      }).join('')}
    </ul>
    <div class="res-actions">
      <div class="res-buttons">
        <button class="btn btn-yellow" id="report">SEE FULL REPORT</button>
        <button class="btn btn-outline" id="team">CHALLENGE MY TEAM</button>
      </div>
      <figure class="tired">
        <figcaption>${score.total >= 80 ? 'Nailed it!' : 'We... survived?'}</figcaption>
        <img src="${img('worker-tired')}" alt="A tired office worker giving a thumbs-up">
      </figure>
    </div>
    <div class="res-foot">
      <button class="btn-link" id="again">PLAY AGAIN WITH A NEW BUDGET</button>
      <a class="btn-link" href="${esc(config.assessmentUrl)}" target="_blank" rel="noopener">Book a free IT resilience assessment</a>
    </div>`;

  // Count-up animation.
  const num = el.querySelector('#num');
  const t0 = performance.now();
  let raf = 0;
  const step = now => {
    const p = Math.min(1, (now - t0) / 1200);
    num.textContent = Math.round(score.total * (1 - Math.pow(1 - p, 3)));
    if (p < 1) raf = requestAnimationFrame(step);
    else sfx.fanfare();
  };
  raf = requestAnimationFrame(step);

  el.querySelector('#report').addEventListener('click', () => { sfx.select(); go('report'); });
  el.querySelector('#again').addEventListener('click', () => {
    sfx.select();
    state.newRun();
    go('shop');
  });
  el.querySelector('#team').addEventListener('click', async () => {
    sfx.select();
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('challenge', run.profile.company);
    const text = `${run.profile.company} scored ${score.total}/100 on CLICK, PTG's phishing and ransomware game. Can you beat it?`;
    const btn = el.querySelector('#team');
    try {
      if (!navigator.share) throw new Error('no share');
      await navigator.share({ title: 'CLICK', text, url: url.toString() });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      btn.textContent = 'LINK COPIED!';
    } catch {
      btn.textContent = 'COPY THE PAGE LINK';
    }
  });
  return () => cancelAnimationFrame(raf);
}
