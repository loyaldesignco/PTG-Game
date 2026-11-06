import { buildDeck, applyFilter, judge, missedTypes, mulberry32 } from '../engine/inbox.js';
import { esc, rich, img, shake } from './ui.js';

const SEGMENTS = 20;

export function mount({ el, go, state, sfx, config, game }) {
  const run = state.run;
  const rng = mulberry32(run.seed);
  const deck = buildDeck(run.profile, rng);
  const { shown, filtered } = applyFilter(deck, run.owned.includes('filter'));
  run.shown = shown;
  run.filtered = filtered;
  run.results = [];
  const trained = run.owned.includes('training');

  el.innerHTML = `
    <header class="hud">
      <div class="hud-time">
        <div class="segbar" id="bar">${'<i></i>'.repeat(SEGMENTS)}</div>
        <span id="time">2:00</span>
      </div>
      <div class="hud-streak" id="streak" aria-label="Streak"><i class="flame"></i>x<span>0</span></div>
      <div class="hud-count">EMAIL<br><span id="count">1/${shown.length}</span></div>
    </header>
    <div class="bg-office inbox-bg" style="background-image:url(${img('office')})"></div>
    <div class="deck" id="deck"></div>
    <div class="clue-toast" id="toast" aria-live="polite"></div>
    <div class="swipe-hint" aria-hidden="true">◀ SWIPE TO REPORT · SWIPE TO TRUST ▶</div>
    <div class="decide">
      <button class="btn btn-yellow" id="report">REPORT</button>
      <button class="btn btn-dark" id="trust">TRUST</button>
    </div>
    <div class="overlay" id="brief">
      <div class="dialog">
        <h2>YOUR SHIFT STARTS</h2>
        <p><b>${shown.length} emails</b> are waiting. <b class="y">REPORT</b> the phish. <b>TRUST</b> the real mail.</p>
        <p>Tap anything suspicious before you decide to find <b class="y">CLUES</b> for bonus points.</p>
        ${filtered.length ? `<p class="perk">EMAIL FILTER blocked ${filtered.length} phishing emails before they reached you.</p>` : ''}
        ${trained ? '<p class="perk">TRAINING: clues are highlighted.</p>' : ''}
        <p class="muted">Keyboard: ← report · → trust</p>
        <button class="btn btn-yellow" id="open">OPEN INBOX</button>
      </div>
    </div>`;

  const deckEl = el.querySelector('#deck');
  const toast = el.querySelector('#toast');
  const bar = [...el.querySelectorAll('#bar i')];
  const timeEl = el.querySelector('#time');
  const streakEl = el.querySelector('#streak span');
  const countEl = el.querySelector('#count');

  const total = config.inboxSeconds * 1000;
  let elapsed = 0, last = 0, paused = true, raf = 0, idx = 0, streak = 0;
  let card = null, email = null, found = [], shownAt = 0, busy = false, finished = false;

  function tick(now) {
    if (!last) last = now;
    const dt = now - last;
    last = now;
    if (!paused) {
      elapsed += dt;
      if (elapsed >= total) { elapsed = total; timeUp(); }
    }
    const left = Math.max(0, total - elapsed);
    const lit = Math.ceil((left / total) * SEGMENTS);
    bar.forEach((b, i) => { b.className = i < lit ? (left < 20000 ? 'on low' : 'on') : ''; });
    const s = Math.ceil(left / 1000);
    timeEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function renderCard() {
    email = shown[idx];
    found = [];
    countEl.textContent = `${idx + 1}/${shown.length}`;
    toast.textContent = '';
    const behind = idx < shown.length - 1 ? '<div class="card card-behind" aria-hidden="true"></div>' : '';
    deckEl.innerHTML = `${behind}
      <article class="card ${trained ? 'trained' : ''}" id="card" aria-label="Email ${idx + 1} of ${shown.length}">
        <div class="from">
          <i class="env" aria-hidden="true"></i>
          <div><b>${esc(email.fromName)}</b><span>${rich(email.from)}</span></div>
        </div>
        <h3 class="subj">${rich(email.subject)}</h3>
        <div class="body">${rich(email.body)}</div>
        ${email.attachment ? `<div class="attach"><i class="clip" aria-hidden="true"></i><span>${rich(email.attachment)}</span></div>` : ''}
        ${email.link ? `<div class="link"><span class="linkbtn">${esc(email.link.label)}</span><span class="url">→ ${rich(email.link.url)}</span></div>` : ''}
        <div class="stamp" id="stamp"></div>
      </article>`;
    card = deckEl.querySelector('#card');
    shownAt = performance.now();
    bindSwipe(card);
  }

  function onClue(target) {
    if (busy || target.classList.contains('found')) return;
    const id = target.dataset.clue;
    // A clue may be split across fields (same id); mark them all.
    card.querySelectorAll(`[data-clue="${CSS.escape(id)}"]`).forEach(s => s.classList.add('found'));
    if (!found.includes(id)) found.push(id);
    sfx.clue();
    toast.innerHTML = `<b>CLUE!</b> ${esc(email.clues[id] || 'Something is off here.')}`;
  }

  deckEl.addEventListener('click', e => {
    const c = e.target.closest('.clue');
    if (c) onClue(c);
  });
  deckEl.addEventListener('keydown', e => {
    const c = e.target.closest('.clue');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClue(c); }
  });

  function decide(decision) {
    if (busy || finished || !email) return;
    busy = true;
    paused = true;
    const correct = judge(email, decision);
    run.results.push({
      id: email.id, email, phish: email.phish, type: email.type || null, decision, correct,
      cluesFound: found.slice(), cluesTotal: email.clueIds.length, ms: performance.now() - shownAt,
    });
    streak = correct ? streak + 1 : 0;
    streakEl.textContent = streak;
    el.querySelector('#streak').classList.toggle('hot', streak >= 3);

    const stamp = card.querySelector('#stamp');
    let label, cls;
    if (email.phish && correct) { label = 'CAUGHT!'; cls = 'good'; }
    else if (email.phish) { label = decision === 'timeout' ? 'TOO SLOW!' : 'MISSED!'; cls = 'bad'; }
    else if (correct) { label = 'SAFE'; cls = 'good'; }
    else { label = 'FALSE ALARM'; cls = 'warn'; }
    stamp.className = 'stamp show ' + cls;
    stamp.innerHTML = `<b>${label}</b><span>${esc(email.lesson)}</span>${!correct || email.phish ? '<em>TAP TO CONTINUE</em>' : ''}`;
    if (correct) sfx.good(); else { sfx.bad(); shake(game, 300); }
    if (email.phish && !correct) {
      // Reveal the clues they missed.
      card.querySelectorAll('.clue').forEach(s => s.classList.add('reveal'));
    }
    card.classList.add(decision === 'report' ? 'out-left' : 'out-right');
    const wait = correct && !email.phish ? 900 : 2600;
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      card.removeEventListener('click', advance);
      next();
    };
    setTimeout(advance, wait);
    setTimeout(() => card.addEventListener('click', advance), 250);
  }

  function next() {
    idx += 1;
    busy = false;
    if (idx >= shown.length) return finish();
    paused = false;
    renderCard();
  }

  function timeUp() {
    if (finished) return;
    paused = true;
    // Everything left unread is effectively trusted: missed phish still get through.
    for (let i = idx; i < shown.length; i++) {
      const e = shown[i];
      if (run.results.some(r => r.id === e.id)) continue;
      run.results.push({ id: e.id, email: e, phish: e.phish, type: e.type || null, decision: 'timeout',
        correct: judge(e, 'timeout'), cluesFound: i === idx ? found.slice() : [], cluesTotal: e.clueIds.length, ms: 10000 });
    }
    toast.innerHTML = '<b>TIME!</b> Unread emails sat in the inbox... and someone opened them.';
    sfx.bad();
    setTimeout(finish, 1600);
  }

  function finish() {
    if (finished) return;
    finished = true;
    run.missed = missedTypes(run.results);
    go('breach');
  }

  function bindSwipe(c) {
    let x0 = null, dx = 0, id = null;
    c.addEventListener('pointerdown', e => {
      if (busy || e.target.closest('.clue')) return;
      x0 = e.clientX; dx = 0; id = e.pointerId;
      c.setPointerCapture(id);
      c.classList.add('drag');
    });
    c.addEventListener('pointermove', e => {
      if (x0 === null || e.pointerId !== id) return;
      const scale = game.getBoundingClientRect().width / 360;
      dx = (e.clientX - x0) / scale;
      c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      c.dataset.lean = dx < -30 ? 'report' : dx > 30 ? 'trust' : '';
    });
    const end = () => {
      if (x0 === null) return;
      x0 = null;
      c.classList.remove('drag');
      c.style.transform = '';
      c.dataset.lean = '';
      if (dx < -90) decide('report');
      else if (dx > 90) decide('trust');
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  el.querySelector('#report').addEventListener('click', () => decide('report'));
  el.querySelector('#trust').addEventListener('click', () => decide('trust'));
  const onKey = e => {
    if (el.querySelector('#brief')) return;
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'r') decide('report');
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 't') decide('trust');
  };
  window.addEventListener('keydown', onKey);

  el.querySelector('#open').addEventListener('click', () => {
    sfx.select();
    el.querySelector('#brief').remove();
    renderCard();
    paused = false;
  });

  return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
}
