// Tiny square-wave sound effects with WebAudio. No audio files needed.
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('click_muted') === '1'; } catch {}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.08, type = 'square', vol = 0.06, when = 0) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  blip: () => tone(660, 0.05),
  select: () => { tone(520, 0.05); tone(780, 0.07, 'square', 0.06, 0.05); },
  deny: () => { tone(180, 0.12, 'square', 0.07); },
  coin: () => { tone(988, 0.06); tone(1319, 0.12, 'square', 0.06, 0.06); },
  clue: () => { tone(880, 0.05); tone(1175, 0.05, 'square', 0.05, 0.05); tone(1568, 0.09, 'square', 0.05, 0.1); },
  good: () => { tone(659, 0.06); tone(988, 0.1, 'square', 0.06, 0.06); },
  bad: () => { tone(220, 0.1, 'sawtooth', 0.07); tone(150, 0.2, 'sawtooth', 0.07, 0.1); },
  alarm: () => { for (let i = 0; i < 4; i++) { tone(880, 0.12, 'square', 0.05, i * 0.25); tone(660, 0.12, 'square', 0.05, i * 0.25 + 0.12); } },
  tick: () => tone(1200, 0.02, 'square', 0.025),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.06, i * 0.1)),
};

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('click_muted', m ? '1' : '0'); } catch {}
}
export function unlockAudio() { ac(); }
