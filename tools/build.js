// Monta el juego en UN SOLO archivo HTML, a partir de src/ (funcional 20).
//
// Uso (desde la carpeta del repositorio):  node tools/build.js
//
// Salidas (en dist/, que no se sube a GitHub porque se regenera):
//   dist/hive_breaker.html           documento completo: se abre con doble clic en el ordenador
//                                    y es lo que irá dentro de la app de Android (Capacitor)
//   dist/hive_breaker_artifact.html  lo mismo sin <html>/<head>/<body>: es lo que se publica
//                                    como Artifact para probar desde el móvil
//
// Antes de montar comprueba que no haya marcas de conflicto ni errores de sintaxis.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600&family=Teko:wght@500;600&display=swap">';

function fail(msg) {
  console.error('\n[build] PARADO: ' + msg + '\n');
  process.exit(1);
}

function read(file) { return fs.readFileSync(file, 'utf8'); }

function buildStamp() {
  const d = new Date();
  const date = d.toISOString().slice(0, 16).replace('T', ' ');
  let hash = 'local';
  try {
    hash = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execSync('git status --porcelain -- src', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (dirty) hash += '+';
  } catch (e) { /* sin git: se queda en 'local' */ }
  return date + ' ' + hash;
}

function build() {
  const jsDir = path.join(SRC, 'js');
  const files = fs.readdirSync(jsDir).filter(function (f) { return /^\d\d_.*\.js$/.test(f); }).sort();
  if (!files.length) fail('no hay archivos en src/js');

  const parts = [];
  for (const f of files) {
    const file = path.join(jsDir, f);
    const code = read(file);
    if (/^(<<<<<<< |>>>>>>> )/m.test(code)) fail('marcas de conflicto en src/js/' + f);
    try { new vm.Script(code, { filename: 'src/js/' + f }); }
    catch (e) { fail('error de sintaxis en src/js/' + f + '\n' + (e.stack || e.message).split('\n').slice(0, 5).join('\n')); }
    parts.push('// ===== ' + f + ' =====\n' + code);
  }

  const css = read(path.join(SRC, 'style.css'));
  const body = read(path.join(SRC, 'body.html'));
  for (const [name, text] of [['style.css', css], ['body.html', body]]) {
    if (/^(<<<<<<< |>>>>>>> )/m.test(text)) fail('marcas de conflicto en src/' + name);
  }

  const stamp = buildStamp();
  let js = 'globalThis.HB = globalThis.HB || {}; HB.BUILD = ' + JSON.stringify(stamp) + ';\n' + parts.join('\n');
  js = js.replace(/<\/script/gi, '<\\/script');

  const head = '<title>Hive Breaker</title>' + FONTS + '<style>\n' + css + '</style>\n';
  const full =
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n' +
    '<meta name="theme-color" content="#121519">\n' + head + '</head>\n<body>\n' + body + '<script>\n' + js + '</script>\n</body>\n</html>\n';
  // El Artifact añade él solo <html>, <head> y <body>; si se los ponemos, se duplican.
  const artifact = head + body + '<script>\n' + js + '</script>\n';

  fs.mkdirSync(DIST, { recursive: true });
  const outFull = path.join(DIST, 'hive_breaker.html');
  const outArt = path.join(DIST, 'hive_breaker_artifact.html');
  fs.writeFileSync(outFull, full);
  fs.writeFileSync(outArt, artifact);
  const kb = function (s) { return (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB'; };
  console.log('[build] ' + files.length + ' archivos de src/js · versión ' + stamp);
  console.log('[build] dist/hive_breaker.html          ' + kb(full) + '  (abrir en el navegador)');
  console.log('[build] dist/hive_breaker_artifact.html ' + kb(artifact) + '  (para publicar como Artifact)');
  return { full: outFull, artifact: outArt, stamp: stamp };
}

if (require.main === module) build();
module.exports = { build: build };
