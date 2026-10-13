// Carga la LÓGICA del juego (src/js/00-45) en Node, exactamente los mismos archivos que van en
// el HTML. La usan el simulador y las comprobaciones. No necesita instalar nada.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const JS_DIR = path.join(__dirname, '..', 'src', 'js');

// Los archivos de lógica son los que empiezan por 00-49. Los de 50 en adelante usan el navegador.
function logicFiles() {
  return fs.readdirSync(JS_DIR)
    .filter(function (f) { return /^\d\d_.*\.js$/.test(f) && parseInt(f, 10) < 50; })
    .sort();
}

function loadLogic() {
  const ctx = { console: console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of logicFiles()) {
    const file = path.join(JS_DIR, f);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  return ctx.HB;
}

module.exports = { loadLogic: loadLogic, logicFiles: logicFiles, JS_DIR: JS_DIR };
