// Capturas automáticas del juego en un móvil simulado (para que Claude vea lo que dibuja).
//
// Uso:  node tools/build.js && node tools/capture.js [--segundos 60] [--cada 6] [--velocidad 4]
//
// Abre dist/hive_breaker.html en Chromium con pantalla de móvil (390 × 844), prueba el joystick
// con el ratón, activa el piloto automático y guarda capturas en capturas/ (no se sube a GitHub).
// Al final dice si hubo errores en la consola y los FPS medidos.
//
// Necesita Playwright. En la nube de Claude ya está instalado; en el ordenador no hace falta.
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
    console.error('[capture] No encuentro Playwright. En el ordenador no hace falta: abre dist/hive_breaker.html.');
    process.exit(1);
  }
}

function args(argv) {
  const a = { segundos: 60, cada: 6, velocidad: 4, ancho: 390, alto: 844 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, '');
    if (k in a) a[k] = parseFloat(argv[++i]);
  }
  return a;
}

(async function main() {
  const a = args(process.argv);
  const { chromium } = loadPlaywright();
  const root = path.join(__dirname, '..');
  const page0 = path.join(root, 'dist', 'hive_breaker.html');
  if (!fs.existsSync(page0)) { console.error('[capture] Primero: node tools/build.js'); process.exit(1); }
  const out = path.join(root, 'capturas');
  fs.mkdirSync(out, { recursive: true });

  const opts = {};
  if (fs.existsSync('/opt/pw-browsers/chromium')) opts.executablePath = undefined;
  const browser = await chromium.launch(opts);
  const ctx = await browser.newContext({
    viewport: { width: a.ancho, height: a.alto }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', function (e) { errors.push(String(e && e.stack || e)); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('file://' + page0);
  await page.waitForTimeout(1200);
  let n = 0;
  const shot = async function (name) {
    const f = path.join(out, String(n++).padStart(2, '0') + '_' + name + '.png');
    await page.screenshot({ path: f });
    console.log('[capture] ' + path.relative(root, f));
  };
  await shot('inicio');

  // Joystick con el ratón: apoyar, arrastrar a la izquierda y arriba, soltar.
  const cx = a.ancho / 2, cy = a.alto * 0.7;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(cx - i * 6, cy - i * 4); await page.waitForTimeout(16); }
  await page.waitForTimeout(500);
  await shot('joystick');
  await page.mouse.up();

  // El sonido: que ninguno falle (no se oye, pero se ejecuta).
  const audioErrs = await page.evaluate(function () { return HB.Audio.test(); });
  if (audioErrs.length) errors.push('sonido: ' + audioErrs.join(', '));
  else console.log('[capture] Sonidos: todos se generan sin fallos.');

  await page.evaluate(function (v) { HB.Game.autopilot = true; HB.Game.speed = v; HB.Game.showFps = true; }, a.velocidad);
  const t0 = Date.now();
  while (Date.now() - t0 < a.segundos * 1000) {
    await page.waitForTimeout(a.cada * 1000);
    const info = await page.evaluate(function () {
      const R = HB.Game.st.regions[HB.Game.st.cur];
      return { t: HB.Game.st.time, zones: Object.keys(R.bought).length, credits: R.credits, fps: HB.Game.fps };
    });
    await shot('t' + Math.round(info.t) + 's_z' + info.zones);
  }

  // Menú de ajustes
  await page.evaluate(function () { HB.Game.autopilot = false; HB.Menu.open(); });
  await page.waitForTimeout(300);
  await shot('ajustes');

  const fps = await page.evaluate(function () { return Math.round(HB.Game.fps); });
  console.log('[capture] FPS al final (Chromium del servidor, no un móvil): ' + fps);
  if (errors.length) { console.log('[capture] ERRORES:\n  ' + errors.join('\n  ')); process.exitCode = 1; }
  else console.log('[capture] Sin errores en la consola.');
  await browser.close();
})();
