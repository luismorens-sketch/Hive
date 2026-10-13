// Hive Breaker — el consejero: decide "qué toca hacer ahora" y cómo llegar.
//
// Lo usan tres cosas a la vez, y por eso vive aquí, sin DOM:
//   1. La flecha guía del juego (pilar 4: siempre una flecha que dice adónde ir).
//   2. El piloto automático del menú de pruebas.
//   3. El robot del simulador (tools/sim_balance.js).
// Si el robot y la flecha piensan igual, el simulador mide el juego que ve el jugador.
//
// Para moverse usa un campo de flujo sobre una rejilla de medias casillas (el mismo concepto que
// usarán los bichos en el hito 4).
(function (HB) {
  'use strict';

  const CS = 0.5;   // tamaño de celda de la rejilla, en casillas

  // ---------- Rejilla y campo de flujo ----------
  function nav(R) {
    const n = R._nav;
    if (n && n.ver === R._solidsVer && n.fogY === R.fogY) return n;
    const d = HB.REGIONS[R.id];
    const gw = Math.round(d.w / CS), gh = Math.round(d.h / CS);
    const blocked = new Uint8Array(gw * gh);
    const r = HB.CONFIG.cmd.radius + 0.05;
    const solids = HB.Logic.solids(R);
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const x = (i + 0.5) * CS, y = (j + 0.5) * CS;
        let b = y < R.fogY + r;
        for (let k = 0; !b && k < solids.length; k++) {
          const s = solids[k];
          if (s.t === 'r') b = x > s.x0 - r && x < s.x1 + r && y > s.y0 - r && y < s.y1 + r;
          else b = HB.dist2(x, y, s.x, s.y) < (s.r + r) * (s.r + r);
        }
        blocked[j * gw + i] = b ? 1 : 0;
      }
    }
    R._nav = { ver: R._solidsVer, fogY: R.fogY, gw: gw, gh: gh, blocked: blocked, fields: {}, spots: null };
    return R._nav;
  }

  function cellOf(N, x, y) {
    const i = HB.clamp(Math.floor(x / CS), 0, N.gw - 1);
    const j = HB.clamp(Math.floor(y / CS), 0, N.gh - 1);
    return j * N.gw + i;
  }

  function field(N, tx, ty) {
    const t = cellOf(N, tx, ty);
    if (N.fields[t]) return N.fields[t];
    const dist = new Float32Array(N.gw * N.gh).fill(1e9);
    const q = new Int32Array(N.gw * N.gh);
    let qh = 0, qt = 0;
    dist[t] = 0; q[qt++] = t;
    while (qh < qt) {
      const cur = q[qh++];
      const ci = cur % N.gw, cj = (cur - ci) / N.gw;
      const nd = dist[cur] + 1;
      const nb = [cur - 1, cur + 1, cur - N.gw, cur + N.gw];
      const ok = [ci > 0, ci < N.gw - 1, cj > 0, cj < N.gh - 1];
      for (let k = 0; k < 4; k++) {
        if (!ok[k]) continue;
        const nx = nb[k];
        if (N.blocked[nx] || dist[nx] <= nd) continue;
        dist[nx] = nd; q[qt++] = nx;
      }
    }
    N.fields[t] = dist;
    return dist;
  }

  function lineClear(N, ax, ay, bx, by) {
    const d = HB.dist(ax, ay, bx, by);
    const n = Math.ceil(d / 0.2);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      if (N.blocked[cellOf(N, ax + (bx - ax) * t, ay + (by - ay) * t)]) return false;
    }
    return true;
  }

  // Dirección para ir de donde está el comandante a (tx, ty). Devuelve true al llegar.
  function steer(st, tx, ty, out) {
    const R = st.regions[st.cur], c = st.cmd;
    const dx = tx - c.x, dy = ty - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.12) { out.x = 0; out.y = 0; return true; }
    const N = nav(R);
    let ux, uy;
    if (lineClear(N, c.x, c.y, tx, ty)) { ux = dx / d; uy = dy / d; }
    else {
      const F = field(N, tx, ty);
      const cur = cellOf(N, c.x, c.y);
      const ci = cur % N.gw, cj = (cur - ci) / N.gw;
      let best = -1, bv = F[cur] < 1e9 ? F[cur] : 1e9;
      for (let oj = -1; oj <= 1; oj++) {
        for (let oi = -1; oi <= 1; oi++) {
          if (!oi && !oj) continue;
          const i = ci + oi, j = cj + oj;
          if (i < 0 || j < 0 || i >= N.gw || j >= N.gh) continue;
          const k = j * N.gw + i;
          if (N.blocked[k]) continue;
          if (oi && oj && (N.blocked[cj * N.gw + i] || N.blocked[j * N.gw + ci])) continue;
          const v = F[k] + (oi && oj ? 0.41 : 0);
          if (v < bv) { bv = v; best = k; }
        }
      }
      if (best < 0) { ux = dx / d; uy = dy / d; }
      else {
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
    for (const e of R.ents) if (HB.MACHINES[e.type].kind === 'export') return e;
    return null;
  }

  // Cuántos objetos de la pila aceptaría ahora la máquina e (limitado por su hueco).
  function acceptCount(e, stack) {
    const def = HB.MACHINES[e.type];
    if (def.kind !== 'proc' && def.kind !== 'export') return 0;
    const L = HB.Logic.level(e);
    let n = 0;
    if (def.kind === 'proc') {
      for (const k in def.inputs) {
        let have = 0;
        for (const it of stack) if (it === k) have++;
        n += Math.min(have, L.inCap - e.inBuf[k]);
      }
    } else if (def.kind === 'export') {
      let have = 0;
      for (const it of stack) if (def.accepts.indexOf(it) >= 0) have++;
      n = Math.min(have, L.inCap - HB.Logic.totalIn(e));
    }
    return Math.max(0, n);
  }

  function wantsAny(e, stack) {
    const def = HB.MACHINES[e.type];
    for (const it of stack) {
      if (def.kind === 'proc' && def.inputs[it] !== undefined) return true;
      if (def.kind === 'export' && def.accepts.indexOf(it) >= 0) return true;
    }
    return false;
  }

  function hintFor(kind, e) {
    if (kind === 'mine') return 'hint_mine';
    if (kind === 'pickup') return 'hint_pickup';
    if (kind === 'collect') return 'hint_collect';
    if (kind === 'pay') return 'hint_pay';
    if (kind === 'deliver') {
      if (e.type === 'smelter') return 'hint_deposit';
      if (e.type === 'export') return 'hint_export';
      return 'hint_feed';
    }
    return null;
  }

  function mk(kind, x, y, e, z) { return { kind: kind, x: x, y: y, e: e || null, z: z || null, hint: hintFor(kind, e) }; }

  function stillValid(st, t, mem) {
    const R = st.regions[st.cur], c = st.cmd, cap = HB.CONFIG.cmd.stackCap;
    if (!t) return false;
    if (t.kind === 'mine') return c.stack.length < cap && R.veins.length > 0;
    if (t.kind === 'collect') return R.pile > 0;
    if (t.kind === 'deliver') return R._byId[t.e.id] === t.e && acceptCount(t.e, c.stack) > 0;
    if (t.kind === 'pickup') {
      const e = t.e, def = HB.MACHINES[e.type];
      if (c.stack.length >= cap) return false;
      if (e.out > 0) return true;
      // Esperar a que salga lo que se está fabricando, pero no eternamente.
      const coming = e.busy || (function () { for (const k in def.inputs) if (e.inBuf[k] >= def.inputs[k]) return true; return false; })();
      return coming && c.stack.length < cap / 2 && st.time - mem.since < 8;
    }
    return false;
  }

  function choose(st, mem) {
    const R = st.regions[st.cur], c = st.cmd, cap = HB.CONFIG.cmd.stackCap;

    // 1. Si puedes pagar una zona, eso primero (la más barata).
    const za = cheapest(R, true);
    if (za) {
      if (mem.task && mem.task.kind === 'pay' && mem.task.z === za.z) return mem.task;
      const p = HB.Logic.zonePadPos(za.z);
      return mk('pay', p.x, p.y, null, za.z);
    }

    // 2. Seguir con lo que se estaba haciendo, si todavía tiene sentido.
    if (stillValid(st, mem.task, mem)) return mem.task;

    const ex = exportEnt(R);
    const next = cheapest(R, false);

    // 3. Recoger el dinero si con él ya llega para la siguiente zona o la caja se está llenando.
    if (R.pile > 0 && ex) {
      const vault = HB.Logic.level(ex).vault;
      if ((next && R.credits + R.pile >= next.rem) || R.pile >= vault * 0.5 || c.stack.length === 0 && R.pile >= 30) {
        const p = HB.Logic.padPos(ex, 'pile');
        return mk('collect', p.x, p.y, ex);
      }
    }

    // 4. Llevar lo que hay en la pila a quien más lo aproveche (fabricar antes que vender).
    if (c.stack.length > 0) {
      let best = null, bs = 0;
      for (const e of R.ents) {
        const n = acceptCount(e, c.stack);
        if (n <= 0) continue;
        const p = HB.Logic.padPos(e, 'in');
        const s = n * (HB.MACHINES[e.type].kind === 'proc' ? 2 : 1) - HB.dist(c.x, c.y, p.x, p.y) * 0.05;
        if (s > bs) { bs = s; best = e; }
      }
      if (best) { const p = HB.Logic.padPos(best, 'in'); return mk('deliver', p.x, p.y, best); }
    }

    // 5. Recoger lo fabricado.
    let pe = null, po = 0;
    for (const e of R.ents) {
      if (HB.MACHINES[e.type].kind !== 'proc' || e.out <= 0) continue;
      const enough = e.out >= Math.min(4, cap - c.stack.length) || !e.busy || e.out >= HB.Logic.level(e).outCap;
      if (enough && e.out > po) { po = e.out; pe = e; }
    }
    if (pe && c.stack.length < cap) { const p = HB.Logic.padPos(pe, 'out'); return mk('pickup', p.x, p.y, pe); }

    // 6. Minar.
    if (c.stack.length < cap) {
      const s = bestSpot(st);
      if (s) return mk('mine', s.x, s.y);
    }

    // 7. Nada que hacer con la pila llena: dinero, o esperar junto a quien la quiera.
    if (R.pile > 0 && ex) { const p = HB.Logic.padPos(ex, 'pile'); return mk('collect', p.x, p.y, ex); }
    for (const e of R.ents) {
      if (wantsAny(e, c.stack)) { const p = HB.Logic.padPos(e, 'in'); return mk('wait', p.x, p.y, e); }
    }
    return mk('wait', c.x, c.y);
  }

  HB.Advisor = {
    // Qué haría ahora un jugador que sabe jugar. mem guarda la tarea en curso (no se guarda).
    target: function (st, mem) {
      const t = choose(st, mem);
      if (t !== mem.task) { mem.task = t; mem.since = st.time; }
      return t;
    },

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
  };
})(globalThis.HB);
