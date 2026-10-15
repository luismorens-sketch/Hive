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

  // Gemas que vuelan desde (x, y) de la pantalla a su contador.
  function gemRain(n, x, y) {
    if (!(n > 0)) return;
    vis.gemInFlight += n;
    const k = Math.min(10, Math.max(3, Math.ceil(n / 10))), share = n / k;
    for (let i = 0; i < k; i++) {
      const last = i === k - 1;
      Fx.fly({
        spr: A.gem(), screen: true, x: x + (Math.random() - 0.5) * 80, y: y + (Math.random() - 0.5) * 40, z: 0,
        to: function (o) { const h = vis.hudGems || { x: V.gx + V.gw - 110, y: 37 }; o.x = h.x; o.y = h.y; o.z = 0; },
        dur: 0.6, arc: 80, delay: i * 0.05, scale: 1.1, ease: HB.easeInOut,
        land: function () { vis.gemInFlight = last ? 0 : Math.max(0, vis.gemInFlight - share); vis.gemPulse = 1; Au.play('cling', { step: 6 + (i % 6) }); },
      });
    }
  }

  // Billetes que llueven desde el centro de la pantalla hacia el contador.
  function rain(amount) {
    if (!(amount > 0)) return;
    vis.credInFlight += amount;
    const n = Math.min(FX.billMax, Math.max(5, Math.ceil(amount / 10)));
    const share = amount / n;
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.5;
    for (let k = 0; k < n; k++) {
      const last = k === n - 1;
      Fx.fly({
        spr: A.billHud(), screen: true, x: cx + (Math.random() - 0.5) * 120, y: cy + (Math.random() - 0.5) * 60, z: 0,
        to: function (o) { const h = vis.hudCredits || { x: 40, y: 37 }; o.x = h.x; o.y = h.y; o.z = 0; },
        dur: FX.billFly, arc: 80, delay: k * FX.billStagger * 1.5, scale: 1.1, ease: HB.easeInOut,
        land: function () { vis.credInFlight = last ? 0 : Math.max(0, vis.credInFlight - share); vis.credPulse = 1; Au.play('cling', { step: Au.step() }); },
      });
    }
  }

  function gainPct(e) {
    const L = HB.MACHINES[e.type].levels, a = L[e.level - 2], b = L[e.level - 1];
    if (!a || !b) return null;
    const r = a.time !== undefined ? a.time / b.time : a.interval / b.interval;
    return '+' + Math.round((r - 1) * 100) + '%';
  }

  const SGT = {
    intro: ['tut_hello', P.yellow, 'normal'],
    drone: ['tut_drone', P.tealL, 'normal'],
    heat: ['tut_heat', P.orangeL, 'normal'],
    warn: ['tut_warn', '#ff8a8a', 'alarm'],
    power: ['tut_power', P.amber, 'alarm'],
    leaper: ['tut_leaper', P.acid, 'alarm'],
    boss: ['tut_boss', '#ff8a8a', 'alarm'],
  };

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
      if (z.kind === 'turret' && !res) { Au.play('pop'); return; }   // falta elegir el tipo
      vis.flash = 1;
      Au.play('tada');
      HB.buzz(30);
      V.shake(FX.shakePx, FX.shakeTime);
      if (z.kind === 'machine' || z.kind === 'vein' || z.kind === 'turret' || z.kind === 'wall' || z.kind === 'drone') {
        const x = res && res.x !== undefined ? res.x : z.x, y = res && res.y !== undefined ? res.y : z.y;
        if (res && res.id) HB.entVis(res.id).rise = 0;
        Fx.confetti(x, y - 0.5, FX.confetti);
        Fx.ring(x, y + 0.4, 2.2);
        Fx.dust(x, y + 0.3, 12, 1.8);
        Fx.text({ s: HB.T('unlocked'), x: x, y: y - 1.6, col: P.yellow, size: V.tile * 0.75, dur: 1.2 });
      } else if (z.kind === 'upgrade' && res) {
        const m = HB.MACHINES[res.type];
        HB.entVis(res.id).flash = 1;
        Fx.rays(res.x, res.y - (m.z || 0.5), 0, P.yellow);
        Fx.confetti(res.x, res.y - 0.5, Math.round(FX.confetti / 2));
        const pct = m.levels && m.levels[0].time !== undefined || m.levels && m.levels[0].interval !== undefined ? gainPct(res) : null;
        Fx.text({ s: pct || HB.T('upgraded'), x: res.x, y: res.y - (m.z || 0.5) - 1.0, col: P.yellow, size: V.tile * 0.95, dur: 1.3, rise: 1.6 });
        Au.play('up', { delay: 0.12 });
      } else if (z.kind === 'expansion') {
        Fx.confetti(p.x, p.y - 0.5, FX.confetti);
        Fx.text({ s: HB.T('area_open'), x: p.x, y: p.y - 1.4, col: P.yellow, size: V.tile * 0.85, dur: 1.5 });
      } else if (z.kind === 'nest') {
        Fx.confetti(p.x, p.y - 0.5, FX.confetti);
        HB.HUD.showBanner(HB.T('assault'), P.acid, 2.2);
      }
    },

    // ---------- La noche ----------
    refill: function (st, e) {
      const t = e.a, idx = e.c, R = st.regions[st.cur];
      HB.slot.stack(idx, tmp);
      const sx = tmp.x, sy = tmp.y;
      HB.slot.box(R, t, tmp);
      Fx.fly({ spr: A.item('ammo'), x: sx, y: sy, z: 0, tx: tmp.x, ty: tmp.y - 0.5, tz: 0, dur: FX.depositFly, arc: 0.7,
        land: function () { Au.play('drop', { step: Au.step() }); HB.entVis(t.id).flash = 0.4; } });
    },

    repair: function (st, e) {
      const b = e.a, idx = e.b;
      // con Placas vuela una de la pila; sin ellas, un billete (se ha pagado en Créditos)
      if (idx >= 0) HB.slot.stack(idx, tmp); else { tmp.x = st.cmd.x; tmp.y = st.cmd.y - 0.9; }
      Fx.fly({ spr: A.item(idx >= 0 ? 'plate' : 'bill'), x: tmp.x, y: tmp.y, z: 0, tx: b.x, ty: b.y - 0.4, tz: 0, dur: 0.22, arc: 0.6,
        land: function () { Fx.sparks(b.x, b.y - 0.4, 0.2, 5, P.yellow); Au.play('tic', { step: Au.step() }); } });
      if (e.c) { HB.entVis(b.id).rise = 0; Au.play('tada'); Fx.dust(b.x, b.y, 10, 1.5); }
    },

    heatOn: function () { Au.play('pop'); },

    warn: function (st, e) {
      Au.play('siren');
      HB.buzz(30);
      HB.HUD.showBanner(HB.T('hive_stirs'), '#ff5a5a', 2.4);
    },

    nightStart: function (st, e) {
      HB.HUD.showBanner(HB.T('night_n', e.a), '#ff8a8a', 1.6);
      V.shake(3, 0.2);
    },

    spawn: function (st, e) {
      const b = e.a;
      if (V.onScreen(b.x, b.y, 1) && Math.random() < 0.4) Fx.dust(b.x, b.y, 3, 0.5);
    },

    shot: function (st, e) {
      const t = e.a, b = e.b;
      const tip = { x: t.x + Math.cos(t.aim) * 0.7, y: t.y - 0.42 + Math.sin(t.aim) * 0.7 };
      HB.tracer(tip.x, tip.y, b.x + (Math.random() - 0.5) * 0.2, b.y - 0.1);
      HB.entVis(t.id).muzzle = 0.05;
      Au.play('gun', { vol: volAt(st, t.x, t.y) * 0.7 });
    },

    shell: function (st, e) {
      HB.entVis(e.a.id).muzzle = 0.08;
      Au.play('cannon', { vol: volAt(st, e.a.x, e.a.y) });
    },

    boom: function (st, e) {
      const s2 = e.a;
      Fx.sparks(s2.tx, s2.ty, 0.2, 10, P.orangeL);
      Fx.dust(s2.tx, s2.ty, 8, 1.0);
      Fx.ring(s2.tx, s2.ty, s2.splash * 1.6, P.orangeL);
      Au.play('boom', { vol: volAt(st, s2.tx, s2.ty) * 0.8 });
      V.shake(2, 0.1);
    },

    bugHit: function (st, e) {
      const b = e.a, dmg = e.b;
      if (dmg >= 8 && V.onScreen(b.x, b.y, 0)) Fx.text({ s: String(Math.round(dmg)), x: b.x + (Math.random() - 0.5) * 0.4, y: b.y - 0.6, col: dmg >= 25 ? P.yellow : '#ffffff', size: dmg >= 25 ? V.tile * 0.6 : V.tile * 0.42, dur: 0.55, rise: 0.8 });
      Au.play('thwip', { vol: volAt(st, b.x, b.y) * 0.6 });
    },

    kill: function (st, e) {
      const b = e.a, E = HB.ENEMIES[b.type];
      // revienta en gotas de baba de colores (funcional 13.2), nada de vísceras
      Fx.goo(b.x, b.y, E.boss ? 40 : FX.splat + Math.floor(Math.random() * 3), b.type === 'gilded');
      Au.play('splat', { vol: volAt(st, b.x, b.y) });
      if (b.type === 'crusher') { HB.Game.hitstop = Math.max(HB.Game.hitstop, FX.hitstop / 2); V.shake(3, 0.12); }
      if (b.type === 'gilded') { Fx.confetti(b.x, b.y, 30); Au.play('chaching'); }
    },

    loot: function (st, e) {
      const l = e.a, R = st.regions[st.cur];
      const night = R.phase === 'night', v = Math.round(l.v);
      const from = V.w2s(l.x, l.y, {});
      if (!night) vis.credInFlight += v;
      Fx.fly({
        spr: A.billHud(), screen: true, x: from.x, y: from.y, z: 0,
        to: function (o) { const h = night ? (vis.hudLoot || { x: 300, y: 87 }) : (vis.hudCredits || { x: 40, y: 37 }); o.x = h.x; o.y = h.y; o.z = 0; },
        dur: 0.45, arc: 40, scale: 0.8, ease: HB.easeInOut,
        land: function () {
          if (night) vis.lootPulse = 1;
          else { vis.credInFlight = Math.max(0, vis.credInFlight - v); vis.credPulse = 1; }
          Au.play('cling', { step: Au.step(), vol: 0.6 });
        },
      });
    },

    bite: function (st, e) {
      const t = e.b;
      const x = t === 'cmd' ? st.cmd.x : t.x, y = t === 'cmd' ? st.cmd.y : t.y;
      if (V.onScreen(x, y, 0)) Fx.sparks(HB.lerp(e.a.x, x, 0.5), HB.lerp(e.a.y, y, 0.5) - 0.3, 0.2, 2, P.acid);
      Au.play('bite', { vol: volAt(st, x, y) * 0.7 });
    },

    hit: function (st, e) { HB.entVis(e.a.id).flash = Math.max(HB.entVis(e.a.id).flash, 0.35); },

    destroyed: function (st, e) {
      const b = e.a;
      Fx.sparks(b.x, b.y - 0.4, 0.3, 16, P.orangeL);
      Fx.dust(b.x, b.y, 16, 2);
      Fx.ring(b.x, b.y + 0.3, 2.4, P.orangeL);
      for (let i = 0; i < 4; i++) Fx.smoke(b.x + (Math.random() - 0.5), b.y, 0.4);
      Au.play('boom', { vol: volAt(st, b.x, b.y) });
      V.shake(6, 0.25);
      HB.buzz(40);
    },

    cmdHit: function () { vis.hurt = 1; Au.play('hurt'); HB.buzz(10); },
    cmdDown: function (st) { Au.play('lose'); Fx.dust(st.cmd.x, st.cmd.y, 10, 1); V.shake(4, 0.2); },
    respawn: function (st) { Fx.dust(st.cmd.x, st.cmd.y, 10, 1); Fx.ring(st.cmd.x, st.cmd.y, 1.5, P.tealL); Au.play('pop'); },

    cmdShot: function (st, e) {
      const c = st.cmd, b = e.a;
      HB.tracer(c.x + Math.cos(c.aim) * 0.45, c.y - 0.45 + Math.sin(c.aim) * 0.3, b.x, b.y - 0.1, '#9ff3ff');
      vis.cmdMuzzle = 0.06;
      Au.play('blaster', { vol: 0.5 });
    },

    jump: function (st, e) { if (V.onScreen(e.a.x, e.a.y, 0)) Fx.dust(e.a.x, e.a.y, 4, 0.5); },
    escape: function (st, e) { Fx.text({ s: '...', x: e.a.x, y: e.a.y - 0.6, col: P.yellow, size: V.tile * 0.6 }); },

    roar: function (st, e) { Au.play('roar'); V.shake(6, 0.4); HB.buzz(50); Fx.ring(e.a.x, e.a.y, 3, P.acid); },

    bossDead: function (st, e) {
      const b = e.a;
      HB.Game.hitstop = FX.hitstop;
      HB.Game.slow = FX.slowmo;
      Fx.rays(b.x, b.y - 0.5, 0, P.yellow);
      Fx.confetti(b.x, b.y - 0.5, 60);
      Fx.goo(b.x, b.y, 40, false);
      V.shake(8, 0.5);
      Au.play('boom'); Au.play('fanfare', { delay: 0.3 });
      HB.buzz(80);
      HB.HUD.showBanner(HB.T('cleared_title'), P.yellow, 3);
    },

    orbital: function () { Au.play('zap'); },
    orbitalHit: function (st, e) {
      const s2 = e.a;
      Fx.sparks(s2.x, s2.y, 0.3, 24, '#ffb0b0');
      Fx.dust(s2.x, s2.y, 16, 2.4);
      Fx.ring(s2.x, s2.y, HB.CONFIG.orbital.radius * 2, '#ff8a8a');
      vis.flash = 0.6;
      Au.play('boom'); V.shake(7, 0.3); HB.buzz(40);
    },

    noAmmo: function (st, e) { Au.play('click', { vol: volAt(st, e.a.x, e.a.y) }); },
    brownout: function () { Au.play('zap', { vol: 0.6 }); },

    nightEnd: function (st, e) {
      const r = e.a;
      if (r.won) { Au.play('fanfare'); Fx.confetti(st.cmd.x, st.cmd.y - 2, 40); }
      else Au.play('lose');
    },

    defeat: function () { Au.play('lose'); V.shake(6, 0.3); },
    secondChance: function (st) { vis.flash = 1; Au.play('tada'); Fx.ring(st.cmd.x, st.cmd.y, 3, P.cashL); },

    // al cerrar el informe, el botín llueve hacia el contador (funcional 3.3)
    claim: function (st, e) {
      const r = e.a, mult = e.b || 1;
      rain(r.won ? Math.round((r.loot + r.bonus) * mult) : 0);
    },

    // al cobrar lo producido mientras no jugabas (funcional 14.4), lo mismo
    awayClaim: function (st, e) { rain(e.a); },

    // el cofre: los Créditos llueven al contador y las Gemas al suyo
    chestClaim: function (st, e) {
      for (const p of e.b) {
        if (p.k === 'credits') rain(p.n);
        else if (p.k === 'gems') gemRain(p.n, V.gx + V.gw / 2, V.gh * 0.55);
      }
      HB.buzz(20);
    },

    // el Swarmer dorado suelta unas pocas Gemas (funcional 9.5)
    gems: function (st, e) { const p = V.w2s(e.a.x, e.a.y, {}); gemRain(e.b, p.x, p.y); },

    // ---------- Tutorial (funcional 12): el sargento Brass avisa la primera vez que pasa algo ----------
    // [clave del texto, color, cara]. También en los momentos fuertes: primera noche, primera
    // victoria y el jefe (la región conquistada la cuenta la tarjeta de 72_hud.js).
    ftue: function (st, e) {
      const L = SGT[e.a];
      if (L) HB.HUD.tip(HB.T(L[0]), HB.T(L[0] + '_sub'), L[1], L[2]);
    },

    // ---------- Drones ----------
    droneNew: function (st, e) {
      const pad = e.b;
      Fx.text({ s: HB.T('drone_hired'), x: pad.x, y: pad.y - 1.8, col: P.tealL, size: V.tile * 0.6, dur: 1.4 });
      Au.play('pop', { delay: 0.1 }); Au.play('tic', { step: 7, delay: 0.25 });
    },
    droneMine: function (st, e) { if (Math.random() < 0.5 && V.onScreen(e.b.x, e.b.y, 0)) Fx.sparks(e.b.x, e.b.y - 0.3, 0.2, 2, P.glint); },
    droneDrop: function (st, e) { if (HB.MACHINES[e.b.type].kind === 'proc') squash(e.b.id, 0.04); },
  };

  HB.Juice = {
    handle: function (st, e) { const h = H[e.k]; if (h) h(st, e); },
  };
})(globalThis.HB);
