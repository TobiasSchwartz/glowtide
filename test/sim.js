// Headless balance sim: runs index.html's script in Node with a stubbed DOM and the #bot autopilot.
// Death codes: B = boss reached the reef, b = shells lost during a boss, w = shells lost in waves.
// Usage: node test/sim.js [vent] [runs] [daily]   e.g. node test/sim.js lantern 8
const fs = require('fs'), vm = require('vm'), path = require('path');
const [vent = 'lantern', runs = '6', daily = ''] = process.argv.slice(2);
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
if (daily) GT.state.daily = true;

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
