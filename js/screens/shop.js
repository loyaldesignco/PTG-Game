import { BUDGET, DEFENSES } from '../data/defenses.js';
import { esc, img, shake } from './ui.js';

export function mount({ el, go, state, sfx, game }) {
  const run = state.run;
  el.innerHTML = `
    <div class="shop-head" style="background-image:url(${img('shop-keeper')})" role="img"
      aria-label="A friendly IT shopkeeper in a yellow polo behind a counter, server racks behind him.">
      <div class="budget" aria-live="polite">IT BUDGET: <b id="budget">${run.budgetLeft}</b></div>
      <div class="shop-say" id="say">Budget's tight. Pick the defenses you'd bet the office on.</div>
    </div>
    <div class="tiles" role="group" aria-label="Defenses">
      ${DEFENSES.map(d => `
        <button class="tile" data-id="${d.id}" aria-pressed="false" aria-label="${esc(d.name)}, ${d.cost} credits. ${esc(d.effect)}">
          <img src="${img('tile-' + d.id)}" alt="">
          <span class="price"><i class="coin"></i>${d.cost}</span>
        </button>`).join('')}
    </div>
    <button class="btn btn-yellow start-shift" id="go">START SHIFT</button>`;

  const budgetEl = el.querySelector('#budget');
  const say = el.querySelector('#say');

  function refresh() {
    budgetEl.textContent = run.budgetLeft;
    el.querySelectorAll('.tile').forEach(t => {
      const owned = run.owned.includes(t.dataset.id);
      t.classList.toggle('owned', owned);
      t.setAttribute('aria-pressed', String(owned));
      const d = DEFENSES.find(x => x.id === t.dataset.id);
      t.classList.toggle('cant', !owned && d.cost > run.budgetLeft);
    });
  }

  el.querySelector('.tiles').addEventListener('click', e => {
    const t = e.target.closest('.tile');
    if (!t) return;
    const d = DEFENSES.find(x => x.id === t.dataset.id);
    if (run.owned.includes(d.id)) {
      run.owned = run.owned.filter(id => id !== d.id);
      run.budgetLeft += d.cost;
      sfx.blip();
      say.innerHTML = `Returned <b>${esc(d.name)}</b>. +${d.cost} credits.`;
    } else if (d.cost > run.budgetLeft) {
      sfx.deny();
      shake(game, 250);
      say.innerHTML = `Can't afford <b>${esc(d.name)}</b>. Tap something you own to return it.`;
    } else {
      run.owned.push(d.id);
      run.budgetLeft -= d.cost;
      sfx.coin();
      say.innerHTML = `<b>${esc(d.name)}</b>: ${esc(d.effect)}<small>PTG service: ${esc(d.service)}</small>`;
    }
    refresh();
  });

  el.querySelector('#go').addEventListener('click', () => {
    sfx.select();
    // Keep purchase order stable for reports.
    run.owned = DEFENSES.map(d => d.id).filter(id => run.owned.includes(id));
    go('inbox');
  });
  refresh();
  if (run.budgetLeft !== BUDGET) say.textContent = 'Welcome back. Adjust your stack.';
}
