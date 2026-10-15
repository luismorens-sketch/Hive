// Hive Breaker — el consejero: decide "qué toca hacer ahora" y cómo llegar.
//
// Lo usan tres cosas a la vez, y por eso vive aquí, sin DOM:
//   1. La flecha guía del juego (pilar 4: siempre una flecha que dice adónde ir).
//   2. El piloto automático del menú de pruebas.
//   3. El robot del simulador (tools/sim_balance.js).
// Si el robot y la flecha piensan igual, el simulador mide el juego que ve el jugador.
//
// Para moverse usa un campo de flujo sobre una rejilla de medias casillas (los bichos usan otro,
// en 43_night.js, que va hacia la Torre de mando).
(function (HB) {
  'use strict';

  const CS = 0.5;   // tamaño de celda de la rejilla, en casillas

  // ---------- Rejilla y campo de flujo ----------
  // Además de los edificios, la rejilla marca las zonas de entrada, salida y munición: al pisarlas
  // el comandante suelta o recoge cosas, así que el robot las rodea salvo si van a ellas.
  function nav(R) {
    const n = R._nav;
    if (n && n.ver === R._solidsVer && n.fogY === R.fogY) return n;
    const d = HB.REGIONS[R.id];
    const gw = Math.round(d.w / CS), gh = Math.round(d.h / CS);
    const blocked = new Uint8Array(gw * gh);
    const padId = new Int16Array(gw * gh).fill(-1);
    const r = HB.CONFIG.cmd.radius + 0.05;
    const solids = HB.Logic.solids(R);
    const pads = HB.Logic.pads(R).filter(function (p) { return p.kind === 'in' || p.kind === 'out' || p.kind === 'box'; });
    const pr2 = Math.pow(HB.CONFIG.padRadius + 0.15, 2);
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const x = (i + 0.5) * CS, y = (j + 0.5) * CS, k = j * gw + i;
        let b = y < R.fogY + r;
        for (let q = 0; !b && q < solids.length; q++) {
          const s = solids[q];
          if (s.t === 'r') b = x > s.x0 - r && x < s.x1 + r && y > s.y0 - r && y < s.y1 + r;
          else b = HB.dist2(x, y, s.x, s.y) < (s.r + r) * (s.r + r);
        }
        blocked[k] = b ? 1 : 0;
        for (let q = 0; q < pads.length; q++) if (HB.dist2(x, y, pads[q].x, pads[q].y) < pr2) { padId[k] = q; break; }
      }
    }
    R._nav = { ver: R._solidsVer, fogY: R.fogY, gw: gw, gh: gh, blocked: blocked, padId: padId, fields: {}, spots: null };
    return R._nav;
  }

  function cellOf(N, x, y) {
    const i = HB.clamp(Math.floor(x / CS), 0, N.gw - 1);
    const j = HB.clamp(Math.floor(y / CS), 0, N.gh - 1);
    return j * N.gw + i;
  }

  // ¿Se puede pasar por la celda k? (avoid: rodear las zonas que no son la de destino ni la actual)
  function open(N, k, avoid, tp, cp) {
    if (N.blocked[k]) return false;
    if (!avoid) return true;
    const p = N.padId[k];
    return p < 0 || p === tp || p === cp;
  }

  function field(N, tx, ty, avoid, cp) {
    const t = cellOf(N, tx, ty), tp = N.padId[t];
    const key = t + (avoid ? 'a' + cp : 'h');
    if (N.fields[key]) return N.fields[key];
    const dist = new Float32Array(N.gw * N.gh).fill(1e9);
    const q = new Int32Array(N.gw * N.gh);
    let qh = 0, qt = 0;
    dist[t] = 0; q[qt++] = t;
    while (qh < qt) {
      const cur = q[qh++];
      const ci = cur % N.gw, cj = (cur - ci) / N.gw;
      const nd = dist[cur] + 1;
      if (ci > 0 && dist[cur - 1] > nd && open(N, cur - 1, avoid, tp, cp)) { dist[cur - 1] = nd; q[qt++] = cur - 1; }
      if (ci < N.gw - 1 && dist[cur + 1] > nd && open(N, cur + 1, avoid, tp, cp)) { dist[cur + 1] = nd; q[qt++] = cur + 1; }
      if (cj > 0 && dist[cur - N.gw] > nd && open(N, cur - N.gw, avoid, tp, cp)) { dist[cur - N.gw] = nd; q[qt++] = cur - N.gw; }
      if (cj < N.gh - 1 && dist[cur + N.gw] > nd && open(N, cur + N.gw, avoid, tp, cp)) { dist[cur + N.gw] = nd; q[qt++] = cur + N.gw; }
    }
    N.fields[key] = dist;
    return dist;
  }

  function lineClear(N, ax, ay, bx, by, avoid, tp, cp) {
    const d = HB.dist(ax, ay, bx, by);
    const n = Math.ceil(d / 0.2);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      if (!open(N, cellOf(N, ax + (bx - ax) * t, ay + (by - ay) * t), avoid, tp, cp)) return false;
    }
    return true;
  }

  function bestNeighbor(N, F, cur, avoid, tp, cp) {
    const ci = cur % N.gw, cj = (cur - ci) / N.gw;
    let best = -1, bv = F[cur] < 1e9 ? F[cur] : 1e9;
    for (let oj = -1; oj <= 1; oj++) {
      for (let oi = -1; oi <= 1; oi++) {
        if (!oi && !oj) continue;
        const i = ci + oi, j = cj + oj;
        if (i < 0 || j < 0 || i >= N.gw || j >= N.gh) continue;
        const k = j * N.gw + i;
        if (!open(N, k, avoid, tp, cp)) continue;
        if (oi && oj && (!open(N, cj * N.gw + i, avoid, tp, cp) || !open(N, j * N.gw + ci, avoid, tp, cp))) continue;
        const v = F[k] + (oi && oj ? 0.41 : 0);
        if (v < bv) { bv = v; best = k; }
      }
    }
    return best;
  }

  // Dirección para ir de donde está el comandante a (tx, ty). Devuelve true al llegar.
  function steer(st, tx, ty, out) {
    const R = st.regions[st.cur], c = st.cmd;
    const dx = tx - c.x, dy = ty - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.12) { out.x = 0; out.y = 0; return true; }
    const N = nav(R);
    const cur = cellOf(N, c.x, c.y), tp = N.padId[cellOf(N, tx, ty)], cp = N.padId[cur];
    let ux = dx / d, uy = dy / d;
    if (!lineClear(N, c.x, c.y, tx, ty, true, tp, cp)) {
      let best = bestNeighbor(N, field(N, tx, ty, true, cp), cur, true, tp, cp);
      if (best < 0) {
        // sin camino que rodee las zonas: por donde se pueda
        if (!lineClear(N, c.x, c.y, tx, ty, false)) best = bestNeighbor(N, field(N, tx, ty, false, -1), cur, false);
      }
      if (best >= 0) {
        const bi = best % N.gw, bj = (best - bi) / N.gw;
        const ex = (bi + 0.5) * CS - c.x, ey = (bj + 0.5) * CS - c.y;
        const el = Math.sqrt(ex * ex + ey * ey) || 1;
        ux = ex / el; uy = ey / el;
      }
    }
    const mag = Math.min(1, d / 0.3);   // frena al llegar para no pasarse
    out.x = ux * mag; out.y = uy * mag;
    return false;
  }

  // ---------- Dónde minar: el punto que alcanza más vetas ----------
  function mineSpots(R) {
    const N = nav(R);
    if (N.spots && N.spotsN === R.veins.length) return N.spots;
    const K = HB.CONFIG.cmd, range = K.mineRange - 0.1;
    const pads = HB.Logic.pads(R);
    const cand = [];
    for (const v of R.veins) {
      for (let a = 0; a < 8; a++) {
        const ang = a * Math.PI / 4;
        cand.push({ x: v.x + Math.cos(ang) * 1.0, y: v.y + Math.sin(ang) * 1.0 });
      }
    }
    for (let i = 0; i < R.veins.length; i++) {
      for (let j = i + 1; j < R.veins.length; j++) {
        const a = R.veins[i], b = R.veins[j];
        const dd = HB.dist(a.x, a.y, b.x, b.y);
        if (dd > 2 * range) continue;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const px = -(b.y - a.y) / dd, py = (b.x - a.x) / dd;
        const off = Math.sqrt(Math.max(0, range * range - dd * dd / 4)) * 0.85;
        cand.push({ x: mx + px * off, y: my + py * off });
        cand.push({ x: mx - px * off, y: my - py * off });
      }
    }
    const spots = [];
    for (const p of cand) {
      if (N.blocked[cellOf(N, p.x, p.y)]) continue;
      let onPad = false;
      for (const q of pads) if (HB.dist2(p.x, p.y, q.x, q.y) < 1.0) { onPad = true; break; }
      if (onPad) continue;
      let n = 0;
      for (const v of R.veins) if (HB.dist(p.x, p.y, v.x, v.y) <= range) n++;
      if (n > 0) spots.push({ x: p.x, y: p.y, n: n });
    }
    N.spots = spots; N.spotsN = R.veins.length;
    return spots;
  }

  function bestSpot(st) {
    const R = st.regions[st.cur], c = st.cmd;
    let best = null, bs = -1e9;
    for (const s of mineSpots(R)) {
      const score = s.n * 100 - HB.dist(c.x, c.y, s.x, s.y);
      if (score > bs) { bs = score; best = s; }
    }
    return best;
  }

  // ---------- Qué toca hacer ----------
  function def(e) { return HB.MACHINES[e.type]; }

  function cheapest(R, affordableOnly) {
    let best = null, br = Infinity;
    for (const z of HB.Logic.visibleZones(R)) {
      const rem = HB.Logic.remaining(R, z);
      if (affordableOnly && rem > R.credits) continue;
      if (rem < br) { br = rem; best = z; }
    }
    return best ? { z: best, rem: br } : null;
  }

  function exportEnt(R) {
    for (const e of R.ents) if (def(e).kind === 'export' && !e.dead) return e;
    return null;
  }

  function count(stack, it) { let n = 0; for (const s of stack) if (s === it) n++; return n; }

  // Cuántos objetos de la pila aceptaría ahora la máquina e (limitado por su hueco).
  function acceptCount(e, stack) {
    const d = def(e);
    if (e.dead || (d.kind !== 'proc' && d.kind !== 'export')) return 0;
    const L = HB.Logic.level(e);
    let n = 0;
    if (d.kind === 'proc') {
      for (const k in d.inputs) n += Math.min(count(stack, k), L.inCap - e.inBuf[k]);
    } else {
      let have = 0;
      for (const it of stack) if (d.accepts.indexOf(it) >= 0) have++;
      n = Math.min(have, L.inCap - HB.Logic.totalIn(e));
    }
    return Math.max(0, n);
  }

  function wantsAny(e, stack) {
    const d = def(e);
    if (e.dead) return false;
    for (const it of stack) {
      if (d.kind === 'proc' && d.inputs[it] !== undefined) return true;
      if (d.kind === 'export' && d.accepts.indexOf(it) >= 0) return true;
      if (d.kind === 'turret' && it === 'ammo') return true;
    }
    return false;
  }

  // ¿Nadie podrá aceptar nada de la pila? Todas las máquinas que quieren algo están llenas y sin
  // poder fabricar (su salida también está llena), y no hay exportación ni torreta con hueco.
  function stuck(R, stack) {
    for (const e of R.ents) {
      const d = def(e);
      if (e.dead || !wantsAny(e, stack)) continue;
      if (d.kind === 'turret') { if (HB.Logic.boxRoom(e)) return false; continue; }
      if (acceptCount(e, stack) > 0) return false;
      if (d.kind === 'export') return false;                       // la nave se lo lleva y hará hueco
      if (d.kind === 'proc' && e.out < HB.Logic.level(e).outCap) return false;   // aún fabrica y hará hueco
    }
    return true;
  }

  // Lo lleno que está la caja de munición de una torreta (0..1).
  function ammoFrac(e) { const d = def(e); return e.ammo / (d.box * d.shots); }

  // Torretas que necesitan munición, la más vacía primero. limit = por debajo de qué fracción.
  function hungryTurret(R, limit, from) {
    let best = null, bs = Infinity;
    for (const e of R.ents) {
      if (def(e).kind !== 'turret' || e.dead || !HB.Logic.boxRoom(e)) continue;
      const f = ammoFrac(e);
      if (f >= limit) continue;
      // la más vacía; a igualdad, la más cercana (la distancia no cambia quién entra en la lista)
      const s = f + (from ? HB.dist(from.x, from.y, e.x, e.y) * 0.004 : 0);
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  }

  // Hueco para Ore que queda en las máquinas que lo aceptan.
  function oreRoom(R) {
    let n = 0;
    for (const e of R.ents) {
      const d = def(e);
      if (d.kind === 'proc' && !e.dead && d.inputs.ore !== undefined) n += HB.Logic.level(e).inCap - e.inBuf.ore;
    }
    return n;
  }

  function ammoSource(R) {
    let best = null;
    for (const e of R.ents) if (def(e).kind === 'proc' && def(e).output === 'ammo' && !e.dead && e.out > 0 && (!best || e.out > best.out)) best = e;
    return best;
  }

  function bugsNear(R, x, y, r) {
    let n = 0;
    if (!R._bugs) return 0;
    for (const b of R._bugs) if (!b.dead && HB.dist2(x, y, b.x, b.y) < r * r) n++;
    return n;
  }

  // Un sitio pisable junto al borde de un edificio, del lado del comandante.
  function besideSpot(R, e, from) {
    const m = HB.Logic.dims(e), N = nav(R);
    const cands = [
      { x: HB.clamp(from.x, e.x - m.w / 2, e.x + m.w / 2), y: e.y - m.h / 2 - 0.5 },
      { x: HB.clamp(from.x, e.x - m.w / 2, e.x + m.w / 2), y: e.y + m.h / 2 + 0.5 },
      { x: e.x - m.w / 2 - 0.5, y: HB.clamp(from.y, e.y - m.h / 2, e.y + m.h / 2) },
      { x: e.x + m.w / 2 + 0.5, y: HB.clamp(from.y, e.y - m.h / 2, e.y + m.h / 2) },
    ];
    let best = null, bd = Infinity;
    for (const p of cands) {
      if (N.blocked[cellOf(N, p.x, p.y)]) continue;
      const d = HB.dist(from.x, from.y, p.x, p.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function needsRepair(R) {
    let best = null, bs = 0;
    for (const e of R.ents) {
      const d = def(e);
      if (d.kind === 'dronepad' || e.hp >= d.hp) continue;
      const lack = 1 - e.hp / d.hp;
      // escombros primero; luego la Torre de mando y las torretas
      const s = (e.dead ? 3 : 0) + (d.kind === 'hq' ? 1.5 : 0) + (d.kind === 'turret' ? 1 : 0) + lack;
      const limit = d.kind === 'hq' ? 0.2 : 0.35;
      if ((e.dead || lack > limit) && s > bs) { bs = s; best = e; }
    }
    return best;
  }

  // Dónde plantarse de noche: detrás de la torreta más amenazada (quieto dispara un 30 % más).
  function defendSpot(R, c) {
    // Lo primero, el bicho que ya está encima de la base: plantarse a tiro de él (a 3 casillas,
    // del lado del comandante), porque puede estar mordiendo por donde no llega ninguna torreta.
    const H = R.ents.find(function (e) { return def(e).kind === 'hq'; });
    if (H) {
      let near = null, nd = 6 * 6;
      for (const b of R._bugs || []) {
        if (b.dead || HB.ENEMIES[b.type].flee) continue;
        const d = HB.dist2(H.x, H.y, b.x, b.y);
        if (d < nd) { nd = d; near = b; }
      }
      if (near) {
        const N = nav(R);
        for (const from of [c, H]) {
          const dx = from.x - near.x, dy = from.y - near.y, l = Math.sqrt(dx * dx + dy * dy) || 1;
          const p = { x: near.x + dx / l * 3, y: near.y + dy / l * 3 };
          if (!N.blocked[cellOf(N, p.x, p.y)]) return p;
        }
      }
    }
    let tb = null, tbd = Infinity;
    for (const b of R._bugs || []) {
      if (b.dead) continue;
      const d = HB.dist2(c.x, c.y, b.x, b.y);
      if (d < tbd) { tbd = d; tb = b; }
    }
    if (!tb) return null;
    let ref = null, rd = Infinity;
    for (const e of R.ents) {
      if (def(e).kind !== 'turret' || e.dead) continue;
      const d = HB.dist2(e.x, e.y, tb.x, tb.y);
      if (d < rd) { rd = d; ref = e; }
    }
    if (ref) return HB.Logic.padPos(ref, 'box', R.id);
    const s = HB.Logic.sideOf(R.id, tb.y);
    return { x: H.x, y: H.y - s * 1.8 };
  }

  function nearestLoot(R, c, r) {
    let best = null, bd = r * r;
    for (const l of R._loot || []) {
      const d = HB.dist2(c.x, c.y, l.x, l.y);
      if (d < bd && bugsNear(R, l.x, l.y, 2.2) === 0) { bd = d; best = l; }
    }
    return best;
  }

  function hintFor(kind, e) {
    if (kind === 'mine') return 'hint_mine';
    if (kind === 'pickup') return e && def(e).output === 'ammo' ? 'hint_ammo' : 'hint_pickup';
    if (kind === 'collect') return 'hint_collect';
    if (kind === 'pay') return 'hint_pay';
    if (kind === 'refill') return 'hint_refill';
    if (kind === 'repair') return 'hint_repair';
    if (kind === 'nest') return 'hint_nest';
    if (kind === 'trash') return 'hint_trash';
    if (kind === 'deliver') {
      if (e.type === 'smelter') return 'hint_deposit';
      if (e.type === 'export') return 'hint_export';
      return 'hint_feed';
    }
    return null;
  }

  function mk(kind, x, y, e, z) { return { kind: kind, x: x, y: y, e: e || null, z: z || null, hint: hintFor(kind, e) }; }

  function same(t, kind, e) { return t && t.kind === kind && t.e === e; }

  function stillValid(st, t, mem) {
    const R = st.regions[st.cur], c = st.cmd, cap = HB.CONFIG.cmd.stackCap;
    if (!t) return false;
    if (t.kind === 'mine') return c.stack.length < cap && R.veins.length > 0;
    if (t.kind === 'collect') return R.pile > 0;
    if (t.kind === 'deliver') return R._byId[t.e.id] === t.e && acceptCount(t.e, c.stack) > 0;
    if (t.kind === 'refill') return !t.e.dead && HB.Logic.boxRoom(t.e) && count(c.stack, 'ammo') > 0;
    if (t.kind === 'pickup') {
      const e = t.e, d = def(e);
      if (c.stack.length >= cap || e.dead) return false;
      if (e.out > 0) return true;
      // Esperar a que salga lo que se está fabricando, pero no eternamente.
      const coming = e.busy || (function () { for (const k in d.inputs) if (e.inBuf[k] >= d.inputs[k]) return true; return false; })();
      return coming && c.stack.length < cap / 2 && st.time - mem.since < 8;
    }
    return false;
  }

  function choose(st, mem) {
    const R = st.regions[st.cur], c = st.cmd, cap = HB.CONFIG.cmd.stackCap;
    const strat = mem.strat || 'balanced';
    if (c.deadT > 0) return mk('wait', c.x, c.y);
    const night = R.phase === 'night';
    const bossTime = R.nestReady && !R.cleared && R.phase === 'day' && HB.Night.bossRating(R).level !== 'red';
    const soon = R.phase === 'warn' || bossTime || (R.heatOn && R.phase === 'day' && R.heat >= HB.Night.barSize(R) * 0.7);
    const H = R.ents.find(function (e) { return def(e).kind === 'hq'; });
    const boss = night && R._night && R._night.bossRef && !R._night.bossRef.dead ? R._night.bossRef : null;
    // De noche manda la defensa en cuanto hay bichos cerca del comandante o de la base.
    const threat = night && (boss || bugsNear(R, c.x, c.y, 7) > 0 || (H && bugsNear(R, H.x, H.y, 10) > 0));
    const ammoIn = count(c.stack, 'ammo');

    // 1. Munición para las torretas: de noche, cuando se acerca y si van muy vacías.
    const limit = night ? 0.6 : (soon ? 0.85 : (strat === 'defense' ? 0.7 : 0.35));
    const hungry = hungryTurret(R, limit, c);
    if (hungry && ammoIn > 0) {
      if (same(mem.task, 'refill', hungry)) return mem.task;
      const p = HB.Logic.padPos(hungry, 'box', R.id);
      return mk('refill', p.x, p.y, hungry);
    }
    if (hungry && (night || soon) && c.stack.length < cap) {
      const src = ammoSource(R);
      if (src && !(threat && bugsNear(R, src.x, src.y, 3) > 0)) {
        if (same(mem.task, 'pickup', src)) return mem.task;
        const p = HB.Logic.padPos(src, 'out');
        return mk('pickup', p.x, p.y, src);
      }
    }

    // 2. De noche: botín cercano, y si no, plantarse a defender.
    if (night) {
      const l = nearestLoot(R, c, threat ? 3 : 6);
      if (l) return mk('loot', l.x, l.y);
      if (threat) {
        let p = defendSpot(R, c);
        if (boss && H) {
          // contra el jefe: a 3 casillas de él, del lado de la base (a tiro y sin que muerda)
          const dx = H.x - boss.x, dy = H.y - boss.y, l = Math.sqrt(dx * dx + dy * dy) || 1;
          p = { x: boss.x + dx / l * 3.2, y: boss.y + dy / l * 3.2 };
          const N = nav(R);
          if (N.blocked[cellOf(N, p.x, p.y)]) p = defendSpot(R, c);
        }
        if (c.hp < HB.CONFIG.cmd.hp * 0.35 && H) p = { x: H.x, y: H.y + HB.Logic.sideOf(R.id, (p || H).y) * -1.8 };
        if (p) {
          if (mem.task && mem.task.kind === 'defend' && HB.dist(mem.task.x, mem.task.y, p.x, p.y) < 1) return mem.task;
          return mk('defend', p.x, p.y);
        }
      }
    }

    // 2b. De día, el botín que quedó en el suelo antes de que desaparezca.
    if (!night) {
      const l = nearestLoot(R, c, 9);
      if (l) return mk('loot', l.x, l.y);
    }

    // 3. Si puedes pagar una zona, eso primero (la más barata).
    const za = cheapest(R, true);
    if (za && !threat) {
      if (mem.task && mem.task.kind === 'pay' && mem.task.z === za.z) return mem.task;
      const p = HB.Logic.zonePadPos(za.z);
      return mk('pay', p.x, p.y, null, za.z);
    }

    // 3b. El suministro aéreo: solo si se ven los vídeos (sin vídeo la caja no da nada).
    if (mem.ads && !night && !threat && R.supply && R.supply.box && R.supply.box.t > HB.CONFIG.supply.fall) {
      const b = R.supply.box;
      return mk('supply', b.x, b.y);
    }

    // 4. Reparar lo roto (de día), con placas de la pila; si no hay de dónde sacarlas, pagando.
    if (!night) {
      const broken = needsRepair(R);
      let plateSrc = null;
      for (const e of R.ents) if (def(e).output === 'plate' && !e.dead && e.out >= 3 && (!plateSrc || e.out > plateSrc.out)) plateSrc = e;
      if (broken && (count(c.stack, 'plate') > 0 || (!plateSrc && R.credits >= HB.CONFIG.cmd.repairCash))) {
        if (same(mem.task, 'repair', broken)) return mem.task;
        const p = besideSpot(R, broken, c);
        if (p) return mk('repair', p.x, p.y, broken);
      }
      // sin placas: ir a por ellas a una Fundición
      if (broken && c.stack.length < cap && (broken.dead || def(broken).kind === 'hq')) {
        const src = plateSrc;
        if (src) {
          if (same(mem.task, 'pickup', src)) return mem.task;
          const p = HB.Logic.padPos(src, 'out');
          return mk('pickup', p.x, p.y, src);
        }
      }
    }

    // 5. El Nido: lanzar al jefe cuando la defensa está a la altura (verde, o ámbar tras esperar).
    if (R.nestReady && !R.cleared && R.phase === 'day' && !hungryTurret(R, 0.85) && !needsRepair(R)) {
      const rating = HB.Night.bossRating(R);
      if (rating.level === 'green' || (rating.level === 'amber' && R.nights >= (mem.bossPatience || 14))) {
        const z = HB.REGIONS[R.id].zones.find(function (q) { return q.kind === 'nest'; });
        return mk('nest', z.x, z.y);
      }
    }

    // 6. Seguir con lo que se estaba haciendo, si todavía tiene sentido.
    if (stillValid(st, mem.task, mem)) return mem.task;

    const ex = exportEnt(R);
    const next = cheapest(R, false);

    // 7. Recoger el dinero si con él ya llega para la siguiente zona o la caja se está llenando.
    if (R.pile > 0 && ex) {
      const vault = HB.Logic.level(ex).vault;
      if ((next && R.credits + R.pile >= next.rem) || R.pile >= vault * 0.5 || c.stack.length === 0 && R.pile >= 30) {
        const p = HB.Logic.padPos(ex, 'pile');
        return mk('collect', p.x, p.y, ex);
      }
    }

    // 8. Llevar lo que hay en la pila a quien más lo aproveche (fabricar antes que vender).
    if (c.stack.length > 0) {
      let best = null, bs = 0;
      for (const e of R.ents) {
        const n = acceptCount(e, c.stack);
        if (n <= 0) continue;
        const p = HB.Logic.padPos(e, 'in');
        const s = n * (def(e).kind === 'proc' ? 2 : 1) - HB.dist(c.x, c.y, p.x, p.y) * 0.05;
        if (s > bs) { bs = s; best = e; }
      }
      // la munición, si alguna torreta tiene hueco y no vamos a por beneficio, a la torreta
      if (ammoIn > 0 && strat !== 'profit') {
        const t = hungryTurret(R, strat === 'defense' ? 1 : 0.8, c);
        if (t) { const p = HB.Logic.padPos(t, 'box', R.id); return mk('refill', p.x, p.y, t); }
      }
      if (best) { const p = HB.Logic.padPos(best, 'in'); return mk('deliver', p.x, p.y, best); }
    }

    // 9. Recoger lo fabricado.
    let pe = null, po = 0;
    for (const e of R.ents) {
      if (def(e).kind !== 'proc' || e.out <= 0 || e.dead) continue;
      const enough = e.out >= Math.min(4, cap - c.stack.length) || !e.busy || e.out >= HB.Logic.level(e).outCap;
      if (enough && e.out > po) { po = e.out; pe = e; }
    }
    if (pe && c.stack.length < cap) { const p = HB.Logic.padPos(pe, 'out'); return mk('pickup', p.x, p.y, pe); }

    // 10. Minar (sin pasarse: si las Fundiciones están llenas, el mineral no tiene adónde ir).
    if (c.stack.length < cap && oreRoom(R) > count(c.stack, 'ore')) {
      const s = bestSpot(st);
      if (s) return mk('mine', s.x, s.y);
    }

    // 10b. Atascado: la pila llena y todo lo que la quiere está lleno por los dos lados (una
    // Fundición sin hueco que tampoco puede soltar lo que fabrica). Al reciclador.
    const tr = HB.REGIONS[R.id].trash;
    if (tr && c.stack.length >= cap && stuck(R, c.stack)) return mk('trash', tr.x, tr.y);

    // 11. Nada que hacer con la pila llena: dinero, o esperar junto a quien la quiera.
    if (R.pile > 0 && ex) { const p = HB.Logic.padPos(ex, 'pile'); return mk('collect', p.x, p.y, ex); }
    for (const e of R.ents) {
      if (wantsAny(e, c.stack) && def(e).kind !== 'turret') { const p = HB.Logic.padPos(e, 'in'); return mk('wait', p.x, p.y, e); }
    }
    return mk('wait', c.x, c.y);
  }

  // Lo que el robot elige en las ventanas: tipo de torreta, informe y segunda oportunidad.
  function decide(st, mem) {
    const R = st.regions[st.cur];
    if (st.choice) {
      let g = 0;
      for (const e of R.ents) if (e.type === 'gatling') g++;
      const pick = st.choice.options.indexOf('cannon') >= 0 && g >= 1 && (g % 2 === 1) ? 'cannon' : st.choice.options[0];
      HB.Logic.choose(st, pick);
      return 'choice:' + pick;
    }
    if (st.defeat) {
      if (mem.ads) { HB.Night.secondChance(st); return 'second'; }
      HB.Night.giveUp(st);
      return 'giveup';
    }
    if (st.away) {
      HB.Offline.claim(st, mem.ads ? 2 : 1);
      return mem.ads ? 'x2' : 'claim';
    }
    if (!st.report && HB.Chests.pending(st)) { HB.Chests.claim(st); return 'chest'; }
    if (st.supply) { HB.Supply.claim(st, !!mem.ads); return mem.ads ? 'supply' : 'decline'; }
    // la tarjeta de «tu base nunca duerme» al conquistar la región: el robot la da por leída
    if (R.cleared && !st.report && st.ftue.offlineTip === undefined) { HB.Logic.ftue(st, 'offlineTip'); return 'tip'; }
    if (st.report) {
      const x2 = mem.ads && st.report.won;
      HB.Night.claimReport(st, x2 ? 2 : 1);
      return x2 ? 'x2' : 'claim';
    }
    return null;
  }

  HB.Advisor = {
    // Qué haría ahora un jugador que sabe jugar. mem guarda la tarea en curso (no se guarda).
    // mem.strat: 'balanced' (por defecto), 'profit' o 'defense'.
    target: function (st, mem) {
      const t = choose(st, mem);
      if (t !== mem.task) { mem.task = t; mem.since = st.time; }
      return t;
    },

    decide: decide,

    // El robot: decide y produce una dirección de joystick en out {x, y}.
    bot: function (st, mem, out) {
      const t = HB.Advisor.target(st, mem);
      const c = st.cmd;
      // Si lleva un segundo sin avanzar, un empujón lateral (por si se atasca en una esquina).
      if (mem.lastX === undefined || st.time - mem.lastT >= 1) {
        const moved = mem.lastX === undefined ? 1 : HB.dist(c.x, c.y, mem.lastX, mem.lastY);
        const far = HB.dist(c.x, c.y, t.x, t.y) > 0.3;
        if (moved < 0.05 && far) mem.nudge = 0.4;
        mem.lastX = c.x; mem.lastY = c.y; mem.lastT = st.time;
      }
      const arrived = steer(st, t.x, t.y, out);
      if (mem.nudge > 0 && !arrived) {
        mem.nudge -= 1 / HB.CONFIG.tickHz;
        const nx = -out.y, ny = out.x;
        out.x = out.x * 0.3 + nx; out.y = out.y * 0.3 + ny;
      }
      return t;
    },

    steer: steer,
    ammoFrac: ammoFrac,
  };
})(globalThis.HB);
