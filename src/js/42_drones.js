// Hive Breaker — drones (funcional 7). Sin DOM: lo usa también el simulador.
//
// Cada base de drones tiene una ruta fija:
//   'miner': mina en sus vetas y lleva el Ore a la entrada de una máquina.
//   'cargo': recoge de la salida de una máquina y lo deja en la entrada de otra.
// Vuelan en línea recta. De noche se refugian en su base si hay bichos cerca.
// Capacidad de paso = drones × carga × velocidad: si sobra producción, el montón de salida crece
// hasta «MAX»; si falta, la máquina avisa «NO INPUT». El jugador lo lee sin ver un número.
// Los drones no se guardan: se rehacen desde sus bases al cargar.
(function (HB) {
  'use strict';

  const PAD = function () { return HB.MACHINES.dronepad; };

  function padLevel(pad) { return PAD().levels[pad.level - 1]; }

  function sync(st, R) {
    if (R._drones && R._dronesVer === R._solidsVer) return;
    const loading = !R._drones;   // al cargar la partida se rehacen: no se anuncian otra vez
    R._drones = R._drones || [];
    for (const e of R.ents) {
      if (HB.MACHINES[e.type].kind !== 'dronepad') continue;
      const lv = padLevel(e);
      let have = 0;
      for (const d of R._drones) if (d.pad === e.id) have++;
      for (let i = have; i < lv.n; i++) {
        const d = { id: e.id + '#' + i, pad: e.id, idx: i, x: e.x, y: e.y, st: 'toSrc', carry: [], t: 0, wait: 0, hide: 0, drop: 1.2 };
        R._drones.push(d);
        if (!loading) HB.Logic.ev(st, 'droneNew', d, e);
      }
    }
    R._dronesVer = R._solidsVer;
  }

  function moveTo(d, tx, ty, speed, dt) {
    const dx = tx - d.x, dy = ty - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const s = speed * dt;
    if (dist <= s || dist < 0.02) { d.x = tx; d.y = ty; return true; }
    d.x += dx / dist * s; d.y += dy / dist * s;
    d.dir = Math.atan2(dy, dx);
    return false;
  }

  function danger(R, x, y, r) {
    const bugs = R._bugs;
    if (!bugs || !bugs.length) return false;
    const r2 = r * r;
    for (const b of bugs) if (!b.dead && HB.dist2(x, y, b.x, b.y) < r2) return true;
    return false;
  }

  // Cuánto deja un dron de carga en la salida antes de llevárselo a la exportación (funcional 5.4).
  function reserve(src, dst) {
    if (HB.MACHINES[dst.type].kind !== 'export') return 0;
    if (src.prio === 'defense') return Infinity;
    if (src.prio === 'profit') return 0;
    return Math.floor(HB.Logic.level(src).outCap / 2);
  }

  function hover(d, p) { return { x: p.x + (d.idx - 1) * 0.32, y: p.y - 0.15 }; }

  function minerStep(st, R, d, pad, lv, dt) {
    const route = pad.route;
    const dst = R._byId[route.to];
    // reparte las vetas de su ruta entre los drones de la misma base
    let vein = null, k = 0;
    for (const v of R.veins) {
      if (route.veins.indexOf(v.id) < 0) continue;
      if (!vein || k === d.idx % (route.veins.length)) vein = v;
      k++;
    }
    if (!vein || !dst || dst.dead) { moveTo(d, pad.x, pad.y, lv.speed, dt); return; }
    if (d.st === 'toSrc') {
      const a = -Math.PI / 2 + (d.idx - 1) * 0.9;
      if (moveTo(d, vein.x + Math.cos(a) * 0.75, vein.y - 0.35 + Math.sin(a) * 0.4, lv.speed, dt)) { d.st = 'load'; d.t = 0; }
    } else if (d.st === 'load') {
      d.t += dt;
      while (d.t >= PAD().mineEvery && d.carry.length < lv.cap) {
        d.t -= PAD().mineEvery;
        d.carry.push('ore');
        HB.Logic.ev(st, 'droneMine', d, vein);
      }
      if (d.carry.length >= lv.cap) { d.st = 'toDst'; d.t = 0; }
    } else if (d.st === 'toDst') {
      const p = hover(d, HB.Logic.padPos(dst, 'in'));
      if (moveTo(d, p.x, p.y, lv.speed, dt)) { d.st = 'unload'; d.t = 0; }
    } else if (d.st === 'unload') {
      unload(st, d, dst, dt);
      if (!d.carry.length) d.st = 'toSrc';
    }
  }

  function unload(st, d, dst, dt) {
    d.t += dt;
    while (d.t >= PAD().moveEvery && d.carry.length) {
      const it = d.carry[d.carry.length - 1];
      if (!HB.Logic.accepts(dst, it)) { d.t = 0; d.wait += dt; return; }
      d.t -= PAD().moveEvery;
      d.carry.pop();
      dst.inBuf[it]++;
      HB.Logic.ev(st, 'droneDrop', d, dst, it);
    }
  }

  function cargoStep(st, R, d, pad, lv, dt) {
    const route = pad.route;
    const src = R._byId[route.from], dst = R._byId[route.to];
    if (!src || !dst || src.dead || dst.dead) { moveTo(d, pad.x, pad.y, lv.speed, dt); return; }
    const out = HB.MACHINES[src.type].output;
    if (d.st === 'toSrc') {
      const p = hover(d, HB.Logic.padPos(src, 'out'));
      if (moveTo(d, p.x, p.y, lv.speed, dt)) { d.st = 'load'; d.t = 0; d.wait = 0; }
    } else if (d.st === 'load') {
      d.t += dt;
      const res = reserve(src, dst);
      while (d.t >= PAD().moveEvery && d.carry.length < lv.cap && src.out > res) {
        d.t -= PAD().moveEvery;
        src.out--;
        d.carry.push(out);
        HB.Logic.ev(st, 'droneLoad', d, src, out);
      }
      if (src.out <= res) d.wait += dt; else d.wait = 0;
      if (d.carry.length >= lv.cap || (d.carry.length > 0 && d.wait > 1.5)) { d.st = 'toDst'; d.t = 0; }
    } else if (d.st === 'toDst') {
      const p = hover(d, HB.Logic.padPos(dst, 'in'));
      if (moveTo(d, p.x, p.y, lv.speed, dt)) { d.st = 'unload'; d.t = 0; }
    } else if (d.st === 'unload') {
      unload(st, d, dst, dt);
      if (!d.carry.length) d.st = 'toSrc';
    }
  }

  function step(st, R, dt) {
    sync(st, R);
    const hide = HB.CONFIG.night.hideRange;
    for (const d of R._drones) {
      const pad = R._byId[d.pad];
      if (!pad) continue;
      const lv = padLevel(pad);
      if (d.drop > 0) { d.drop -= dt; continue; }        // bajando en paracaídas
      // De noche, a refugio si hay bichos cerca (funcional 3.2).
      if (R.phase === 'night' && danger(R, d.x, d.y, hide)) d.hide = 2;
      if (d.hide > 0) {
        moveTo(d, pad.x, pad.y, lv.speed * 1.3, dt);
        if (!danger(R, d.x, d.y, hide + 1)) d.hide -= dt;
        continue;
      }
      if (pad.dead) { moveTo(d, pad.x, pad.y, lv.speed, dt); continue; }
      if (pad.route.kind === 'miner') minerStep(st, R, d, pad, lv, dt);
      else cargoStep(st, R, d, pad, lv, dt);
    }
  }

  HB.Drones = {
    step: step,
    padLevel: padLevel,
    reserve: reserve,
    count: function (R) { return R._drones ? R._drones.length : 0; },
  };
})(globalThis.HB);
