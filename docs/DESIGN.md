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
(5 total). A wave is announced 1.5 s ahead by a chevron at the top of its lane (`WAVE_WARN`), so
the player can plan gate vs. defend. Darters and the Anglerking only step to a neighbouring lane
(edge lanes move inward). Gates drift down slower than enemies:
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
  of the lane) gives +500 and hatches a hatchling (max 2) that shoots beside you for 30 s
  (`PET_LIFE`, blinks before it leaves); at the cap a deep claim renews the older one, so deep
  claims stay worth chasing. Each leak scares one away. Eligible gates pulse green.
- **Safe spawns:** a new gate avoids lanes with creatures near the top or queued, retrying up to
  four times (0.8 s apart) before it spawns in the calmest lane.
- **Reef burst:** a leaking creature costs shells as before, but bursts and damages the creatures
  just behind it in its lane, so a horde does not leak all at once.

**Glow (temporary power, replaces permanent upgrades).** Glow gates add +1 Glow (0-4). Drain grows
with Glow (`GLOW_DRAIN_BASE + GLOW_DRAIN_PER*glow`), so tier IV needs upkeep and tier I is stable; a
claim pauses the drain for 2 s. A leak costs only 0.35 Glow (v2 took a whole tier, which caused a
death spiral). A Shade that gets through drains 1 more (it used to drain when near the reef, i.e.
exactly while you fought it, which made it a run killer). Glow claimed above the cap becomes score.
Tiers: I faster shots (x1.25), II twin shot (extra bullet every 2nd volley, `GLOW_TWIN_EVERY`), III
piercing, IV Full Bloom (side-lane shots). Tiers are kept flat on purpose (tier 0 to III is about
x2.3 damage, it was x4): with steep tiers no enemy pressure is both survivable at low Glow and
challenging at high Glow, and every lost tier flips a run from cruising to collapse.
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
("Damage +25% -> +50%", "Lv 2/3").
**Cascading loot (v3.3).** Rewards have five tiers: Common, Uncommon, Rare, Epic, Legendary. A
reward's tier belongs to its next level (`t` per level), so stronger levels are rarer: Keen shots
and Quick vent go Common -> Uncommon -> Rare, Side vents Uncommon -> Rare -> Epic, Needlepoint Rare
-> Epic. Utility rewards (Steady glow, Open gates, Coral reef, Mend) stay mostly Common, Old souls is
Uncommon/Rare, Brighter vent Epic, and Spring tide (every reward you hold gains a level, needs two
upgradable ones) is the only Legendary. Each card rolls its tier as a cascade: start Common, climb
one tier per success (36/28/22/16%), then draw a reward of that tier (falling back to the nearest
lower, then higher, tier when none is left). Luck adds to every climb: +10% for a zone without
leaks (zone 2+), +1% per zone, +5% per offer in a row without Rare or better (pity). Base odds per
card are roughly 64/26/8/2/0.4%; a flawless zone 5 is 50/29/13/5/2%. This replaced the old rule
(a flawless zone guaranteed one of two "rare" rewards, so good players saw them every boss while
the strong stat levels were always common). Held rewards show as tier-coloured pills under the
zone bar (`DMG ●●○`), with full effects on the pause screen. 3+ leaks or 2 shells left still adds Mend. Bosses: odd zones Maelstrom (3-lane vortex wall, one
segment per lane, spawns krill), even zones Anglerking (one big fish that hops lanes after a
telegraph, spawns darters). Beating a boss: next zone, +1 shell, palette deepens. Score = kills +
gates + boss bonus; depth in metres. Target run length 3-5 min.

**Meta progression: sidegrades only, no pay to win.** Four "vents" with roughly equal strength,
unlocked by achievements, never by grinding currency. Each changes a rule, not only weapon stats:
- Lantern, the Keeper (default): fast stream; the only vent that reaches Glow IV without Brighter
  vent, and Glow never drains below tier I by time.
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
`CFG='{"HP_SCALE":0.3}' node test/sim.js ...` overrides CONFIG values without editing the game.

Pressure model: `node test/sim.js model [tier]` prints per zone and vent, from the game's own
formulas (`GT.fn`): U = incoming creature HP/s over your damage/s (share of time spent shooting
creatures; the rest is free for gates) and B = one full wave's HP over the damage you deal while it
crosses the lane (above 1 it leaks even with perfect play). Assumes +20% damage per boss reward.
Bot calibration: the bot dies where U at tier II reaches about 2.5-3. Pressure grows slowly
(fewer, bigger waves every 4.5-6 s; HP `1 + 0.2(z-1) + 0.02(z-1)^2`); the quadratic term outgrows
boss rewards so every run ends. v3 grew HP x count / interval about cubically, which gave a wall at
zone 5.

Balance as of v3.2 (bot, 8 runs each): median zone 6 for every vent, averages 6.3-8.1, 8-11 min.
The bot reacts instantly, so humans will die earlier; most bot deaths are now during bosses.
v3.3 (bot, 12 runs each, cascading rewards): averages 6.8-7.5. The old numbers were held down
because the bot takes the first card and a flawless zone always put Old souls or Brighter vent there.

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
- v3.2: feedback "Shade kills runs, hatchlings kept forever, Early bloom always offered". Wave
  warning, Shade drains on leak, 30 s hatchlings, Early bloom removed, flatter Glow tiers, pressure
  model and retune (Needle damage 2.75 -> 3), inward-only lane jumps, daily seed no longer consumed
  by visual effects.
- v3.3: feedback "rare rewards drop every round, stat levels feel more valuable". Cascading
  reward tiers (Common to Legendary), tier per reward level, pity luck, Spring tide, held rewards
  in the HUD and on the pause screen.

## Ideas not done yet

- Difficulty feedback from real play: zone 2+ may still feel hectic.
- More pearls/enemies, a third boss (bosses still alternate odd/even), new content from zone 5 on.
- Wild ideas from the brainstorm: leaked shells hatch into pets, a nemesis that returns the enemy
  types you leaked most, taming gates that turn heavy enemies into allies, an upside-down zone.
- Haptics (`navigator.vibrate`) on leaks.
- Bosses are now the main killer in sims (boss HP still scales with `hpMul`; reaching the reef
  ends the run regardless of shells).
