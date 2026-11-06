import { CONFIG } from './config.js';
import { BUDGET } from './data/defenses.js';
import { DEFAULT_PROFILE } from './engine/text.js';
import { sfx, isMuted, setMuted, unlockAudio } from './audio.js';
import * as title from './screens/title.js';
import * as setup from './screens/setup.js';
import * as shop from './screens/shop.js';
import * as inbox from './screens/inbox.js';
import * as breach from './screens/breach.js';
import * as results from './screens/results.js';
import * as report from './screens/report.js';

const SCREENS = { title, setup, shop, inbox, breach, results, report };
const W = 360, H = 640;

const game = document.getElementById('game');
const screenEl = document.getElementById('screen');
const muteBtn = document.getElementById('mute');

// Logical 360x640 canvas, scaled to fit any viewport (phone, desktop iframe, iPad kiosk).
function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  game.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fit);
fit();

let profile = { ...DEFAULT_PROFILE };
try { Object.assign(profile, JSON.parse(localStorage.getItem('click_profile') || '{}')); } catch {}

export const state = {
  profile,
  run: null,
  reportUnlocked: false,
  saveProfile() {
    try { localStorage.setItem('click_profile', JSON.stringify(state.profile)); } catch {}
  },
  newRun() {
    state.run = {
      profile: { ...state.profile },
      owned: [],
      budgetLeft: BUDGET,
      shown: [], filtered: [], results: [], missed: [],
      breach: { steps: [], decisions: [] },
      seed: CONFIG.seed ?? Math.floor(Math.random() * 1e9),
      startedAt: Date.now(),
    };
    state.reportUnlocked = false;
    return state.run;
  },
};

let cleanup = null;
function go(name, opts = {}) {
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } }
  cleanup = null;
  game.classList.remove('shake', 'alarm');
  screenEl.innerHTML = '';
  screenEl.className = 'screen screen-' + name;
  const ctx = { el: screenEl, game, state, go, sfx, config: CONFIG, opts };
  cleanup = SCREENS[name].mount(ctx) || null;
  const focusable = screenEl.querySelector('[autofocus], button, [href], input, select');
  if (focusable) focusable.focus({ preventScroll: true });
}

function renderMute() {
  muteBtn.textContent = isMuted() ? '×' : '♪';
  muteBtn.setAttribute('aria-pressed', String(isMuted()));
}
muteBtn.addEventListener('click', () => { setMuted(!isMuted()); renderMute(); });
renderMute();

window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

go('title');
