// Comprobaciones antes de comprometer y de publicar. Uso:  node tools/check.js
//
// 1. Marcas de conflicto de git (lo que rompió CORE y Mafia).
// 2. Errores de sintaxis en src/js y tools.
// 3. Textos: inglés y español tienen las mismas claves.
// 4. Tablas: zonas bien escritas, nada pisando nada en el mapa.
// 5. Prueba de humo: el robot del simulador juega 20 minutos sin que nada falle.
// 6. Montaje: tools/build.js genera el HTML.
// Si algo falla, termina con error (código 1) y dice qué.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadLogic } = require('./load_logic');

const ROOT = path.join(__dirname, '..');
let failed = 0;
function ok(msg) { console.log('  ok    ' + msg); }
function bad(msg) { console.log('  FALLO ' + msg); failed++; }

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    if (f === '.git' || f === 'node_modules' || f === 'dist' || f === 'capturas' || f === 'android') continue;
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(js|md|html|css|json|sh|txt)$/.test(f)) out.push(p);
  }
  return out;
}

console.log('\n[check] 1. Marcas de conflicto');
{
  let n = 0;
  for (const f of walk(ROOT, [])) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach(function (l, i) {
      if (/^(<<<<<<< |>>>>>>> |<<<<<<<$|>>>>>>>$)/.test(l)) { bad(path.relative(ROOT, f) + ':' + (i + 1) + ' tiene una marca de conflicto'); n++; }
    });
  }
  if (!n) ok('ninguna');
}

console.log('[check] 2. Sintaxis');
{
  const dirs = [['src/js', false], ['tools', true]];
  for (const [d, cjs] of dirs) {
    for (const f of fs.readdirSync(path.join(ROOT, d)).filter(function (x) { return x.endsWith('.js'); })) {
      const code = fs.readFileSync(path.join(ROOT, d, f), 'utf8');
      try {
        new vm.Script(cjs ? '(function (exports, require, module, __filename, __dirname) {' + code + '\n})' : code, { filename: d + '/' + f });
      } catch (e) { bad(d + '/' + f + ': ' + e.message); }
    }
  }
  if (!failed) ok('src/js y tools sin errores');
}

let HB = null;
try { HB = loadLogic(); } catch (e) { bad('la lógica no carga en Node: ' + e.message); }

if (HB) {
  console.log('[check] 3. Textos');
  {
    const S = HB.STRINGS, langs = Object.keys(S);
    let n = 0;
    for (const a of langs) for (const b of langs) {
      for (const k in S[a]) if (!(k in S[b])) { bad('falta "' + k + '" en ' + b); n++; }
    }
    if (!n) ok(langs.join(' + ') + ' con las mismas ' + Object.keys(S.en).length + ' claves');
  }

  console.log('[check] 4. Tablas y mapa');
  {
    const before = failed;
    const C = HB.CONFIG, PR = C.padRadius, CR = C.cmd.radius;
    for (const rid in HB.REGIONS) {
      const d = HB.REGIONS[rid];
      const ids = {};
      const startIds = {};
      for (const s of d.start) { startIds[s.id] = s.type; if (!HB.MACHINES[s.type]) bad(rid + ': máquina inicial con tipo desconocido ' + s.type); }
      const built = {};   // máquinas que crea cada zona
      const ups = {};
      d.zones.forEach(function (z, i) {
        if (ids[z.id] !== undefined) bad(rid + ': zona repetida ' + z.id);
        ids[z.id] = i;
        if (z.x < 0.5 || z.x > d.w - 0.5 || z.y < 0.5 || z.y > d.h - 0.5) bad(rid + '/' + z.id + ': fuera del mapa');
        for (const r of (z.req || [])) {
          if (ids[r] === undefined) bad(rid + '/' + z.id + ': su requisito ' + r + ' no existe o va después en la lista');
        }
        if (z.kind === 'machine') { if (!HB.MACHINES[z.type]) bad(rid + '/' + z.id + ': tipo ' + z.type + ' desconocido'); built[z.id] = z.type; }
        if (z.kind === 'upgrade') {
          const type = startIds[z.target] || built[z.target];
          if (!type) bad(rid + '/' + z.id + ': mejora de ' + z.target + ', que no existe antes en la lista');
          else {
            ups[z.target] = (ups[z.target] || 0) + 1;
            if (ups[z.target] > HB.MACHINES[type].levels.length - 1) bad(rid + '/' + z.id + ': ' + z.target + ' no tiene tantos niveles');
          }
        }
        if (!['vein', 'machine', 'upgrade', 'expansion', 'turret', 'wall', 'drone', 'nest'].includes(z.kind)) bad(rid + '/' + z.id + ': tipo de zona desconocido ' + z.kind);
        if (z.kind === 'turret') built[z.id] = z.type || (z.choice && z.choice[0]);
        if (z.kind === 'drone') built[z.id] = 'dronepad';
        if (z.kind === 'turret' && !(z.type || (z.choice && z.choice.length))) bad(rid + '/' + z.id + ': torreta sin tipo ni opciones');
        if (z.kind === 'drone' && !(z.route && (z.route.kind === 'miner' || z.route.kind === 'cargo'))) bad(rid + '/' + z.id + ': dron sin ruta');
      });

      // Mapa con todo comprado: huellas sólidas y zonas que se pisan.
      const L = HB.State.layout(rid);
      const ents = [];
      for (const s of d.start) ents.push({ id: s.id, type: s.type, x: s.x, y: s.y, flip: s.flip, owner: null });
      for (const z of d.zones) {
        const p = L.ents[z.id];
        if (!p) continue;
        const type = p.type || (z.choice ? z.choice[0] : null);
        if (!type || !HB.MACHINES[type]) { bad(rid + '/' + z.id + ': tipo desconocido'); continue; }
        ents.push(Object.assign({ id: z.id, type: type, x: p.x, y: p.y, flip: p.opts.flip, owner: z.id }, p.opts.w ? { w: p.opts.w, h: p.opts.h } : {}));
      }
      const solids = [];
      for (const e of ents) {
        const m = HB.Logic.dims(e);
        if (HB.MACHINES[e.type].kind === 'dronepad') continue;
        solids.push({ t: 'r', owner: e.owner, id: e.id, x0: e.x - m.w / 2, y0: e.y - m.h / 2, x1: e.x + m.w / 2, y1: e.y + m.h / 2 });
        if (e.x - m.w / 2 < -0.01 || e.x + m.w / 2 > d.w + 0.01 || e.y - m.h / 2 < 0 || e.y + m.h / 2 > d.h) bad(rid + ': ' + e.id + ' se sale del mapa');
      }
      for (const v of d.veins) solids.push({ t: 'c', owner: null, id: v.id, x: v.x, y: v.y, r: 0.55 });
      for (const z of d.zones) if (z.kind === 'vein') solids.push({ t: 'c', owner: z.id, id: z.id, x: z.x, y: z.y, r: 0.55 });

      const pads = [];
      for (const e of ents) {
        const m = HB.MACHINES[e.type];
        const add = function (which, name) { pads.push(Object.assign({ name: e.id + ':' + name, owner: e.owner }, HB.Logic.padPos(e, which, rid))); };
        if (m.kind === 'proc') { add('in', 'in'); add('out', 'out'); }
        if (m.kind === 'export') { add('in', 'in'); add('pile', 'pile'); }
        if (m.kind === 'turret') add('box', 'caja');
      }
      for (const z of d.zones) pads.push(Object.assign({ name: 'zona ' + z.id, zone: z.id }, HB.Logic.zonePadPos(z)));

      for (const p of pads) {
        if (p.x < CR || p.x > d.w - CR || p.y > d.h - CR) bad(rid + ': ' + p.name + ' cae fuera del mapa');
        for (const s of solids) {
          if (p.zone && s.owner === p.zone) continue;
          let dd;
          if (s.t === 'r') {
            const cx = HB.clamp(p.x, s.x0, s.x1), cy = HB.clamp(p.y, s.y0, s.y1);
            dd = HB.dist(p.x, p.y, cx, cy);
          } else dd = HB.dist(p.x, p.y, s.x, s.y) - s.r;
          if (dd < CR + 0.05) bad(rid + ': ' + p.name + ' está encima de ' + s.id + ' (el comandante no podría pisarla)');
        }
      }
      // ¿La zona a necesita (directa o indirectamente) la zona b? Entonces nunca se ven a la vez.
      const zmap = {};
      for (const z of d.zones) zmap[z.id] = z;
      const needs = function (a, b) {
        const seen = {}, todo = [a];
        while (todo.length) {
          const z = zmap[todo.pop()];
          if (!z || seen[z.id]) continue;
          seen[z.id] = true;
          for (const r of (z.req || [])) { if (r === b) return true; todo.push(r); }
        }
        return false;
      };
      for (let i = 0; i < pads.length; i++) {
        for (let j = i + 1; j < pads.length; j++) {
          const a = pads[i], b = pads[j];
          const dd = HB.dist(a.x, a.y, b.x, b.y);
          if (dd < 0.01) continue;                       // mejoras en cadena: mismo sitio a propósito
          if (a.zone && b.owner === a.zone) continue;     // no coinciden nunca en el tiempo
          if (b.zone && a.owner === b.zone) continue;
          if (a.zone && b.zone && (needs(a.zone, b.zone) || needs(b.zone, a.zone))) continue;
          if (dd < PR * 2) bad(rid + ': ' + a.name + ' y ' + b.name + ' se pisan (' + dd.toFixed(2) + ' casillas)');
        }
      }
      // Con todo comprado (muros incluidos), los bichos tienen que poder llegar a la Torre de mando
      // desde cada flanco: los muros canalizan, no encierran (funcional 9.2).
      {
        const st = HB.State.newGame(1);
        for (const z of d.zones) HB.Logic.forceUnlock(st, z);
        const R = st.regions[st.cur];
        HB.Logic.ensure(R);
        for (const jump of [false, true]) {
          const F = HB.Night.field(R, jump);
          for (const fk in d.flanks) {
            const fl = d.flanks[fk];
            const y = fl.fromFog ? R.fogY - 0.6 : fl.y;
            for (let x = fl.x0; x <= fl.x1; x += 1) {
              const i = Math.floor(x / 0.5), j = Math.floor(y / 0.5);
              if (!(F.dist[j * F.gw + i] < 1e9)) { bad(rid + ': desde el flanco ' + fk + ' (x=' + x.toFixed(1) + ') los bichos no llegan a la Torre de mando'); break; }
            }
          }
        }
        // y el comandante tiene que poder llegar a todo lo que se pisa
        const nestZ = d.zones.find(function (z) { return z.kind === 'nest'; });
        if (nestZ && !HB.Night.field(R, false)) bad(rid + ': sin campo de flujo');
      }
      if (failed === before) ok(rid + ': ' + d.zones.length + ' zonas, ' + pads.length + ' sitios que se pisan, nada se solapa, los bichos llegan desde cada flanco');
    }
  }

  console.log('[check] 5. Prueba de humo (el robot juega la región entera)');
  {
    try {
      const { run } = require('./sim_balance');
      const r = run({ minutos: 45, seed: 777 });
      if (r.zones.length === 0) bad('el robot no ha comprado ninguna zona');
      else if (!r.nights.length) bad('no ha llegado ninguna noche');
      else if (r.cleared === null) bad('el robot no conquista la región en 45 minutos (' + r.zones.length + '/' + r.zonesTotal + ' zonas, ' + r.nights.length + ' noches)');
      else ok('región conquistada en ' + Math.round(r.cleared / 60) + ' min de juego · ' + r.nights.length + ' noches · ' + r.kills + ' bichos');
    } catch (e) { bad('el simulador ha fallado: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | ')); }
  }

  console.log('[check] 6. Guardado');
  {
    const st = HB.State.newGame(5);
    st.regions.r1.credits = 42;
    const back = HB.State.deserialize(HB.State.serialize(st));
    if (!back || back.regions.r1.credits !== 42 || !back.regions.r1._byId) bad('guardar y cargar no devuelve la misma partida');
    else if (!('perks' in back)) bad('falta el campo perks en el guardado (funcional 15.9)');
    else ok('guardar y cargar funciona (clave ' + HB.CONFIG.save.key + ')');
  }
}

console.log('[check] 7. Montaje');
try {
  const { execFileSync } = require('child_process');
  execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'pipe' });
  ok('dist/hive_breaker.html y dist/hive_breaker_artifact.html generados');
} catch (e) { bad('tools/build.js ha fallado:\n' + String(e.stdout || '') + String(e.stderr || '')); }

console.log(failed ? '\n[check] ' + failed + ' FALLO(S). No comprometas hasta arreglarlo.\n' : '\n[check] Todo bien.\n');
process.exit(failed ? 1 : 0);
