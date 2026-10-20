# Glowtide: design and dev notes

A small phone game in the spirit of the "Mob Control" ads: three lanes, endless hordes, upgrade
gates that compete with defending. One self-contained file, `index.html` (vanilla JS + canvas, no
build, no assets). Prototype for short play sessions, Android Chrome, portrait, one thumb.

## Game design

**Theme.** Bioluminescent abyss. The player is a glowing vent creature on the sea floor guarding the
reef; warm, rotting deep-sea creatures drift down. Everything is drawn procedurally: palette
`#04121F`→`#0A2540` background, player/bullets cyan `#4FF0E0`/`#B8FFF2`, enemies coral
`#FF6A3D`/`#FF2E63`, gates amber `#FFD76A`, pearls `#FFE9F3`, bosses and Shade violet `#7928CA`.
Fonts: Unbounded (display), Sora (UI). Single deliberate dark look.

**Controls.** Swipe left/right to change lanes (a flick moves one lane, a long drag several).
Firing is automatic into the current lane. Taps are reserved for the pearl tray. Arrow keys on desktop.

**Core loop.** Waves come down the three lanes; each creature reaching the reef costs shells
(5 total). Gates drift down slower than enemies:
- Shooting a gate fills its charge; when full the player gets its reward.
- **Twist, breeding gates:** while a gate is unclaimed, every creature passing through it is cloned
  (max 4 clones, then the gate collapses). You must clear the lane in front of a gate and charge it
  before the horde reaches it. This is the "upgrade vs. defend" decision.
- Gates keep spawning during boss fights (otherwise Glow collapses after each boss).
- **Ripening:** a gate ripens over time (dots, 1-3, one per 6 s) and pays more: Glow gates +1/+1.5/+2,
  pearl gates add +0.5 Glow per extra dot, score 200 per dot. A creature passing a ripe gate eats a
  dot instead of being cloned. Waiting pays, but only if you keep the lane clear.
- **Rotten gates** (15% from zone 2): dashed green, skull glyph, with the caged pack drawn inside.
  Claiming gives +2 Glow but releases the pack (a Splitter plus drifters) at the gate. Ignoring one is
  safe: rotten gates never clone.
- **Deep claim and hatchlings:** claiming a fully ripe gate below the dashed DEEP line (bottom 30%
  of the lane) gives +500 and hatches a hatchling (max 2) that shoots beside you; each leak scares
  one away. Eligible gates pulse green.
- **Safe spawns:** a new gate avoids lanes with creatures near the top or queued, retrying up to
  four times (0.8 s apart) before it spawns in the calmest lane.
- **Reef burst:** a leaking creature costs shells as before, but bursts and damages the creatures
  just behind it in its lane, so a horde does not leak all at once.

**Glow (temporary power, replaces permanent upgrades).** Glow gates add +1 Glow (0-4). Drain grows
with Glow (`GLOW_DRAIN_BASE + GLOW_DRAIN_PER*glow`), so tier IV needs upkeep and tier I is stable; a
claim pauses the drain for 2 s. A leak costs only 0.35 Glow (v2 took a whole tier, which caused a
death spiral); the Shade still drains 1. Glow claimed above the cap becomes score. Tiers: I faster shots, II twin shot, III piercing, IV Full Bloom (side-lane shots).
Design reason: v1 had 11 permanent stacking upgrades, which made the player too strong over time
and were opaque (unexplained icons). Glow keeps power tied to how well you play gates right now.

**Pearls (stored, player-triggered items).** ~30% of gates are pearl gates showing the specific
pearl. Pearls go into a 3-slot tray (bottom right) and are used by tapping: Polyp (sentry in your
lane, 15 s), Frost (slow all, 8 s), Undertow (push all back), Storm (kills arc to other lanes,
8 s, damage scales with zone), Ink (damage everything in your lane), Mend (+2 shells). Pearls have levels I-III (tray dots):
a pearl gate's ripeness sets the level, and a pearl you already hold levels up instead of taking a
slot. Higher levels last longer or hit harder (`PEARLS[k].lv`). A full tray wastes new pearls, and
such gates are drawn dimmed with "FULL", so pearls are worth spending. A pearl's tip card shows when
it is collected, so it can be planned.

**Enemies.** Drifter (jelly, baseline), Krill (weak swarms), Darter (fast, jumps lanes once),
Bulwark (armoured, costs 2 shells), Splitter (bursts into krill), Shade (from zone 2, drains Glow).
HP scales per zone.

**Run structure.** Zones of 60 s waves, then a boss. After each boss the player picks one of three
run-only rewards (`BOONS`). Each levels up to a max when picked again and its card shows the change
("Damage +25% -> +50%", "Level 2 of 3"). A zone without leaks adds one rare reward (Brighter vent:
Glow cap +1, Hatchling, Early bloom: gates start riper); 3+ leaks or 2 shells left adds Mend. Bosses: odd zones Maelstrom (3-lane vortex wall, one
segment per lane, spawns krill), even zones Anglerking (one big fish that hops lanes after a
telegraph, spawns darters). Beating a boss: next zone, +1 shell, palette deepens. Score = kills +
gates + boss bonus; depth in metres. Target run length 3-5 min.

**Meta progression: sidegrades only, no pay to win.** Four "vents" with roughly equal strength,
unlocked by achievements, never by grinding currency. Each changes a rule, not only weapon stats:
- Lantern, the Keeper (default): fast stream; the only vent that reaches Glow IV without a rare
  reward, and Glow never drains below tier I by time.
- Needle, the Hunter (reach zone 2): heavy piercing shots, Glow capped at II; no Glow gates, every
  gate holds a pearl, and killing Bulwarks, Splitters and Shades feeds +0.25 Glow.
- Spore, the Gardener (claim 6 gates in a run): 3-shot fan, Glow capped at III; every 5th kill
  plants a 6 s sentry.
- Tidecaller, the Tide (beat 2 bosses in a run): ebb and flood alternate every 10 s. Ebb: creatures
  x0.75 speed, gates charge double, Glow does not drain. Flood: creatures x1.2, fire rate x1.3,
  Glow drains 1.6x.

**Title screen.** One swipeable row of cards: today's dive first, then vents 1-4 in unlock order.
The centred card is the choice and the single Dive button plays it (disabled on a locked vent).
Help, field guide and sound are icon buttons. The daily dive uses the last chosen vent.

**Daily dive.** Same seed for everyone plus two modifiers picked from the date (`DAILY_MODS`: Black
Tide, Brood Day, Cracked Reef, Krill Tide, Rot Bloom, Riptide, Heavy Water, Armed Dive), shown on the
title. Medals for reaching zone 3/5/7, own best score, "Copy result" on the game-over screen. No
permanent stat boosts anywhere.

**Onboarding.** A 3-card intro before the first run (also "How to play" on the title). Learn-as-you-
go callouts: the first time each enemy, boss, gate kind, pearl or Glow change appears, the game
pauses and shows a large card until tapped. Field guide on the title lists everything seen
("Reset tips" replays intro and callouts). Seen ids persist in localStorage.

**Audio.** WebAudio synthesis only (shots, hits, gate charge, claims, leaks, boss roar, drone),
starts on first tap, mute toggle persisted.

## Code notes

- All tuning numbers live in `const CONFIG` and the `VENT_DEFS` / `ENEMY_TYPES` tables at the top
  of the script. Zone 1 easing: `ZONE1_WAVE_MUL`, `ZONE1_DRAIN_MUL`. Rule tables: `BOONS`, `DAILY_MODS`, vent rules are checked via `state.vent`.
- Battery: drawing is capped at 60 fps in play (120 Hz phones would draw twice as often) and 20 fps
  on menus and tip cards, timed with `performance.now()` (rAF timestamps stall in headless Chrome);
  `DPR_CAP` 1.5; the AudioContext is suspended outside play and while muted.
- Popups: identical toasts merge, at most two show, Glow tier toasts at most every 4 s. Side shots
  (Full Bloom, Side vents) and sentries pass through gates; only your lane volley and hatchlings
  charge them.
- Best scores are per vent (`save.bestBy`, `save.depthBy`); the daily keeps its per-day best.
- Gameplay randomness uses one seeded PRNG (mulberry32); daily seed = hash of the local date.
- Save: localStorage key `glowtide.v1` (`best`, `bestDaily`, `unlocked`, `vent`, `muted`, `stats`,
  `seen`), every access in try/catch (private mode can block storage).
- Hosted on GitHub Pages as an installable PWA: `manifest.webmanifest`, `icons/`, and `sw.js`
  (network first, cache fallback, so it plays offline after the first visit). Only Google Fonts
  as external resource, no alert/confirm/prompt, no `shadowBlur` per entity (pre-rendered glow
  sprites for phone performance).
- `window.GT` exposes `CONFIG` and `state` for debugging. `#bot` in the URL runs an autopilot
  (defend the lowest threat, else charge a gate, use pearls when enemies near the reef) that
  auto-restarts runs and skips intro/callouts.

## Testing and balancing

`test/harness-prefix.html` replaces `requestAnimationFrame`/`performance.now` with a manual clock
(`window.tick(frames)`), so the game can be fast-forwarded even in a hidden browser tab.
```sh
cat test/harness-prefix.html index.html > test/test.html   # test.html is a throwaway build
python -m http.server 8765 --bind 127.0.0.1                # from the repo root
# open http://127.0.0.1:8765/test/phone.html  (412x870 iframe, #bot)
# in the console: T(600) advances 10 s of game time, G() returns the game state
```
Measure over several bot runs: survival time, zone reached, average Glow, gates claimed, enemy
count. Keep each `T()` call short (a few thousand frames); long synchronous loops time out CDP.

Faster: `node test/sim.js <vent> <runs> [daily]` runs the script headless in Node (stubbed DOM, bot
autopilot) and prints zone/score/minutes per run plus the cause of death (`w` waves, `b` during a
boss, `B` boss reached the reef). Run the four vents in parallel; 8 runs take a few minutes.

Balance as of v3 (bot, 8 runs each): see History. v2.3 had a hard wall: enemy HP x count grew much
faster than the capped player DPS, so every vent died in zone 3-4 (~14-17k score).

## History

- v1: first build (deepseek won a 3-model bake-off), permanent stacking upgrades.
- v2: feedback "gets too easy, buffs meaningless, want swipe" → Glow, pearls, Shade, swipe,
  callouts, field guide. Balance by a Sonnet subagent.
- v2.1: gates during bosses (fixes the zone-2 wall, diagnosed by GLM), faster Glow drain.
- v2.2: intro cards, callouts pause until tapped with larger text.
- v2.3: gentler zone 1.
- v3: feedback "Glow random/all-or-nothing, vents and daily feel the same, wall at ~14.5k, want more
  strategy". Design ideas from a 4-model brainstorm (deepseek, gemini, glm, sonnet). Wall removed
  (`HP_SCALE` 1.0 -> 0.6, clones at half HP, Bulwarks never cloned), Glow drain rework, reef burst
  (owner's idea), ripening and rotten gates, boss rewards, vent rules, daily modifiers and medals.

## Ideas not done yet

- Difficulty feedback from real play: zone 2+ may still feel hectic.
- More pearls/enemies, a third boss (bosses still alternate odd/even), new content from zone 5 on.
- Wild ideas from the brainstorm: leaked shells hatch into pets, a nemesis that returns the enemy
  types you leaked most, taming gates that turn heavy enemies into allies, an upside-down zone.
- Haptics (`navigator.vibrate`) on leaks.
