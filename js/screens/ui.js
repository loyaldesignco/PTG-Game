import { parseRich } from '../engine/text.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Render a field with [[clue|text]] markers as tappable spans.
export function rich(str) {
  return parseRich(str).map(s => s.t === 'clue'
    ? `<span class="clue" data-clue="${esc(s.id)}" role="button" tabindex="0">${esc(s.v)}</span>`
    : esc(s.v)).join('').replace(/\n/g, '<br>');
}

export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => [...root.querySelectorAll(sel)];

export function img(name) { return `assets/img/${name}.png`; }

// Typewriter text into an element; returns a function that finishes instantly.
export function typewriter(el, text, cps = 60, onDone) {
  let i = 0, done = false;
  el.textContent = '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const id = setInterval(() => {
    i += 2;
    el.textContent = text.slice(0, i);
    if (i >= text.length) finish();
  }, 2000 / cps);
  function finish() {
    if (done) return;
    done = true;
    clearInterval(id);
    el.textContent = text;
    onDone && onDone();
  }
  if (reduce) finish();
  return finish;
}

export function shake(game, ms = 400) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  game.classList.remove('shake');
  void game.offsetWidth;
  game.classList.add('shake');
  setTimeout(() => game.classList.remove('shake'), ms);
}
