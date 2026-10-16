// Banco de rendimiento del dibujo (lecciones de CORE, parte 3: medir sin engañarse).
//
// Uso:  node tools/build.js && node tools/bench.js [--fotogramas 240] [--rondas 2]
//
// Abre dist/hive_breaker.html en Chromium con pantalla de Galaxy A34 (412 × 915, DPR 2: el
// juego no pasa de 2), prepara una base de media partida y mide cuánto tarda en pintarse un
// fotograma en dos escenas: el día y una noche dura (50 bichos a la vista), con el juego en
// marcha. Cada ronda empieza igual (misma semilla), para que se puedan comparar.
//
// Cómo mide: el lienzo se pinta por software (sin GPU) y tras cada fotograma se lee un píxel,
// que obliga a terminar de pintar de verdad (lección 15: si no, se mide cuándo se piden las
// órdenes, no cuándo se pintan). Lo que se pinta por software se parece a lo que cuesta en
// un móvil: los píxeles. Ojo: el TEXTO sale relativamente barato aquí y caro en el móvil.
//
// LAS CIFRAS ABSOLUTAS NO VALEN (lección 21): solo sirve comparar dos versiones en este mismo
// banco, alternando cada una dos veces (lección 16). El número de verdad, en un Android real.
//
// Necesita Playwright (en la nube ya está; en el ordenador vale NODE_PATH a otro proyecto).
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* probar la instalación global */ }
  try {
    const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return require(path.join(root, 'playwright'));
  } catch (e) {
    console.error('[bench] No encuentro Playwright (en la nube ya está; en el ordenador: NODE_PATH=<otro proyecto>/node_modules).');
    process.exit(1);
  }
}

function args(argv) {
  const a = { fotogramas: 240, rondas: 2, archivo: path.join(__dirname, '..', 'dist', 'hive_breaker.html') };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, '');
    if (k === 'archivo') a.archivo = path.resolve(argv[++i]);
    else if (k in a) a[k] = parseFloat(argv[++i]);
  }
  return a;
}

// Se ejecuta DENTRO de la página: prepara la escena y mide n fotogramas.
function scene(opts) {
  const G = HB.Game, V = HB.View;
  if (!window.__bench) {
    // El bucle del juego sigue pidiendo fotogramas: se le quita el dibujo para medir solo el nuestro.
    window.__bench = { frame: HB.Render.frame };
    HB.Render.frame = function () {};
    G.paused = true;
  }
  const frame = window.__bench.frame;
  const st = HB.State.newGame(4242);
  G.st = st; HB.settings = st.settings; G.mem = {}; G.botMem = {};
  HB.resetVis(st); V.cam.ready = false;
  st.ftue = {}; for (const k of HB.FTUE) st.ftue[k] = 1;   // sin tutorial ni avisos
  const R = st.regions[st.cur], d = HB.REGIONS[R.id];
  // base de media partida: las 22 primeras zonas compradas
  for (const z of d.zones.slice(0, 22)) HB.Logic.forceUnlock(st, z);
  R.credits = 1234; R.pile = 120;
  st.cmd.x = 6; st.cmd.y = 31.5;
  // unos segundos de juego de día para que todo esté en marcha (drones, máquinas, nave)
  const step = function (sec) {
    const dt = 1 / HB.CONFIG.tickHz;
    for (let t = 0; t < sec; t += dt) {
      HB.Logic.step(st, { x: 0, y: 0 }, dt);
      if (st.tick % HB.CONFIG.econEvery === 0) HB.Logic.econ(st, dt * HB.CONFIG.econEvery);
      for (const e of st.ev) HB.Juice.handle(st, e);
      st.ev.length = 0;
    }
  };
  step(8);
  if (opts.night) {
    // una noche dura (como la noche 10): 36 Swarmers, 8 Leapers y 6 Crushers a la vista
    R.nights = 9; R.heatOn = true;
    HB.Night.provoke(st);
    const N = R._night;
    for (const gr of N.groups) gr.done = true;
    let id = 1000;
    const add = function (type, n) {
      const E = HB.ENEMIES[type];
      for (let i = 0; i < n; i++) {
        const hp = E.hp * 3;
        R._bugs.push({ id: id++, type: type, x: 1.5 + HB.rand(st) * 9, y: 36.5 + HB.rand(st) * 6, hp: hp, maxHp: hp, r: E.r,
          cd: 0, st: 'move', z: 0, jt: 0, jx: 0, jy: 0, hitT: 0, stuck: 0, lastD: 1e9, phase: 0, dir: -Math.PI / 2, dead: false });
      }
    };
    add('swarmer', 36); add('leaper', 8); add('crusher', 6);
    step(3);
  }
  G.prevX = st.cmd.x; G.prevY = st.cmd.y;
  const g = V.ctx;
  // calentar (que se hagan las cachés de dibujos) y luego medir
  const tick = function () { if (opts.live) step(1 / 60); };
  for (let i = 0; i < 30; i++) { tick(); frame(G, 1, 1 / 60); }
  g.getImageData(0, 0, 1, 1);
  const times = [];
  for (let i = 0; i < opts.frames; i++) {
    tick();
    const t0 = performance.now();
    frame(G, 1, 1 / 60);
    g.getImageData(1, 1, 1, 1);
    times.push(performance.now() - t0);
  }
  times.sort(function (a, b) { return a - b; });
  let bugs = 0; for (const b of R._bugs || []) if (!b.dead) bugs++;
  return { med: times[Math.floor(times.length / 2)], p90: times[Math.floor(times.length * 0.9)], bugs: bugs, fx: HB.Fx.counts() };
}

(async function main() {
  const a = args(process.argv);
  if (!fs.existsSync(a.archivo)) { console.error('[bench] Primero: node tools/build.js'); process.exit(1); }
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--disable-gpu', '--disable-accelerated-2d-canvas'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', function (e) { errors.push(String(e)); });
  await page.goto('file://' + a.archivo);
  await page.waitForTimeout(1500);
  const scenes = [
    { name: 'día', night: false, live: true },
    { name: 'noche', night: true, live: true },
  ];
  const res = {};
  // la ronda -1 calienta el navegador y las cachés: no cuenta
  for (let r = -1; r < a.rondas; r++) {
    for (const s of scenes) {
      const out = await page.evaluate(scene, { night: s.night, live: s.live, frames: r < 0 ? 60 : a.fotogramas });
      if (r >= 0) (res[s.name] = res[s.name] || []).push(out);
    }
  }
  console.log('[bench] ' + path.basename(a.archivo) + ' · ' + a.fotogramas + ' fotogramas × ' + a.rondas + ' rondas · ms por fotograma (mediana / p90)');
  for (const s of scenes) {
    const list = res[s.name];
    console.log('  ' + s.name.padEnd(6) + list.map(function (o) { return o.med.toFixed(2) + ' / ' + o.p90.toFixed(2); }).join('   ') +
      (s.night ? '   (bichos vivos ' + list[0].bugs + ', partículas ' + list[0].fx.parts + ')' : ''));
  }
  if (errors.length) { console.log('[bench] ERRORES:\n  ' + errors.join('\n  ')); process.exitCode = 1; }
  await browser.close();
})();
