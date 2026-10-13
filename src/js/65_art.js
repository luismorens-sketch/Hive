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

    // ---------- Veta ----------
    vein: function () {
      return V.sprite('vein', 1.5, 1.5, 0.75, 1.0, function (g) {
        shadow(g, 0.05, 0.34, 0.6, 0.14, 0.25);
        // roca base
        g.beginPath();
        g.moveTo(-0.62, 0.35); g.lineTo(-0.55, 0.0); g.lineTo(-0.3, -0.18); g.lineTo(0.25, -0.2);
        g.lineTo(0.58, 0.02); g.lineTo(0.62, 0.35); g.closePath();
        D.fillStroke(g, '#6b6f78', LW);
        g.beginPath(); g.moveTo(-0.5, 0.05); g.lineTo(-0.28, -0.12); g.lineTo(0.2, -0.14); g.lineTo(0.0, 0.08); g.closePath();
        g.fillStyle = '#868b94'; g.fill();
        // cristales
        const cr = [[-0.28, 0.12, 0.17, 0.55], [0.05, 0.1, 0.22, 0.78], [0.33, 0.16, 0.15, 0.45]];
        for (const c of cr) {
          const x = c[0], y = c[1], w = c[2], h = c[3];
          g.beginPath();
          g.moveTo(x - w, y); g.lineTo(x - w * 0.8, y - h * 0.8); g.lineTo(x, y - h); g.lineTo(x + w * 0.8, y - h * 0.8);
          g.lineTo(x + w, y); g.closePath();
          D.fillStroke(g, P.ore, LW);
          g.beginPath(); g.moveTo(x - w * 0.8, y - h * 0.8); g.lineTo(x, y - h); g.lineTo(x, y); g.lineTo(x - w * 0.6, y);
          g.closePath(); g.fillStyle = P.oreL; g.fill();
          g.fillStyle = P.glint; g.fillRect(x - w * 0.35, y - h * 0.7, w * 0.22, h * 0.18);
        }
      });
    },

    // ---------- Fundición ----------
    smelter: function (flip, lvl) {
      const m = HB.MACHINES.smelter, w = m.w, h = m.h, z = m.z;
      return V.sprite('smelter:' + (flip ? 1 : 0) + ':' + lvl, w + 1.2, z + h * 0.75 + 2.0, (w + 1.2) / 2, z + h * 0.75 + 1.4 - h / 2, function (g) {
        if (flip) g.scale(-1, 1);
        const fy = h / 2;
        shadow(g, 0.15, fy + 0.02, w / 2 + 0.3, 0.28, 0.25);
        D.rr(g, -w / 2 - 0.1, fy - 0.3, w + 0.2, 0.36, 0.06); D.fillStroke(g, P.conc, LW);
        D.box(g, 0, fy - 0.12, w - 0.1, h, z, P.oliveL, P.olive, LW);
        const top = fy - 0.12 - z;
        hazard(g, -w / 2 + 0.12, fy - 0.36, w - 0.34, 0.16);
        // boca del horno
        D.rr(g, -0.42, top + 0.2, 0.84, 0.5, 0.12); D.fillStroke(g, '#2a1a10', LW);
        const gr = g.createLinearGradient(0, top + 0.25, 0, top + 0.68);
        gr.addColorStop(0, '#ffe08a'); gr.addColorStop(0.5, P.orange); gr.addColorStop(1, '#c2410c');
        D.rr(g, -0.34, top + 0.28, 0.68, 0.36, 0.08); g.fillStyle = gr; g.fill();
        // tolva de entrada (lado izquierdo del tejado)
        g.beginPath();
        g.moveTo(-w / 2 + 0.05, top - 0.95); g.lineTo(-w / 2 + 0.85, top - 0.95); g.lineTo(-w / 2 + 0.75, top - 0.3); g.lineTo(-w / 2 + 0.15, top - 0.3);
        g.closePath(); D.fillStroke(g, P.steelD, LW);
        g.fillStyle = '#4f5a60'; g.fillRect(-w / 2 + 0.14, top - 0.9, 0.62, 0.14);
        // chimenea
        D.rr(g, 0.38, top - 1.25, 0.42, 0.95, 0.06); D.fillStroke(g, P.teal, LW);
        D.ellipse(g, 0.59, top - 1.25, 0.21, 0.08); D.fillStroke(g, '#24302f', LW);
        g.fillStyle = P.tealL; g.fillRect(0.44, top - 1.1, 0.07, 0.7);
        // franja turquesa y remaches
        g.fillStyle = P.teal; g.fillRect(-w / 2 + 0.08, top + 0.02, w - 0.26, 0.07);
        g.fillStyle = P.ink;
        for (const rx of [-w / 2 + 0.2, w / 2 - 0.3]) { D.ellipse(g, rx, top + 0.85, 0.035, 0.035); g.fill(); }
        // conducto de salida
        g.beginPath(); g.moveTo(w / 2 - 0.12, fy - 0.75); g.lineTo(w / 2 + 0.42, fy - 0.45); g.lineTo(w / 2 + 0.42, fy - 0.25); g.lineTo(w / 2 - 0.12, fy - 0.5); g.closePath();
        D.fillStroke(g, P.steelD, LW);
        levelPips(g, flip, lvl, w / 2 - 0.55, fy - 0.62);
      });
    },

    // ---------- Fábrica de munición ----------
    ammo_fab: function (flip, lvl) {
      const m = HB.MACHINES.ammo_fab, w = m.w, h = m.h, z = m.z;
      return V.sprite('ammo:' + (flip ? 1 : 0) + ':' + lvl, w + 1.2, z + h * 0.75 + 2.0, (w + 1.2) / 2, z + h * 0.75 + 1.4 - h / 2, function (g) {
        if (flip) g.scale(-1, 1);
        const fy = h / 2;
        shadow(g, 0.15, fy + 0.02, w / 2 + 0.3, 0.28, 0.25);
        D.rr(g, -w / 2 - 0.1, fy - 0.3, w + 0.2, 0.36, 0.06); D.fillStroke(g, P.conc, LW);
        D.box(g, 0, fy - 0.12, w - 0.1, h, z, P.tealL, P.teal, LW);
        const top = fy - 0.12 - z;
        g.fillStyle = P.yellow; g.fillRect(-w / 2 + 0.06, top + 0.12, w - 0.22, 0.12);
        g.strokeStyle = P.ink; g.lineWidth = 0.03; g.strokeRect(-w / 2 + 0.06, top + 0.12, w - 0.22, 0.12);
        // tres balas
        for (let i = 0; i < 3; i++) {
          const bx = -0.32 + i * 0.3, by = top + 0.42;
          D.rr(g, bx - 0.08, by, 0.16, 0.45, 0.03); D.fillStroke(g, '#d9a33a', 0.035);
          g.beginPath(); g.moveTo(bx - 0.08, by + 0.02); g.quadraticCurveTo(bx, by - 0.22, bx + 0.08, by + 0.02); g.closePath();
          D.fillStroke(g, '#b8743a', 0.035);
        }
        // tolva
        g.beginPath();
        g.moveTo(-w / 2 + 0.05, top - 0.95); g.lineTo(-w / 2 + 0.85, top - 0.95); g.lineTo(-w / 2 + 0.75, top - 0.3); g.lineTo(-w / 2 + 0.15, top - 0.3);
        g.closePath(); D.fillStroke(g, P.steelD, LW);
        g.fillStyle = '#4f5a60'; g.fillRect(-w / 2 + 0.14, top - 0.9, 0.62, 0.14);
        // prensa en el tejado
        D.rr(g, 0.25, top - 1.0, 0.6, 0.7, 0.08); D.fillStroke(g, P.oliveD, LW);
        D.rr(g, 0.33, top - 0.92, 0.44, 0.16, 0.04); D.fillStroke(g, P.orange, 0.03);
        D.ellipse(g, w / 2 - 0.25, top + 0.08, 0.07, 0.07); D.fillStroke(g, P.orangeL, 0.03);
        levelPips(g, flip, lvl, w / 2 - 0.55, fy - 0.62);
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
        const col = kind === 'in' ? 'rgba(255,210,63,' : (kind === 'out' ? 'rgba(39,179,164,' : 'rgba(79,199,104,');
        const solid = kind === 'in' ? P.yellow : (kind === 'out' ? P.tealL : P.cashL);
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
      const key = z.kind === 'machine' ? 'm:' + z.type : z.kind;
      return V.sprite('zicon:' + key, 1.0, 1.0, 0.5, 0.5, function (g) {
        g.fillStyle = '#ffffff'; g.strokeStyle = P.ink; g.lineWidth = 0.05;
        if (z.kind === 'vein') {
          g.save(); g.translate(0, 0.14); g.scale(1.4, 1.4); ITEM_ART.ore(g); g.restore();
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
