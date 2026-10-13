// Hive Breaker — reglas del juego. Sin DOM: lo usa también el simulador.
//
//   HB.Logic.step(st, input, dt)  → 30 Hz: el comandante se mueve, mina, deposita, recoge y paga.
//   HB.Logic.econ(st, dt)         → 10 Hz: las máquinas fabrican y la nave de exportación compra.
//
// La lógica avisa de lo que pasa metiendo eventos en st.ev ({k: 'mine', a, b, c}). El dibujo y
// el sonido los leen y los vacían; el simulador los cuenta. La lógica nunca depende de ellos.
(function (HB) {
  'use strict';

  function ev(st, k, a, b, c) { st.ev.push({ k: k, a: a, b: b, c: c }); }

  function regionDef(R) { return HB.REGIONS[R.id]; }

  function zoneIndex(rdef, zid) {
    if (!rdef._idx) {
      rdef._idx = {};
      rdef.zones.forEach(function (z, i) { rdef._idx[z.id] = i; });
    }
    return rdef._idx[zid];
  }

  // Precios "bonitos": enteros por debajo de 100, de 5 en 5 hasta 1.000 y luego 2 cifras.
  function nicePrice(p) {
    if (p < 100) return Math.max(1, Math.round(p));
    if (p < 1000) return Math.round(p / 5) * 5;
    const mag = Math.pow(10, Math.floor(Math.log10(p)) - 1);
    return Math.round(p / mag) * mag;
  }

  function price(R, z) {
    const d = regionDef(R);
    const n = zoneIndex(d, z.id);
    return nicePrice(d.p0 * Math.pow(d.k, n) * (z.mult || 1));
  }

  function remaining(R, z) { return price(R, z) - (R.paid[z.id] || 0); }

  function totalIn(e) {
    let n = 0;
    for (const k in e.inBuf) n += e.inBuf[k];
    return n;
  }

  function level(e) { return HB.MACHINES[e.type].levels[e.level - 1]; }

  // Dónde está cada zona que se pisa de una máquina.
  function padPos(e, which) {
    const d = HB.MACHINES[e.type];
    const s = e.flip ? -1 : 1;
    const off = d.w / 2 + 0.85;
    if (which === 'in') return { x: e.x - s * off, y: e.y + 0.25 };
    if (which === 'out') return { x: e.x + s * off, y: e.y + 0.25 };
    return { x: e.x - 0.3, y: e.y + d.h / 2 + 0.95 };   // 'pile': el montón de billetes
  }

  // Dónde se pisa una zona de pago. Las de máquina quedan delante de la huella del edificio y
  // las de veta a su lado, para que al aparecer no salgan encima del comandante.
  function zonePadPos(z) {
    if (z.kind === 'machine') return { x: z.x, y: z.y + HB.MACHINES[z.type].h / 2 + 0.55 };
    if (z.kind === 'vein') return { x: z.x + 1.0, y: z.y };
    return { x: z.x, y: z.y };
  }

  // ---------- Cachés que se rehacen al comprar algo ----------
  function rebuild(R) {
    const d = regionDef(R);
    // Zonas a la vista: las primeras de la lista sin comprar que cumplen sus requisitos.
    const vis = [];
    for (const z of d.zones) {
      if (R.bought[z.id] !== undefined) continue;
      let ok = true;
      if (z.req) for (const r of z.req) if (R.bought[r] === undefined) { ok = false; break; }
      if (!ok) continue;
      vis.push(z);
      if (vis.length >= d.visible) break;
    }
    R._vis = vis;

    const pads = [];
    for (const e of R.ents) {
      const k = HB.MACHINES[e.type].kind;
      if (k === 'proc') {
        const a = padPos(e, 'in'), b = padPos(e, 'out');
        pads.push({ key: e.id + ':in', kind: 'in', x: a.x, y: a.y, e: e });
        pads.push({ key: e.id + ':out', kind: 'out', x: b.x, y: b.y, e: e });
      } else if (k === 'export') {
        const a = padPos(e, 'in'), b = padPos(e, 'pile');
        pads.push({ key: e.id + ':in', kind: 'in', x: a.x, y: a.y, e: e });
        pads.push({ key: e.id + ':pile', kind: 'pile', x: b.x, y: b.y, e: e });
      }
    }
    for (const z of vis) {
      const p = zonePadPos(z);
      pads.push({ key: 'z:' + z.id, kind: 'zone', x: p.x, y: p.y, z: z });
    }
    R._pads = pads;

    const solids = [];
    for (const e of R.ents) {
      const m = HB.MACHINES[e.type];
      solids.push({ t: 'r', x0: e.x - m.w / 2, y0: e.y - m.h / 2, x1: e.x + m.w / 2, y1: e.y + m.h / 2 });
    }
    for (const v of R.veins) solids.push({ t: 'c', x: v.x, y: v.y, r: 0.55 });
    R._solids = solids;
    R._dirty = false;
  }

  function ensure(R) { if (R._dirty !== false || !R._pads) rebuild(R); }

  // ---------- Choques del comandante ----------
  function collide(c, solids, r) {
    for (let pass = 0; pass < 2; pass++) {
      for (const s of solids) {
        if (s.t === 'r') {
          const cx = c.x < s.x0 ? s.x0 : (c.x > s.x1 ? s.x1 : c.x);
          const cy = c.y < s.y0 ? s.y0 : (c.y > s.y1 ? s.y1 : c.y);
          const dx = c.x - cx, dy = c.y - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 >= r * r) continue;
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2);
            c.x += dx / d * (r - d); c.y += dy / d * (r - d);
          } else {
            // El centro está dentro: se saca por el lado más cercano.
            const l = c.x - s.x0, rr = s.x1 - c.x, t = c.y - s.y0, b = s.y1 - c.y;
            const m = Math.min(l, rr, t, b);
            if (m === l) c.x = s.x0 - r; else if (m === rr) c.x = s.x1 + r;
            else if (m === t) c.y = s.y0 - r; else c.y = s.y1 + r;
          }
        } else {
          const dx = c.x - s.x, dy = c.y - s.y;
          const min = s.r + r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          const d = Math.sqrt(d2) || 1e-6;
          c.x = s.x + dx / d * min; c.y = s.y + dy / d * min;
        }
      }
    }
  }

  // ---------- Acciones por proximidad (funcional 4.1) ----------
  function accepts(e, it) {
    const d = HB.MACHINES[e.type], L = level(e);
    if (d.kind === 'proc') return d.inputs[it] !== undefined && e.inBuf[it] < L.inCap;
    if (d.kind === 'export') return d.accepts.indexOf(it) >= 0 && totalIn(e) < L.inCap;
    return false;
  }

  function depositOne(st, c, e) {
    // Pila mixta: sale el objeto aceptado que esté más arriba.
    for (let i = c.stack.length - 1; i >= 0; i--) {
      const it = c.stack[i];
      if (!accepts(e, it)) continue;
      c.stack.splice(i, 1);
      e.inBuf[it]++;
      ev(st, 'deposit', e, it, i);
      return true;
    }
    return false;
  }

  function pickupOne(st, c, e) {
    const cap = HB.CONFIG.cmd.stackCap;
    if (e.out <= 0 || c.stack.length >= cap) return false;
    const it = HB.MACHINES[e.type].output;
    e.out--;
    c.stack.push(it);
    ev(st, 'pickup', e, it, c.stack.length - 1);
    if (c.stack.length >= cap) ev(st, 'full');
    return true;
  }

  function unlock(st, R, z) {
    R.bought[z.id] = st.time;
    delete R.paid[z.id];
    st.stats.zones++;
    let res = null;
    if (z.kind === 'vein') {
      res = { id: z.id, x: z.x, y: z.y };
      R.veins.push(res);
    } else if (z.kind === 'machine') {
      res = HB.State.machineEntity(z.id, z.type, z.x, z.y, z.flip);
      R.ents.push(res);
      R._byId[res.id] = res;
    } else if (z.kind === 'upgrade') {
      res = R._byId[z.target];
      if (res) res.level = Math.min(res.level + 1, HB.MACHINES[res.type].levels.length);
    } else if (z.kind === 'expansion') {
      R.fogY = z.fogY;
    }
    R._dirty = true;
    R._solidsVer = (R._solidsVer || 0) + 1;
    st.cmd.pad = null;
    st.needSave = true;
    ev(st, 'unlock', z, res);
  }

  function pay(st, R, c, z, dt) {
    const P = HB.CONFIG.pay;
    if (c.padT < P.dwell || R.credits <= 0) return;
    const pr = price(R, z);
    const paid = R.paid[z.id] || 0;
    c.payT += dt;
    // Cada vez más rápido: de x1 a x5 en 1,5 s (funcional 13.2).
    const mult = 1 + (P.maxMult - 1) * Math.min(1, c.payT / P.accelTime);
    c.payAcc += pr * P.baseFrac * mult * dt;
    let n = Math.floor(c.payAcc);
    if (n < 1) return;
    c.payAcc -= n;
    n = Math.min(n, pr - paid, R.credits);
    R.credits -= n;
    R.paid[z.id] = paid + n;
    ev(st, 'pay', z, n);
    if (paid + n >= pr) unlock(st, R, z);
  }

  function findPad(R, x, y) {
    const r2 = HB.CONFIG.padRadius * HB.CONFIG.padRadius;
    let best = null, bd = r2;
    for (const p of R._pads) {
      const d2 = HB.dist2(x, y, p.x, p.y);
      if (d2 < bd) { bd = d2; best = p; }
    }
    return best;
  }

  // ---------- Paso del comandante: 30 Hz ----------
  function step(st, input, dt) {
    const R = st.regions[st.cur];
    ensure(R);
    const d = regionDef(R);
    const c = st.cmd, K = HB.CONFIG.cmd;
    st.time += dt;
    st.tick++;

    let ix = input ? input.x || 0 : 0, iy = input ? input.y || 0 : 0;
    const m = Math.sqrt(ix * ix + iy * iy);
    if (m > 1) { ix /= m; iy /= m; }
    c.moving = m > 0.01;
    c.vx = ix * K.speed; c.vy = iy * K.speed;
    if (c.moving) {
      c.face = Math.atan2(iy, ix);
      if (st.ftue.move === undefined) { st.ftue.move = st.time; ev(st, 'ftue', 'move'); }
    }
    c.x += c.vx * dt; c.y += c.vy * dt;
    collide(c, R._solids, K.radius);
    c.x = HB.clamp(c.x, K.radius, d.w - K.radius);
    c.y = HB.clamp(c.y, R.fogY + K.radius, d.h - K.radius);

    // Minar: estar junto a una veta. Cada veta al alcance mina por su cuenta.
    const rr = K.mineRange * K.mineRange;
    for (const v of R.veins) {
      if (HB.dist2(c.x, c.y, v.x, v.y) > rr) { c.mineT[v.id] = -1; continue; }
      if (!(c.mineT[v.id] >= 0)) c.mineT[v.id] = K.mineInterval - K.mineFirst;
      c.mineT[v.id] += dt;
      if (c.mineT[v.id] < K.mineInterval) continue;
      if (c.stack.length >= K.stackCap) { c.mineT[v.id] = K.mineInterval; continue; }
      c.mineT[v.id] -= K.mineInterval;
      c.stack.push('ore');
      st.stats.mined++;
      ev(st, 'mine', v, c.stack.length - 1);
      if (c.stack.length >= K.stackCap) ev(st, 'full');
    }

    // Zonas que se pisan.
    const p = findPad(R, c.x, c.y);
    const key = p ? p.key : null;
    if (key !== c.pad) { c.pad = key; c.padT = 0; c.actT = 0; c.payT = 0; c.payAcc = 0; }
    else c.padT += dt;
    if (!p) return;

    if (p.kind === 'in') {
      c.actT += dt;
      while (c.actT >= K.depositInterval) {
        c.actT -= K.depositInterval;
        if (!depositOne(st, c, p.e)) { c.actT = 0; break; }
      }
    } else if (p.kind === 'out') {
      c.actT += dt;
      while (c.actT >= K.pickupInterval) {
        c.actT -= K.pickupInterval;
        if (!pickupOne(st, c, p.e)) { c.actT = 0; break; }
      }
    } else if (p.kind === 'pile') {
      if (R.pile >= 1) {
        const n = R.pile;
        R.pile = 0;
        R.credits += n;
        ev(st, 'collect', n, p.e);
      }
    } else if (p.kind === 'zone') {
      pay(st, R, c, p.z, dt);
    }
  }

  // ---------- Economía: 10 Hz ----------
  function hasInputs(e, def) {
    for (const k in def.inputs) if (e.inBuf[k] < def.inputs[k]) return false;
    return true;
  }

  function tryStart(st, e, def, L) {
    if (e.out >= L.outCap || !hasInputs(e, def)) return false;
    for (const k in def.inputs) e.inBuf[k] -= def.inputs[k];
    e.busy = true;
    ev(st, 'start', e);
    return true;
  }

  function procStep(st, R, e, def, dt) {
    const L = level(e);
    const s = st.stats.m[e.id] || (st.stats.m[e.id] = { busy: 0, full: 0, starve: 0 });
    if (!e.busy && tryStart(st, e, def, L)) e.prog = 0;
    if (!e.busy) {
      e.idle += dt;
      if (e.out >= L.outCap) s.full += dt; else s.starve += dt;
      return;
    }
    e.idle = 0;
    s.busy += dt;
    e.prog += dt;
    // Lo que sobra de un paso pasa a la unidad siguiente: a 10 Hz no se pierde tiempo.
    while (e.busy && e.prog >= L.time) {
      e.prog -= L.time;
      e.busy = false;
      e.out++;
      e.worked = true;
      st.stats.made++;
      ev(st, 'produce', e);
      if (!tryStart(st, e, def, L)) e.prog = 0;
    }
  }

  function exportStep(st, R, e, def, dt) {
    const L = level(e), S = HB.CONFIG.ship, sh = e.ship;
    sh.t = Math.max(0, sh.t - dt);
    if (sh.st === 'away') {
      if (sh.t <= 0 && totalIn(e) > 0 && R.pile < L.vault) {
        sh.st = 'land'; sh.t = S.land;
        ev(st, 'shipLand', e);
      }
    } else if (sh.st === 'land') {
      if (sh.t <= 0) {
        sh.st = 'load'; sh.t = S.load;
        // Compra lo que quepa en la caja fuerte, lo más caro primero.
        let value = 0, count = 0;
        const counts = {};
        for (const it of def.accepts) {
          const pr = HB.ITEMS[it].price;
          const room = Math.floor((L.vault - R.pile - value) / pr);
          const n = Math.min(e.inBuf[it], Math.max(0, room));
          if (n <= 0) continue;
          e.inBuf[it] -= n;
          value += n * pr;
          count += n;
          counts[it] = n;
        }
        R.pile += value;
        st.stats.sold += count;
        st.stats.earned += value;
        ev(st, 'shipBuy', e, value, counts);
      }
    } else if (sh.st === 'load') {
      if (sh.t <= 0) { sh.st = 'leave'; sh.t = S.leave; ev(st, 'shipLeave', e); }
    } else if (sh.st === 'leave') {
      if (sh.t <= 0) { sh.st = 'away'; sh.t = Math.max(1, L.interval - S.land - S.load - S.leave); }
    }
  }

  function econ(st, dt) {
    const R = st.regions[st.cur];
    ensure(R);
    for (const e of R.ents) {
      const def = HB.MACHINES[e.type];
      if (def.kind === 'proc') procStep(st, R, e, def, dt);
      else if (def.kind === 'export') exportStep(st, R, e, def, dt);
    }
  }

  // Para los iconos ámbar de cuello de botella (funcional 18): 'full', 'starve', 'vault' o null.
  function status(R, e) {
    const def = HB.MACHINES[e.type];
    if (def.kind === 'proc') {
      const L = level(e);
      if (e.out >= L.outCap) return 'full';
      if (!e.busy && e.worked && e.idle > 4) return 'starve';
    } else if (def.kind === 'export') {
      if (R.pile >= level(e).vault) return 'vault';
    }
    return null;
  }

  function allBought(R) {
    const d = regionDef(R);
    for (const z of d.zones) if (R.bought[z.id] === undefined) return false;
    return true;
  }

  HB.Logic = {
    step: step,
    econ: econ,
    price: price,
    remaining: remaining,
    totalIn: totalIn,
    level: level,
    padPos: padPos,
    zonePadPos: zonePadPos,
    status: status,
    allBought: allBought,
    accepts: accepts,
    visibleZones: function (R) { ensure(R); return R._vis; },
    pads: function (R) { ensure(R); return R._pads; },
    solids: function (R) { ensure(R); return R._solids; },
  };
})(globalThis.HB);
