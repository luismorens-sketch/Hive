// Hive Breaker — HUD y ventanas (funcional 18), en píxeles de pantalla.
//
// Arriba: dinero y ajustes; debajo, la barra de Calor con «provocar» (de día) o la noche en
// curso con su botín. Abajo a la derecha, de noche, el Orbital Strike.
// Ventanas (paran el juego): elegir torreta, informe de la noche, segunda oportunidad, lo producido
// mientras no jugabas («WHILE YOU WERE AWAY», funcional 14.4), «tu base nunca duerme» al conquistar
// la región y el vídeo simulado (funcional 15.3: en el prototipo el botón «AD» da la recompensa
// sin anuncio). Abajo, los avisos cortos del tutorial (funcional 12), de uno en uno.
// Cada botón que se dibuja se apunta en `buttons` para que 80_input.js sepa qué se ha tocado.
(function (HB) {
  'use strict';

  const V = HB.View, P = HB.PAL, D = HB.Draw, A = HB.Art;
  const vis = HB.Vis;

  const H = HB.HUD = {
    gear: { x: 0, y: 0, r: 24 },
    buttons: [],
    banner: null,         // { s, col, t, dur, sub }
    aiming: false,        // eligiendo dónde cae el Orbital
    ad: null,             // vídeo simulado en pantalla: { t, dur, done }
    pop: 0,               // animación de entrada de la ventana abierta
    awayT: 0,             // segundos que lleva abierta la pantalla de regreso (la cifra rueda)
    tips: [],             // avisos del tutorial en cola: { s, sub, col, t, dur }
    tipNow: null,
  };

  function T(k, a, b) { return HB.T(k, a, b); }

  function button(x, y, w, h, label, fill, ink, fn, opts) {
    const g = V.ctx;
    opts = opts || {};
    D.rr(g, x - w / 2, y - h / 2 + 4, w, h, h * 0.3); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fill();
    D.rr(g, x - w / 2, y - h / 2, w, h, h * 0.3); g.fillStyle = fill; g.fill();
    g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
    let tx = x;
    if (opts.clap) {
      // claqueta: el botón de vídeo lleva siempre claqueta y «AD» (funcional 15.3)
      const cx = x - w / 2 + 26, cy = y;
      D.rr(g, cx - 12, cy - 6, 24, 16, 3); g.fillStyle = P.ink; g.fill();
      g.save(); g.translate(cx - 12, cy - 6); g.rotate(-0.35);
      D.rr(g, 0, -7, 24, 6, 2); g.fillStyle = '#ffffff'; g.fill(); g.restore();
      tx = x + 12;
    }
    V.text(label, tx, y + 2, opts.size || Math.min(30, h * 0.5), ink, null);
    H.buttons.push({ x: x - w / 2, y: y - h / 2, w: w, h: h, fn: fn });
  }

  // Texto que se encoge hasta caber en maxW (las frases largas en pantallas estrechas).
  function fitText(s, x, y, px, col, maxW, weight, stroke) {
    const g = V.ctx;
    g.font = V.font(px, weight);
    const w = g.measureText(s).width;
    if (w > maxW) px = Math.max(12, Math.floor(px * maxW / w));
    V.text(s, x, y, px, col, stroke || null, 'center', weight);
  }

  // Parte una frase en líneas que caben en maxW.
  function wrap(s, px, maxW, weight) {
    const g = V.ctx;
    g.font = V.font(px, weight);
    const out = [];
    let line = '';
    for (const w of s.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (line && g.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
    return out;
  }

  function panel(x, y, w, h, border) {
    const g = V.ctx;
    D.rr(g, x - w / 2, y - h / 2 + 6, w, h, 20); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fill();
    D.rr(g, x - w / 2, y - h / 2, w, h, 20); g.fillStyle = '#1c2126'; g.fill();
    g.lineWidth = 3; g.strokeStyle = border || P.yellow; g.stroke();
  }

  function scrim(a) { const g = V.ctx; g.fillStyle = 'rgba(8,10,12,' + (a || 0.6) + ')'; g.fillRect(V.gx, 0, V.gw, V.gh); }

  function gearIcon(g, x, y, r) {
    g.save(); g.translate(x, y);
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, rr = i % 2 ? r * 0.72 : r;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath(); g.fillStyle = '#e8ecee'; g.fill(); g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
    g.beginPath(); g.arc(0, 0, r * 0.32, 0, Math.PI * 2); g.fillStyle = P.ink; g.fill();
    g.restore();
  }

  // ---------- Barra de Calor o noche en curso ----------
  function drawHeat(st, R, y) {
    const g = V.ctx, x0 = V.gx + 14, w = V.gw - 28;
    if (R.phase === 'night' && R._night) {
      const N = R._night;
      let left = 0;
      for (const b of R._bugs) if (!b.dead) left++;
      for (const gr of N.groups) if (!gr.done) left += gr.list.length;
      D.rr(g, x0, y, w, 34, 12); g.fillStyle = 'rgba(60,10,30,0.85)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ff5a7a'; g.stroke();
      V.text(T('night_n', N.n) + ' · ' + T('bugs_left', left), x0 + 14, y + 19, 24, '#ffffff', null, 'left');
      const lp = 1 + vis.lootPulse * 0.15;
      vis.lootPulse = Math.max(0, vis.lootPulse - 0.06);
      V.text(T('night_loot') + ' ' + HB.money(R.nightLoot), x0 + w - 12, y + 19, 24 * lp, P.cashL, null, 'right');
      vis.hudLoot = { x: x0 + w - 50, y: y + 17 };
      return y + 44;
    }
    if (!R.heatOn) return y;
    const size = HB.Night.barSize(R);
    const f = R.phase === 'warn' ? 1 : HB.clamp(R.heat / size, 0, 1);
    const prov = HB.Night.provokeInfo(st, R);
    const bw = prov.can ? w - 110 : w;
    D.rr(g, x0, y, bw, 30, 11); g.fillStyle = P.hud; g.fill();
    const warn = R.phase === 'warn';
    const fillW = Math.max(0, (bw - 6) * f);
    if (fillW > 2) {
      const gr = g.createLinearGradient(x0, 0, x0 + bw, 0);
      gr.addColorStop(0, '#ffb020'); gr.addColorStop(1, '#ff3b3b');
      D.rr(g, x0 + 3, y + 3, fillW, 24, 9);
      g.fillStyle = warn && Math.floor(vis.clock * 6) % 2 ? '#ffffff' : gr; g.fill();
    }
    D.rr(g, x0, y, bw, 30, 11); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.18)'; g.stroke();
    V.text(warn ? T('hive_stirs') : T('heat'), x0 + 12, y + 17, 22, '#ffffff', P.ink, 'left');
    if (prov.can) {
      button(x0 + w - 50, y + 15, 100, 34, T('provoke'), '#ff5a5a', '#ffffff', function () { HB.Night.provoke(st); }, { size: 22 });
    }
    return y + 40;
  }

  // Energía junto al dinero (funcional 18): usada / disponible. Ámbar cerca del límite; roja y
  // latiendo si falta (brownout: todo va más lento).
  function drawPowerPill(R, x, y, h) {
    const p = R.power;
    if (!p) return;
    const g = V.ctx;
    const over = p.demand > p.supply, near = !over && p.demand >= p.supply * 0.85;
    const col = over ? '#ff5a5a' : (near ? P.amber : '#ffffff');
    const txt = T('power_hud', p.demand, p.supply);
    g.font = V.font(28);
    const w = g.measureText(txt).width + 42;
    const blink = over && Math.floor(vis.clock * 4) % 2;
    D.rr(g, x, y, w, h, 14); g.fillStyle = blink ? 'rgba(120,20,30,0.9)' : P.hud; g.fill();
    g.lineWidth = 2; g.strokeStyle = over ? '#ff5a5a' : 'rgba(255,255,255,0.12)'; g.stroke();
    // rayo
    const bx = x + 18, by = y + h / 2;
    g.beginPath();
    g.moveTo(bx + 3, by - 13); g.lineTo(bx - 7, by + 2); g.lineTo(bx, by + 2); g.lineTo(bx - 3, by + 13); g.lineTo(bx + 8, by - 3); g.lineTo(bx + 1, by - 3);
    g.closePath(); g.fillStyle = over ? '#ff5a5a' : P.yellow; g.fill(); g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
    V.text(txt, x + 32, y + h / 2 + 3, 28, col, P.ink, 'left');
  }

  function drawPower(R, y) {
    if (!R.power || R.power.f >= 1) return y;
    const g = V.ctx, txt = T('low_power_speed', Math.round(R.power.f * 100));
    g.font = V.font(18);
    const tw = g.measureText(txt).width + 16, w = tw + 60, x = V.gx + V.gw / 2 - w / 2;
    g.save(); D.rr(g, x, y, w, 24, 4); g.clip();
    g.fillStyle = P.amber; g.fillRect(x, y, w, 24);
    g.fillStyle = P.ink;
    for (let i = -2; i < w / 18 + 2; i++) { const sx = x + i * 18 + (vis.clock * 30) % 18; g.beginPath(); g.moveTo(sx, y + 24); g.lineTo(sx + 9, y + 24); g.lineTo(sx + 21, y); g.lineTo(sx + 12, y); g.closePath(); g.fill(); }
    g.restore();
    D.rr(g, x + 30, y + 3, tw, 18, 4); g.fillStyle = P.amber; g.fill();
    V.text(txt, x + w / 2, y + 13, 18, P.ink, null);
    return y + 32;
  }

  function drawOrbital(st, R) {
    if (R.phase !== 'night' || !(R._orbital > 0)) { H.aiming = false; return; }
    const g = V.ctx, x = V.gx + V.gw - 52, y = V.gh - 70;
    const pulse = 1 + Math.sin(vis.clock * 5) * 0.05;
    D.ellipse(g, x, y, 36 * pulse, 36 * pulse); g.fillStyle = H.aiming ? '#ff3b3b' : '#3a1d2a'; g.fill();
    g.lineWidth = 3; g.strokeStyle = '#ff5a5a'; g.stroke();
    // diana
    g.strokeStyle = '#ffffff'; g.lineWidth = 3;
    D.ellipse(g, x, y - 4, 14, 14); g.stroke();
    g.beginPath(); g.moveTo(x - 20, y - 4); g.lineTo(x + 20, y - 4); g.moveTo(x, y - 24); g.lineTo(x, y + 16); g.stroke();
    V.text(T('orbital'), x, y + 26, 16, '#ffffff', P.ink);
    H.buttons.push({ x: x - 38, y: y - 38, w: 76, h: 76, fn: function () { H.aiming = !H.aiming; } });
    if (H.aiming) V.text(T('orbital_aim'), V.gx + V.gw / 2, V.gh * 0.62, 30, '#ff8a8a', P.ink);
  }

  // ---------- Ventanas ----------
  function drawChoice(st, game) {
    const ch = st.choice;
    scrim(0.55);
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.48;
    const pw = Math.min(V.gw - 24, 380);
    const s = HB.easeOutBack(Math.min(1, H.pop));
    const g = V.ctx;
    g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
    panel(cx, cy, pw, 330);
    V.text(T('choose_turret'), cx, cy - 135, 34, P.yellow, null);
    const cw = (pw - 48) / 2;
    ch.options.forEach(function (type, i) {
      const x = cx - pw / 2 + 16 + cw / 2 + i * (cw + 16), y = cy + 15;
      D.rr(g, x - cw / 2, y - 105, cw, 210, 16); g.fillStyle = '#262c33'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.2)'; g.stroke();
      // dibujo de la torreta, en grande
      const tile = V.tile, sc = 1.6;
      const base = A.turretBase(), head = A.turretHead(type);
      g.drawImage(base.c, x - base.ax * tile * sc, y - 25 - base.ay * tile * sc, base.w * tile * sc, base.h * tile * sc);
      g.save(); g.translate(x, y - 25 - 0.42 * tile * sc); g.rotate(-0.5);
      g.drawImage(head.c, -head.ax * tile * sc, -head.ay * tile * sc, head.w * tile * sc, head.h * tile * sc);
      g.restore();
      V.text(T('t_' + type), x, y + 45, 30, '#ffffff', null);
      V.text(T('t_' + type + '_d'), x, y + 75, 17, '#c9d1d6', null, 'center', 500);
      H.buttons.push({ x: x - cw / 2, y: y - 105, w: cw, h: 210, fn: function () { HB.Logic.choose(st, type); game.save(); } });
    });
    g.restore();
  }

  function adFirstFree(st) { return !st.ads || !st.ads.seen; }

  function drawReport(st, game) {
    const r = st.report, g = V.ctx;
    scrim(0.55);
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.47;
    const pw = Math.min(V.gw - 24, 380), ph = r.won ? 360 : 330;
    const s = HB.easeOutBack(Math.min(1, H.pop));
    g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
    panel(cx, cy, pw, ph, r.won ? P.yellow : '#ff5a5a');
    let title;
    if (r.cleared) title = T('rep_boss_won');
    else if (r.boss && !r.won) title = T('rep_boss_lost', r.bossHp);
    else title = r.won ? T('rep_won', r.n) : T('rep_lost');
    V.text(title, cx, cy - ph / 2 + 40, title.length > 18 ? 28 : 34, r.won ? P.yellow : '#ff8a8a', null);
    let y = cy - ph / 2 + 92;
    const row = function (label, value, col) {
      V.text(label, cx - pw / 2 + 28, y, 22, '#c9d1d6', null, 'left', 500);
      V.text(value, cx + pw / 2 - 28, y, 26, col || '#ffffff', null, 'right');
      y += 36;
    };
    if (r.won) {
      row(T('rep_loot'), HB.money(r.loot), P.cashL);
      row(T('rep_bonus'), HB.money(r.bonus), P.cashL);
    } else row(T('rep_lost_loot'), HB.money(r.lostLoot), '#ff8a8a');
    row(T('rep_kills'), String(r.kills));
    row(T('rep_damage'), String(r.damage));
    if (r.record) { V.text(T('rep_record'), cx, y, 26, P.yellow, P.ink); y += 34; }
    if (r.tip) { V.text(T(r.tip), cx, y, 19, '#ffffff', null, 'center', 500); y += 30; }
    const by = cy + ph / 2 - 44;
    if (r.won) {
      const free = adFirstFree(st);
      button(cx - pw / 4 + 4, by, pw / 2 - 28, 56, free ? 'x2' : T('x2_ad'), P.cash, '#ffffff', function () {
        game.watchAd('night_x2', function () { HB.Night.claimReport(st, 2); });
      }, { clap: !free, size: 24 });
      if (free) V.text(T('free_ad'), cx - pw / 4 + 4, by - 40, 16, P.cashL, P.ink);
      button(cx + pw / 4 - 4, by, pw / 2 - 28, 56, T('continue'), P.yellow, P.ink, function () { HB.Night.claimReport(st, 1); }, { size: 24 });
    } else {
      button(cx, by, pw - 60, 56, T('continue'), P.yellow, P.ink, function () { HB.Night.claimReport(st, 1); }, { size: 26 });
    }
    g.restore();
  }

  function duration(secs) {
    const m = Math.max(1, Math.floor(secs / 60));
    if (m < 60) return T('dur_m', m);
    return m % 60 ? T('dur_hm', Math.floor(m / 60), m % 60) : T('dur_h', m / 60);
  }

  // Lo producido mientras no jugabas (funcional 14.4): la cifra rueda y se cobra o se dobla.
  function drawAway(st, game, dt) {
    const a = st.away, g = V.ctx;
    const roll = 1.2;
    const before = H.awayT;
    H.awayT += dt;
    // la cifra rueda con un tic, y suena la caja al terminar
    if (H.awayT < roll && Math.floor(H.awayT / 0.09) !== Math.floor(before / 0.09)) HB.Audio.play('tic', { step: Math.floor(H.awayT / 0.09) % 13, vol: 0.5 });
    if (before < roll && H.awayT >= roll) HB.Audio.play('chaching');
    scrim(0.6);
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.47;
    const pw = Math.min(V.gw - 24, 380), ph = a.capped ? 370 : 330;
    const inner = pw - 40;
    const s = HB.easeOutBack(Math.min(1, H.pop));
    g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
    panel(cx, cy, pw, ph, P.cash);
    let y = cy - ph / 2 + 40;
    fitText(T('away_title'), cx, y, 32, P.yellow, inner);
    y += 36;
    fitText(T('away_for', duration(a.away)), cx, y, 20, '#c9d1d6', inner, 500);
    y += 58;
    const shown = Math.round(a.amount * HB.easeOutCubic(Math.min(1, H.awayT / roll)));
    const pulse = H.awayT >= roll ? 1 + 0.08 * Math.max(0, 1 - (H.awayT - roll) * 4) : 1;
    const bill = A.billHud();
    const txt = HB.money(shown);
    g.font = V.font(56);
    // billete + cifra, centrados juntos (se mide la cifra final para que no baile al rodar)
    const x0 = cx - (66 + g.measureText(HB.money(a.amount)).width) / 2;
    g.drawImage(bill.c, x0, y - 24, 60, 45);
    V.text(txt, x0 + 66, y + 3, 56 * pulse, P.cashL, P.ink, 'left');
    y += 50;
    fitText(T('away_sub'), cx, y, 17, '#ffffff', inner, 500);
    if (a.capped === 'vault') {
      y += 34; fitText(T('away_vault'), cx, y, 22, P.amber, inner);
      y += 24; fitText(T('away_vault_sub'), cx, y, 16, '#c9d1d6', inner, 500);
    } else if (a.capped === 'time') {
      y += 34; fitText(T('away_cap', duration(HB.CONFIG.offline.cap)), cx, y, 22, P.amber, inner);
    }
    const by = cy + ph / 2 - 44;
    const free = adFirstFree(st);
    button(cx - pw / 4 + 4, by, pw / 2 - 28, 56, free ? 'x2' : T('x2_ad'), P.cash, '#ffffff', function () {
      game.watchAd('offline_x2', function () { HB.Offline.claim(st, 2); });
    }, { clap: !free, size: 24 });
    if (free) V.text(T('free_ad'), cx - pw / 4 + 4, by - 40, 16, P.cashL, P.ink);
    button(cx + pw / 4 - 4, by, pw / 2 - 28, 56, T('collect'), P.yellow, P.ink, function () { HB.Offline.claim(st, 1); }, { size: 24 });
    g.restore();
  }

  // Al conquistar la región (funcional 12, minuto 15-20): lo que hace la base mientras no juegas.
  function offlineTip(st) {
    const R = st.regions[st.cur];
    return R.cleared && !st.report && !st.defeat && st.ftue.offlineTip === undefined;
  }

  function drawOfflineTip(st, game) {
    const g = V.ctx;
    scrim(0.6);
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.47;
    const pw = Math.min(V.gw - 24, 380), inner = pw - 48;
    const l1 = wrap(T('off_l1'), 20, inner, 500), l2 = wrap(T('off_l2', duration(HB.CONFIG.offline.cap)), 20, inner, 500);
    const ph = 262 + (l1.length + l2.length) * 26;
    const s = HB.easeOutBack(Math.min(1, H.pop));
    g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
    panel(cx, cy, pw, ph, P.cash);
    let y = cy - ph / 2 + 40;
    fitText(T('off_title'), cx, y, 32, P.yellow, inner);
    // un dron con su carga, para que se vea de qué va
    y += 52;
    const dr = A.drone(), bill = A.item('bill'), k = 130, bob = Math.sin(vis.clock * 4) * 3;
    g.drawImage(bill.c, cx - bill.ax * k * 0.6, y + 40 + bob - bill.ay * k * 0.6, bill.w * k * 0.6, bill.h * k * 0.6);
    g.drawImage(dr.c, cx - dr.ax * k, y + bob - dr.ay * k, dr.w * k, dr.h * k);
    y += 70;
    for (const line of l1) { V.text(line, cx, y, 20, '#ffffff', null, 'center', 500); y += 26; }
    y += 6;
    for (const line of l2) { V.text(line, cx, y, 20, P.cashL, null, 'center', 500); y += 26; }
    y += 8;
    fitText(T('off_l3'), cx, y, 24, P.yellow, inner);
    button(cx, cy + ph / 2 - 44, pw - 80, 56, T('got_it'), P.yellow, P.ink, function () {
      HB.Logic.ftue(st, 'offlineTip');
      game.save();
    }, { size: 26 });
    g.restore();
  }

  // Avisos del tutorial: un concepto cada vez (funcional 12), abajo, sin parar el juego.
  H.tip = function (s, sub, col) { H.tips.push({ s: s, sub: sub, col: col || P.yellow, t: 0, dur: 4.2 }); };

  function drawTip(dt) {
    if (!H.tipNow && H.tips.length) H.tipNow = H.tips.shift();
    const t = H.tipNow;
    if (!t) return;
    t.t += dt;
    if (t.t > t.dur) { H.tipNow = null; return; }
    const g = V.ctx;
    const a = t.t < 0.25 ? t.t / 0.25 : (t.t > t.dur - 0.4 ? Math.max(0, (t.dur - t.t) / 0.4) : 1);
    const sc = t.t < 0.3 ? HB.easeOutBack(t.t / 0.3) : 1;
    const pw = Math.min(V.gw - 32, 380), ph = t.sub ? 76 : 52;
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.75;
    g.save(); g.globalAlpha = a; g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
    D.rr(g, cx - pw / 2, cy - ph / 2 + 4, pw, ph, 16); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fill();
    D.rr(g, cx - pw / 2, cy - ph / 2, pw, ph, 16); g.fillStyle = 'rgba(20,24,28,0.92)'; g.fill();
    g.lineWidth = 3; g.strokeStyle = t.col; g.stroke();
    fitText(t.s, cx, cy - (t.sub ? 14 : 0), 30, t.col, pw - 28);
    if (t.sub) fitText(t.sub, cx, cy + 20, 19, '#ffffff', pw - 28, 500);
    g.restore();
  }

  function drawDefeat(st, game) {
    const g = V.ctx;
    scrim(0.6);
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.47;
    const pw = Math.min(V.gw - 24, 380);
    const s = HB.easeOutBack(Math.min(1, H.pop));
    g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
    panel(cx, cy, pw, 250, '#ff5a5a');
    V.text(T('second_title'), cx, cy - 85, 26, '#ff8a8a', null);
    button(cx, cy - 10, pw - 50, 62, T('second_ad'), P.cash, '#ffffff', function () {
      game.watchAd('second_chance', function () { HB.Night.secondChance(st); });
    }, { clap: true, size: 22 });
    button(cx, cy + 70, pw - 120, 48, T('give_up'), '#4a545b', '#ffffff', function () { HB.Night.giveUp(st); }, { size: 22 });
    g.restore();
  }

  function drawAd(game, dt) {
    const a = H.ad, g = V.ctx;
    a.t += dt;
    g.fillStyle = '#000000'; g.fillRect(V.gx, 0, V.gw, V.gh);
    const cx = V.gx + V.gw / 2;
    V.text(T('ad_sim'), cx, V.gh * 0.42, 34, '#ffffff', null);
    V.text(T('ad_sim_sub'), cx, V.gh * 0.42 + 40, 18, '#9aa5ab', null, 'center', 500);
    const left = Math.max(0, a.dur - a.t);
    V.text(String(Math.ceil(left)), cx, V.gh * 0.58, 48, P.yellow, null);
    if (a.t >= a.dur && !a.done) { a.done = true; H.ad = null; a.cb(); }
  }

  function drawBanner(dt) {
    const b = H.banner;
    if (!b) return;
    b.t += dt;
    if (b.t > b.dur) { H.banner = null; return; }
    const k = b.t / b.dur;
    const s = b.t < 0.3 ? HB.easeOutBack(b.t / 0.3) : 1;
    const g = V.ctx;
    g.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
    const cx = V.gx + V.gw / 2, cy = V.gh * 0.36;
    fitText(b.s, cx, cy, 46 * s, b.col || P.yellow, V.gw - 30, 600, P.ink);
    if (b.sub) fitText(b.sub, cx, cy + 40, 22, '#ffffff', V.gw - 30, 600, P.ink);
    g.globalAlpha = 1;
  }

  function drawHand() {
    const g = V.ctx;
    const t = vis.clock;
    const cx = V.gx + V.gw / 2 + Math.sin(t * 2.2) * V.gw * 0.18, cy = V.gh * 0.72 + Math.cos(t * 4.4) * 8;
    g.globalAlpha = 0.9;
    D.ellipse(g, cx, cy, 26, 26); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke();
    g.save(); g.translate(cx + 10, cy + 14); g.rotate(-0.35);
    D.rr(g, -9, -30, 18, 44, 9); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
    D.rr(g, -16, 2, 32, 30, 12); g.fill(); g.stroke();
    g.restore();
    g.globalAlpha = 1;
  }

  function drawJoystick(inp) {
    if (!inp.active) return;
    const g = V.ctx, R = HB.Input.RADIUS;
    D.ellipse(g, inp.ox, inp.oy, R, R);
    g.fillStyle = 'rgba(20,24,28,0.25)'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.stroke();
    D.ellipse(g, inp.kx, inp.ky, R * 0.45, R * 0.45);
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
  }

  H.modal = function (st) { return !!(st.choice || st.report || st.defeat || st.away || H.ad || offlineTip(st)); };

  H.showBanner = function (s, col, dur, sub) { H.banner = { s: s, col: col, t: 0, dur: dur || 1.8, sub: sub }; };

  H.draw = function (game, dt) {
    const st = game.st, R = st.regions[st.cur], g = V.ctx;
    H.buttons.length = 0;

    // contador de dinero: rueda hacia la cifra real y "late" al recibir
    const target = R.credits - vis.credInFlight;
    const diff = target - vis.credDisp;
    if (Math.abs(diff) < 0.5) vis.credDisp = target;
    else vis.credDisp += diff * Math.min(1, dt / (HB.FX.counterRoll / 4));
    vis.credPulse = Math.max(0, vis.credPulse - dt * 5);
    const sc = 1 + (HB.FX.counterPulse - 1) * vis.credPulse;
    const x = V.gx + 14, y = 14, h = 46;
    const txt = HB.money(Math.max(0, Math.round(vis.credDisp)));
    g.font = V.font(34);   // se mide sin el latido: la escala ya la pone g.scale
    const w = Math.max(118, g.measureText(txt).width + 70);
    drawPowerPill(R, x + w + 10, y, h);   // antes que el dinero: al latir, el dinero queda encima
    g.save();
    g.translate(x + 30, y + h / 2); g.scale(sc, sc); g.translate(-(x + 30), -(y + h / 2));
    D.rr(g, x, y, w, h, 14); g.fillStyle = P.hud; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
    const b = A.billHud();
    g.drawImage(b.c, x + 6, y + 4, 54, 40);
    V.text(txt, x + 62, y + h / 2 + 3, 34, '#ffffff', P.ink, 'left');
    g.restore();
    vis.hudCredits = { x: x + 32, y: y + h / 2 };

    const gx = V.gx + V.gw - 38, gy = 37;
    H.gear.x = gx; H.gear.y = gy;
    D.ellipse(g, gx, gy, 24, 24); g.fillStyle = P.hud; g.fill();
    gearIcon(g, gx, gy, 14);
    H.buttons.push({ x: gx - 28, y: gy - 28, w: 56, h: 56, fn: function () { HB.Menu.open(); } });

    let yy = drawHeat(st, R, 70);
    yy = drawPower(R, yy);

    // pista del tutorial (cortita) mientras se aprende el bucle; de noche, la que toque
    const learning = Object.keys(R.bought).length < 2;
    const tgt = game.target;
    let hint = null;
    if (game.intro) hint = null;   // la nave está aterrizando
    else if (st.ftue.move === undefined) hint = 'hint_drag';
    else if (tgt && tgt.hint && (learning || tgt.kind === 'refill' || (tgt.kind === 'pickup' && tgt.hint === 'hint_ammo') || tgt.kind === 'repair')) hint = tgt.hint;
    // de noche, lo que enseña el tutorial (funcional 12): quieto se dispara más; el Orbital
    if (!hint && !game.intro && R.phase === 'night' && R._night) {
      if (R._orbital > 0 && st.ftue.orbital === undefined && !H.aiming) hint = 'tut_orbital';
      else if (R._night.n === 1 && !R._night.boss) hint = 'tut_still';
    }
    if (hint && !H.modal(st)) {
      const hy = yy + 22 + Math.sin(vis.clock * 3) * 3;
      fitText(T(hint), V.gx + V.gw / 2, hy, 28, hint === 'hint_refill' || hint === 'hint_ammo' ? P.orangeL : P.yellow, V.gw - 24, 600, P.ink);
    }
    if (st.ftue.move === undefined && !game.intro) drawHand();

    if (R.cleared && !st.report) {
      vis.endT += dt;
      const a = Math.min(1, vis.endT / 0.5);
      g.globalAlpha = a;
      const pw = Math.min(V.gw - 32, 360), px = V.gx + V.gw / 2, py = V.gh - 110;
      D.rr(g, px - pw / 2, py, pw, 66, 16); g.fillStyle = P.hud; g.fill();
      g.lineWidth = 2; g.strokeStyle = P.yellow; g.stroke();
      V.text(T('end_title'), px, py + 22, 24, P.yellow, null);
      V.text(T('end_sub'), px, py + 46, 18, '#ffffff', null, 'center', 500);
      g.globalAlpha = 1;
    }

    drawOrbital(st, R);
    drawBanner(dt);
    if (!H.modal(st)) drawTip(dt);

    if (game.showFps) {
      const cnt = HB.Fx.counts();
      V.text(Math.round(game.fps) + ' FPS · ' + cnt.parts + 'p ' + cnt.flyers + 'f ' + (R._bugs ? R._bugs.length : 0) + 'b' + (HB.autoLow ? ' · LOW' : ''),
        V.gx + 10, V.gh - 16, 18, '#ffffff', P.ink, 'left', 500);
    }
    drawJoystick(HB.Input);

    // ventanas
    if (H.modal(st)) H.pop = Math.min(1, H.pop + dt * 4); else H.pop = 0;
    if (H.ad) drawAd(game, dt);
    else if (st.choice) drawChoice(st, game);
    else if (st.defeat) drawDefeat(st, game);
    else if (st.report) drawReport(st, game);
    else if (st.away) drawAway(st, game, dt);
    else if (offlineTip(st)) drawOfflineTip(st, game);
    if (!st.away) H.awayT = 0;
  };

  // Un toque corto: primero los botones; luego lo que se puede tocar en el mundo; luego el Orbital.
  H.tap = function (x, y, game) {
    const st = game.st;
    if (game.intro) { game.endIntro(); return true; }   // un toque salta la entrada
    for (let i = H.buttons.length - 1; i >= 0; i--) {
      const b = H.buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); HB.Audio.play('pop'); return true; }
    }
    if (H.modal(st)) return true;   // con una ventana abierta, el resto no responde
    for (const t of vis.taps) if (HB.dist(x, y, t.x, t.y) < t.r) { t.fn(); HB.Audio.play('pop'); return true; }
    if (H.aiming) {
      const wx = V.cam.x + (x - V.gx - V.gw / 2 - V.cam.ox) / V.tile;
      const wy = V.cam.y + (y - V.gh / 2 - V.cam.oy) / V.tile;
      if (HB.Night.orbital(st, wx, wy)) H.aiming = false;
      return true;
    }
    return false;
  };

  // ¿Este punto de la pantalla cae sobre un botón? (para no arrancar el joystick encima)
  H.hitButton = function (x, y) {
    for (const b of H.buttons) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
    for (const t of vis.taps) if (HB.dist(x, y, t.x, t.y) < t.r) return true;
    return H.aiming;
  };
})(globalThis.HB);
