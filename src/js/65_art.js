// Hive Breaker — el arte, dibujado con código (como los edificios del juego anterior del autor).
//
// Cada función dibuja en casillas, con el punto de anclaje en (0, 0). Las que no cambian se
// guardan en caché con HB.View.sprite() y se copian cada fotograma. Cuando lleguen los sprites
// hechos con IA (funcional 19), se sustituyen aquí sin tocar el resto del juego.
(function (HB) {
  'use strict';

  const P = HB.PAL, D = HB.Draw, V = HB.View;
  const LW = 0.06;          // grosor del contorno (siluetas gruesas, funcional 19)

  // Texto dentro de un dibujo en caché, a resolución real (sin texto borroso).
  function spriteText(g, s, x, y, size, fill, stroke) {
    const m = g.getTransform();
    const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    const fs = size * m.a;
    g.font = V.font(fs, 600);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = fs * 0.18; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(s, px, py); }
    g.fillStyle = fill;
    g.fillText(s, px, py);
    g.restore();
  }

  function shadow(g, x, y, rx, ry, a) {
    g.fillStyle = 'rgba(40,25,10,' + (a || 0.22) + ')';
    D.ellipse(g, x, y, rx, ry);
    g.fill();
  }

  function hazard(g, x, y, w, h) {
    g.save();
    D.rr(g, x, y, w, h, 0.03);
    g.clip();
    g.fillStyle = P.yellow; g.fillRect(x, y, w, h);
    g.fillStyle = P.ink;
    for (let i = -2; i < w / 0.22 + 2; i++) {
      const sx = x + i * 0.22;
      g.beginPath();
      g.moveTo(sx, y + h); g.lineTo(sx + 0.11, y + h); g.lineTo(sx + 0.11 + h, y); g.lineTo(sx + h, y);
      g.closePath(); g.fill();
    }
    g.restore();
    D.rr(g, x, y, w, h, 0.03);
    g.lineWidth = 0.03; g.strokeStyle = P.ink; g.stroke();
  }

  // ---------- Objetos (anclaje: centro de la base) ----------
  const ITEM_ART = {
    ore: function (g) {
      g.beginPath();
      g.moveTo(-0.2, -0.02); g.lineTo(-0.22, -0.13); g.lineTo(-0.1, -0.24); g.lineTo(0.08, -0.25);
      g.lineTo(0.21, -0.15); g.lineTo(0.2, -0.03); g.lineTo(0.06, 0.02);
      g.closePath();
      D.fillStroke(g, P.ore, 0.035);
      g.beginPath();
      g.moveTo(-0.1, -0.22); g.lineTo(0.07, -0.23); g.lineTo(0.03, -0.12); g.lineTo(-0.12, -0.12);
      g.closePath(); g.fillStyle = P.oreL; g.fill();
      g.fillStyle = P.glint; g.fillRect(0.08, -0.17, 0.05, 0.05);
    },
    plate: function (g) {
      g.beginPath();
      g.moveTo(-0.23, 0); g.lineTo(0.23, 0); g.lineTo(0.23, -0.07); g.lineTo(-0.23, -0.07); g.closePath();
      D.fillStroke(g, P.steelD, 0.035);
      g.beginPath();
      g.moveTo(-0.23, -0.07); g.lineTo(0.23, -0.07); g.lineTo(0.16, -0.15); g.lineTo(-0.16, -0.15); g.closePath();
      D.fillStroke(g, P.steel, 0.035);
      g.fillStyle = '#ffffff'; g.fillRect(-0.1, -0.13, 0.12, 0.025);
    },
    ammo: function (g) {
      D.rr(g, -0.21, -0.14, 0.42, 0.14, 0.02); D.fillStroke(g, P.oliveD, 0.035);
      D.rr(g, -0.21, -0.22, 0.42, 0.09, 0.02); D.fillStroke(g, P.oliveL, 0.035);
      g.fillStyle = P.yellow; g.fillRect(-0.19, -0.1, 0.38, 0.045);
      g.strokeStyle = P.ink; g.lineWidth = 0.02; g.strokeRect(-0.19, -0.1, 0.38, 0.045);
    },
    // Cobre: pepita cobriza con manchas verdes (la misma silueta de roca que el Ore, otro color)
    copper: function (g) {
      g.beginPath();
      g.moveTo(-0.19, -0.02); g.lineTo(-0.21, -0.12); g.lineTo(-0.12, -0.22); g.lineTo(0.06, -0.24);
      g.lineTo(0.2, -0.16); g.lineTo(0.21, -0.04); g.lineTo(0.05, 0.02);
      g.closePath();
      D.fillStroke(g, P.copper, 0.035);
      g.beginPath();
      g.moveTo(-0.1, -0.21); g.lineTo(0.06, -0.22); g.lineTo(0.02, -0.12); g.lineTo(-0.12, -0.11);
      g.closePath(); g.fillStyle = P.copperL; g.fill();
      g.fillStyle = P.verdigris;
      D.ellipse(g, 0.11, -0.07, 0.05, 0.035); g.fill();
      D.ellipse(g, -0.13, -0.06, 0.03, 0.025); g.fill();
      g.fillStyle = '#fff1d6'; g.fillRect(0.07, -0.19, 0.045, 0.045);
    },
    // Bobina: un carrete de hilo de cobre de pie, con sus dos discos
    coil: function (g) {
      D.ellipse(g, 0, -0.03, 0.17, 0.06); D.fillStroke(g, P.steelD, 0.03);
      D.rr(g, -0.12, -0.24, 0.24, 0.2, 0.03); D.fillStroke(g, P.copper, 0.03);
      g.strokeStyle = P.copperD; g.lineWidth = 0.018;
      for (let y = -0.21; y < -0.05; y += 0.045) { g.beginPath(); g.moveTo(-0.11, y); g.lineTo(0.11, y + 0.015); g.stroke(); }
      g.fillStyle = 'rgba(255,236,205,0.6)'; g.fillRect(-0.07, -0.23, 0.04, 0.17);
      D.ellipse(g, 0, -0.25, 0.17, 0.06); D.fillStroke(g, P.steel, 0.03);
      D.ellipse(g, 0, -0.25, 0.04, 0.018); g.fillStyle = P.ink; g.fill();
    },
    bill: function (g) {
      D.rr(g, -0.24, -0.14, 0.48, 0.14, 0.025); D.fillStroke(g, P.cashD, 0.03);
      D.rr(g, -0.24, -0.2, 0.48, 0.08, 0.025); D.fillStroke(g, P.cash, 0.03);
      g.fillStyle = P.cashL; g.fillRect(-0.06, -0.185, 0.12, 0.05);
    },
  };

  HB.Art = {
    spriteText: spriteText,

    item: function (it) {
      return V.sprite('item:' + it, 0.6, 0.45, 0.3, 0.36, ITEM_ART[it]);
    },

    // Billete grande para el HUD y los vuelos al contador (en píxeles de pantalla).
    billHud: function () {
      return V.sprite('billhud', 0.6, 0.45, 0.3, 0.3, function (g) {
        for (const r of [-0.22, 0.12]) {
          g.save(); g.rotate(r); g.translate(r * 0.2, 0);
          D.rr(g, -0.24, -0.13, 0.48, 0.26, 0.04); D.fillStroke(g, P.cash, 0.035);
          D.rr(g, -0.19, -0.085, 0.38, 0.17, 0.03); g.lineWidth = 0.02; g.strokeStyle = P.cashD; g.stroke();
          g.restore();
        }
        D.ellipse(g, 0.04, 0.0, 0.085, 0.085); D.fillStroke(g, P.cashL, 0.025);
        spriteText(g, '$', 0.04, 0.01, 0.15, P.cashD, null);
      });
    },

    // ---------- Veta: un montón del MISMO mineral que se recoge (se entiende sin explicarlo) ----------
    vein: function (item) {
      item = item || 'ore';
      const cu = item === 'copper';
      return V.sprite('vein:' + item, 1.9, 1.7, 0.95, 1.15, function (g) {
        shadow(g, 0.05, 0.36, 0.78, 0.2, 0.28);
        // suelo removido alrededor
        g.fillStyle = 'rgba(120,90,55,0.45)';
        D.ellipse(g, 0, 0.3, 0.86, 0.26); g.fill();
        // roca madre oscura
        g.beginPath();
        g.moveTo(-0.72, 0.36); g.lineTo(-0.62, 0.02); g.lineTo(-0.34, -0.2); g.lineTo(0.3, -0.22);
        g.lineTo(0.66, 0.02); g.lineTo(0.74, 0.36); g.closePath();
        D.fillStroke(g, cu ? '#6a5246' : '#5d5a5e', LW);
        // trozos de mineral (la misma forma que el objeto, en grande)
        const rocks = [[-0.38, 0.28, 1.25], [0.34, 0.3, 1.2], [-0.02, 0.18, 1.6], [-0.22, -0.06, 1.15], [0.22, -0.08, 1.2], [0.0, -0.3, 1.25]];
        for (const r of rocks) {
          g.save(); g.translate(r[0], r[1]); g.scale(r[2], r[2]);
          ITEM_ART[item](g);
          g.restore();
        }
        // chispas de mineral
        g.fillStyle = cu ? '#ffe2b8' : P.glint;
        for (const q of [[-0.45, 0.1], [0.5, 0.12], [0.1, -0.42], [-0.1, 0.32]]) g.fillRect(q[0], q[1], 0.06, 0.06);
        // pedazos sueltos por el suelo
        for (const q of [[-0.85, 0.42, 0.55], [0.82, 0.44, 0.5], [0.55, 0.55, 0.45]]) {
          g.save(); g.translate(q[0], q[1]); g.scale(q[2], q[2]); ITEM_ART[item](g); g.restore();
        }
      });
    },

    // ---------- Fundición: un horno (puerta en arco al rojo, ladrillo y chimenea) ----------
    smelter: function (flip, lvl) {
      const m = HB.MACHINES.smelter, w = m.w, h = m.h, z = m.z;
      return V.sprite('smelter:' + (flip ? 1 : 0) + ':' + lvl, w + 1.2, z + h * 0.75 + 2.2, (w + 1.2) / 2, z + h * 0.75 + 1.6 - h / 2, function (g) {
        if (flip) g.scale(-1, 1);
        const fy = h / 2;
        shadow(g, 0.15, fy + 0.02, w / 2 + 0.3, 0.28, 0.28);
        D.rr(g, -w / 2 - 0.1, fy - 0.3, w + 0.2, 0.36, 0.06); D.fillStroke(g, P.conc, LW);
        D.box(g, 0, fy - 0.12, w - 0.1, h, z, '#8d99a3', '#5b6670', LW);
        const top = fy - 0.12 - z, x0 = -w / 2 + 0.05, x1 = w / 2 - 0.05;
        // ladrillo en la parte baja de la fachada
        g.save(); D.rr(g, x0, fy - 0.12 - 0.42, x1 - x0, 0.42, 0.06); g.clip();
        g.fillStyle = '#9a4f33'; g.fillRect(x0, fy - 0.6, x1 - x0, 0.5);
        g.strokeStyle = '#6b3320'; g.lineWidth = 0.025;
        for (let r = 0; r < 3; r++) {
          const yy = fy - 0.54 + r * 0.14;
          g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke();
          for (let xx = x0 + (r % 2) * 0.12; xx < x1; xx += 0.24) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 0.14); g.stroke(); }
        }
        g.restore();
        // puerta del horno en arco, al rojo
        const dw = 0.5, db = fy - 0.2, dt = top + 0.18;
        g.beginPath();
        g.moveTo(-dw, db); g.lineTo(-dw, dt + dw * 0.6); g.quadraticCurveTo(-dw, dt, 0, dt); g.quadraticCurveTo(dw, dt, dw, dt + dw * 0.6); g.lineTo(dw, db); g.closePath();
        D.fillStroke(g, '#2a1a10', LW);
        const gr = g.createLinearGradient(0, dt + 0.05, 0, db);
        gr.addColorStop(0, '#fff2a8'); gr.addColorStop(0.35, '#ffb02e'); gr.addColorStop(0.8, '#e2531a'); gr.addColorStop(1, '#8c2a0e');
        g.beginPath();
        g.moveTo(-dw + 0.08, db - 0.04); g.lineTo(-dw + 0.08, dt + dw * 0.6); g.quadraticCurveTo(-dw + 0.08, dt + 0.08, 0, dt + 0.08);
        g.quadraticCurveTo(dw - 0.08, dt + 0.08, dw - 0.08, dt + dw * 0.6); g.lineTo(dw - 0.08, db - 0.04); g.closePath();
        g.fillStyle = gr; g.fill();
        // rejilla de la puerta
        g.strokeStyle = 'rgba(42,26,16,0.7)'; g.lineWidth = 0.035;
        for (const xx of [-0.22, 0, 0.22]) { g.beginPath(); g.moveTo(xx, dt + 0.12); g.lineTo(xx, db - 0.04); g.stroke(); }
        // cúpula en el tejado
        g.beginPath(); g.ellipse(-0.25, top - 0.42, 0.62, 0.42, 0, Math.PI, 0); g.lineTo(0.37, top - 0.3); g.lineTo(-0.87, top - 0.3); g.closePath();
        D.fillStroke(g, '#a3aeb7', LW);
        g.fillStyle = 'rgba(255,255,255,0.35)'; D.ellipse(g, -0.45, top - 0.62, 0.18, 0.08); g.fill();
        // tolva de entrada (lado de la entrada)
        g.beginPath();
        g.moveTo(-w / 2 + 0.02, top - 1.0); g.lineTo(-w / 2 + 0.8, top - 1.0); g.lineTo(-w / 2 + 0.7, top - 0.45); g.lineTo(-w / 2 + 0.12, top - 0.45);
        g.closePath(); D.fillStroke(g, P.steelD, LW);
        g.fillStyle = '#3f474c'; g.fillRect(-w / 2 + 0.1, top - 0.95, 0.62, 0.14);
        // chimenea con boca al rojo
        D.rr(g, 0.45, top - 1.45, 0.42, 1.15, 0.06); D.fillStroke(g, '#4a545b', LW);
        g.fillStyle = P.orange; g.fillRect(0.45, top - 1.2, 0.42, 0.08);
        D.ellipse(g, 0.66, top - 1.45, 0.21, 0.08); D.fillStroke(g, '#ff9a3d', LW);
        // franja oliva (militar) y remaches
        g.fillStyle = P.olive; g.fillRect(-w / 2 + 0.08, top + 0.02, w - 0.26, 0.08);
        g.fillStyle = P.ink;
        for (const rx of [-w / 2 + 0.2, w / 2 - 0.3]) { D.ellipse(g, rx, top + 0.3, 0.035, 0.035); g.fill(); }
        // conducto de salida
        g.beginPath(); g.moveTo(w / 2 - 0.12, fy - 0.75); g.lineTo(w / 2 + 0.42, fy - 0.45); g.lineTo(w / 2 + 0.42, fy - 0.25); g.lineTo(w / 2 - 0.12, fy - 0.5); g.closePath();
        D.fillStroke(g, P.steelD, LW);
        levelPips(g, flip, lvl, w / 2 - 0.6, top + 0.3);
      });
    },

    // ---------- Fábrica de munición: una prensa con el emblema de las balas ----------
    ammo_fab: function (flip, lvl) {
      const m = HB.MACHINES.ammo_fab, w = m.w, h = m.h, z = m.z;
      return V.sprite('ammo:' + (flip ? 1 : 0) + ':' + lvl, w + 1.2, z + h * 0.75 + 2.2, (w + 1.2) / 2, z + h * 0.75 + 1.6 - h / 2, function (g) {
        if (flip) g.scale(-1, 1);
        const fy = h / 2;
        shadow(g, 0.15, fy + 0.02, w / 2 + 0.3, 0.28, 0.28);
        D.rr(g, -w / 2 - 0.1, fy - 0.3, w + 0.2, 0.36, 0.06); D.fillStroke(g, P.conc, LW);
        D.box(g, 0, fy - 0.12, w - 0.1, h, z, P.oliveL, P.olive, LW);
        const top = fy - 0.12 - z;
        hazard(g, -w / 2 + 0.1, fy - 0.36, w - 0.3, 0.16);
        // emblema: círculo amarillo con tres balas
        D.ellipse(g, 0, top + 0.45, 0.4, 0.34); D.fillStroke(g, P.yellow, LW);
        for (let i = 0; i < 3; i++) {
          const bx = -0.17 + i * 0.17, by = top + 0.32;
          D.rr(g, bx - 0.055, by + 0.06, 0.11, 0.3, 0.02); D.fillStroke(g, '#d9a33a', 0.03);
          g.beginPath(); g.moveTo(bx - 0.055, by + 0.08); g.quadraticCurveTo(bx, by - 0.1, bx + 0.055, by + 0.08); g.closePath();
          D.fillStroke(g, '#b8743a', 0.03);
        }
        // tolva de entrada
        g.beginPath();
        g.moveTo(-w / 2 + 0.02, top - 1.0); g.lineTo(-w / 2 + 0.8, top - 1.0); g.lineTo(-w / 2 + 0.7, top - 0.45); g.lineTo(-w / 2 + 0.12, top - 0.45);
        g.closePath(); D.fillStroke(g, P.steelD, LW);
        g.fillStyle = '#3f474c'; g.fillRect(-w / 2 + 0.1, top - 0.95, 0.62, 0.14);
        // pórtico de la prensa (el martillo se mueve: lo dibuja 70_render.js)
        g.fillStyle = '#3d4a50';
        D.rr(g, 0.12, top - 1.5, 0.12, 1.15, 0.03); D.fillStroke(g, '#3d4a50', 0.04);
        D.rr(g, 0.86, top - 1.5, 0.12, 1.15, 0.03); D.fillStroke(g, '#3d4a50', 0.04);
        D.rr(g, 0.05, top - 1.58, 1.0, 0.16, 0.04); D.fillStroke(g, P.orange, 0.04);
        D.rr(g, 0.2, top - 0.42, 0.7, 0.12, 0.03); D.fillStroke(g, P.steelD, 0.04);
        // rodillos de salida
        for (let i = 0; i < 3; i++) { D.ellipse(g, w / 2 - 0.15 + i * 0.16, fy - 0.42, 0.06, 0.06); D.fillStroke(g, P.steel, 0.03); }
        levelPips(g, flip, lvl, -w / 2 + 0.25, top + 0.12);
      });
    },

    // ---------- Bobinadora: un gran carrete de cobre sobre su bancada (funcional v0.4) ----------
    // El carrete gira cuando trabaja: el brillo que lo recorre lo dibuja 70_render.js.
    winder: function (flip, lvl) {
      const m = HB.MACHINES.winder, w = m.w, h = m.h, z = m.z;
      return V.sprite('winder:' + (flip ? 1 : 0) + ':' + lvl, w + 1.2, z + h * 0.75 + 2.2, (w + 1.2) / 2, z + h * 0.75 + 1.6 - h / 2, function (g) {
        if (flip) g.scale(-1, 1);
        const fy = h / 2;
        shadow(g, 0.15, fy + 0.02, w / 2 + 0.3, 0.28, 0.28);
        D.rr(g, -w / 2 - 0.1, fy - 0.3, w + 0.2, 0.36, 0.06); D.fillStroke(g, P.conc, LW);
        D.box(g, 0, fy - 0.12, w - 0.1, h, z, '#93b7bc', '#5b828a', LW);
        const top = fy - 0.12 - z;
        hazard(g, -w / 2 + 0.1, fy - 0.36, w - 0.3, 0.16);
        // franja turquesa (militar) y emblema: una bobina en un círculo
        g.fillStyle = P.teal; g.fillRect(-w / 2 + 0.08, top + 0.02, w - 0.26, 0.08);
        D.ellipse(g, -0.3, top + 0.48, 0.3, 0.26); D.fillStroke(g, P.copperL, LW);
        g.save(); g.translate(-0.3, top + 0.62); g.scale(1.1, 1.1); ITEM_ART.coil(g); g.restore();
        // tolva de entrada (lado de la entrada, como las demás máquinas)
        g.beginPath();
        g.moveTo(-w / 2 + 0.02, top - 1.0); g.lineTo(-w / 2 + 0.8, top - 1.0); g.lineTo(-w / 2 + 0.7, top - 0.45); g.lineTo(-w / 2 + 0.12, top - 0.45);
        g.closePath(); D.fillStroke(g, P.steelD, LW);
        g.fillStyle = '#3f474c'; g.fillRect(-w / 2 + 0.1, top - 0.95, 0.62, 0.14);
        // soportes y el tambor de cobre, tumbado
        const cx = WINDER.cx, cy = top + WINDER.cy, L = WINDER.len, rr = WINDER.r;
        for (const px of [cx - L / 2 - 0.13, cx + L / 2 + 0.03]) { D.rr(g, px, cy - 0.05, 0.1, 0.6, 0.02); D.fillStroke(g, '#3d4a50', 0.04); }
        D.rr(g, cx - L / 2, cy - rr, L, rr * 2, 0.06); D.fillStroke(g, P.copper, LW);
        g.strokeStyle = P.copperD; g.lineWidth = 0.025;
        for (let x = cx - L / 2 + 0.08; x < cx + L / 2 - 0.04; x += 0.085) { g.beginPath(); g.moveTo(x, cy - rr + 0.04); g.lineTo(x + 0.02, cy + rr - 0.04); g.stroke(); }
        g.fillStyle = 'rgba(255,232,200,0.5)'; g.fillRect(cx - L / 2 + 0.05, cy - rr + 0.07, L - 0.1, 0.07);
        for (const ex of [cx - L / 2, cx + L / 2]) {
          D.ellipse(g, ex, cy, 0.1, rr + 0.1); D.fillStroke(g, P.steelD, LW);
          D.ellipse(g, ex, cy, 0.035, 0.07); g.fillStyle = P.ink; g.fill();
        }
        // el hilo baja de la tolva al tambor
        g.strokeStyle = P.copperL; g.lineWidth = 0.04;
        g.beginPath(); g.moveTo(-w / 2 + 0.55, top - 0.5); g.quadraticCurveTo(-0.35, top - 1.05, cx - L / 2 + 0.12, cy - rr + 0.06); g.stroke();
        // conducto de salida
        g.beginPath(); g.moveTo(w / 2 - 0.12, fy - 0.75); g.lineTo(w / 2 + 0.42, fy - 0.45); g.lineTo(w / 2 + 0.42, fy - 0.25); g.lineTo(w / 2 - 0.12, fy - 0.5); g.closePath();
        D.fillStroke(g, P.steelD, LW);
        levelPips(g, flip, lvl, w / 2 - 0.6, top + 0.3);
      });
    },

    // ---------- Panel solar: placas azules en su soporte ----------
    solar: function () {
      const m = HB.MACHINES.solar, w = m.w, h = m.h;
      return V.sprite('solar', w + 1.0, h + 1.8, (w + 1.0) / 2, h / 2 + 1.3, function (g) {
        const fy = h / 2;
        shadow(g, 0.1, fy, w / 2 + 0.15, 0.22, 0.25);
        g.strokeStyle = P.ink; g.lineWidth = 0.07;
        for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) { g.beginPath(); g.moveTo(x, fy - 0.05); g.lineTo(x, fy - 0.55); g.stroke(); }
        // panel inclinado
        const px0 = -w / 2 - 0.05, px1 = w / 2 + 0.05, ty = fy - 1.25, by = fy - 0.45;
        g.beginPath(); g.moveTo(px0 + 0.15, ty); g.lineTo(px1 - 0.15, ty); g.lineTo(px1, by); g.lineTo(px0, by); g.closePath();
        D.fillStroke(g, '#2a5aa6', LW);
        g.save(); g.clip();
        g.strokeStyle = '#a6c8ff'; g.lineWidth = 0.025;
        for (let i = 1; i < 4; i++) { const t = i / 4; g.beginPath(); g.moveTo(px0 + 0.15 + (px1 - px0 - 0.3) * t, ty); g.lineTo(px0 + (px1 - px0) * t, by); g.stroke(); }
        for (let i = 1; i < 3; i++) { const yy = HB.lerp(ty, by, i / 3); g.beginPath(); g.moveTo(px0, yy); g.lineTo(px1, yy); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,0.28)';
        g.beginPath(); g.moveTo(px0 + 0.3, ty); g.lineTo(px0 + 0.6, ty); g.lineTo(px0 + 0.25, by); g.lineTo(px0 - 0.05, by); g.closePath(); g.fill();
        g.restore();
        // caja de baterías con rayo
        D.rr(g, w / 2 - 0.35, fy - 0.42, 0.4, 0.38, 0.05); D.fillStroke(g, P.olive, 0.05);
        g.fillStyle = P.yellow;
        g.beginPath(); g.moveTo(w / 2 - 0.12, fy - 0.38); g.lineTo(w / 2 - 0.24, fy - 0.2); g.lineTo(w / 2 - 0.15, fy - 0.2); g.lineTo(w / 2 - 0.2, fy - 0.07); g.lineTo(w / 2 - 0.05, fy - 0.26); g.lineTo(w / 2 - 0.14, fy - 0.26); g.closePath(); g.fill();
      });
    },

    // ---------- Disipador: aletas plateadas y ventilador (frío, azul) ----------
    dissipator: function () {
      const m = HB.MACHINES.dissipator, w = m.w, h = m.h, z = m.z;
      return V.sprite('dissipator', w + 1.0, z + h * 0.75 + 1.4, (w + 1.0) / 2, z + h * 0.75 + 0.9 - h / 2, function (g) {
        const fy = h / 2;
        shadow(g, 0.1, fy, w / 2 + 0.2, 0.24, 0.25);
        D.box(g, 0, fy - 0.05, w - 0.1, h, z, '#cfd8dc', '#8796a0', LW);
        const top = fy - 0.05 - z;
        // aletas
        g.save(); D.rr(g, -w / 2 + 0.12, top + 0.12, w - 0.34, z - 0.3, 0.04); g.clip();
        g.fillStyle = '#5d6b74'; g.fillRect(-w / 2, top, w, z);
        g.fillStyle = '#e8eef1';
        for (let x = -w / 2 + 0.16; x < w / 2 - 0.2; x += 0.16) g.fillRect(x, top + 0.12, 0.09, z);
        g.restore();
        // franja azul de frío
        g.fillStyle = P.tealL; g.fillRect(-w / 2 + 0.06, fy - 0.2, w - 0.22, 0.08);
        // carcasa del ventilador en el tejado (las aspas giran: 70_render.js)
        D.ellipse(g, 0, top - 0.48, 0.48, 0.3); D.fillStroke(g, '#3d4a50', LW);
        D.ellipse(g, 0, top - 0.48, 0.38, 0.22); g.fillStyle = '#1f2a30'; g.fill();
      });
    },

    // ---------- Plataforma de exportación ----------
    export: function () {
      const m = HB.MACHINES.export, w = m.w, h = m.h;
      return V.sprite('export', w + 1.4, h + 2.2, (w + 1.4) / 2, h / 2 + 1.6, function (g) {
        const fy = h / 2;
        shadow(g, 0.1, fy + 0.05, w / 2 + 0.2, 0.3, 0.2);
        // losa octogonal
        const oct = function (r, ry, cy) {
          g.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = Math.PI / 8 + i * Math.PI / 4;
            const x = Math.cos(a) * r, y = cy + Math.sin(a) * ry;
            if (i) g.lineTo(x, y); else g.moveTo(x, y);
          }
          g.closePath();
        };
        oct(w / 2 + 0.05, h / 2 * 0.9, 0.08); D.fillStroke(g, P.concD, LW);
        oct(w / 2 + 0.05, h / 2 * 0.9, -0.12); D.fillStroke(g, '#5b6569', LW);
        g.setLineDash([0.22, 0.14]);
        D.ellipse(g, 0, -0.12, w / 2 - 0.3, h / 2 * 0.9 - 0.3); g.lineWidth = 0.08; g.strokeStyle = P.yellow; g.stroke();
        g.setLineDash([]);
        // flechas hacia el centro
        g.fillStyle = 'rgba(255,210,63,0.85)';
        for (let i = 0; i < 4; i++) {
          g.save(); g.translate(0, -0.12); g.rotate(i * Math.PI / 2); g.scale(1, 0.9);
          g.beginPath(); g.moveTo(0.62, -0.12); g.lineTo(0.42, 0); g.lineTo(0.62, 0.12); g.closePath(); g.fill();
          g.restore();
        }
        // cartel
        g.fillStyle = P.ink; g.fillRect(-w / 2 - 0.25, -h / 2 - 0.9, 0.08, 1.1);
        D.rr(g, -w / 2 - 0.6, -h / 2 - 1.35, 1.25, 0.5, 0.08); D.fillStroke(g, P.orange, LW);
        spriteText(g, HB.T('export_sign'), -w / 2 + 0.02, -h / 2 - 1.08, 0.36, '#ffffff', P.ink);
      });
    },

    // ---------- Torre de mando ----------
    hq: function () {
      const m = HB.MACHINES.hq, w = m.w, h = m.h;
      return V.sprite('hq', w + 1.2, h + 3.4, (w + 1.2) / 2, h / 2 + 2.8, function (g) {
        const fy = h / 2;
        shadow(g, 0.2, fy + 0.02, w / 2 + 0.35, 0.3, 0.25);
        D.box(g, 0, fy, w, h, 0.7, P.concL, P.conc, LW);
        hazard(g, -w / 2 + 0.1, fy - 0.24, w - 0.2, 0.14);
        const t1 = fy - 0.7;
        D.box(g, 0, t1 - 0.25, 1.5, 1.1, 1.0, P.tealL, P.teal, LW);
        const t2 = t1 - 1.25;
        // ventanas
        D.rr(g, -0.62, t2 + 0.25, 1.24, 0.3, 0.06); D.fillStroke(g, '#9ff3ff', 0.04);
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-0.55, t2 + 0.3, 0.3, 0.07);
        // antena, radar y bandera
        g.strokeStyle = P.ink; g.lineWidth = 0.06;
        g.beginPath(); g.moveTo(0.35, t2 - 0.8); g.lineTo(0.35, t2 - 1.8); g.stroke();
        D.ellipse(g, 0.35, t2 - 1.82, 0.07, 0.07); D.fillStroke(g, '#ff4d4d', 0.03);
        g.beginPath(); g.moveTo(-0.35, t2 - 0.8); g.lineTo(-0.35, t2 - 1.5); g.stroke();
        g.beginPath(); g.moveTo(-0.35, t2 - 1.5); g.lineTo(0.05, t2 - 1.38); g.lineTo(-0.35, t2 - 1.24); g.closePath();
        D.fillStroke(g, P.orange, 0.04);
        g.beginPath(); g.ellipse(0.0, t2 - 0.85, 0.34, 0.14, -0.2, Math.PI, 0); g.closePath();
        D.fillStroke(g, P.steel, 0.05);
      });
    },

    // ---------- Nave de la flota ----------
    ship: function () {
      return V.sprite('ship', 3.0, 2.4, 1.5, 1.2, function (g) {
        // alas y motores
        D.rr(g, -1.35, -0.25, 2.7, 0.5, 0.2); D.fillStroke(g, P.oliveD, LW);
        for (const sx of [-1.1, 1.1]) {
          D.rr(g, sx - 0.28, -0.45, 0.56, 0.9, 0.2); D.fillStroke(g, '#3d4a50', LW);
          D.ellipse(g, sx, 0.38, 0.2, 0.08); g.fillStyle = P.orangeL; g.fill();
          g.fillStyle = P.orange; g.fillRect(sx - 0.24, -0.4, 0.48, 0.1);
        }
        // casco
        g.beginPath();
        g.moveTo(-0.6, -0.85); g.quadraticCurveTo(0, -1.15, 0.6, -0.85);
        g.lineTo(0.75, 0.45); g.quadraticCurveTo(0, 0.95, -0.75, 0.45); g.closePath();
        D.fillStroke(g, P.olive, LW);
        g.fillStyle = P.oliveL;
        g.beginPath(); g.moveTo(-0.45, -0.8); g.quadraticCurveTo(0, -1.0, 0.45, -0.8); g.lineTo(0.5, -0.3); g.lineTo(-0.5, -0.3); g.closePath(); g.fill();
        g.fillStyle = P.teal; g.fillRect(-0.72, -0.05, 1.44, 0.14);
        // cabina
        g.beginPath(); g.ellipse(0, 0.42, 0.36, 0.22, 0, 0, Math.PI * 2);
        D.fillStroke(g, '#8ff0ff', 0.05);
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-0.18, 0.32, 0.14, 0.06);
        // compuerta de carga
        D.rr(g, -0.3, -0.62, 0.6, 0.38, 0.06); D.fillStroke(g, '#3d4a50', 0.04);
        hazard(g, -0.28, -0.3, 0.56, 0.08);
      });
    },

    // ---------- Zonas que se pisan (entrada, salida, dinero) ----------
    // dir: hacia dónde apunta la flecha (1 derecha, -1 izquierda).
    pad: function (kind, dir, item) {
      return V.sprite('pad:' + kind + ':' + dir + ':' + (item || ''), 1.6, 1.4, 0.8, 0.7, function (g) {
        const col = kind === 'in' ? 'rgba(255,210,63,' : (kind === 'out' ? 'rgba(39,179,164,' : (kind === 'box' ? 'rgba(255,138,31,' : 'rgba(79,199,104,'));
        const solid = kind === 'in' ? P.yellow : (kind === 'out' ? P.tealL : (kind === 'box' ? P.orange : P.cashL));
        D.rr(g, -0.62, -0.5, 1.24, 1.0, 0.18);
        g.fillStyle = col + '0.25)'; g.fill();
        g.lineWidth = 0.08; g.strokeStyle = solid; g.stroke();
        g.setLineDash([0.12, 0.12]); g.lineWidth = 0.08; g.strokeStyle = 'rgba(28,33,38,0.55)'; g.stroke(); g.setLineDash([]);
        if (dir) {
          g.save(); g.scale(dir, 1); g.globalAlpha = 0.85; g.fillStyle = solid;
          g.beginPath(); g.moveTo(0.3, -0.18); g.lineTo(0.5, 0); g.lineTo(0.3, 0.18); g.lineTo(0.3, 0.07); g.lineTo(0.1, 0.07); g.lineTo(0.1, -0.07); g.lineTo(0.3, -0.07); g.closePath(); g.fill();
          g.restore();
        }
        if (item) {
          g.save(); g.globalAlpha = 0.45; g.translate(-dir * 0.12, 0.12); g.scale(0.9, 0.9);
          ITEM_ART[item](g);
          g.restore();
        }
      });
    },

    // Icono en el centro de una zona de pago.
    zoneIcon: function (z) {
      const key = z.kind === 'machine' ? 'm:' + z.type : (z.kind === 'vein' ? 'vein:' + (z.item || 'ore') : z.kind);
      const custom = ZONE_ICONS[z.kind === 'machine' ? z.type : z.kind];
      if (custom) return V.sprite('zicon:' + key, 1.0, 1.0, 0.5, 0.5, custom);
      return V.sprite('zicon:' + key, 1.0, 1.0, 0.5, 0.5, function (g) {
        g.fillStyle = '#ffffff'; g.strokeStyle = P.ink; g.lineWidth = 0.05;
        if (z.kind === 'vein') {
          g.save(); g.translate(0, 0.14); g.scale(1.4, 1.4); ITEM_ART[z.item || 'ore'](g); g.restore();
        } else if (z.kind === 'upgrade') {
          for (let i = 0; i < 2; i++) {
            const y = 0.12 - i * 0.22;
            g.beginPath(); g.moveTo(-0.24, y + 0.08); g.lineTo(0, y - 0.14); g.lineTo(0.24, y + 0.08); g.lineTo(0.24, y + 0.18);
            g.lineTo(0, y - 0.04); g.lineTo(-0.24, y + 0.18); g.closePath();
            g.fillStyle = i ? P.yellow : '#ffffff'; g.fill(); g.stroke();
          }
        } else if (z.kind === 'expansion') {
          g.beginPath(); g.moveTo(-0.1, 0.3); g.lineTo(-0.1, -0.3); g.lineTo(0.28, -0.18); g.lineTo(-0.1, -0.05);
          g.lineWidth = 0.07; g.stroke(); g.fillStyle = P.orange; g.fill();
          g.lineWidth = 0.05;
          D.rr(g, -0.14, -0.32, 0.08, 0.64, 0.02); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
        } else {
          // silueta de fábrica
          g.beginPath();
          g.moveTo(-0.3, 0.25); g.lineTo(-0.3, -0.05); g.lineTo(-0.1, 0.06); g.lineTo(-0.1, -0.05); g.lineTo(0.1, 0.06);
          g.lineTo(0.1, -0.3); g.lineTo(0.24, -0.3); g.lineTo(0.24, 0.25); g.closePath();
          g.fillStyle = z.type === 'ammo_fab' ? P.yellow : '#ffffff'; g.fill(); g.stroke();
        }
      });
    },

    // ---------- El comandante (se dibuja cada fotograma: cambia de pose) ----------
    // face: 0 abajo, 1 derecha, 2 arriba, 3 izquierda. phase: ciclo de andar.
    commander: function (g, x, y, face, phase, moving, stackFn) {
      const bob = moving ? -Math.abs(Math.sin(phase)) * 0.05 : 0;
      const lift = moving ? Math.sin(phase) * 0.06 : 0;
      shadow(g, x, y + 0.02, 0.3, 0.12, 0.28);
      g.lineWidth = 0.05; g.strokeStyle = P.ink;
      // la pila va detrás cuando mira hacia la cámara
      if (face === 0 && stackFn) stackFn(x, y - 0.62 + bob);
      // piernas
      for (const s of [-1, 1]) {
        const ly = (s > 0 ? lift : -lift);
        D.rr(g, x + s * 0.1 - 0.065, y - 0.22 - Math.max(0, ly), 0.13, 0.22, 0.05);
        D.fillStroke(g, '#3a4a24', 0.04);
      }
      const by = y - 0.2 + bob;
      // mochila (se ve de espaldas y de lado)
      if (face === 2) { D.rr(g, x - 0.17, by - 0.4, 0.34, 0.34, 0.06); D.fillStroke(g, P.concD, 0.05); }
      if (face === 1 || face === 3) {
        const bx = face === 1 ? -0.24 : 0.1;
        D.rr(g, x + bx, by - 0.4, 0.14, 0.32, 0.04); D.fillStroke(g, P.concD, 0.05);
      }
      // cuerpo
      D.rr(g, x - 0.2, by - 0.38, 0.4, 0.38, 0.12); D.fillStroke(g, P.olive, 0.05);
      if (face !== 2) {
        g.save(); D.rr(g, x - 0.2, by - 0.38, 0.4, 0.38, 0.12); g.clip();
        g.fillStyle = P.orange;
        g.beginPath(); g.moveTo(x - 0.2, by - 0.3); g.lineTo(x - 0.06, by - 0.38); g.lineTo(x + 0.2, by - 0.06); g.lineTo(x + 0.2, by + 0.04); g.closePath(); g.fill();
        g.restore();
      }
      g.fillStyle = P.ink; g.fillRect(x - 0.2, by - 0.1, 0.4, 0.05);
      // arma
      if (face === 1 || face === 3) {
        const s = face === 1 ? 1 : -1;
        D.rr(g, x + (s > 0 ? 0.02 : -0.4), by - 0.22, 0.38, 0.09, 0.03); D.fillStroke(g, '#2b3135', 0.04);
      } else if (face === 0) {
        D.rr(g, x + 0.12, by - 0.24, 0.09, 0.3, 0.03); D.fillStroke(g, '#2b3135', 0.04);
      }
      // brazos
      g.fillStyle = P.oliveD;
      for (const s of [-1, 1]) { D.ellipse(g, x + s * 0.21, by - 0.22, 0.07, 0.08); g.fill(); g.stroke(); }
      // casco
      const hy = by - 0.52;
      D.ellipse(g, x, hy, 0.21, 0.19); D.fillStroke(g, P.oliveD, 0.05);
      g.fillStyle = P.oliveL; D.ellipse(g, x - 0.06, hy - 0.07, 0.08, 0.05); g.fill();
      g.fillStyle = P.tealL; g.strokeStyle = P.ink; g.lineWidth = 0.035;
      if (face === 0) { D.rr(g, x - 0.13, hy - 0.02, 0.26, 0.1, 0.04); g.fill(); g.stroke(); }
      else if (face === 1) { D.rr(g, x + 0.02, hy - 0.03, 0.18, 0.1, 0.04); g.fill(); g.stroke(); }
      else if (face === 3) { D.rr(g, x - 0.2, hy - 0.03, 0.18, 0.1, 0.04); g.fill(); g.stroke(); }
      if (face !== 0 && stackFn) {
        const sx = face === 1 ? -0.17 : (face === 3 ? 0.17 : 0);
        stackFn(x + sx, by - 0.3);
      }
    },
  };

  // ---------- El sargento Brass: el que habla en los avisos (funcional 12) ----------
  // Retrato de busto con el mismo casco que el comandante (y las gafas turquesa subidas), cascos
  // de radio, bigote, galones y condecoraciones. mood: 'normal' · 'alarm' · 'happy'.
  // open: boca abierta (al hablar se alterna). Anclaje en el centro; el busto acaba abajo (+1.05).
  HB.Art.sergeant = function (mood, open) {
    return V.sprite('sgt:' + mood + ':' + (open ? 1 : 0), 2.2, 2.2, 1.1, 1.1, function (g) {
      const skin = '#e9b48c', skinD = '#c98d66', hair = '#6b5a48', brow = '#4f4033';
      g.lineJoin = 'round'; g.lineCap = 'round';
      // hombros y uniforme
      g.beginPath();
      g.moveTo(-0.96, 1.05); g.quadraticCurveTo(-0.96, 0.44, -0.46, 0.33);
      g.lineTo(0.46, 0.33); g.quadraticCurveTo(0.96, 0.44, 0.96, 1.05); g.closePath();
      D.fillStroke(g, P.olive, LW);
      g.beginPath(); g.moveTo(-0.25, 0.33); g.lineTo(0, 0.6); g.lineTo(0.25, 0.33); g.closePath();
      D.fillStroke(g, P.oliveD, 0.04);
      // galones de sargento: tres uves amarillas en el hombro
      g.strokeStyle = P.yellow; g.lineWidth = 0.055;
      for (let i = 0; i < 3; i++) {
        const y = 0.66 + i * 0.1;   // por debajo del borde del hombro, para que no se salgan
        g.beginPath(); g.moveTo(-0.8, y); g.lineTo(-0.68, y + 0.08); g.lineTo(-0.56, y); g.stroke();
      }
      // condecoraciones: tres pasadores y una medalla
      [['#d8433c', P.yellow], [P.teal, '#ffffff'], [P.orange, P.ink]].forEach(function (c, i) {
        const x = 0.2 + i * 0.17, y = 0.6;
        g.fillStyle = c[0]; g.fillRect(x, y, 0.15, 0.08);
        g.fillStyle = c[1]; g.fillRect(x + 0.06, y, 0.03, 0.08);
        g.lineWidth = 0.02; g.strokeStyle = P.ink; g.strokeRect(x, y, 0.15, 0.08);
      });
      g.fillStyle = '#d8433c'; g.fillRect(0.4, 0.69, 0.09, 0.12);
      g.lineWidth = 0.02; g.strokeStyle = P.ink; g.strokeRect(0.4, 0.69, 0.09, 0.12);
      D.ellipse(g, 0.445, 0.88, 0.08, 0.08); D.fillStroke(g, P.yellow, 0.03);
      D.ellipse(g, 0.425, 0.86, 0.025, 0.025); g.fillStyle = '#fff6c0'; g.fill();
      // cuello y cabeza
      D.rr(g, -0.17, 0.1, 0.34, 0.28, 0.06); D.fillStroke(g, skinD, 0.04);
      // la cabeza, grande (proporciones de juguete)
      g.save(); g.translate(0, 0.02); g.scale(1.24, 1.24);
      D.ellipse(g, 0.43, -0.02, 0.07, 0.1); D.fillStroke(g, skin, 0.04);   // oreja (la otra la tapa el auricular)
      D.ellipse(g, 0, -0.08, 0.42, 0.44); D.fillStroke(g, skin, LW);
      D.ellipse(g, -0.2, 0.12, 0.08, 0.05); g.fillStyle = 'rgba(220,110,90,0.35)'; g.fill();   // mejillas
      D.ellipse(g, 0.2, 0.12, 0.08, 0.05); g.fill();
      // cejas
      g.strokeStyle = brow; g.lineWidth = 0.075;
      for (const s of [-1, 1]) {
        g.beginPath();
        if (mood === 'alarm') { g.moveTo(s * 0.29, -0.21); g.lineTo(s * 0.07, -0.1); }
        else if (mood === 'happy') { g.moveTo(s * 0.28, -0.15); g.quadraticCurveTo(s * 0.18, -0.24, s * 0.07, -0.17); }
        else { g.moveTo(s * 0.28, -0.17); g.lineTo(s * 0.07, -0.13); }
        g.stroke();
      }
      // ojos
      for (const s of [-1, 1]) {
        const ex = s * 0.16, ey = -0.03;
        if (mood === 'happy') {
          g.strokeStyle = P.ink; g.lineWidth = 0.045;
          g.beginPath(); g.arc(ex, ey + 0.03, 0.06, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        } else if (mood === 'alarm') {
          D.ellipse(g, ex, ey, 0.075, 0.08); D.fillStroke(g, '#ffffff', 0.03);
          D.ellipse(g, ex, ey + 0.01, 0.035, 0.04); g.fillStyle = P.ink; g.fill();
        } else {
          D.ellipse(g, ex, ey, 0.045, 0.05); g.fillStyle = P.ink; g.fill();
          D.ellipse(g, ex - 0.015, ey - 0.02, 0.015, 0.015); g.fillStyle = '#ffffff'; g.fill();
        }
      }
      // nariz y boca
      D.ellipse(g, 0, 0.07, 0.065, 0.075); D.fillStroke(g, skinD, 0.035);
      const my = 0.27;
      if (mood === 'happy') {
        g.beginPath(); g.moveTo(-0.14, my - 0.02); g.quadraticCurveTo(0, my + (open ? 0.2 : 0.14), 0.14, my - 0.02); g.closePath();
        D.fillStroke(g, '#ffffff', 0.035);
      } else if (mood === 'alarm' || open) {
        const rx = mood === 'alarm' ? (open ? 0.11 : 0.09) : 0.075, ry = mood === 'alarm' ? (open ? 0.09 : 0.06) : 0.05;
        D.ellipse(g, 0, my + 0.01, rx, ry); D.fillStroke(g, '#5a1f1f', 0.035);
        D.ellipse(g, 0, my + ry * 0.45, rx * 0.6, ry * 0.4); g.fillStyle = '#d8433c'; g.fill();
      } else {
        g.strokeStyle = P.ink; g.lineWidth = 0.04;
        g.beginPath(); g.moveTo(-0.07, my); g.lineTo(0.07, my - 0.01); g.stroke();
      }
      // bigote (lo que más se reconoce a tamaño pequeño)
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(0, 0.14);
        g.quadraticCurveTo(s * 0.1, 0.1, s * 0.26, 0.17);
        g.quadraticCurveTo(s * 0.3, 0.24, s * 0.2, 0.23);
        g.quadraticCurveTo(s * 0.08, 0.2, 0, 0.21);
        g.closePath();
        D.fillStroke(g, hair, 0.035);
      }
      // casco (como el del comandante) con su brillo, y las gafas turquesa subidas
      g.beginPath(); g.ellipse(0, -0.3, 0.52, 0.44, 0, Math.PI, 0); g.closePath();
      D.fillStroke(g, P.oliveD, LW);
      D.rr(g, -0.6, -0.33, 1.2, 0.13, 0.065); D.fillStroke(g, P.oliveD, LW);
      D.ellipse(g, -0.2, -0.56, 0.17, 0.08); g.fillStyle = P.oliveL; g.fill();
      D.rr(g, -0.31, -0.49, 0.62, 0.17, 0.08); D.fillStroke(g, P.tealL, 0.045);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-0.24, -0.46, 0.16, 0.04);
      // galón en el casco
      g.strokeStyle = P.yellow; g.lineWidth = 0.05;
      g.beginPath(); g.moveTo(0.18, -0.63); g.lineTo(0.27, -0.58); g.lineTo(0.36, -0.63); g.stroke();
      // cascos de radio: auricular y micrófono hasta la boca
      D.ellipse(g, -0.44, -0.04, 0.11, 0.15); D.fillStroke(g, '#2b3135', 0.04);
      D.ellipse(g, -0.45, -0.04, 0.05, 0.08); g.fillStyle = P.orange; g.fill();
      g.strokeStyle = '#2b3135'; g.lineWidth = 0.045;
      g.beginPath(); g.moveTo(-0.42, 0.08); g.quadraticCurveTo(-0.36, 0.33, -0.12, 0.32); g.stroke();
      D.ellipse(g, -0.1, 0.32, 0.05, 0.04); g.fillStyle = '#2b3135'; g.fill();
      g.restore();
    });
  };

  // ---------- Cofre de suministros (funcional 13.2): caja militar con correas y cierre dorado ----------
  // open: abierto, con la tapa hacia atrás y el brillo dentro. Anclaje en el centro.
  HB.Art.chest = function (open) {
    return V.sprite('chest:' + (open ? 1 : 0), 2.4, 2.2, 1.2, 1.1, function (g) {
      shadow(g, 0, 0.62, 0.95, 0.18, 0.3);
      // cuerpo
      D.rr(g, -0.85, -0.15, 1.7, 0.8, 0.12); D.fillStroke(g, P.olive, LW);
      g.fillStyle = P.oliveD; g.fillRect(-0.85, 0.42, 1.7, 0.1);
      // correas de peligro
      for (const x of [-0.55, 0.37]) hazard(g, x, -0.15, 0.18, 0.8);
      if (open) {
        // dentro, la luz del premio
        const gr = g.createRadialGradient(0, -0.2, 0, 0, -0.2, 0.9);
        gr.addColorStop(0, '#fff6c0'); gr.addColorStop(0.4, 'rgba(255,210,63,0.8)'); gr.addColorStop(1, 'rgba(255,210,63,0)');
        g.fillStyle = gr; D.ellipse(g, 0, -0.25, 0.9, 0.55); g.fill();
        D.rr(g, -0.8, -0.3, 1.6, 0.2, 0.08); D.fillStroke(g, '#3f4a2a', 0.05);
        // la tapa, echada hacia atrás
        g.beginPath(); g.moveTo(-0.85, -0.32); g.lineTo(0.85, -0.32); g.lineTo(0.72, -0.95); g.lineTo(-0.72, -0.95); g.closePath();
        D.fillStroke(g, P.oliveL, LW);
        for (const x of [-0.5, 0.36]) { g.fillStyle = P.yellow; g.beginPath(); g.moveTo(x, -0.32); g.lineTo(x + 0.16, -0.32); g.lineTo(x + 0.13, -0.95); g.lineTo(x - 0.01, -0.95); g.closePath(); g.fill(); }
      } else {
        // tapa cerrada y abombada, con brillo
        g.beginPath(); g.moveTo(-0.9, -0.12); g.lineTo(-0.9, -0.38); g.quadraticCurveTo(0, -0.78, 0.9, -0.38); g.lineTo(0.9, -0.12); g.closePath();
        D.fillStroke(g, P.oliveL, LW);
        for (const x of [-0.55, 0.37]) { g.save(); g.beginPath(); g.moveTo(-0.9, -0.12); g.lineTo(-0.9, -0.38); g.quadraticCurveTo(0, -0.78, 0.9, -0.38); g.lineTo(0.9, -0.12); g.closePath(); g.clip(); hazard(g, x, -0.8, 0.18, 0.7); g.restore(); }
        g.fillStyle = 'rgba(255,255,255,0.35)'; D.ellipse(g, -0.3, -0.45, 0.28, 0.07); g.fill();
        // cierre dorado
        D.rr(g, -0.17, -0.3, 0.34, 0.36, 0.06); D.fillStroke(g, P.yellow, 0.05);
        D.ellipse(g, 0, -0.1, 0.06, 0.07); g.fillStyle = P.ink; g.fill();
        g.fillRect(-0.02, -0.08, 0.04, 0.1);
      }
      // remaches
      g.fillStyle = P.ink;
      for (const x of [-0.72, 0.72]) for (const y of [0.0, 0.4]) { D.ellipse(g, x, y, 0.035, 0.035); g.fill(); }
    });
  };

  // ---------- Suministro aéreo (funcional 15.3): caja de la flota y su paracaídas ----------
  HB.Art.supplyCrate = function () {
    return V.sprite('supply', 1.4, 1.4, 0.7, 0.9, function (g) {
      D.rr(g, -0.42, -0.5, 0.84, 0.62, 0.08); D.fillStroke(g, '#8a6a3c', LW);
      g.fillStyle = '#a5824c'; g.fillRect(-0.36, -0.44, 0.72, 0.18);
      g.strokeStyle = P.orange; g.lineWidth = 0.09;
      g.beginPath(); g.moveTo(-0.42, -0.19); g.lineTo(0.42, -0.19); g.moveTo(0, -0.5); g.lineTo(0, 0.12); g.stroke();
      D.rr(g, -0.42, -0.5, 0.84, 0.62, 0.08); g.lineWidth = LW; g.strokeStyle = P.ink; g.stroke();
      // la estrella de la flota
      g.fillStyle = '#ffffff'; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.06 : 0.14; g.lineTo(0.22 + Math.cos(a) * r, -0.32 + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.lineWidth = 0.025; g.strokeStyle = P.ink; g.stroke();
    });
  };

  HB.Art.parachute = function () {
    return V.sprite('chute', 1.8, 1.4, 0.9, 1.3, function (g) {
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.03;
      for (const x of [-0.7, -0.25, 0.25, 0.7]) { g.beginPath(); g.moveTo(x, -0.62); g.lineTo(x * 0.35, 0); g.stroke(); }
      g.beginPath(); g.ellipse(0, -0.65, 0.82, 0.55, 0, Math.PI, 0); g.closePath(); D.fillStroke(g, P.orange, 0.05);
      g.save(); g.beginPath(); g.ellipse(0, -0.65, 0.82, 0.55, 0, Math.PI, 0); g.closePath(); g.clip();
      g.fillStyle = '#ffffff'; for (const x of [-0.55, 0.0, 0.55]) g.fillRect(x - 0.12, -1.3, 0.24, 0.7);
      g.restore();
      g.beginPath(); g.ellipse(0, -0.65, 0.82, 0.55, 0, Math.PI, 0); g.closePath(); g.lineWidth = 0.05; g.strokeStyle = P.ink; g.stroke();
    });
  };

  // ---------- Reciclador: un contenedor con las flechas de reciclar (anclaje: centro de la base) ----------
  HB.Art.recycler = function () {
    return V.sprite('recycler', 1.3, 1.4, 0.65, 1.15, function (g) {
      shadow(g, 0.04, 0.04, 0.5, 0.14, 0.28);
      g.beginPath(); g.moveTo(-0.42, -0.62); g.lineTo(0.42, -0.62); g.lineTo(0.36, 0.02); g.lineTo(-0.36, 0.02); g.closePath();
      D.fillStroke(g, '#3f5a3a', LW);
      hazard(g, -0.39, -0.3, 0.78, 0.1);
      D.rr(g, -0.48, -0.74, 0.96, 0.14, 0.05); D.fillStroke(g, '#2f4430', LW);   // borde de la boca
      // flechas de reciclar (tres, en triángulo)
      g.save(); g.translate(0, -0.47); g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 0.045;
      for (let i = 0; i < 3; i++) {
        g.save(); g.rotate(i * Math.PI * 2 / 3);
        g.beginPath(); g.moveTo(-0.08, -0.09); g.lineTo(0.06, -0.09); g.stroke();
        g.beginPath(); g.moveTo(0.1, -0.09); g.lineTo(0.05, -0.13); g.lineTo(0.05, -0.05); g.closePath(); g.fill();
        g.restore();
      }
      g.restore();
    });
  };

  // ---------- Gema (la moneda premium, funcional 5.2): un diamante turquesa con facetas ----------
  HB.Art.gem = function () {
    return V.sprite('gem', 0.7, 0.7, 0.35, 0.35, function (g) {
      g.beginPath(); g.moveTo(-0.26, -0.08); g.lineTo(-0.14, -0.22); g.lineTo(0.14, -0.22); g.lineTo(0.26, -0.08); g.lineTo(0, 0.26); g.closePath();
      D.fillStroke(g, '#4fd2f0', 0.04);
      g.beginPath(); g.moveTo(-0.26, -0.08); g.lineTo(0.26, -0.08); g.lineTo(0, 0.26); g.closePath(); g.fillStyle = '#2a9fd0'; g.fill();
      g.beginPath(); g.moveTo(-0.1, -0.08); g.lineTo(0, 0.26); g.lineTo(0.1, -0.08); g.closePath(); g.fillStyle = '#7fe6ff'; g.fill();
      g.beginPath(); g.moveTo(-0.14, -0.22); g.lineTo(-0.05, -0.08); g.lineTo(0.05, -0.08); g.lineTo(0.14, -0.22); g.closePath(); g.fillStyle = '#c9f6ff'; g.fill();
      g.beginPath(); g.moveTo(-0.26, -0.08); g.lineTo(-0.14, -0.22); g.lineTo(0.14, -0.22); g.lineTo(0.26, -0.08); g.lineTo(0, 0.26); g.closePath();
      g.lineWidth = 0.04; g.strokeStyle = P.ink; g.stroke();
      g.fillStyle = '#ffffff'; g.fillRect(-0.12, -0.18, 0.05, 0.05);
    });
  };

  // Iconos de las zonas de pago de lo nuevo (blanco con contorno, como los demás).
  function icoStyle(g) { g.fillStyle = '#ffffff'; g.strokeStyle = P.ink; g.lineWidth = 0.05; g.lineJoin = 'round'; }
  const ZONE_ICONS = {
    turret: function (g) {
      icoStyle(g);
      D.rr(g, -0.28, 0.06, 0.56, 0.2, 0.05); g.fill(); g.stroke();
      D.ellipse(g, -0.02, 0.02, 0.2, 0.16); g.fill(); g.stroke();
      D.rr(g, 0.08, -0.06, 0.32, 0.08, 0.03); g.fillStyle = P.yellow; g.fill(); g.stroke();
    },
    wall: function (g) {
      icoStyle(g);
      for (let i = 0; i < 3; i++) { D.rr(g, -0.33 + i * 0.22, -0.12, 0.2, 0.3, 0.03); g.fill(); g.stroke(); }
      g.fillStyle = P.yellow; g.fillRect(-0.33, -0.12, 0.64, 0.07);
    },
    drone: function (g) {
      icoStyle(g);
      for (const p of [[-0.22, -0.14], [0.22, -0.14], [-0.22, 0.14], [0.22, 0.14]]) { D.ellipse(g, p[0], p[1], 0.12, 0.06); g.fill(); g.stroke(); }
      D.rr(g, -0.14, -0.08, 0.28, 0.16, 0.05); g.fillStyle = P.tealL; g.fill(); g.stroke();
    },
    nest: function (g) {
      g.strokeStyle = P.ink; g.lineWidth = 0.05;
      D.ellipse(g, 0, 0.05, 0.3, 0.24); g.fillStyle = P.bug; g.fill(); g.stroke();
      g.fillStyle = P.acid;
      for (const p of [[-0.12, 0.02], [0.1, -0.04], [0.02, 0.14]]) { D.ellipse(g, p[0], p[1], 0.06, 0.05); g.fill(); }
      g.beginPath(); g.moveTo(-0.2, -0.12); g.lineTo(-0.26, -0.34); g.lineTo(-0.08, -0.18); g.moveTo(0.2, -0.12); g.lineTo(0.26, -0.34); g.lineTo(0.08, -0.18);
      g.stroke();
    },
    solar: function (g) {
      icoStyle(g);
      g.beginPath(); g.moveTo(-0.24, -0.2); g.lineTo(0.24, -0.2); g.lineTo(0.32, 0.12); g.lineTo(-0.32, 0.12); g.closePath();
      g.fillStyle = '#7fb2ff'; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, -0.2); g.lineTo(0, 0.12); g.moveTo(-0.28, -0.04); g.lineTo(0.28, -0.04); g.stroke();
      D.rr(g, -0.04, 0.12, 0.08, 0.16, 0.02); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
    },
    winder: function (g) {
      g.save(); g.translate(0, 0.2); g.scale(1.55, 1.55); ITEM_ART.coil(g); g.restore();
    },
    dissipator: function (g) {
      icoStyle(g);
      D.rr(g, -0.26, -0.2, 0.52, 0.42, 0.05); g.fill(); g.stroke();
      g.fillStyle = '#5d6b74';
      for (let x = -0.18; x < 0.2; x += 0.12) g.fillRect(x, -0.14, 0.05, 0.3);
      g.fillStyle = P.tealL; g.fillRect(-0.26, 0.14, 0.52, 0.06);
    },
  };

  // Cartel de receta sobre cada máquina: lo que entra ▸ lo que sale (para que se entienda qué hace).
  const RECIPES = {
    smelter: [['ore'], ['plate']],
    ammo_fab: [['plate', 'plate'], ['ammo']],
    winder: [['copper'], ['coil']],
    export: [['ammo', 'plate'], ['$']],
    export_cu: [['ammo', 'coil', 'plate'], ['$']],   // con la Bobinadora, las Bobinas también se venden
    solar: [['bolt'], ['+5']],
    dissipator: [['heat'], ['-2']],
  };
  HB.Art.recipe = function (type) {
    const r = RECIPES[type];
    if (!r) return null;
    const n = r[0].length + r[1].length;
    const w = 0.5 + n * 0.42 + 0.3;
    return V.sprite('recipe:' + type, w + 0.1, 0.62, (w + 0.1) / 2, 0.31, function (g) {
      D.rr(g, -w / 2, -0.26, w, 0.52, 0.26);
      g.fillStyle = 'rgba(20,24,28,0.82)'; g.fill();
      g.lineWidth = 0.035; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
      let x = -w / 2 + 0.33;
      const draw = function (it) {
        if (ITEM_ART[it]) { g.save(); g.translate(x, 0.09); g.scale(0.85, 0.85); ITEM_ART[it](g); g.restore(); }
        else if (it === '$') { D.ellipse(g, x, 0, 0.15, 0.15); D.fillStroke(g, P.cash, 0.03); spriteText(g, '$', x, 0.01, 0.2, '#ffffff', P.cashD); }
        else if (it === 'heat') {
          g.beginPath(); g.moveTo(x, -0.2); g.quadraticCurveTo(x + 0.17, -0.02, x + 0.1, 0.12); g.quadraticCurveTo(x, 0.2, x - 0.1, 0.12);
          g.quadraticCurveTo(x - 0.15, 0.0, x, -0.2); g.closePath(); D.fillStroke(g, P.orange, 0.03);
          g.beginPath(); g.moveTo(x, -0.05); g.quadraticCurveTo(x + 0.07, 0.05, x + 0.03, 0.12); g.lineTo(x - 0.04, 0.12); g.quadraticCurveTo(x - 0.06, 0.04, x, -0.05); g.fillStyle = P.yellow; g.fill();
        } else if (it === 'bolt') {
          g.beginPath(); g.moveTo(x + 0.05, -0.2); g.lineTo(x - 0.1, 0.03); g.lineTo(x, 0.03); g.lineTo(x - 0.05, 0.2); g.lineTo(x + 0.11, -0.04); g.lineTo(x + 0.01, -0.04); g.closePath();
          D.fillStroke(g, P.yellow, 0.03);
        }
        else spriteText(g, it, x, 0.02, 0.26, it.charAt(0) === '-' ? P.tealL : P.yellow, P.ink);
        x += 0.42;
      };
      for (const it of r[0]) draw(it);
      // flecha
      g.fillStyle = '#ffffff';
      g.beginPath(); g.moveTo(x - 0.12, -0.08); g.lineTo(x + 0.04, 0); g.lineTo(x - 0.12, 0.08); g.closePath(); g.fill();
      x += 0.3;
      for (const it of r[1]) draw(it);
    });
  };

  // Dónde está el tambor de la Bobinadora (respecto al tejado): lo usa también 70_render.js.
  const WINDER = { cx: 0.25, cy: -0.5, len: 0.95, r: 0.34 };
  HB.Art.WINDER = WINDER;

  function levelPips(g, flip, lvl, x, y) {
    // Puntitos de nivel en la fachada (1, 2 o 3). Se dibujan sin voltear.
    g.save();
    if (flip) { g.scale(-1, 1); x = -x - 0.4; }
    for (let i = 0; i < 3; i++) {
      D.ellipse(g, x + i * 0.17, y, 0.06, 0.06);
      g.fillStyle = i < lvl ? P.yellow : 'rgba(28,33,38,0.45)'; g.fill();
      g.lineWidth = 0.025; g.strokeStyle = P.ink; g.stroke();
    }
    g.restore();
  }
})(globalThis.HB);
