// Hive Breaker — la "jugosidad": convierte lo que pasa en la lógica en vuelos, chispas, sonidos
// y vibración (funcional 13). Si algo no se siente bien, casi siempre se arregla aquí o en la
// tabla FX (20_data.js), sin tocar las reglas.
(function (HB) {
  'use strict';

  const V = HB.View, P = HB.PAL, A = HB.Art, Fx = HB.Fx, Au = HB.Audio, vis = HB.Vis, FX = HB.FX;
  const tmp = {};
  let lastPayBill = -1;
  let clingCount = 0;

  function volAt(st, x, y) {
    const d = HB.dist(st.cmd.x, st.cmd.y, x, y);
    return HB.clamp(1.15 - d / 8, 0.15, 1);
  }

  function squash(id, amount) {
    const v = HB.entVis(id);
    v.sqv -= (amount === undefined ? FX.squash : amount) * 14;
  }

  function gainPct(e) {
    const L = HB.MACHINES[e.type].levels, a = L[e.level - 2], b = L[e.level - 1];
    if (!a || !b) return null;
    const r = a.time !== undefined ? a.time / b.time : a.interval / b.interval;
    return '+' + Math.round((r - 1) * 100) + '%';
  }

  const H = {
    mine: function (st, e) {
      const v = e.a, idx = e.b;
      Au.play('tic', { step: Au.step() });
      Fx.sparks(v.x + (st.cmd.x - v.x) * 0.3, v.y - 0.25, 0.2, 4, P.glint);
      vis.stackIn++;
      Fx.fly({
        spr: A.item('ore'), x: v.x + (Math.random() - 0.5) * 0.3, y: v.y - 0.2, z: 0.2,
        to: function (o) { HB.slot.stack(idx, o); }, dur: FX.mineArc, arc: FX.mineArcH,
        land: function () { vis.stackIn = Math.max(0, vis.stackIn - 1); },
      });
    },

    full: function () {
      vis.maxT = 0; vis.trembleT = 0;
      Au.play('clunk');
      HB.buzz(15);
    },

    deposit: function (st, e) {
      const m = e.a, it = e.b, idx = e.c, def = HB.MACHINES[m.type];
      HB.slot.stack(idx, tmp);
      const sx = tmp.x, sy = tmp.y;
      vis.inIn[m.id] = (vis.inIn[m.id] || 0) + 1;
      if (def.kind === 'export') vis.goodsIn[m.id] = (vis.goodsIn[m.id] || 0) + 1;
      const n = def.kind === 'proc' ? m.inBuf[it] - 1 : HB.Logic.totalIn(m) - 1;
      Fx.fly({
        spr: A.item(it), x: sx, y: sy, z: 0,
        to: function (o) { if (def.kind === 'proc') HB.slot.hopper(m, n, o); else HB.slot.goods(m, Math.min(23, n), o); },
        dur: FX.depositFly, arc: 0.7,
        land: function () {
          vis.inIn[m.id] = Math.max(0, (vis.inIn[m.id] || 1) - 1);
          if (def.kind === 'export') vis.goodsIn[m.id] = Math.max(0, (vis.goodsIn[m.id] || 1) - 1);
          if (def.kind === 'proc') squash(m.id, 0.06);
          Au.play('drop', { step: Au.step() });
        },
      });
    },

    pickup: function (st, e) {
      const m = e.a, it = e.b, idx = e.c;
      HB.slot.out(m, Math.max(0, m.out), tmp);
      const sx = tmp.x, sy = tmp.y;
      vis.stackIn++;
      Fx.fly({
        spr: A.item(it), x: sx, y: sy, z: 0,
        to: function (o) { HB.slot.stack(idx, o); }, dur: FX.pickupFly, arc: 0.8,
        land: function () { vis.stackIn = Math.max(0, vis.stackIn - 1); },
      });
      Au.play('tic', { step: Au.step() });
    },

    start: function (st, e) { squash(e.a.id, FX.squash); },

    produce: function (st, e) {
      const m = e.a, def = HB.MACHINES[m.type];
      HB.slot.chute(m, tmp);
      const sx = tmp.x, sy = tmp.y, n = m.out - 1;
      vis.outIn[m.id] = (vis.outIn[m.id] || 0) + 1;
      Fx.fly({
        spr: A.item(def.output), x: sx, y: sy, z: 0.2,
        to: function (o) { HB.slot.out(m, n, o); }, dur: 0.22, arc: 0.5,
        land: function () { vis.outIn[m.id] = Math.max(0, (vis.outIn[m.id] || 1) - 1); },
      });
      const vol = volAt(st, m.x, m.y);
      Au.play('chunk', { vol: vol * 0.8 });
      const md = HB.MACHINES[m.type], s = m.flip ? -1 : 1;
      if (m.type === 'smelter') Fx.smoke(m.x + s * 0.59, m.y + md.h / 2 - 0.12 - md.z - 1.3, 0);
      else Fx.sparks(m.x + s * 0.55, m.y + md.h / 2 - md.z - 1.0, 0, 2, P.orangeL);
    },

    shipLand: function (st, e) {
      Au.play('whoosh', { vol: volAt(st, e.a.x, e.a.y) });
      Au.play('thud', { vol: volAt(st, e.a.x, e.a.y), delay: HB.CONFIG.ship.land * 0.9 });
    },

    shipBuy: function (st, e) {
      const m = e.a, value = e.b;
      const alt = vis.shipAlt || 1.2;
      // la mercancía sube al rayo
      let total = 0;
      for (const k in e.c) total += e.c[k];
      const shown = Math.min(10, total);
      let i = 0;
      for (const k in e.c) {
        for (let j = 0; j < e.c[k] && i < shown; j++, i++) {
          HB.slot.goods(m, i, tmp);
          Fx.fly({ spr: A.item(k), x: tmp.x, y: tmp.y, z: 0, tx: m.x, ty: m.y - 0.12, tz: alt, dur: 0.35, arc: 0, delay: i * 0.03 });
        }
      }
      // los billetes caen en el montón, rebotando
      const n = Math.min(12, Math.max(3, Math.ceil(value / 10)));
      const share = value / n;
      for (let k = 0; k < n; k++) {
        const slotI = HB.slot.billCount(vis.pileShown + share * (k + 1)) - 1;
        Fx.fly({
          spr: A.item('bill'), x: m.x + (Math.random() - 0.5) * 0.4, y: m.y - 0.12, z: alt,
          to: function (o) { HB.slot.bill(m, Math.max(0, slotI), o); }, dur: 0.45, arc: 0.9, delay: 0.25 + k * 0.05,
          ease: HB.easeInOut,
          land: function () { vis.pileShown += share; Au.play('cling', { step: k % 13, vol: 0.5 * volAt(st, m.x, m.y) }); },
        });
      }
      Au.play('chaching', { vol: volAt(st, m.x, m.y) });
      Fx.text({ s: '+' + HB.money(value), x: m.x, y: m.y - 1.6, col: P.cashL, size: V.tile * 0.7 });
    },

    shipLeave: function (st, e) { Au.play('whooshUp', { vol: volAt(st, e.a.x, e.a.y) }); },

    collect: function (st, e) {
      const amount = e.a, m = e.b;
      const n = Math.min(FX.billMax, Math.max(3, Math.ceil(amount / 5)));
      const share = amount / n;
      vis.credInFlight += amount;
      const from = V.w2s(HB.Logic.padPos(m, 'pile').x, HB.Logic.padPos(m, 'pile').y, {});
      vis.pileShown = 0;
      for (let k = 0; k < n; k++) {
        const last = k === n - 1;
        Fx.fly({
          spr: A.billHud(), screen: true, x: from.x + (Math.random() - 0.5) * 20, y: from.y, z: 0,
          to: function (o) { const h = vis.hudCredits || { x: 40, y: 37 }; o.x = h.x; o.y = h.y; o.z = 0; },
          dur: FX.billFly, arc: 60, delay: k * FX.billStagger, scale: 1.1, ease: HB.easeInOut,
          land: function () {
            vis.credInFlight = last ? 0 : Math.max(0, vis.credInFlight - share);
            vis.credPulse = 1;
            Au.play('cling', { step: Au.step() });
            if (++clingCount % 5 === 0) HB.buzz(8);
          },
        });
      }
    },

    pay: function (st, e) {
      const z = e.a, R = st.regions[st.cur];
      const pr = HB.Logic.price(R, z), paid = R.paid[z.id] || pr;
      Au.play('payTick', { p: paid / pr });
      if (vis.clock - lastPayBill < FX.payBillEvery) return;
      lastPayBill = vis.clock;
      const p = HB.Logic.zonePadPos(z);
      Fx.fly({
        spr: A.item('bill'), x: st.cmd.x, y: st.cmd.y - 0.9, z: 0, tx: p.x, ty: p.y, tz: 0, dur: 0.28, arc: 0.9,
        scale: 0.9,
      });
    },

    unlock: function (st, e) {
      const z = e.a, res = e.b;
      const p = HB.Logic.zonePadPos(z);
      vis.flash = 1;
      Au.play('tada');
      HB.buzz(30);
      V.shake(FX.shakePx, FX.shakeTime);
      if (z.kind === 'machine' || z.kind === 'vein') {
        const x = z.x, y = z.y;
        if (res && res.id) HB.entVis(res.id).rise = 0;
        Fx.confetti(x, y - 0.5, FX.confetti);
        Fx.ring(x, y + (z.kind === 'machine' ? HB.MACHINES[z.type].h / 2 : 0.3), 2.2);
        Fx.dust(x, y + 0.3, 12, 1.8);
        Fx.text({ s: HB.T('unlocked'), x: x, y: y - 1.6, col: P.yellow, size: V.tile * 0.75, dur: 1.2 });
      } else if (z.kind === 'upgrade' && res) {
        const m = HB.MACHINES[res.type];
        HB.entVis(res.id).flash = 1;
        Fx.rays(res.x, res.y - m.z, 0, P.yellow);
        Fx.confetti(res.x, res.y - 0.5, Math.round(FX.confetti / 2));
        const pct = gainPct(res);
        Fx.text({ s: pct || HB.T('upgraded'), x: res.x, y: res.y - m.z - 1.0, col: P.yellow, size: V.tile * 0.95, dur: 1.3, rise: 1.6 });
        Au.play('up', { delay: 0.12 });
      } else if (z.kind === 'expansion') {
        Fx.confetti(p.x, p.y - 0.5, FX.confetti);
        Fx.text({ s: HB.T('area_open'), x: p.x, y: p.y - 1.4, col: P.yellow, size: V.tile * 0.85, dur: 1.5 });
      }
    },
  };

  HB.Juice = {
    handle: function (st, e) { const h = H[e.k]; if (h) h(st, e); },
  };
})(globalThis.HB);
