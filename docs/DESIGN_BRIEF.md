# CLICK — PTG Game Design Brief

Nov 5, 2026 · Brian Punger

## Concept

CLICK is a 3-minute pixel art browser game where players defend a small office from phishing and then survive the ransomware attack their mistakes let in. Players build a PTG-style security stack without being sold to, and every run ends with a personal Resilience Score that leads to a PTG assessment.

| | |
|---|---|
| Goal | Generate qualified leads for managed IT, security awareness training and backup/continuity |
| Audience | Owners and office managers at Long Island and NYC SMBs (10–250 staff) |
| Session length | 3 minutes core run; optional campaign and industry modes for longer play |
| Platforms | Mobile-first browser, embedded on ptg.co, iPad kiosk at events |
| Tone | Playful pixel art with real tension; never fear-mongering |

## Core game loop

A run moves from setup to the shop, through the inbox and the breach, and always ends at the report and PTG call to action. Players who catch every phish still get breached through the vendor twist, so no run skips Act 2. Replaying with a new budget is the hook: players learn which defenses matter by losing without them.

## Systems

### Budget and upgrades

Fixed IT budget (100 credits) spent in a shop before each run. The budget never covers everything; the results screen shows what the full stack would have prevented.

| Defense | Cost | Effect in game | PTG service |
|---|---|---|---|
| Email filtering | 20 | Removes 3 of the 15 emails before they reach the inbox | Managed email security |
| Security training | 15 | Unlocks extra clue highlights in Act 1 | Security awareness training |
| MFA | 20 | A missed credential phish no longer leads to account takeover | Identity and access management |
| EDR / 24/7 monitoring | 30 | Ransomware is caught early; Act 2 starts with half the damage | Managed detection and response |
| Immutable backups | 25 | Unlocks the "Restore from backup" choice in Act 2 | Backup, recovery and continuity |
| Incident response retainer | 20 | Adds a "Call PTG" lifeline that resolves one crisis | Incident response |

### Attack chains

| Missed in Act 1 | Leads to in Act 2 | Key decision |
|---|---|---|
| Fake login page | Account takeover | Reset passwords and revoke sessions, or ignore the odd login alert |
| Fake invoice / CEO request | Wire fraud | Verify by phone, or send the payment |
| Malicious attachment | Ransomware | Unplug, pay, or restore from backup |
| Fake vendor update | Supply-chain breach | Isolate the vendor's access, or keep working |
| None missed | Vendor compromise twist | Even perfect players are hit through a third party; backups and monitoring decide the outcome |

### Clue hunting

Every email hides 1–3 real clues (misspelled domain, mismatched link, odd tone or urgency, unexpected attachment). Tapping a clue before deciding earns a bonus. Training highlights clues; later levels hide them better.

### Difficulty curve

1. Emails 1–5: sloppy phish with obvious clues
2. Emails 6–10: brand-perfect lures and real-looking invoices
3. Emails 11–15: spear phishing that names the player's company and their "CEO"

### Scoring

The Resilience Score (0–100) combines phish caught, clues found, speed, Act 2 decisions and money left in the budget. Downtime cost is shown separately in dollars, based on headcount and industry.

## Modes and replayability

| Mode | How it plays | Why it helps PTG |
|---|---|---|
| Quick Run | One budget, one inbox, one breach; about 3 minutes | LinkedIn ads, kiosk, ptg.co landing page |
| Campaign: "A Week at the Office" | Mon phishing, Tue lost laptop, Wed vendor breach, Thu storm power outage, Fri departing employee with data | Shows the full managed IT scope |
| Industry scenarios | Manufacturing (OT downtime), family office (wire fraud), hospitality (POS breach), healthcare (patient records) | Vertical campaigns and sales follow-up |
| Team Challenge | Owner sends a private link to staff; gets a team report of who clicked what | Free phishing assessment and a warm lead |
| Kiosk Versus | Two players race side by side on one iPad | Booth crowd; two leads per round |

Leaderboard ranks companies by average score; monthly "Most Resilient Company on Long Island" post. Fresh content via an AI-generated email pool. Shareable pixel achievements ("Zero Clicks", "Backup Hero", "Called PTG First").

## Lead capture and sales handoff

1. Before play (optional): company name, headcount, industry.
2. After play: score shows instantly; full report unlocks with a work email.
3. CTA: "Book a free IT resilience assessment" and "Run the Team Challenge for your staff."
4. Handoff: score, defenses chosen and mistakes go to the CRM ("You skipped backups and the ransomware cost you $48k. Let's talk about that.")

Open question: which CRM or form tool receives the leads (HubSpot, Halo or a Webflow form)?

## Art direction

| Element | Rule |
|---|---|
| Palette | Black #020202, charcoal #1B1B1B, warm grays, off-white, lightning yellow #F9B62C; alarm red only during the breach |
| Pixels | Hard edges, no anti-aliasing, dithered shading, chunky dark outlines |
| Type | Bitmap pixel font in game; Space Grotesk and Hanken Grotesk on surrounding ptg.co pages |
| UI | Square corners everywhere, yellow pixel borders on dialogue boxes |
| Characters | ~32×32 px office workers with emotes (sweat drop, "!", panic swirl) |
| Mood | Act 1 cozy dusk office; Act 2 red alarm lighting, glitch, screen shake |
| Logos | Real PTG mark added by hand; no real brands in the art |

Touchstones: Papers, Please (desk tension), Stardew Valley (warmth), Reigns (card swiping).

The Gemini image prompts (title, shop, inbox, breach, results, sprite sheet, office tileset, industry backdrops, badges, leaderboard) live in the original brief; renders of prompts 1–5 are in `assets/concept/`.

## Build phases

| Phase | Scope | Marketing moment |
|---|---|---|
| 1. Core | Quick Run: shop, Act 1 inbox with clues, Act 2 ransomware chain, results, email-gated report, lead form | Launch on LinkedIn and ptg.co |
| 2. Depth | All four attack chains, vendor twist, achievements, company leaderboard | "Most Resilient Company" monthly posts |
| 3. Sales tools | Team Challenge with owner report, CRM handoff, kiosk mode with Kiosk Versus | Trade shows and outbound sales |
| 4. Expansion | Campaign week, industry scenarios, AI-generated email pool | Vertical campaigns |

Tech: HTML5 canvas with a lightweight engine such as Phaser, mobile-first, embeddable on ptg.co. No app store or download needed.
