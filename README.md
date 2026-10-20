<div align="center">

<img src="icons/icon-192.png" width="96" alt="Glowtide icon">

# Glowtide

**Hold the reef.** A three-lane horde defense game for one thumb, set in a bioluminescent abyss.

[![Play now](https://img.shields.io/badge/play-now-4FF0E0?style=for-the-badge&logo=googlechrome&logoColor=04121F&labelColor=0A2540)](https://tobiasschwartz.github.io/glowtide/)

[![Deploy](https://github.com/TobiasSchwartz/glowtide/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/TobiasSchwartz/glowtide/actions/workflows/pages/pages-build-deployment)
[![License: MIT](https://img.shields.io/github/license/TobiasSchwartz/glowtide?color=4FF0E0)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](#install-on-your-phone)
[![Offline](https://img.shields.io/badge/offline-ready-FFD76A)](#install-on-your-phone)
[![Vanilla JS](https://img.shields.io/badge/vanilla-JS-F7DF1E?logo=javascript&logoColor=black)](index.html)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](#development)
[![Last commit](https://img.shields.io/github/last-commit/TobiasSchwartz/glowtide)](https://github.com/TobiasSchwartz/glowtide/commits)
[![Repo size](https://img.shields.io/github/repo-size/TobiasSchwartz/glowtide)](https://github.com/TobiasSchwartz/glowtide)

</div>

---

Creatures drift down three lanes toward your reef. Swipe to switch lanes; you fire automatically.
Upgrade gates fall between the hordes, but every creature that passes an unclaimed gate gets
cloned. Charge the gate or defend the lane: that choice is the whole game.

## Features

- **Breeding gates.** Gates ripen over time and pay more, but only if you keep their lane clear.
- **Glow.** Temporary power (faster shots, twin shot, piercing, Full Bloom) that drains unless you keep claiming gates.
- **Pearls.** Six stored abilities (Frost, Storm, Ink, ...) you trigger with a tap.
- **Bosses.** Maelstrom and Anglerking, plus run-only rewards after every boss.
- **Four vents.** Sidegrades that change the rules, unlocked by achievements. Nothing is pay to win.
- **Daily dive.** The same seed and two modifiers for everyone, with medals.
- **Tiny.** One HTML file, procedural graphics, synthesized audio, no build step, no assets to load.

## Install on your phone

Glowtide is a Progressive Web App: it installs like a native app and plays offline.

| Platform | Steps |
| --- | --- |
| Android (Chrome) | Open the [game](https://tobiasschwartz.github.io/glowtide/), tap **⋮ → Install app** (or "Add to Home screen") |
| iOS (Safari) | Open the [game](https://tobiasschwartz.github.io/glowtide/), tap **Share → Add to Home Screen** |
| Desktop (Chrome/Edge) | Click the install icon in the address bar |

Updates arrive automatically the next time you open the game online.

## How to play

| Action | Touch | Keyboard |
| --- | --- | --- |
| Change lane | Swipe left/right | ← → |
| Fire | Automatic | Automatic |
| Use a pearl | Tap it in the tray | |

A short intro runs before your first dive, and the game explains each new enemy, gate and pearl
the first time it appears.

## Development

No toolchain needed. Serve the folder and open it:

```sh
python -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/
```

Append `#bot` to the URL for an autopilot. For balancing, run headless bot games in Node:

```sh
node test/sim.js lantern 8      # vent, number of runs
```

Design, tuning and testing notes are in [docs/DESIGN.md](docs/DESIGN.md).

### Project layout

```
index.html            the whole game (HTML, CSS, JS)
manifest.webmanifest  PWA manifest
sw.js                 service worker (offline cache)
icons/                app icons
test/                 headless sim and browser test harness
docs/DESIGN.md        game design and dev notes
```

## Deployment

GitHub Pages serves the `main` branch root (Settings → Pages → Deploy from a branch → `main` / `/ (root)`).
Every push to `main` goes live.

## Contributing

Issues and pull requests are welcome. Please keep the game a single dependency-free file and run
`node test/sim.js` for a few vents before proposing balance changes.

## License

[MIT](LICENSE) © Tobias Schwartz
