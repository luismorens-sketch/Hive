// Hive Breaker — el Calor, la noche, los bichos, las torretas y el jefe (funcional 3, 8, 9, 11).
// Sin DOM: lo usa también el simulador.
//
//   Día:   las máquinas que trabajan llenan la barra de Calor. Llena (o a los 6 min) →
//          «THE HIVE STIRS» 10 s → noche.
//   Noche: grupos de bichos por 1-3 flancos. Van a la Torre de mando siguiendo un campo de
//          flujo y muerden lo que tengan al lado. Las torretas gastan munición de su caja.
//          El comandante dispara solo (quieto, +30 %). Los bichos sueltan botín.
//   Fin:   sin bichos → amanecer e informe. Si cae la Torre de mando → segunda oportunidad o
//          noche perdida (se pierde el botín de esa noche; nunca lo ahorrado ni lo comprado).
// Bichos, disparos y botín empiezan por "_": no se guardan (una noche a medias no se guarda).
(function (HB) {
  'use strict';

  const CS = 0.5;   // celda del campo de flujo de los bichos (casillas)

  function C() { return HB.CONFIG; }
  function ev(st, k, a, b, c) { st.ev.push({ k: k, a: a, b: b, c: c }); }
  function def(e) { return HB.MACHINES[e.type]; }
  function rdef(R) { return HB.REGIONS[R.id]; }
  function pf(R) { return R.power ? R.power.f : 1; }

  function barSize(R) { return rdef(R).B0 * (1 + 0.25 * (R.nights + 1)); }
  function threat(R, n) { return rdef(R).A0 * (1 + 0.15 * n); }

  function hq(R) { for (const e of R.ents) if (def(e).kind === 'hq') return e; return null; }

  // ---------- Campo de flujo hacia la Torre de mando ----------
  // jump = true: el de los Leapers, que saltan los muros.
  function field(R, jump) {
    const key = jump ? 'j' : 'g';
    let F = R._bf;
    if (!F || F.ver !== R._solidsVer) F = R._bf = { ver: R._solidsVer };
    if (F[key]) return F[key];
    const d = rdef(R);
    const gw = Math.round(d.w / CS), gh = Math.round(d.h / CS);
    const blocked = new Uint8Array(gw * gh), wall = new Uint8Array(gw * gh);
    const goal = [];
    const H = hq(R);
    const solids = HB.Logic.solids(R);
    const m = 0.22;
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const x = (i + 0.5) * CS, y = (j + 0.5) * CS, k = j * gw + i;
        if (H && Math.abs(x - H.x) < HB.Logic.dims(H).w / 2 + 0.5 && Math.abs(y - H.y) < HB.Logic.dims(H).h / 2 + 0.5) { goal.push(k); continue; }
        for (const s of solids) {
          let hit;
          if (s.t === 'r') hit = x > s.x0 - m && x < s.x1 + m && y > s.y0 - m && y < s.y1 + m;
          else hit = HB.dist2(x, y, s.x, s.y) < (s.r + m) * (s.r + m);
          if (!hit) continue;
          if (s.wall) { wall[k] = 1; if (jump) continue; }
          blocked[k] = 1; break;
        }
      }
    }
    const dist = new Float32Array(gw * gh).fill(1e9);
    const q = new Int32Array(gw * gh);
    let qh = 0, qt = 0;
    for (const k of goal) { dist[k] = 0; q[qt++] = k; }
    while (qh < qt) {
      const cur = q[qh++];
      const ci = cur % gw, cj = (cur - ci) / gw, nd = dist[cur] + 1;
      if (ci > 0 && !blocked[cur - 1] && dist[cur - 1] > nd) { dist[cur - 1] = nd; q[qt++] = cur - 1; }
      if (ci < gw - 1 && !blocked[cur + 1] && dist[cur + 1] > nd) { dist[cur + 1] = nd; q[qt++] = cur + 1; }
      if (cj > 0 && !blocked[cur - gw] && dist[cur - gw] > nd) { dist[cur - gw] = nd; q[qt++] = cur - gw; }
      if (cj < gh - 1 && !blocked[cur + gw] && dist[cur + gw] > nd) { dist[cur + gw] = nd; q[qt++] = cur + gw; }
    }
    F[key] = { gw: gw, gh: gh, dist: dist, blocked: blocked, wall: wall };
    return F[key];
  }

  function cellOf(F, x, y) {
    const i = HB.clamp(Math.floor(x / CS), 0, F.gw - 1), j = HB.clamp(Math.floor(y / CS), 0, F.gh - 1);
    return j * F.gw + i;
  }

  // Dirección cuesta abajo en el campo. Devuelve la celda elegida (o -1).
  function downhill(F, x, y, out) {
    const cur = cellOf(F, x, y);
    const ci = cur % F.gw, cj = (cur - ci) / F.gw;
    let best = -1, bv = F.dist[cur];
    for (let oj = -1; oj <= 1; oj++) {
      for (let oi = -1; oi <= 1; oi++) {
        if (!oi && !oj) continue;
        const i = ci + oi, j = cj + oj;
        if (i < 0 || j < 0 || i >= F.gw || j >= F.gh) continue;
        const k = j * F.gw + i;
        if (F.blocked[k]) continue;
        if (oi && oj && (F.blocked[cj * F.gw + i] || F.blocked[j * F.gw + ci])) continue;
        const v = F.dist[k] + (oi && oj ? 0.41 : 0);
        if (v < bv) { bv = v; best = k; }
      }
    }
    if (best < 0) return -1;
    const bi = best % F.gw, bj = (best - bi) / F.gw;
    out.x = (bi + 0.5) * CS - x; out.y = (bj + 0.5) * CS - y;
    const l = Math.sqrt(out.x * out.x + out.y * out.y) || 1;
    out.x /= l; out.y /= l;
    return best;
  }

  // ---------- Planificar y empezar la noche ----------
  function openFlanks(R) {
    const out = ['s'];
    const d = rdef(R);
    const exp = d.zones.find(function (z) { return z.kind === 'expansion'; });
    if (exp && R.bought[exp.id] !== undefined && R.nights + 1 >= C().night.northFrom) out.push('n');
    return out;
  }

  function plan(st, R, opts) {
    opts = opts || {};
    const N = C().night;
    const n = R.nights + 1;
    const first = n === 1 && !opts.boss;
    // flancos de esta noche
    const open = openFlanks(R);
    let flanks;
    if (first) flanks = ['s'];
    else {
      const count = 1 + Math.floor(HB.rand(st) * open.length);
      flanks = open.slice();
      for (let i = flanks.length - 1; i > 0; i--) { const j = Math.floor(HB.rand(st) * (i + 1)); const t = flanks[i]; flanks[i] = flanks[j]; flanks[j] = t; }
      flanks = flanks.slice(0, count);
    }
    // qué bichos: se gasta la amenaza con los pesos de la tabla ENEMIES
    const list = [];
    if (first) { for (let i = 0; i < N.firstSwarmers; i++) list.push('swarmer'); }   // noche 1 guionizada (funcional 12)
    else {
      // Tras perder, la noche se repite más suave: −mercy por cada derrota seguida (con tope).
      const mercy = Math.max(1 - N.mercyMax, 1 - N.mercy * (R.lossStreak || 0));
      let A = threat(R, n) * (opts.capped ? N.capThreat : 1) * (opts.boss ? 0.6 : 1) * mercy;
      for (let guard = 0; guard < 200 && A >= 1; guard++) {
        let tot = 0;
        const cand = [];
        for (const k in HB.ENEMIES) {
          const E = HB.ENEMIES[k];
          if (!E.cost || E.boss || (E.from || 1) > n || E.cost > A) continue;
          cand.push(k); tot += E.weight;
        }
        if (!cand.length) break;
        let r = HB.rand(st) * tot, pick = cand[0];
        for (const k of cand) { r -= HB.ENEMIES[k].weight; if (r <= 0) { pick = k; break; } }
        list.push(pick);
        A -= HB.ENEMIES[pick].cost;
      }
    }
    // el raro dorado: 1 de cada 150 Swarmers (funcional 9.5)
    for (let i = 0; i < list.length; i++) if (list[i] === 'swarmer' && HB.rand(st) < HB.ENEMIES.gilded.chance) list[i] = 'gilded';
    // en grupos, cada uno por un flanco
    let cost = 0;
    for (const k of list) cost += HB.ENEMIES[k].cost || 1;
    const g = Math.max(1, Math.ceil(cost / N.groupSize));
    const groups = [];
    for (let i = 0; i < g; i++) groups.push({ t: 2 + i * N.groupGap, flank: flanks[i % flanks.length], list: [], done: false });
    list.forEach(function (k, i) { groups[i % g].list.push(k); });
    return { n: n, flanks: flanks, groups: groups, boss: !!opts.boss, capped: !!opts.capped, provoke: opts.provoke || 0, first: first };
  }

  function startNight(st, R, p) {
    R.phase = 'night';
    R._plan = null;
    R._bugs = []; R._shots = []; R._strikes = [];
    R._bugId = 0;
    R.nightLoot = 0;
    R._orbital = (p.n >= C().night.orbitalFrom || p.boss) ? 1 : 0;
    R._night = {
      n: p.n, t: 0, groups: p.groups, flanks: p.flanks, boss: p.boss, first: p.first,
      provoke: p.provoke, capped: p.capped, kills: 0, damage: 0, usedSecond: false,
      emptyT: 0, brownT: 0, bossRef: null, bossDone: false,
    };
    if (p.boss) {
      const at = rdef(R).nestAt;
      R._night.bossRef = spawn(st, R, 'brood', at.x, at.y);
    }
    // Noche 2 (funcional 12): una torreta se queda sin munición a propósito, para aprender a
    // rellenarla. Solo si hay munición a mano (en la pila o en una Fábrica); si no, sería injusto.
    if (p.n === 2 && !p.boss && st.ftue.refill === undefined) {
      const T = R.ents.find(function (e) { return def(e).kind === 'turret' && !e.dead; });
      let handy = st.cmd.stack.indexOf('ammo') >= 0;
      for (const e of R.ents) if (def(e).kind === 'proc' && def(e).output === 'ammo' && !e.dead && e.out >= 2) handy = true;
      if (T && handy) T.ammo = Math.min(T.ammo, Math.ceil(def(T).shots * 0.4));
    }
    ev(st, 'nightStart', p.n, p.flanks);
    HB.Logic.ftue(st, 'night');
    if (R._orbital > 0) HB.Logic.ftue(st, 'orbitalReady');
  }

  function warn(st, R, opts) {
    R.phase = 'warn';
    R._warnT = C().night.warn;
    R._plan = plan(st, R, opts);
    ev(st, 'warn', R._plan);
    HB.Logic.ftue(st, 'warn');
  }

  // ---------- Bichos ----------
  function spawn(st, R, type, x, y) {
    const E = HB.ENEMIES[type];
    const n = R._night ? R._night.n : R.nights + 1;
    const mul = E.boss ? 1 : 1 + C().night.hpGrow * n;   // el jefe no crece con las noches
    const b = {
      id: ++R._bugId, type: type, x: x, y: y, hp: E.hp * mul, maxHp: E.hp * mul, r: E.r,
      cd: HB.rand(st) * 0.6, st: 'move', z: 0, jt: 0, jx: 0, jy: 0, hitT: 0, stuck: 0, lastD: 1e9,
      phase: 0, dir: Math.PI / 2, dead: false,
    };
    R._bugs.push(b);
    ev(st, 'spawn', b);
    if (type === 'leaper') HB.Logic.ftue(st, 'leaper');
    return b;
  }

  function spawnGroup(st, R, g) {
    const d = rdef(R), F = d.flanks[g.flank];
    for (let i = 0; i < g.list.length; i++) {
      const x = F.x0 + HB.rand(st) * (F.x1 - F.x0);
      const y = F.fromFog ? R.fogY - 0.6 - HB.rand(st) * 0.8 : F.y - HB.rand(st) * 0.8;
      spawn(st, R, g.list[i], x, y);
    }
    g.done = true;
    ev(st, 'wave', g);
  }

  function damageBug(st, R, b, dmg) {
    if (b.dead) return;
    b.hp -= dmg;
    b.hitT = HB.FX.hitFlash;
    ev(st, 'bugHit', b, dmg);
    if (b.hp <= 0) killBug(st, R, b);
  }

  function killBug(st, R, b) {
    b.dead = true;
    const E = HB.ENEMIES[b.type], N = R._night;
    if (N) N.kills++;
    st.stats.kills++;
    const n = N ? N.n : 1;
    const value = Math.round(E.loot * (1 + C().night.lootGrow * n));
    // el botín se esparce y a los 0,4 s vuela al imán del comandante (funcional 13.2)
    const pieces = E.boss ? 12 : (value >= 20 ? 3 : 1);
    for (let i = 0; i < pieces; i++) {
      const a = HB.rand(st) * Math.PI * 2, r = pieces > 1 ? 0.3 + HB.rand(st) * (E.boss ? 1.6 : 0.5) : 0;
      R._loot.push({ x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r * 0.6, v: value / pieces, t: 0 });
    }
    ev(st, 'kill', b, value);
    if (E.gems) { st.gems += E.gems; ev(st, 'gems', b, E.gems); }   // el dorado da unas pocas Gemas (funcional 9.5)
    if (E.boss) {
      R.cleared = true;
      if (N) N.bossDone = true;
      HB.Logic.touch(R);
      ev(st, 'bossDead', b);
      HB.Logic.ftue(st, 'cleared');
      // Con la Madre cae su prole: los bichos que quedan mueren (sueltan su botín) y no llegan
      // más. Así la noche del jefe se gana siempre que caiga ella; antes, si las crías tiraban
      // después la Torre de mando, la región quedaba conquistada y la noche, perdida.
      if (N) for (const g of N.groups) g.done = true;
      for (const o of R._bugs) if (!o.dead) killBug(st, R, o);
    }
  }

  function hurt(st, R, target, dmg) {
    const N = R._night;
    if (target === 'cmd') {
      const c = st.cmd;
      if (c.deadT > 0) return;
      c.hp -= dmg;
      ev(st, 'cmdHit', dmg);
      if (c.hp <= 0) { c.hp = 0; c.deadT = C().cmd.respawn; ev(st, 'cmdDown'); }
      return;
    }
    const e = target;
    if (e.dead) return;
    if (def(e).kind === 'hq' && N && N.first) dmg = 0;   // la primera noche no se puede perder
    if (dmg <= 0) return;
    e.hp -= dmg;
    if (N) N.damage += dmg;
    ev(st, 'hit', e, dmg);
    if (e.hp > 0) return;
    e.hp = 0;
    if (def(e).kind === 'hq') { defeat(st, R); return; }
    e.dead = true;
    HB.Logic.touch(R);
    ev(st, 'destroyed', e);
  }

  const dir = { x: 0, y: 0 };
  function bugsStep(st, R, dt) {
    const bugs = R._bugs, c = st.cmd, solids = HB.Logic.solids(R);
    const d = rdef(R);
    const cmdAlive = c.deadT <= 0;
    for (const b of bugs) {
      if (b.dead) continue;
      const E = HB.ENEMIES[b.type];
      if (b.hitT > 0) b.hitT -= dt;
      if (b.slowT > 0) b.slowT -= dt;   // frenado por una torreta de choque
      if (b.st === 'jump') {
        b.jt += dt;
        b.x += b.jx * dt; b.y += b.jy * dt;
        b.z = Math.sin(Math.PI * Math.min(1, b.jt / 0.6)) * 0.9;
        if (b.jt >= 0.6) { b.st = 'move'; b.z = 0; HB.Logic.collide(b, solids, b.r, false); }
        continue;
      }
      // ¿A quién muerde? Al comandante si lo tiene al lado; si no, al edificio que roce.
      let target = null;
      if (E.dmg > 0) {
        if (cmdAlive && HB.dist(b.x, b.y, c.x, c.y) < b.r + 0.55) target = 'cmd';
        else {
          let bd = b.r + 0.22;
          for (const s of solids) {
            if (s.t !== 'r' || (s.wall && b.stuck < 1.5)) continue;
            const dd = HB.Logic.edgeDist(s.e, b.x, b.y);
            if (dd < bd) { bd = dd; target = s.e; }
          }
        }
      }
      if (target) {
        b.st = 'atk';
        b.cd -= dt;
        const tx = target === 'cmd' ? c.x : target.x, ty = target === 'cmd' ? c.y : target.y;
        b.dir = Math.atan2(ty - b.y, tx - b.x);
        if (b.cd <= 0) { b.cd = 1 / E.rate; hurt(st, R, target, E.dmg); ev(st, 'bite', b, target); }
        continue;
      }
      b.st = 'move';
      let speed = E.speed;
      if (b.slowT > 0) speed *= b.slowK || 1;
      if (E.flee) {
        // el dorado huye hacia el borde más cercano (funcional 9.5)
        const ex = b.x < d.w / 2 ? -1 : 1;
        dir.x = ex * 0.8 + (b.x - c.x) * 0.05; dir.y = (b.y - c.y) * 0.05;
        const l = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
        dir.x /= l; dir.y /= l;
        if (b.x < 0.3 || b.x > d.w - 0.3) { b.dead = true; ev(st, 'escape', b); continue; }
      } else {
        const F = field(R, !!E.jump);
        const cell = downhill(F, b.x, b.y, dir);
        if (cell < 0) {
          const H = hq(R);
          dir.x = H.x - b.x; dir.y = H.y - b.y;
          const l = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
          dir.x /= l; dir.y /= l;
        } else if (E.jump) {
          // un muro delante: salto (funcional 9.5: el Leaper salta muros)
          const ahead = cellOf(F, b.x + dir.x * 0.6, b.y + dir.y * 0.6);
          if (F.wall[ahead]) {
            b.st = 'jump'; b.jt = 0; b.jx = dir.x * speed * 1.6; b.jy = dir.y * speed * 1.6;
            ev(st, 'jump', b);
            continue;
          }
        }
        const here = F.dist[cellOf(F, b.x, b.y)];
        if (here >= b.lastD - 0.01) b.stuck += dt; else { b.stuck = 0; b.lastD = here; }
      }
      b.dir = Math.atan2(dir.y, dir.x);
      b.x += dir.x * speed * dt; b.y += dir.y * speed * dt;
      HB.Logic.collide(b, solids, b.r, false);
      b.x = HB.clamp(b.x, b.r, d.w - b.r);
      b.y = HB.clamp(b.y, 0, d.h);
    }
    // separación: que no se amontonen todos en el mismo punto
    for (let i = 0; i < bugs.length; i++) {
      const a = bugs[i];
      if (a.dead || a.st === 'jump') continue;
      for (let j = i + 1; j < bugs.length; j++) {
        const b = bugs[j];
        if (b.dead || b.st === 'jump') continue;
        const dx = b.x - a.x, dy = b.y - a.y, min = (a.r + b.r) * 0.9;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 1e-8) continue;
        const dd = Math.sqrt(d2), push = (min - dd) / 2;
        const ux = dx / dd, uy = dy / dd;
        const wa = HB.ENEMIES[a.type].boss ? 0.1 : 1, wb = HB.ENEMIES[b.type].boss ? 0.1 : 1;
        a.x -= ux * push * wa; a.y -= uy * push * wa;
        b.x += ux * push * wb; b.y += uy * push * wb;
      }
    }
    // el jefe pare crías al bajar de vida (funcional 9.5: con fases)
    const N = R._night;
    if (N && N.bossRef && !N.bossRef.dead) {
      const B = N.bossRef, E = HB.ENEMIES.brood;
      while (B.phase < E.phases.length && B.hp / B.maxHp <= E.phases[B.phase]) {
        B.phase++;
        for (let k = 0; k < E.brood; k++) {
          const a = k / E.brood * Math.PI * 2;
          spawn(st, R, 'swarmer', B.x + Math.cos(a) * 1.3, B.y + Math.sin(a) * 0.9);
        }
        ev(st, 'roar', B);
      }
    }
    // los muertos se quitan de la lista
    if (st.tick % 15 === 0) R._bugs = bugs.filter(function (b) { return !b.dead; });
  }

  function nearestBug(R, x, y, range) {
    let best = null, bd = range * range;
    for (const b of R._bugs) {
      if (b.dead || b.z > 0.3) continue;
      const d2 = HB.dist2(x, y, b.x, b.y);
      if (d2 < bd) { bd = d2; best = b; }
    }
    return best;
  }

  // ---------- Torretas y disparos ----------
  function turretStats(e) {
    const T = def(e), L = T.levels[e.level - 1];
    return { dmg: T.dmg * L.dmg, rate: T.rate * L.rate, range: T.range + L.range, splash: T.splash };
  }

  function turretsStep(st, R, dt) {
    const N = R._night;
    let anyEmpty = false;
    for (const e of R.ents) {
      const T = def(e);
      if (T.kind !== 'turret' || e.dead) continue;
      const S = turretStats(e);
      e.cd -= dt;
      const t = nearestBug(R, e.x, e.y - 0.3, S.range);
      if (t) e.aim = Math.atan2(t.y - e.y, t.x - e.x);
      if (e.ammo <= 0) { if (t) anyEmpty = true; continue; }
      if (!t || e.cd > 0) continue;
      e.cd = 1 / (S.rate * pf(R) * HB.Logic.eff(e));
      e.ammo--;
      if (T.slow) {
        // torreta de choque: descarga en área que frena a todos los que alcanza (al jefe, no)
        const hit = [];
        for (const b of R._bugs) {
          if (b.dead || b.z > 0.3 || HB.dist(e.x, e.y - 0.3, b.x, b.y) > S.range + b.r) continue;
          if (!HB.ENEMIES[b.type].boss) { b.slowT = T.slowT; b.slowK = T.slow; }
          if (hit.length < 6) hit.push(b);
          damageBug(st, R, b, S.dmg);
        }
        ev(st, 'shock', e, hit);
      } else if (S.splash > 0) {
        const dd = HB.dist(e.x, e.y, t.x, t.y);
        R._shots.push({ x: e.x, y: e.y - 0.6, tx: t.x, ty: t.y, t: 0, dur: dd / T.shellSpeed, dmg: S.dmg, splash: S.splash });
        ev(st, 'shell', e, t);
      } else {
        damageBug(st, R, t, S.dmg);
        ev(st, 'shot', e, t);
      }
      if (e.ammo <= 0) ev(st, 'noAmmo', e);
    }
    if (N && anyEmpty) N.emptyT += dt;
    if (N && pf(R) < 1) N.brownT += dt;
    // proyectiles de cañón
    for (let i = R._shots.length - 1; i >= 0; i--) {
      const s = R._shots[i];
      s.t += dt;
      if (s.t < s.dur) continue;
      R._shots.splice(i, 1);
      areaDamage(st, R, s.tx, s.ty, s.splash, s.dmg);
      ev(st, 'boom', s);
    }
    // ataques orbitales en camino
    for (let i = R._strikes.length - 1; i >= 0; i--) {
      const s = R._strikes[i];
      s.t -= dt;
      if (s.t > 0) continue;
      R._strikes.splice(i, 1);
      areaDamage(st, R, s.x, s.y, C().orbital.radius, C().orbital.dmg);
      ev(st, 'orbitalHit', s);
    }
  }

  function areaDamage(st, R, x, y, r, dmg) {
    for (const b of R._bugs) {
      if (b.dead) continue;
      const d = HB.dist(x, y, b.x, b.y);
      if (d > r + b.r) continue;
      damageBug(st, R, b, dmg * (1 - 0.5 * Math.min(1, d / r)));
    }
  }

  // El comandante dispara solo al bicho más cercano (funcional 4.3).
  function cmdCombat(st, R, dt) {
    const c = st.cmd, K = C().cmd;
    if (c.deadT > 0 || !R._bugs.length) { c.aimT = 0; return; }
    c.cd -= dt;
    const t = nearestBug(R, c.x, c.y, K.range);
    if (!t) { c.aimT = 0; return; }
    c.aim = Math.atan2(t.y - c.y, t.x - c.x);
    c.aimT = 0.3;
    if (c.cd > 0) return;
    c.cd = 1 / (K.rate * (c.stillT > 0.15 ? K.stillBonus : 1));
    damageBug(st, R, t, K.dmg);
    ev(st, 'cmdShot', t);
  }

  // El botín vuela al comandante si está dentro de su imán; si no, queda en el suelo.
  function lootStep(st, R, dt) {
    const c = st.cmd, mag = C().cmd.magnet;
    for (let i = R._loot.length - 1; i >= 0; i--) {
      const l = R._loot[i];
      l.t += dt;
      if (l.dawn && l.t > C().night.lootDawn) { R._loot.splice(i, 1); continue; }
      if (c.deadT > 0 || l.t < 0.4 || HB.dist(c.x, c.y, l.x, l.y) > mag) continue;
      R._loot.splice(i, 1);
      if (R.phase === 'night') R.nightLoot += l.v; else R.credits += Math.round(l.v);
      ev(st, 'loot', l);
    }
  }

  // ---------- Fin de la noche ----------
  function tipFor(R, N) {
    let turrets = 0;
    for (const e of R.ents) if (def(e).kind === 'turret') turrets++;
    if (N.emptyT > 3) return 'tip_ammo';
    if (N.brownT > 5) return 'tip_power';
    if (turrets < 2) return 'tip_turrets';
    return 'tip_upgrade';
  }

  function endNight(st, R, won) {
    const N = R._night, Cn = C().night;
    const lost = R._loot.length;
    // Lo que quedó en el suelo se puede recoger un rato tras el amanecer (si se gana la noche).
    if (won) for (const l of R._loot) { l.dawn = true; l.t = 0.4; }
    else R._loot = [];
    const loot = Math.round(R.nightLoot);
    let bonus = 0;
    if (won) {
      bonus = Math.round(Cn.bonusBase * (1 + 0.5 * N.n) * (1 + N.provoke));
      if (N.boss) bonus += 300;
    }
    const rep = {
      n: N.n, won: won, kills: N.kills, loot: won ? loot : 0, lostLoot: won ? 0 : loot, bonus: bonus,
      damage: Math.round(N.damage), boss: N.boss, cleared: N.boss && won, lootLeft: lost,
      tip: won ? null : tipFor(R, N), bossHp: null, record: false,
    };
    if (N.boss && !won && N.bossRef) rep.bossHp = Math.max(1, Math.round(N.bossRef.hp / N.bossRef.maxHp * 100));
    if (won) {
      R.nights = N.n;
      R.lossStreak = 0;
      if (rep.loot + rep.bonus > R.best) { rep.record = R.best > 0; R.best = rep.loot + rep.bonus; }
    } else {
      // Noche perdida: se pierde el botín de esa noche; la Torre de mando se levanta (lostHq).
      const H = hq(R);
      if (H) H.hp = Math.max(H.hp, def(H).hp * Cn.lostHq);
      R.lossStreak = (R.lossStreak || 0) + 1;
      st.stats.lost = (st.stats.lost || 0) + 1;
    }
    R.phase = 'day'; R.heat = 0; R.dayT = 0;
    R._night = null; R._bugs = []; R._shots = []; R._strikes = []; R._orbital = 0;
    R.nightLoot = 0;
    st.report = rep;
    st.needSave = true;
    ev(st, 'nightEnd', rep);
  }

  function defeat(st, R) {
    const N = R._night;
    if (!N) return;
    const can = C().night.secondChance && !N.usedSecond && !N.first;
    if (can) { st.defeat = { n: N.n, boss: N.boss }; ev(st, 'defeat'); }
    else endNight(st, R, false);
  }

  // ---------- Pasos ----------
  function econ(st, R, dt) {
    if (!R.heatOn || st.report || st.choice) return;
    if (R.phase === 'day') {
      R.dayT += dt;
      let h = 0;
      const f = pf(R);
      for (const e of R.ents) {
        if (e.dead) continue;
        const d = def(e);
        if (d.kind === 'proc' && e.busy) h += d.heat * HB.Logic.level(e).heatMul * f * HB.Logic.eff(e);
        else if (d.kind === 'cool') h += d.heat * f;
      }
      R.heat = Math.max(0, R.heat + h * dt);
      const size = barSize(R);
      if (R.heat >= size || R.dayT >= C().night.dayCap) warn(st, R, { capped: R.heat < size });
    } else if (R.phase === 'warn') {
      R._warnT -= dt;
      if (R._warnT <= 0) startNight(st, R, R._plan || plan(st, R, {}));
    }
  }

  function step(st, R, dt) {
    if (!R._bugs) { R._bugs = []; R._shots = []; R._loot = []; R._strikes = []; }
    lootStep(st, R, dt);
    if (R.phase !== 'night' || st.defeat) return;
    const N = R._night;
    N.t += dt;
    for (const g of N.groups) if (!g.done && N.t >= g.t) spawnGroup(st, R, g);
    bugsStep(st, R, dt);
    turretsStep(st, R, dt);
    cmdCombat(st, R, dt);
    if (R.phase !== 'night' || st.defeat) return;
    let alive = 0;
    for (const b of R._bugs) if (!b.dead) alive++;
    let pending = false;
    for (const g of N.groups) if (!g.done) { pending = true; break; }
    if (!alive && !pending) endNight(st, R, true);
  }

  // ---------- Lo que pide el jugador ----------
  function provokeInfo(st, R) {
    const can = R.phase === 'day' && R.heatOn && !st.report && !st.choice && R.nights + 1 >= C().night.provokeFrom;
    return { can: can, bonus: can ? C().night.provokeBonus * (1 - Math.min(1, R.heat / barSize(R))) : 0 };
  }

  // Poder de la defensa frente al jefe: verde / ámbar / rojo (funcional 3.4).
  function bossRating(R) {
    let dps = C().cmd.dmg * C().cmd.rate;
    for (const e of R.ents) {
      if (def(e).kind !== 'turret' || e.dead) continue;
      const S = turretStats(e);
      dps += S.dmg * S.rate * (S.splash ? 1.6 : 1);
    }
    const B = HB.ENEMIES.brood;
    const need = B.hp / 20;   // matarlo en unos 20 s
    const r = dps / need;
    return { dps: dps, need: need, ratio: r, level: r >= 1 ? 'green' : (r >= 0.65 ? 'amber' : 'red') };
  }

  HB.Night = {
    barSize: barSize,
    threat: threat,
    econ: econ,
    step: step,
    field: field,
    turretStats: turretStats,
    bossRating: bossRating,
    provokeInfo: provokeInfo,
    openFlanks: openFlanks,

    provoke: function (st) {
      const R = st.regions[st.cur], p = provokeInfo(st, R);
      if (!p.can) return false;
      startNight(st, R, plan(st, R, { provoke: p.bonus }));
      return true;
    },

    startBoss: function (st, R) {
      if (R.phase !== 'day' || !R.nestReady || R.cleared) return false;
      startNight(st, R, plan(st, R, { boss: true }));
      HB.Logic.ftue(st, 'boss');
      return true;
    },

    orbital: function (st, x, y) {
      const R = st.regions[st.cur];
      if (R.phase !== 'night' || !(R._orbital > 0)) return false;
      R._orbital--;
      R._strikes.push({ x: x, y: y, t: C().orbital.delay });
      ev(st, 'orbital', x, y);
      HB.Logic.ftue(st, 'orbital');
      return true;
    },

    claimReport: function (st, mult) {
      const r = st.report;
      if (!r) return;
      const R = st.regions[st.cur];
      if (r.won) R.credits += Math.round((r.loot + r.bonus) * (mult || 1));
      st.report = null;
      st.needSave = true;
      ev(st, 'claim', r, mult);
      // Cofres (funcional 12 y 9.5): uno tras la primera noche ganada y otro al caer el jefe.
      if (r.won && !r.cleared && HB.Logic.ftue(st, 'win')) HB.Chests.give(st, 'first');
      if (r.cleared) HB.Chests.give(st, 'boss');
    },

    secondChance: function (st) {
      const R = st.regions[st.cur], N = R._night;
      if (!st.defeat || !N) return;
      st.defeat = null;
      N.usedSecond = true;
      for (const e of R.ents) {
        const d = def(e);
        if (d.kind === 'hq') e.hp = d.hp * 0.5;
        else if (d.kind === 'wall') { e.hp = Math.max(e.hp, d.hp * 0.5); e.dead = false; }
        else if (d.kind === 'turret' && !e.dead) e.ammo = d.box * d.shots;
      }
      const H = hq(R);
      for (const b of R._bugs) if (!b.dead && !HB.ENEMIES[b.type].boss && HB.dist(b.x, b.y, H.x, H.y) < 3.5) b.dead = true;
      HB.Logic.touch(R);
      ev(st, 'secondChance');
    },

    giveUp: function (st) {
      const R = st.regions[st.cur];
      if (!st.defeat) return;
      st.defeat = null;
      endNight(st, R, false);
    },
  };
})(globalThis.HB);
