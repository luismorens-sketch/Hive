// Hive Breaker — reglas del juego. Sin DOM: lo usa también el simulador.
//
//   HB.Logic.step(st, input, dt)  → 30 Hz: el comandante se mueve, mina, deposita, recoge, paga,
//                                    rellena torretas y repara; los drones y la noche avanzan.
//   HB.Logic.econ(st, dt)         → 10 Hz: energía, máquinas, nave de exportación y Calor.
//
// La lógica avisa de lo que pasa metiendo eventos en st.ev ({k: 'mine', a, b, c}). El dibujo y
// el sonido los leen y los vacían; el simulador los cuenta. La lógica nunca depende de ellos.
// Los drones viven en 42_drones.js y la noche (bichos, torretas, Calor, jefe) en 43_night.js.
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

  function def(e) { return HB.MACHINES[e.type]; }
  function level(e) { return HB.MACHINES[e.type].levels[e.level - 1]; }
  function dims(e) { const d = HB.MACHINES[e.type]; return { w: e.w || d.w, h: e.h || d.h }; }

  // Un edificio dañado rinde menos (funcional 9.3): de 100 % sano a 50 % casi roto; roto, nada.
  function eff(e) { return e.dead ? 0 : 0.5 + 0.5 * e.hp / def(e).hp; }

  // Lado de la base: +1 si la Torre de mando queda más al sur que y, -1 si queda al norte.
  const sideCache = {};
  function hqY(rid) {
    if (sideCache[rid] === undefined) {
      const d = HB.REGIONS[rid];
      let y = d.h / 2;
      for (const s of d.start) if (s.type === 'hq') y = s.y;
      sideCache[rid] = y;
    }
    return sideCache[rid];
  }
  function zoneRegion(z) {
    if (z._rid) return z._rid;
    for (const rid in HB.REGIONS) if (HB.REGIONS[rid].zones.indexOf(z) >= 0) { z._rid = rid; break; }
    return z._rid || 'r1';
  }
  function sideOf(rid, y) { return hqY(rid) > y ? 1 : -1; }

  // Dónde está cada zona que se pisa de un edificio.
  function padPos(e, which, rid) {
    const d = dims(e);
    if (which === 'box') {
      // La caja de munición de una torreta queda del lado de la base.
      const s = sideOf(rid || 'r1', e.y);
      return { x: e.x, y: e.y + s * 1.5 };
    }
    const s = e.flip ? -1 : 1;
    const off = d.w / 2 + 0.85;
    if (which === 'in') return { x: e.x - s * off, y: e.y + 0.25 };
    if (which === 'out') return { x: e.x + s * off, y: e.y + 0.25 };
    return { x: e.x - 0.3, y: e.y + d.h / 2 + 0.95 };   // 'pile': el montón de billetes
  }

  // Dónde se pisa una zona de pago. Las de edificio quedan delante de su huella (del lado de la
  // base) y las de veta a su lado, para que al aparecer no salgan encima del comandante.
  function zonePadPos(z) {
    if (z.kind === 'machine') return { x: z.x, y: z.y + HB.MACHINES[z.type].h / 2 + 0.55 };
    if (z.kind === 'vein') return { x: z.x + 1.0, y: z.y };
    if (z.kind === 'turret') return { x: z.x, y: z.y + sideOf(zoneRegion(z), z.y) * 1.5 };
    if (z.kind === 'wall') return { x: z.x, y: z.y + sideOf(zoneRegion(z), z.y) * 1.0 };
    return { x: z.x, y: z.y };
  }

  // ---------- Cachés que se rehacen al comprar o romper algo ----------
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
      const k = def(e).kind;
      if (k === 'proc') {
        const a = padPos(e, 'in'), b = padPos(e, 'out');
        pads.push({ key: e.id + ':in', kind: 'in', x: a.x, y: a.y, e: e });
        pads.push({ key: e.id + ':out', kind: 'out', x: b.x, y: b.y, e: e });
      } else if (k === 'export') {
        const a = padPos(e, 'in'), b = padPos(e, 'pile');
        pads.push({ key: e.id + ':in', kind: 'in', x: a.x, y: a.y, e: e });
        pads.push({ key: e.id + ':pile', kind: 'pile', x: b.x, y: b.y, e: e });
      } else if (k === 'turret') {
        const a = padPos(e, 'box', R.id);
        pads.push({ key: e.id + ':box', kind: 'box', x: a.x, y: a.y, e: e });
      }
    }
    for (const z of vis) {
      const p = zonePadPos(z);
      pads.push({ key: 'z:' + z.id, kind: 'zone', x: p.x, y: p.y, z: z });
    }
    if (R.nestReady && !R.cleared) {
      const z = d.zones.find(function (q) { return q.kind === 'nest'; });
      if (z) pads.push({ key: 'nest', kind: 'nest', x: z.x, y: z.y, z: z });
    }
    R._pads = pads;

    const solids = [];
    for (const e of R.ents) {
      if (e.dead || def(e).kind === 'dronepad') continue;
      const m = dims(e);
      solids.push({ t: 'r', e: e, wall: def(e).kind === 'wall', x0: e.x - m.w / 2, y0: e.y - m.h / 2, x1: e.x + m.w / 2, y1: e.y + m.h / 2 });
    }
    for (const v of R.veins) solids.push({ t: 'c', x: v.x, y: v.y, r: 0.55 });
    R._solids = solids;
    R._dirty = false;
  }

  function ensure(R) { if (R._dirty !== false || !R._pads) rebuild(R); }
  function touch(R) { R._dirty = true; R._solidsVer = (R._solidsVer || 0) + 1; }

  // ---------- Choques (comandante y bichos) ----------
  function collide(c, solids, r, skipWalls) {
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < solids.length; i++) {
        const s = solids[i];
        if (skipWalls && s.wall) continue;
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

  // Distancia de un punto al borde de un edificio (0 si está dentro).
  function edgeDist(e, x, y) {
    const m = dims(e);
    const cx = HB.clamp(x, e.x - m.w / 2, e.x + m.w / 2), cy = HB.clamp(y, e.y - m.h / 2, e.y + m.h / 2);
    return HB.dist(x, y, cx, cy);
  }

  // ---------- Acciones por proximidad (funcional 4.1) ----------
  function accepts(e, it) {
    if (e.dead) return false;
    const d = def(e);
    if (d.kind === 'proc') return d.inputs[it] !== undefined && e.inBuf[it] < level(e).inCap;
    if (d.kind === 'export') return d.accepts.indexOf(it) >= 0 && totalIn(e) < level(e).inCap;
    return false;
  }

  // ¿Cabe otra caja de munición en la torreta?
  function boxRoom(e) {
    const d = def(e);
    return !e.dead && e.ammo + d.shots <= d.box * d.shots;
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

  function refillOne(st, c, e) {
    if (!boxRoom(e)) return false;
    for (let i = c.stack.length - 1; i >= 0; i--) {
      if (c.stack[i] !== 'ammo') continue;
      c.stack.splice(i, 1);
      e.ammo += def(e).shots;
      ev(st, 'refill', e, 'ammo', i);
      return true;
    }
    return false;
  }

  function pickupOne(st, c, e) {
    const cap = HB.CONFIG.cmd.stackCap;
    if (e.out <= 0 || c.stack.length >= cap) return false;
    const it = def(e).output;
    e.out--;
    c.stack.push(it);
    ev(st, 'pickup', e, it, c.stack.length - 1);
    if (c.stack.length >= cap) ev(st, 'full');
    return true;
  }

  function buildEntity(st, R, z, type) {
    const L = HB.State.layout(R.id).ents[z.id];
    const e = HB.State.machineEntity(z.id, type || L.type, L.x, L.y, L.opts);
    R.ents.push(e);
    R._byId[e.id] = e;
    return e;
  }

  function unlock(st, R, z) {
    R.bought[z.id] = st.time;
    delete R.paid[z.id];
    st.stats.zones++;
    let res = null;
    if (z.kind === 'vein') {
      res = { id: z.id, x: z.x, y: z.y };
      R.veins.push(res);
    } else if (z.kind === 'machine' || z.kind === 'wall' || z.kind === 'drone') {
      res = buildEntity(st, R, z);
    } else if (z.kind === 'turret') {
      if (z.choice) st.choice = { zone: z.id, options: z.choice.slice() };   // el jugador elige
      else res = buildEntity(st, R, z, z.type);
      if (!R.heatOn) { R.heatOn = true; ev(st, 'heatOn'); }
    } else if (z.kind === 'upgrade') {
      res = R._byId[z.target];
      if (res) res.level = Math.min(res.level + 1, def(res).levels.length);
    } else if (z.kind === 'expansion') {
      R.fogY = z.fogY;
    } else if (z.kind === 'nest') {
      R.nestReady = true;
    }
    touch(R);
    st.cmd.pad = null;
    st.needSave = true;
    ev(st, 'unlock', z, res);
  }

  // El jugador elige el tipo de torreta de una zona ya pagada (funcional 6.2).
  function choose(st, type) {
    const ch = st.choice;
    if (!ch || ch.options.indexOf(type) < 0) return null;
    const R = st.regions[st.cur];
    const z = regionDef(R).zones.find(function (q) { return q.id === ch.zone; });
    st.choice = null;
    const e = buildEntity(st, R, z, type);
    touch(R);
    st.needSave = true;
    ev(st, 'unlock', z, e);
    return e;
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

  // Reparar (funcional 4.1): quieto junto a un edificio dañado, gasta Placas de la pila.
  function repair(st, R, c, dt) {
    const K = HB.CONFIG.cmd;
    if (c.moving) { c.repT = 0; return; }
    let plates = -1;
    for (let i = c.stack.length - 1; i >= 0; i--) if (c.stack[i] === 'plate') { plates = i; break; }
    if (plates < 0) return;
    let best = null, bd = K.repairReach;
    for (const e of R.ents) {
      if (def(e).kind === 'dronepad' || e.hp >= def(e).hp) continue;
      const d = edgeDist(e, c.x, c.y);
      if (d <= bd) { bd = d; best = e; }
    }
    if (!best) { c.repT = 0; return; }
    c.repT += dt;
    if (c.repT < K.repairEvery) return;
    c.repT -= K.repairEvery;
    c.stack.splice(plates, 1);
    const wasDead = best.dead;
    best.hp = Math.min(def(best).hp, best.hp + K.repairHp);
    // Un escombro vuelve a funcionar al recuperar la mitad de la vida.
    if (best.dead && best.hp >= def(best).hp * 0.5) { best.dead = false; touch(R); }
    ev(st, 'repair', best, plates, wasDead && !best.dead);
  }

  // ---------- Paso del comandante: 30 Hz ----------
  function step(st, input, dt) {
    const R = st.regions[st.cur];
    ensure(R);
    const d = regionDef(R);
    const c = st.cmd, K = HB.CONFIG.cmd;
    st.time += dt;
    st.tick++;

    if (c.deadT > 0) {
      // Caído: reaparece en la Torre de mando (funcional 4.3). Nunca hay "game over".
      c.deadT -= dt;
      c.moving = false; c.vx = 0; c.vy = 0;
      if (c.deadT <= 0) {
        c.deadT = 0; c.hp = K.hp;
        c.x = d.spawn.x; c.y = d.spawn.y;
        ev(st, 'respawn');
      }
    } else {
      let ix = input ? input.x || 0 : 0, iy = input ? input.y || 0 : 0;
      const m = Math.sqrt(ix * ix + iy * iy);
      if (m > 1) { ix /= m; iy /= m; }
      c.moving = m > 0.01;
      c.vx = ix * K.speed; c.vy = iy * K.speed;
      if (c.moving) {
        c.face = Math.atan2(iy, ix);
        c.stillT = 0;
        if (st.ftue.move === undefined) { st.ftue.move = st.time; ev(st, 'ftue', 'move'); }
      } else c.stillT += dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      collide(c, R._solids, K.radius);
      c.x = HB.clamp(c.x, K.radius, d.w - K.radius);
      c.y = HB.clamp(c.y, R.fogY + K.radius, d.h - K.radius);
      actions(st, R, c, dt);
    }

    if (HB.Drones) HB.Drones.step(st, R, dt);
    if (HB.Night) HB.Night.step(st, R, dt);
  }

  function actions(st, R, c, dt) {
    const K = HB.CONFIG.cmd;
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

    repair(st, R, c, dt);

    // Zonas que se pisan.
    const p = findPad(R, c.x, c.y);
    const key = p ? p.key : null;
    if (key !== c.pad) { c.pad = key; c.padT = 0; c.actT = 0; c.payT = 0; c.payAcc = 0; }
    else c.padT += dt;
    if (!p) return;

    if (p.kind === 'in' || p.kind === 'box') {
      c.actT += dt;
      while (c.actT >= K.depositInterval) {
        c.actT -= K.depositInterval;
        const ok = p.kind === 'in' ? depositOne(st, c, p.e) : refillOne(st, c, p.e);
        if (!ok) { c.actT = 0; break; }
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
    } else if (p.kind === 'nest') {
      // Quedarse 1,5 s encima lanza la noche del jefe (solo de día).
      if (R.phase === 'day' && c.padT >= 1.5 && HB.Night) { HB.Night.startBoss(st, R); c.pad = null; }
    }
  }

  // ---------- Economía: 10 Hz ----------
  function hasInputs(e, d) {
    for (const k in d.inputs) if (e.inBuf[k] < d.inputs[k]) return false;
    return true;
  }

  function tryStart(st, e, d, L) {
    if (e.dead || e.out >= L.outCap || !hasInputs(e, d)) return false;
    for (const k in d.inputs) e.inBuf[k] -= d.inputs[k];
    e.busy = true;
    ev(st, 'start', e);
    return true;
  }

  function procStep(st, R, e, d, dt) {
    const L = level(e);
    const s = st.stats.m[e.id] || (st.stats.m[e.id] = { busy: 0, full: 0, starve: 0 });
    if (!e.busy && tryStart(st, e, d, L)) e.prog = 0;
    if (!e.busy || e.dead) {
      e.idle += dt;
      if (e.out >= L.outCap) s.full += dt; else s.starve += dt;
      return;
    }
    e.idle = 0;
    s.busy += dt;
    e.prog += dt * R.power.f * eff(e);
    // Lo que sobra de un paso pasa a la unidad siguiente: a 10 Hz no se pierde tiempo.
    while (e.busy && e.prog >= L.time) {
      e.prog -= L.time;
      e.busy = false;
      e.out++;
      e.worked = true;
      st.stats.made++;
      ev(st, 'produce', e);
      if (!tryStart(st, e, d, L)) e.prog = 0;
    }
  }

  function exportStep(st, R, e, d, dt) {
    const L = level(e), S = HB.CONFIG.ship, sh = e.ship;
    sh.t = Math.max(0, sh.t - dt);
    if (sh.st === 'away') {
      if (sh.t <= 0 && !e.dead && totalIn(e) > 0 && R.pile < L.vault) {
        sh.st = 'land'; sh.t = S.land;
        ev(st, 'shipLand', e);
      }
    } else if (sh.st === 'land') {
      if (sh.t <= 0) {
        sh.st = 'load'; sh.t = S.load;
        // Compra lo que quepa en la caja fuerte, lo más caro primero.
        let value = 0, count = 0;
        const counts = {};
        for (const it of d.accepts) {
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

  // Energía (funcional 5.3): capacidad, no stock. Si la demanda supera a la oferta, todo rinde
  // proporcionalmente menos (brownout), torretas incluidas.
  function power(st, R) {
    let supply = 0, demand = 0;
    for (const e of R.ents) {
      if (e.dead) continue;
      const d = def(e);
      if (d.supply) supply += d.supply;
      if (d.power) demand += d.power;
    }
    const f = demand > supply ? supply / demand : 1;
    const was = R.power ? R.power.f : 1;
    R.power = { supply: supply, demand: demand, f: f };
    if (f < 1 && was >= 1) ev(st, 'brownout', f);
    else if (f >= 1 && was < 1) ev(st, 'powerOk');
  }

  function econ(st, dt) {
    const R = st.regions[st.cur];
    ensure(R);
    power(st, R);
    for (const e of R.ents) {
      const d = def(e);
      if (d.kind === 'proc') procStep(st, R, e, d, dt);
      else if (d.kind === 'export') exportStep(st, R, e, d, dt);
    }
    if (HB.Night) HB.Night.econ(st, R, dt);
  }

  // Para los iconos ámbar de cuello de botella (funcional 18).
  function status(R, e) {
    const d = def(e);
    if (e.dead) return 'dead';
    if (d.kind === 'proc') {
      const L = level(e);
      if (e.out >= L.outCap) return 'full';
      if (!e.busy && e.worked && e.idle > 4) return 'starve';
      if (R.power && R.power.f < 1) return 'power';
    } else if (d.kind === 'export') {
      if (R.pile >= level(e).vault) return 'vault';
    } else if (d.kind === 'turret') {
      if (e.ammo <= 0) return 'noammo';
    } else if (d.kind === 'cool' && R.power && R.power.f < 1) return 'power';
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
    ev: ev,
    price: price,
    remaining: remaining,
    totalIn: totalIn,
    level: level,
    dims: dims,
    eff: eff,
    padPos: padPos,
    zonePadPos: zonePadPos,
    sideOf: sideOf,
    status: status,
    allBought: allBought,
    accepts: accepts,
    boxRoom: boxRoom,
    choose: choose,
    collide: collide,
    edgeDist: edgeDist,
    touch: touch,
    ensure: ensure,
    // Para las herramientas (tools/check.js): compra una zona sin pagarla.
    forceUnlock: function (st, z) {
      const R = st.regions[st.cur];
      ensure(R);
      unlock(st, R, z);
      if (st.choice) choose(st, st.choice.options[0]);
    },
    visibleZones: function (R) { ensure(R); return R._vis; },
    pads: function (R) { ensure(R); return R._pads; },
    solids: function (R) { ensure(R); return R._solids; },
  };
})(globalThis.HB);
