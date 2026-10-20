// Headless balance sim: runs index.html's script in Node with a stubbed DOM and the #bot autopilot.
// Death codes: B = boss reached the reef, b = shells lost during a boss, w = shells lost in waves.
// Usage: node test/sim.js [vent] [runs] [daily]   e.g. node test/sim.js lantern 8
// Try tunings without editing the game: CFG='{"HP_SCALE":0.3}' node test/sim.js ...
const fs = require('fs'), vm = require('vm'), path = require('path');
const [vent = 'lantern', runs = vent === 'model' ? '' : '6', daily = ''] = process.argv.slice(2);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

// A Proxy that swallows every DOM/canvas call and property read.
const stub = () => new Proxy(function(){}, {
  get: (t, k) => k === Symbol.toPrimitive ? () => 0 : (k in t ? t[k] : (t[k] = stub())),
  set: (t, k, v) => { t[k] = v; return true; },
  apply: () => stub(), construct: () => stub()
});
let t = 0, q = [];
const store = { 'glowtide.v1': JSON.stringify({ vent, unlocked: ['lantern','needle','spore','tidecaller'], seen: [] }) };
const win = {
  location: { hash: '#bot' }, innerWidth: 412, innerHeight: 870, devicePixelRatio: 1,
  performance: { now: () => t }, requestAnimationFrame: cb => q.push(cb),
  matchMedia: () => ({ matches: false }), addEventListener() {}, setTimeout() {},
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
  document: stub(), AudioContext: undefined, webkitAudioContext: undefined,
  Math, Date, JSON, Object, Array, String, Number, isFinite, Symbol
};
win.window = win;
win.navigator = {};
vm.createContext(win);
vm.runInContext(src, win);
const GT = win.GT;
Object.assign(GT.CONFIG, JSON.parse(process.env.CFG || '{}'));
if (daily) GT.state.daily = true;

// Pressure model, `node test/sim.js model`: per zone (wave phase, end of zone) and vent at Glow tier II (or the tier given).
//   U = incoming creature HP/s over your damage/s: the share of time you must shoot creatures; the
//       rest is free for gates. B = one full wave's HP over the damage you deal while it crosses the
//       lane (minus REACT s to get there): above 1 that wave leaks even with perfect play.
// Boss rewards are assumed to add BOON_GROWTH damage per boss beaten.
if (vent === 'model'){
  const { CONFIG: C, ENEMY_TYPES: T, VENT_DEFS: V, fn } = GT, s = GT.state;
  const REACT = 2, BOON_GROWTH = 0.2, TIER = +runs || 2; // node test/sim.js model <tier>
  const h = k => Math.max(1, Math.round(T[k].hp*fn.hpMul()));
  // Bullets needed to clear one queued spawn (krill come in clusters, splitters burst into krill).
  const shots = (k, dmg) => { const n = x => Math.ceil(h(x)/dmg); return k === 'krill' ? C.KRILL_CLUSTER*n('krill') : k === 'splitter' ? n('splitter') + 3*n('krill') : n(k); };
  const slot = dmg => { let w = 0, n = 0; for (const a of fn.availableTypes()){ w += a.w; n += a.w*shots(a.t, dmg); } return n/w; };
  const vents = Object.keys(V);
  console.log('zone  size  intv  hpMul  ' + vents.map(v => (v + ' U/B').padStart(14)).join(''));
  for (let z = 1; z <= 10; z++){
    s.zone = z; s.tZone = 55;
    const n = fn.waveSize(), extra = z >= 2 ? 0.3*0.5 : 0, travel = 1/T.drifter.speed + (n-1)*C.WAVE_SPACING - REACT;
    const row = vents.map(v => {
      const d = V[v], dmg = d.dmg*(1 + BOON_GROWTH*(z-1));
      const g = Math.min(TIER, d.glowMax);
      const rate = d.fireRate*(g >= 1 ? C.GLOW_TIER_RATE : 1)*(d.bullets + (g >= 2 ? 1/C.GLOW_TWIN_EVERY : 0))*(1 + 0.5*(d.pierce + (g >= 3 ? 1 : 0)));
      const wave = n*slot(dmg);
      return ((wave*(1 + extra)/fn.waveInterval()/rate).toFixed(2) + ' / ' + (wave/(rate*travel)).toFixed(2)).padStart(14);
    });
    console.log(String(z).padStart(4) + String(n).padStart(6) + fn.waveInterval().toFixed(1).padStart(6) + fn.hpMul().toFixed(2).padStart(7) + '  ' + row.join(''));
  }
  process.exit(0);
}

const results = [];
let lastScreen = '', gSum = 0, gN = 0, g4 = 0;
for (let f = 0; results.length < +runs && f < 60 * 60 * 120; f++) {
  t += 1000 / 60; const c = q; q = []; c.forEach(fn => fn(t));
  const s = GT.state;
  if (s.screen === 'playing'){ gSum += s.glow; gN++; if (s.glow >= 4) g4++; }
  if (s.screen === 'gameover' && lastScreen !== 'gameover')
    results.push({ how: s.player.shells > 0 ? 'B' : (s.phase === 'boss' ? 'b' : 'w'), score: s.score, zone: s.zone, min: +(s.time / 60).toFixed(1), gates: s.gatesClaimed, bosses: s.bossesKilled });
  lastScreen = s.screen;
}
const avg = k => (results.reduce((a, r) => a + r[k], 0) / results.length).toFixed(1);
console.log(vent + (daily ? ' daily' : ''), results.map(r => `${r.how}z${r.zone}/${r.score}/${r.min}m`).join(' '));
console.log(`  glow avg ${(gSum/gN).toFixed(2)} at IV ${(100*g4/gN).toFixed(0)}%`);
console.log(`  avg score ${avg('score')} zone ${avg('zone')} min ${avg('min')} gates ${avg('gates')} bosses ${avg('bosses')}`);
