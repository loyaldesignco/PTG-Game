import { buildReport, leadPayload, ACHIEVEMENTS } from '../engine/score.js';
import { money, stripMarkers } from '../engine/text.js';
import { validateEmail, submitLead } from '../lead.js';
import { esc } from './ui.js';

export function mount(ctx) {
  if (ctx.state.reportUnlocked) return renderReport(ctx);
  return renderGate(ctx);
}

function renderGate(ctx) {
  const { el, state, sfx, go, config } = ctx;
  const run = state.run;
  el.innerHTML = `
    <div class="gate">
      <div class="teaser" aria-hidden="true">
        <p>WHAT GOT THROUGH ████████</p><p>DEFENSES YOU SKIPPED ██████</p><p>DOWNTIME COST $██,███</p><p>FULL STACK VS YOU ████</p>
      </div>
      <form class="dialog" id="f" novalidate>
        <h2>UNLOCK YOUR FULL REPORT</h2>
        <p>See exactly what got through, what each missing defense would have stopped, and your estimated downtime cost.</p>
        <label>Name <input name="name" autocomplete="name" maxlength="60"></label>
        <label>${config.requireWorkEmail ? 'Work email' : 'Email'} <input name="email" type="email" autocomplete="email" required maxlength="120"></label>
        <label>Company <input name="company" autocomplete="organization" maxlength="40" value="${esc(run.profile.company)}"></label>
        <label class="check"><input type="checkbox" name="consent" checked> PTG can contact me about my results.</label>
        <p class="err" id="err" role="alert"></p>
        <button class="btn btn-yellow" type="submit">SHOW MY REPORT</button>
        <button class="btn-link" type="button" id="back">Back to score</button>
      </form>
    </div>`;
  const f = el.querySelector('#f');
  const err = el.querySelector('#err');
  el.querySelector('#back').addEventListener('click', () => go('results'));
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const problem = validateEmail(f.email.value);
    if (problem) { err.textContent = problem; sfx.deny(); f.email.focus(); return; }
    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'SAVING...';
    if (f.company.value.trim()) run.profile.company = f.company.value.trim();
    await submitLead(leadPayload(run, {
      name: f.name.value.trim(),
      email: f.email.value.trim().toLowerCase(),
      consent: f.consent.checked,
    }));
    sfx.coin();
    state.reportUnlocked = true;
    go('report');
  });
}

const TYPE_LABEL = {
  credential: 'Fake login page', invoice: 'Fake invoice / CEO request',
  attachment: 'Malicious attachment', vendor: 'Fake vendor update',
  shadowai: 'Shadow AI',
};

function renderReport({ el, state, go, config, sfx }) {
  const run = state.run;
  const r = buildReport(run);
  const saved = Math.max(0, r.totals.cost - r.fullStack);
  el.innerHTML = `
    <div class="report">
      <h1>YOUR RESILIENCE REPORT</h1>
      <p class="muted">${esc(run.profile.company)} · ${run.profile.headcount} staff · score <b class="y">${r.score.total}/100</b></p>

      <section>
        <h2>DOWNTIME COST</h2>
        <div class="vs">
          <div><span>YOUR RUN</span><b class="bad">${money(r.totals.cost)}</b><small>${Math.round(r.totals.hours * 10) / 10} hrs down</small></div>
          <div><span>FULL PTG STACK</span><b class="y">${money(r.fullStack)}</b><small>same attacks</small></div>
        </div>
        ${saved > 0 ? `<p>The full stack would have saved an estimated <b class="y">${money(saved)}</b>.</p>` : ''}
        <p class="muted small">Estimate: ${money(r.hourly)}/hour of downtime for your headcount and industry, plus direct losses.</p>
      </section>

      <section>
        <h2>WHAT GOT THROUGH</h2>
        ${r.gotThrough.length ? `<ul class="list">${r.gotThrough.map(e => `
          <li><b>${esc(TYPE_LABEL[e.type] || e.type)}</b>: "${esc(stripMarkers(e.subject))}"
          <small>${esc(Object.values(e.clues)[0] || '')}</small></li>`).join('')}</ul>`
          : '<p>Nothing! You caught every phish you saw. The breach came through a vendor instead.</p>'}
        ${r.falseAlarms.length ? `<p class="muted small">${r.falseAlarms.length} real email(s) were reported as phish. Caution is good; slowing the business down has a cost too.</p>` : ''}
      </section>

      <section>
        <h2>BREACH DECISIONS</h2>
        <ul class="list">${run.breach.decisions.map(d => `
          <li><b>${esc(d.crisis.toUpperCase())}</b>: ${d.quality >= 1 ? 'good call' : d.quality > 0 ? 'partly contained' : 'costly'}
          <small>${esc(d.result)}</small></li>`).join('')}</ul>
      </section>

      <section>
        <h2>DEFENSES YOU SKIPPED</h2>
        ${r.skipped.length ? `<ul class="list">${r.skipped.map(d => `
          <li><b>${esc(d.name)}</b> <span class="muted">(${esc(d.service)})</span><small>${esc(d.would)}</small></li>`).join('')}</ul>`
          : '<p>None. You bought every defense.</p>'}
      </section>

      <section>
        <h2>TROPHIES</h2>
        <p>${ACHIEVEMENTS.filter(a => r.achievements.includes(a.id)).map(a => `<span class="chip">${esc(a.name)}</span>`).join(' ') || '<span class="muted">None yet. Play again!</span>'}</p>
      </section>

      <div class="cta">
        <a class="btn btn-yellow" href="${esc(config.assessmentUrl)}" target="_blank" rel="noopener">BOOK A FREE IT RESILIENCE ASSESSMENT</a>
        <a class="btn btn-outline" href="${esc(config.assessmentUrl)}?interest=team-challenge" target="_blank" rel="noopener">RUN THE TEAM CHALLENGE</a>
        <button class="btn-link" id="again">PLAY AGAIN WITH A NEW BUDGET</button>
      </div>
    </div>`;
  el.querySelector('#again').addEventListener('click', () => { sfx.select(); state.newRun(); go('shop'); });
}
