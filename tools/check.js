// Comprobaciones antes de comprometer y de publicar. Uso:  node tools/check.js
//
// 1. Marcas de conflicto de git (lo que rompió CORE y Mafia).
// 2. Errores de sintaxis en src/js y tools.
// 3. Textos (sistema de idiomas de CORE): todos los idiomas con las mismas claves y los mismos
//    huecos {0}/{1}, y todo texto que pide el código existe.
// 4. Tablas: zonas bien escritas, nada pisando nada en el mapa.
// 5. Prueba de humo: el robot del simulador juega la región entera sin que nada falle.
// 6. Guardado: guardar y cargar devuelve la misma partida.
// 7. Mientras no juegas: el cálculo cuadra con lo que la base vende de verdad, y los topes.
// 8. Cofres, suministro aéreo y reciclador: dan lo que dicen las tablas, se guardan, y con la
//    pila atascada la flecha lleva al reciclador y se sale del atasco.
// 9. Arte hecho con IA: cada imagen tiene su sitio.
// 10. Montaje: tools/build.js genera el HTML.
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
    // El sistema de idiomas de CORE: cada idioma completo, sin claves de más, sin huecos perdidos,
    // y todo lo que pide el código existe (si no, en pantalla saldría el nombre de la clave).
    const S = HB.STRINGS, langs = Object.keys(S);
    let n = 0;
    for (const a of langs) for (const b of langs) {
      for (const k in S[a]) if (!(k in S[b])) { bad('falta "' + k + '" en ' + b + (a === 'en' ? '' : ' (¿clave mal escrita en ' + a + '?)')); n++; }
    }
    const holes = function (str) { return (String(str).match(/\{\d\}/g) || []).sort().join(''); };
    for (const l of langs) for (const k in S[l]) {
      if (typeof S[l][k] !== 'string' || !S[l][k]) { bad(l + '/' + k + ': texto vacío'); n++; }
      else if (S.en[k] !== undefined && holes(S[l][k]) !== holes(S.en[k])) { bad(l + '/' + k + ': huecos distintos del inglés (' + holes(S.en[k]) + ' → ' + holes(S[l][k]) + ')'); n++; }
    }
    let used = 0;
    for (const f of fs.readdirSync(path.join(ROOT, 'src', 'js'))) {
      // sin las líneas de comentario; y solo claves enteras (las que se arman, como 't_' + tipo, no)
      const txt = fs.readFileSync(path.join(ROOT, 'src', 'js', f), 'utf8').split('\n')
        .filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
      const re = /(?:HB\.T|[^A-Za-z_.$]T)\('([a-z_0-9]+)'\s*[,)]/g;
      let m;
      while ((m = re.exec(txt))) { used++; if (!(m[1] in S.en)) { bad(f + ': pide el texto "' + m[1] + '", que no existe'); n++; } }
    }
    HB.lang = 'qa';
    if (HB.T('max').charAt(0) !== '[') { bad('el pseudo-idioma no marca los textos'); n++; }
    HB.lang = 'en';
    if (!n) ok(langs.join(' + ') + ' con las mismas ' + Object.keys(S.en).length + ' claves y los mismos huecos · ' + used + ' textos pedidos en el código, todos existen');
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
      if (d.trash) pads.push({ name: 'reciclador', x: d.trash.x, y: d.trash.y });

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
      // La región 1 está pensada para unos 55-60 min del robot (0.4.0); 90 deja margen.
      const LIMIT = 90;
      const r = run({ minutos: LIMIT, seed: 777 });
      if (r.zones.length === 0) bad('el robot no ha comprado ninguna zona');
      else if (!r.nights.length) bad('no ha llegado ninguna noche');
      else if (r.cleared === null) bad('el robot no conquista la región en ' + LIMIT + ' minutos (' + r.zones.length + '/' + r.zonesTotal + ' zonas, ' + r.nights.length + ' noches)');
      else if (!(r.gems >= 150)) bad('el robot conquista la región pero no recibe los dos cofres (Gemas: ' + r.gems + ')');
      else ok('región conquistada en ' + Math.round(r.cleared / 60) + ' min de juego · ' + r.nights.length + ' noches · ' + r.kills + ' bichos · ' + r.gems + ' Gemas');
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

  console.log('[check] 7. Mientras no juegas (offline)');
  try {
    const O = HB.Offline, K = HB.CONFIG.offline, before = failed;
    // Sin drones que lleguen a la exportación, la base no vende nada sola.
    const st0 = HB.State.newGame(9);
    st0.savedAt = 1e12;
    if (O.check(st0, 1e12 + 3600e3)) bad('offline: una partida nueva gana dinero sin drones');
    // Con la cadena de drones hasta la exportación (todo lo de la lista hasta drone_cargo_2).
    const st = HB.State.newGame(9), R = st.regions.r1;
    for (const z of HB.REGIONS.r1.zones) { HB.Logic.forceUnlock(st, z); if (z.id === 'drone_cargo_2') break; }
    HB.Logic.econ(st, 0.1);
    const rate = O.rate(st);
    // Lo que vende de verdad: 15 min de drones y máquinas, sin comandante ni noches.
    const sim = HB.State.deserialize(HB.State.serialize(st)), Q = sim.regions.r1;
    Q.heatOn = false;
    const dt = 1 / HB.CONFIG.tickHz;
    let earned = 0;
    for (let i = 0, n = 15 * 60 * HB.CONFIG.tickHz; i < n; i++) {
      HB.Drones.step(sim, Q, dt);
      if (i % HB.CONFIG.econEvery === 0) { HB.Logic.econ(sim, dt * HB.CONFIG.econEvery); if (i > 120 * HB.CONFIG.tickHz) earned += Q.pile; Q.pile = 0; }
      sim.ev.length = 0;
    }
    const real = earned / (13 * 60);
    if (!(rate > 0)) bad('offline: con drones hasta la exportación, el ritmo calculado es 0');
    else if (Math.abs(rate - real) > real * 0.1) bad('offline: el cálculo da $' + rate.toFixed(2) + '/s y la base vende $' + real.toFixed(2) + '/s');
    // Topes: caja fuerte, 2 h, reloj hacia atrás y ausencias cortas.
    st.savedAt = 1e12;
    const v = O.compute(st, 1e12 + 3600e3);
    if (!v || v.amount !== Math.min(O.vaultCap(R), Math.floor(rate * 3600))) bad('offline: 1 h fuera no respeta la caja fuerte');
    K.vault = false;
    const t = O.compute(st, 1e12 + 5 * 3600e3);
    if (!t || t.capped !== 'time' || t.amount !== Math.floor(rate * K.cap)) bad('offline: 5 h fuera no se corta en ' + K.cap / 3600 + ' h');
    K.vault = true;
    if (O.compute(st, 1e12 - 3600e3)) bad('offline: con la hora hacia atrás se gana dinero');
    if (O.compute(st, 1e12 + (K.minAway - 1) * 1000)) bad('offline: sale la pantalla tras menos de ' + K.minAway + ' s fuera');
    // Cobrar ×2, y que la pantalla pendiente sobreviva a guardar y cargar.
    const a = O.check(st, 1e12 + 3600e3);
    const back = HB.State.deserialize(HB.State.serialize(st));
    if (!a || !back.away || back.away.amount !== a.amount) bad('offline: la pantalla de regreso no se guarda');
    const c0 = R.credits;
    O.claim(st, 2);
    if (R.credits !== c0 + a.amount * 2 || st.away) bad('offline: cobrar ×2 no da el doble');
    if (failed === before) ok('ritmo calculado $' + rate.toFixed(2) + '/s · real $' + real.toFixed(2) + '/s · 1 h fuera = $' + a.amount + ' (caja fuerte) · topes de 2 h y de reloj bien');
  } catch (e) { bad('offline ha fallado: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | ')); }

  console.log('[check] 8. Cofres, suministro aéreo y reciclador');
  try {
    const before = failed;
    const st = HB.State.newGame(3), R = st.regions.r1;
    for (const kind in HB.CHESTS) {
      HB.Chests.give(st, kind);
      const back = HB.State.deserialize(HB.State.serialize(st));
      if (!back || back.chests[back.chests.length - 1] !== kind) bad('cofres: el cofre «' + kind + '» se pierde al guardar y cargar');
      const c0 = R.credits, g0 = st.gems;
      let wantC = 0, wantG = 0;
      for (const p of HB.CHESTS[kind].prizes) { if (p.k === 'credits') wantC += p.n; else if (p.k === 'gems') wantG += p.n; else bad('cofres: premio desconocido «' + p.k + '»'); }
      HB.Chests.claim(st);
      if (R.credits - c0 !== wantC || st.gems - g0 !== wantG) bad('cofres: el cofre «' + kind + '» no da lo que dice la tabla');
    }
    if (st.chests.length) bad('cofres: quedan cofres sin abrir tras cobrarlos');
    const back = HB.State.deserialize(HB.State.serialize(st));
    if (back.gems !== st.gems) bad('cofres: las Gemas no se guardan');
    if (failed === before) ok(Object.keys(HB.CHESTS).length + ' cofres: dan lo que dice la tabla y se guardan (' + st.gems + ' Gemas en total)');
  } catch (e) { bad('los cofres han fallado: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | ')); }
  try {
    const before = failed, K = HB.CONFIG.supply;
    const st = HB.State.newGame(4), R = st.regions.r1;
    HB.Logic.ensure(R);
    const dt = 1 / HB.CONFIG.tickHz;
    // antes de la primera noche ganada no cae nada
    for (let t = 0; t < K.every[1] + 5; t += dt) HB.Supply.step(st, R, dt);
    if (R.supply.box) bad('suministro: cae una caja antes de la primera noche ganada');
    R.nights = K.from;
    let fell = null;
    for (let t = 0; t < K.every[1] + 5 && !fell; t += dt) { HB.Supply.step(st, R, dt); if (R.supply.box) fell = t; }
    if (fell === null) bad('suministro: en ' + K.every[1] + ' s de día no cae ninguna caja');
    else {
      const b = R.supply.box;
      for (let t = 0; t < K.fall + 0.1; t += dt) HB.Supply.step(st, R, dt);
      st.cmd.x = b.x; st.cmd.y = b.y;
      HB.Supply.step(st, R, dt);
      if (!st.supply || !(st.supply.amount >= K.min)) bad('suministro: al pisar la caja no sale la ventana con al menos $' + K.min);
      else {
        const back = HB.State.deserialize(HB.State.serialize(st));
        if (!back.supply || back.supply.amount !== st.supply.amount) bad('suministro: la caja abierta no se guarda');
        const c0 = R.credits, amount = st.supply.amount;
        HB.Supply.claim(st, true);
        if (R.credits - c0 !== amount || st.supply) bad('suministro: con el vídeo no da lo prometido');
      }
    }
    if (failed === before) ok('suministro aéreo: cae tras la primera noche, se abre al pisarlo y paga con el vídeo');
  } catch (e) { bad('el suministro aéreo ha fallado: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | ')); }
  try {
    // El atasco: pila llena de mineral, Fundición llena por los dos lados y sin drones.
    const before = failed, st = HB.State.newGame(6), R = st.regions.r1, sm = R._byId.smelter_1;
    const L = HB.Logic.level(sm), cap = HB.CONFIG.cmd.stackCap;
    sm.inBuf.ore = L.inCap; sm.out = L.outCap;
    for (let i = 0; i < cap; i++) st.cmd.stack.push('ore');
    const mem = {}, inp = { x: 0, y: 0 }, dt = 1 / HB.CONFIG.tickHz;
    const t0 = HB.Advisor.target(st, mem);
    if (t0.kind !== 'trash') bad('reciclador: con la pila atascada la flecha no lleva al reciclador (' + t0.kind + ')');
    for (let i = 0; i < 30 * HB.CONFIG.tickHz && st.cmd.stack.length >= cap; i++) { HB.Advisor.bot(st, mem, inp); HB.Logic.step(st, inp, dt); st.ev.length = 0; }
    if (st.cmd.stack.length >= cap) bad('reciclador: en 30 s no se vacía la pila');
    // y con la pila ya vacía, vuelve a lo normal (recoger las Placas)
    for (let i = 0; i < 5 * HB.CONFIG.tickHz && st.cmd.stack.length; i++) { HB.Advisor.bot(st, mem, inp); HB.Logic.step(st, inp, dt); st.ev.length = 0; }
    const t1 = HB.Advisor.target(st, mem);
    if (t1.kind === 'trash') bad('reciclador: con la pila vacía la flecha sigue en el reciclador');
    if (failed === before) ok('reciclador: con la pila atascada, la flecha lleva a él y se sale del atasco');
  } catch (e) { bad('el reciclador ha fallado: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | ')); }
}

console.log('[check] 9. Arte hecho con IA (assets/sprites)');
{
  const dir = path.join(ROOT, 'assets', 'sprites');
  const specs = fs.readFileSync(path.join(ROOT, 'src', 'js', '67_art_images.js'), 'utf8');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(function (f) { return /\.(webp|png)$/.test(f); }) : [];
  let n = 0;
  for (const f of files) {
    const name = f.replace(/\.(webp|png)$/, '');
    if (specs.indexOf(name + ':') < 0) { bad('assets/sprites/' + f + ': el juego no sabe dónde usarla (falta en ART_SPECS)'); n++; }
  }
  if (!n) ok(files.length ? files.length + ' imágenes, todas con su sitio' : 'todavía ninguna (se usan los dibujos hechos con código)');
}

console.log('[check] 10. Montaje');
try {
  const { execFileSync } = require('child_process');
  execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'pipe' });
  ok('dist/hive_breaker.html y dist/hive_breaker_artifact.html generados');
} catch (e) { bad('tools/build.js ha fallado:\n' + String(e.stdout || '') + String(e.stderr || '')); }

console.log(failed ? '\n[check] ' + failed + ' FALLO(S). No comprometas hasta arreglarlo.\n' : '\n[check] Todo bien.\n');
process.exit(failed ? 1 : 0);
