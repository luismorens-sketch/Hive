// Hive Breaker — HUD y ventanas (funcional 18), en píxeles de pantalla.
//
// Arriba: dinero y ajustes; debajo, la barra de Calor con «provocar» (de día) o la noche en
// curso con su botín. Abajo a la derecha, de noche, el Orbital Strike.
// Ventanas (paran el juego): elegir torreta, informe de la noche, segunda oportunidad y el vídeo
// simulado (funcional 15.3: en el prototipo el botón «AD» da la recompensa sin anuncio).
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
  };

  function T(k, a) { return HB.T(k, a); }

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

  function drawPower(R, y) {
    if (!R.power || R.power.f >= 1) return y;
    const g = V.ctx, w = 190, x = V.gx + V.gw / 2 - w / 2;
    g.save(); D.rr(g, x, y, w, 24, 4); g.clip();
    g.fillStyle = P.amber; g.fillRect(x, y, w, 24);
    g.fillStyle = P.ink;
    for (let i = -2; i < w / 18 + 2; i++) { const sx = x + i * 18 + (vis.clock * 30) % 18; g.beginPath(); g.moveTo(sx, y + 24); g.lineTo(sx + 9, y + 24); g.lineTo(sx + 21, y); g.lineTo(sx + 12, y); g.closePath(); g.fill(); }
    g.restore();
    D.rr(g, x + 30, y + 3, w - 60, 18, 4); g.fillStyle = P.amber; g.fill();
    V.text(T('low_power') + ' ' + R.power.supply + '/' + R.power.demand + ' MW', x + w / 2, y + 13, 18, P.ink, null);
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
    V.text(b.s, cx, cy, 46 * s, b.col || P.yellow, P.ink);
    if (b.sub) V.text(b.sub, cx, cy + 40, 22, '#ffffff', P.ink);
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

  H.modal = function (st) { return !!(st.choice || st.report || st.defeat || H.ad); };

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
    g.font = V.font(34 * sc);
    const w = Math.max(118, g.measureText(txt).width + 70);
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
    if (st.ftue.move === undefined) hint = 'hint_drag';
    else if (tgt && tgt.hint && (learning || tgt.kind === 'refill' || (tgt.kind === 'pickup' && tgt.hint === 'hint_ammo') || tgt.kind === 'repair')) hint = tgt.hint;
    if (hint && !H.modal(st)) {
      const hy = yy + 22 + Math.sin(vis.clock * 3) * 3;
      V.text(T(hint), V.gx + V.gw / 2, hy, 28, hint === 'hint_refill' || hint === 'hint_ammo' ? P.orangeL : P.yellow, P.ink);
    }
    if (st.ftue.move === undefined) drawHand();

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
  };

  // Un toque corto: primero los botones; luego lo que se puede tocar en el mundo; luego el Orbital.
  H.tap = function (x, y, game) {
    const st = game.st;
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
