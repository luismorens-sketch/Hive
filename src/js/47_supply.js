// Hive Breaker — el suministro aéreo (funcional 15.3, vídeo n.º 4). Sin DOM: lo usa también el
// simulador.
//
// De día, cada 4-5 min (al azar, con la semilla de la partida) la flota lanza una caja en
// paracaídas cerca de la Torre de mando. Dura 60 s en el suelo. Al pisarla, sale la ventana:
// con el vídeo (simulado) da 90 s de producción en Créditos; sin vídeo, nada. Empieza a caer
// después de la primera noche ganada (un concepto nuevo cada vez, funcional 12) y no cae de
// noche. La «producción» es lo que ha vendido la base en los últimos minutos (con lo que
// vendería sola como mínimo) y nunca menos de supply.min.
(function (HB) {
  'use strict';

  function C() { return HB.CONFIG.supply; }
  function ev(st, k, a, b) { st.ev.push({ k: k, a: a, b: b }); }

  function nextIn(st) { const c = C(); return c.every[0] + HB.rand(st) * (c.every[1] - c.every[0]); }

  // Un sitio libre a la vista, alrededor de la Torre de mando: ni dentro de un edificio ni encima
  // de una zona que se pisa.
  function spot(st, R) {
    const d = HB.REGIONS[R.id];
    const H = R.ents.find(function (e) { return HB.MACHINES[e.type].kind === 'hq'; });
    if (!H) return null;
    const solids = HB.Logic.solids(R), pads = HB.Logic.pads(R), m = 0.7;
    for (let tries = 0; tries < 40; tries++) {
      const a = HB.rand(st) * Math.PI * 2, r = 2.5 + HB.rand(st) * 3.5;
      const x = H.x + Math.cos(a) * r, y = H.y - 1.5 + Math.sin(a) * r * 0.8;
      if (x < 0.8 || x > d.w - 0.8 || y < R.fogY + 1.2 || y > d.h - 1) continue;
      let bad = false;
      for (const s of solids) {
        if (s.t === 'r') bad = x > s.x0 - m && x < s.x1 + m && y > s.y0 - m && y < s.y1 + m;
        else bad = HB.dist2(x, y, s.x, s.y) < (s.r + m) * (s.r + m);
        if (bad) break;
      }
      if (!bad) for (const p of pads) if (HB.dist2(x, y, p.x, p.y) < 1.3 * 1.3) { bad = true; break; }
      if (!bad) return { x: x, y: y };
    }
    return null;
  }

  // Lo que ha vendido la base en los últimos minutos, en $/s.
  function recentRate(st, R) {
    const h = R._inc || (R._inc = []);
    if (!h.length || st.time - h[h.length - 1].t >= 10) {
      h.push({ t: st.time, e: st.stats.earned });
      if (h.length > 19) h.shift();   // unos 3 minutos
    }
    const a = h[0], b = h[h.length - 1];
    return b.t - a.t >= 30 ? (b.e - a.e) / (b.t - a.t) : 0;
  }

  function reward(st, R) {
    const rate = Math.max(recentRate(st, R), HB.Offline ? HB.Offline.rate(st) : 0);
    const v = Math.max(C().min, rate * C().secs);
    return v < 100 ? Math.round(v) : Math.round(v / 5) * 5;
  }

  function step(st, R, dt) {
    if (!R.supply) R.supply = { next: nextIn(st), box: null };
    const S = R.supply;
    recentRate(st, R);
    if (R.phase !== 'day') { if (S.box) { S.box = null; ev(st, 'supplyGone'); } return; }
    if (S.box) {
      const b = S.box, c = st.cmd;
      b.t += dt;
      if (b.t >= C().life) { S.box = null; ev(st, 'supplyGone'); return; }
      // al pisarla (ya en el suelo), se abre la ventana
      if (b.t > C().fall && c.deadT <= 0 && HB.dist2(c.x, c.y, b.x, b.y) < 0.8 * 0.8) {
        st.supply = { amount: reward(st, R) };
        S.box = null;
        st.needSave = true;
        ev(st, 'supplyOpen', st.supply);
        HB.Logic.ftue(st, 'supply');
      }
      return;
    }
    if (R.nights < C().from) return;
    S.next -= dt;
    if (S.next > 0) return;
    S.next = nextIn(st);
    const p = spot(st, R);
    if (!p) return;
    S.box = { x: p.x, y: p.y, t: 0 };
    ev(st, 'supplyDrop', S.box);
    HB.Logic.ftue(st, 'supplyDrop');
  }

  HB.Supply = {
    step: step,
    reward: reward,
    // watched: true si se ha visto el vídeo (simulado). Sin vídeo, la caja se pierde.
    claim: function (st, watched) {
      const s = st.supply;
      if (!s) return 0;
      st.supply = null;
      st.needSave = true;
      if (!watched) { ev(st, 'supplyDecline'); return 0; }
      st.regions[st.cur].credits += s.amount;
      ev(st, 'supplyClaim', s.amount);
      return s.amount;
    },
  };
})(globalThis.HB);
