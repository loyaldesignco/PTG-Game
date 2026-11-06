import { img } from './ui.js';

export function mount({ el, go, sfx }) {
  el.innerHTML = `
    <div class="title-art" style="background-image:url(${img('title')})" role="img"
      aria-label="CLICK. A pixel office worker at a glowing monitor at dusk, a suspicious email on screen."></div>
    <button class="press-start blink" id="start">PRESS START</button>
    <div class="title-panel">
      <p class="tagline">Defend the office from phishing.<br>Survive the breach you let in.</p>
      <ol class="title-steps">
        <li><b>1</b> Spend your IT budget</li>
        <li><b>2</b> Triage 15 emails</li>
        <li><b>3</b> Survive the breach</li>
      </ol>
      <p class="title-meta">FREE · NO SIGN-UP · ABOUT 3 MIN</p>
    </div>
    <footer class="title-foot">
      <span class="ptg-mark" data-slot="ptg-logo" aria-label="PTG">PTG</span>
      <span>A resilience game</span>
    </footer>`;
  const start = () => { sfx.select(); go('setup'); };
  el.querySelector('#start').addEventListener('click', start);
  const onKey = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
