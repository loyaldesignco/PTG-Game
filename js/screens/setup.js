import { INDUSTRIES } from '../engine/score.js';
import { esc, img } from './ui.js';

const HEADCOUNTS = [
  { v: 15, label: '10-24' },
  { v: 35, label: '25-49' },
  { v: 75, label: '50-99' },
  { v: 175, label: '100-250' },
];

export function mount({ el, go, state, sfx }) {
  const p = state.profile;
  el.innerHTML = `
    <div class="bg-office" style="background-image:url(${img('office')})"></div>
    <form class="dialog setup" id="f" novalidate>
      <h2>CLOCK IN</h2>
      <p class="muted">Optional. Personalizes your downtime cost and the company leaderboard.</p>
      <label>Company name
        <input name="company" maxlength="40" autocomplete="organization" value="${esc(p.company)}">
      </label>
      <label>Headcount
        <select name="headcount">
          ${HEADCOUNTS.map(h => `<option value="${h.v}" ${Math.abs(h.v - p.headcount) < 1 ? 'selected' : ''}>${h.label} staff</option>`).join('')}
        </select>
      </label>
      <label>Industry
        <select name="industry">
          ${INDUSTRIES.map(i => `<option value="${i.id}" ${i.id === p.industry ? 'selected' : ''}>${esc(i.label)}</option>`).join('')}
        </select>
      </label>
      <button class="btn btn-yellow" type="submit">GO TO THE SHOP</button>
      <button class="btn-link" type="button" id="skip">Skip</button>
    </form>`;
  const f = el.querySelector('#f');
  if (!HEADCOUNTS.some(h => h.v === p.headcount)) f.headcount.value = '35';

  const next = (save) => {
    if (save) {
      p.company = f.company.value.trim().slice(0, 40) || p.company;
      p.headcount = Number(f.headcount.value);
      p.industry = f.industry.value;
      state.saveProfile();
    }
    sfx.select();
    state.newRun();
    go('shop');
  };
  f.addEventListener('submit', e => { e.preventDefault(); next(true); });
  el.querySelector('#skip').addEventListener('click', () => next(false));
}
