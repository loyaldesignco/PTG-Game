# CLICK — a PTG resilience game

A 3-minute pixel art browser game: defend a small office from phishing, then survive the
breach your mistakes let in. Every run ends with a Resilience Score and an email-gated
report that leads to a PTG IT resilience assessment.

This repo is **Phase 1 (Core / Quick Run)** from the design brief (`docs/DESIGN_BRIEF.md`),
plus the Phase 2 game logic that came cheaply: all four attack chains, the vendor-compromise twist and achievements.

## Run it

No build step and no dependencies. It's static HTML/CSS/ES modules.

```bash
npm start            # python3 -m http.server 8080 → http://localhost:8080
npm test             # engine unit tests (node --test)
```

URL options: `?seed=42` (repeatable inbox for demos/QA), `?kiosk` (accepts any email at the
report gate), `?leadEndpoint=https://...` (override the lead POST target).

### Embedding on ptg.co

The game draws on a fixed 360×640 canvas and scales to fit its container, so a
portrait iframe works anywhere:

```html
<iframe src="https://YOUR-HOST/click/" style="width:100%;max-width:420px;aspect-ratio:9/16;border:0" allow="clipboard-write; web-share"></iframe>
```

On an iPad kiosk, open it fullscreen with `?kiosk`.

## How a run plays

1. **Title → Clock in** (optional company, headcount, industry → personalizes the emails and downtime cost)
2. **Shop**: 100 credits, 6 defenses (130 credits total, so you can't buy everything)
3. **Act 1, inbox**: 15 emails in 3 difficulty tiers (sloppy → brand-perfect → spear phish that names your company and CEO), 2:00 on the clock. Report or trust each one (buttons, swipe or ←/→). Tapping a clue earns a bonus.
4. **Act 2, the breach**: each missed phish type opens a crisis (fake login → account takeover, fake invoice → wire fraud, attachment → ransomware, vendor update → supply-chain breach). If you miss nothing, a vendor gets compromised anyway. Downtime $ ticks up while you hesitate.
5. **Results**: score, stats, trophies → **full report** behind a work-email gate → CTAs.

| Defense | Effect in game |
|---|---|
| Email filter (20) | Removes 3 phish from the inbox |
| Training (15) | Highlights clues |
| MFA (20) | Missed credential phish no longer causes account takeover |
| 24/7 monitoring (30) | All breach downtime halved |
| Backups (25) | Unlocks "Restore from backup" in the ransomware crisis |
| IR hotline (20) | One-time "Call PTG" lifeline that resolves a crisis |

**Resilience Score (0–100):** phish caught 30 · real mail trusted 10 · clues 15 · speed 10
(scaled by accuracy) · Act 2 decisions 25 · budget left 10 (scaled by how well the office held up).
**Downtime cost** = hours × headcount × $55 × industry multiplier, plus direct losses (fraud, ransom).

## Project layout

```
index.html, css/style.css
js/main.js            screen router, 360×640 scaling, run state
js/config.js          deployment settings (lead endpoint, CTA URL, timers, kiosk)
js/lead.js            lead capture (POST + local copy)
js/audio.js           WebAudio blips (no audio files)
js/data/              emails, defenses, crises (all copy lives here)
js/engine/            pure, tested logic: deck building, attack chains, scoring, report
js/screens/           one module per screen
assets/img/           game art, cropped from the concept renders
assets/concept/       the original concept renders (reference only, not loaded by the game)
assets/fonts/         self-hosted Press Start 2P + VT323 (OFL)
tests/                node --test suites
```

### Editing content

- **Emails**: `js/data/emails.js`. Mark a clue inline as `[[id|text]]` and explain it in `clues.id`.
  Placeholders: `{company}`, `{domain}`, `{lookalike}`, `{ceo}`, `{ceoFirst}`. The tests check that
  every clue has an explanation and every placeholder gets filled.
- **Crises and outcomes**: `js/data/crises.js` (hours, dollar losses, result text).
- **Shop**: `js/data/defenses.js`.

## Leads and CRM handoff

After the email gate, `leadPayload()` builds one JSON record per run: contact, company,
headcount, industry, score breakdown, defenses bought and skipped, phish missed, breach
decisions, downtime hours and cost, the full-stack comparison, and a ready-made
`salesOpener`, for example:

> "You skipped backups and the ransomware cost you $58k. Let's talk about that."

The brief leaves the CRM open (HubSpot, Halo or Webflow). Until that's decided, set
`CONFIG.leadEndpoint` in `js/config.js` to any URL that accepts a JSON POST (a HubSpot
form or workflow webhook, a Webflow/Zapier webhook, a small serverless function).
With no endpoint set, leads are only kept in the browser's `localStorage` under `click_leads`.

## Art

The game uses the concept renders from the Gemini prompts in the brief, cropped into
backgrounds, shop tiles, stat icons and trophies (`assets/img/`); all UI text is live HTML.
To-dos from the brief's art direction:

- **PTG logo**: `.ptg-mark` on the title screen is a text placeholder. Drop in the real mark by hand.
- The breach art is ransomware-specific, so the other crises use a red-tinted office instead.
- Character sprite sheet, industry backdrops and badge set (prompts 6–9) aren't used yet.

## Not yet built (later phases)

Company leaderboard (needs a backend), Team Challenge owner report, CRM integration,
Kiosk Versus, Campaign week, industry scenarios, AI-generated email pool.
"CHALLENGE MY TEAM" currently shares a link to the game.
