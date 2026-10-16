// Hive Breaker — arte de la defensa y del enjambre, dibujado con código: torretas, muros, drones,
// bichos, el Nido, escombros. Igual que 65_art.js: cada dibujo se guarda en caché y se copia.
//
// Bichos (funcional 19): violeta y rosa ácido, con puntos débiles que brillan. Amenazantes pero
// no repulsivos: nada de vísceras. Se dibujan mirando a la derecha y se giran al pintarlos.
(function (HB) {
  'use strict';

  const P = HB.PAL, D = HB.Draw, V = HB.View, A = HB.Art;
  const LW = 0.06;

  function shadow(g, x, y, rx, ry, a) {
    g.fillStyle = 'rgba(40,25,10,' + (a || 0.22) + ')';
    D.ellipse(g, x, y, rx, ry); g.fill();
  }

  function hazardBand(g, x, y, w, h) {
    g.save(); D.rr(g, x, y, w, h, 0.02); g.clip();
    g.fillStyle = P.yellow; g.fillRect(x, y, w, h);
    g.fillStyle = P.ink;
    for (let i = -2; i < w / 0.2 + 2; i++) {
      const sx = x + i * 0.2;
      g.beginPath(); g.moveTo(sx, y + h); g.lineTo(sx + 0.1, y + h); g.lineTo(sx + 0.1 + h, y); g.lineTo(sx + h, y); g.closePath(); g.fill();
    }
    g.restore();
  }

  function oct(g, r, ry, cy) {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + i * Math.PI / 4;
      const x = Math.cos(a) * r, y = cy + Math.sin(a) * ry;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath();
  }

  // ---------- Torretas ----------
  A.turretBase = function () {
    return V.sprite('tbase', 1.8, 1.6, 0.9, 0.85, function (g) {
      shadow(g, 0.08, 0.5, 0.72, 0.22, 0.3);
      oct(g, 0.68, 0.5, 0.22); D.fillStroke(g, P.concD, LW);
      oct(g, 0.68, 0.5, 0.05); D.fillStroke(g, P.conc, LW);
      g.save(); oct(g, 0.68, 0.5, 0.05); g.clip();
      g.lineWidth = 0.1; g.strokeStyle = P.yellow; g.setLineDash([0.16, 0.14]);
      D.ellipse(g, 0, 0.05, 0.6, 0.43); g.stroke(); g.setLineDash([]);
      g.restore();
      g.fillStyle = P.ink;
      for (const p of [[-0.45, 0.05], [0.45, 0.05], [0, -0.3], [0, 0.4]]) { D.ellipse(g, p[0], p[1], 0.04, 0.03); g.fill(); }
    });
  };

  // Cabeza de la torreta, mirando a la derecha (se gira hacia el objetivo).
  A.turretHead = function (type) {
    return V.sprite('thead:' + type, 1.6, 1.2, 0.6, 0.6, function (g) {
      if (type === 'cannon') {
        D.rr(g, 0.15, -0.13, 0.62, 0.26, 0.06); D.fillStroke(g, '#3a454b', LW);
        D.rr(g, 0.66, -0.17, 0.16, 0.34, 0.04); D.fillStroke(g, '#2b3135', LW);
        D.ellipse(g, 0, 0, 0.4, 0.36); D.fillStroke(g, P.oliveD, LW);
        D.ellipse(g, -0.06, -0.06, 0.26, 0.22); g.fillStyle = P.olive; g.fill();
        g.fillStyle = P.orange; g.fillRect(-0.32, -0.04, 0.12, 0.08);
      } else {
        for (const oy of [-0.09, 0, 0.09]) { D.rr(g, 0.15, oy - 0.035, 0.52, 0.07, 0.02); D.fillStroke(g, '#2b3135', 0.035); }
        D.rr(g, 0.55, -0.14, 0.08, 0.28, 0.02); D.fillStroke(g, '#4a545b', 0.035);
        D.ellipse(g, 0, 0, 0.32, 0.28); D.fillStroke(g, P.olive, LW);
        D.ellipse(g, -0.05, -0.06, 0.18, 0.13); g.fillStyle = P.oliveL; g.fill();
        D.rr(g, 0.04, -0.05, 0.18, 0.1, 0.03); g.fillStyle = P.tealL; g.fill(); g.lineWidth = 0.03; g.strokeStyle = P.ink; g.stroke();
      }
    });
  };

  // ---------- Muros: barreras de hormigón con franja de peligro ----------
  A.wall = function (len) {
    const z = HB.MACHINES.wall.z, h = HB.MACHINES.wall.h;
    return V.sprite('wall:' + len.toFixed(2), len + 0.4, z + h + 0.6, (len + 0.4) / 2, z + 0.45, function (g) {
      const x0 = -len / 2, fy = h / 2;
      shadow(g, 0.08, fy + 0.04, len / 2 + 0.1, 0.16, 0.3);
      const n = Math.max(1, Math.round(len));
      const seg = len / n;
      for (let i = 0; i < n; i++) {
        const sx = x0 + i * seg + 0.02, sw = seg - 0.04;
        D.rr(g, sx, fy - z, sw, z, 0.06); D.fillStroke(g, P.conc, LW);
        D.rr(g, sx + 0.04, fy - z - h * 0.7, sw - 0.08, h * 0.7 + 0.02, 0.06); D.fillStroke(g, P.concL, LW);
        hazardBand(g, sx + 0.06, fy - z + 0.12, sw - 0.12, 0.12);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(sx + 0.06, fy - 0.16, sw - 0.12, 0.08);
      }
    });
  };

  // ---------- Base de drones y dron ----------
  A.dronePad = function () {
    return V.sprite('dpad', 1.6, 1.4, 0.8, 0.7, function (g) {
      D.ellipse(g, 0, 0.04, 0.66, 0.54); D.fillStroke(g, '#3f494e', LW);
      D.ellipse(g, 0, 0, 0.6, 0.48); g.fillStyle = '#56626a'; g.fill();
      g.lineWidth = 0.07; g.strokeStyle = P.yellow; D.ellipse(g, 0, 0, 0.5, 0.39); g.stroke();
      A.spriteText(g, 'H', 0, 0.02, 0.5, '#ffffff', P.ink);
      g.fillStyle = P.tealL;
      for (const a of [0.6, 2.2, 3.8, 5.4]) { D.ellipse(g, Math.cos(a) * 0.58, Math.sin(a) * 0.45, 0.05, 0.04); g.fill(); }
    });
  };

  A.drone = function () {
    return V.sprite('drone', 1.0, 0.8, 0.5, 0.4, function (g) {
      g.strokeStyle = P.ink; g.lineWidth = 0.05;
      for (const p of [[-0.24, -0.16], [0.24, -0.16], [-0.24, 0.16], [0.24, 0.16]]) {
        g.beginPath(); g.moveTo(0, 0); g.lineTo(p[0], p[1]); g.stroke();
        D.ellipse(g, p[0], p[1], 0.06, 0.05); g.fillStyle = '#2b3135'; g.fill();
      }
      D.rr(g, -0.17, -0.11, 0.34, 0.22, 0.07); D.fillStroke(g, P.teal, 0.05);
      D.rr(g, -0.1, -0.07, 0.2, 0.08, 0.03); g.fillStyle = P.tealL; g.fill();
      D.ellipse(g, 0.11, 0.05, 0.035, 0.035); g.fillStyle = P.orange; g.fill();
    });
  };

  // ---------- Bichos ----------
  function legs(g, n, x0, x1, len, spread, frame, w) {
    g.strokeStyle = '#2a1238'; g.lineWidth = w || 0.045; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const x = HB.lerp(x0, x1, t);
      const sw = ((i + frame) % 2 ? 1 : -1) * 0.12;
      for (const s of [-1, 1]) {
        const ang = (t - 0.5) * spread + sw * s;
        g.beginPath();
        g.moveTo(x, 0);
        const kx = x + Math.sin(ang) * len * 0.45, ky = s * len * 0.6;
        g.lineTo(kx, ky);
        g.lineTo(kx + Math.sin(ang) * len * 0.5, s * len * 1.0);
        g.stroke();
      }
    }
  }

  function spots(g, list, col) {
    for (const p of list) {
      D.ellipse(g, p[0], p[1], p[2], p[2] * 0.85); g.fillStyle = col || P.acid; g.fill();
      D.ellipse(g, p[0] - p[2] * 0.3, p[1] - p[2] * 0.3, p[2] * 0.35, p[2] * 0.3); g.fillStyle = '#ffd1ea'; g.fill();
    }
  }

  const BUG_ART = {
    swarmer: function (g, f, gold) {
      const body = gold ? '#f2c14e' : P.bug, dark = gold ? '#b8862a' : '#5e2391';
      legs(g, 3, -0.04, 0.12, 0.26, 1.4, f);
      D.ellipse(g, -0.13, 0, 0.21, 0.16); D.fillStroke(g, body, 0.045);
      D.ellipse(g, -0.15, -0.04, 0.12, 0.06); g.fillStyle = gold ? '#fff2b0' : '#b066e8'; g.fill();
      D.ellipse(g, 0.08, 0, 0.11, 0.1); D.fillStroke(g, dark, 0.045);
      D.ellipse(g, 0.2, 0, 0.08, 0.075); D.fillStroke(g, dark, 0.045);
      g.strokeStyle = '#2a1238'; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(0.26, -0.04); g.lineTo(0.34, -0.07); g.moveTo(0.26, 0.04); g.lineTo(0.34, 0.07); g.stroke();
      spots(g, [[-0.2, 0.05, 0.045], [-0.07, 0.07, 0.035], [0.22, -0.03, 0.025]], gold ? '#ffffff' : P.acid);
    },
    leaper: function (g, f) {
      // patas traseras grandes (salta muros)
      g.strokeStyle = '#2a1238'; g.lineWidth = 0.06; g.lineCap = 'round';
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(-0.02, s * 0.05); g.lineTo(-0.3, s * (0.3 + f * 0.03)); g.lineTo(-0.42, s * 0.12); g.stroke();
      }
      legs(g, 2, 0.08, 0.18, 0.22, 1.0, f);
      D.ellipse(g, -0.12, 0, 0.24, 0.12); D.fillStroke(g, '#a23fbf', 0.045);
      D.ellipse(g, -0.14, -0.03, 0.14, 0.05); g.fillStyle = '#d27ff0'; g.fill();
      D.ellipse(g, 0.12, 0, 0.1, 0.085); D.fillStroke(g, '#6d2490', 0.045);
      D.ellipse(g, 0.24, 0, 0.075, 0.065); D.fillStroke(g, '#6d2490', 0.045);
      spots(g, [[-0.22, 0.03, 0.04], [0.25, -0.02, 0.025]]);
    },
    crusher: function (g, f) {
      legs(g, 3, -0.18, 0.18, 0.44, 1.2, f, 0.08);
      D.ellipse(g, -0.05, 0, 0.46, 0.38); D.fillStroke(g, '#4f2479', LW);
      // placas del caparazón con costuras brillantes
      g.strokeStyle = P.acid; g.lineWidth = 0.04;
      for (const x of [-0.25, -0.02, 0.2]) { g.beginPath(); g.ellipse(x, 0, 0.12, 0.33, 0, -1.2, 1.2); g.stroke(); }
      D.ellipse(g, -0.12, -0.12, 0.22, 0.1); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill();
      D.ellipse(g, 0.42, 0, 0.16, 0.15); D.fillStroke(g, '#3a1a5c', LW);
      g.fillStyle = '#e9e2f0'; g.strokeStyle = P.ink; g.lineWidth = 0.035;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0.5, s * 0.06); g.lineTo(0.68, s * 0.2); g.lineTo(0.52, s * 0.14); g.closePath(); g.fill(); g.stroke(); }
      spots(g, [[0.46, -0.05, 0.035], [0.46, 0.05, 0.035]]);
    },
    brood: function (g, f) {
      legs(g, 4, -0.4, 0.45, 0.9, 1.4, f, 0.11);
      D.ellipse(g, -0.35, 0, 0.95, 0.72); D.fillStroke(g, '#6a2c9e', 0.08);
      D.ellipse(g, -0.5, -0.2, 0.5, 0.22); g.fillStyle = '#9a52d6'; g.fill();
      spots(g, [[-0.8, 0.12, 0.13], [-0.45, 0.32, 0.11], [-0.2, 0.05, 0.14], [-0.6, -0.25, 0.1], [0.0, 0.3, 0.09]]);
      D.ellipse(g, 0.55, 0, 0.36, 0.32); D.fillStroke(g, '#4b1f74', 0.08);
      D.ellipse(g, 0.95, 0, 0.24, 0.22); D.fillStroke(g, '#3a1a5c', 0.08);
      // corona de púas
      g.fillStyle = '#efe6f7'; g.strokeStyle = P.ink; g.lineWidth = 0.04;
      for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) {
        const x = 0.55 + Math.cos(a + Math.PI) * 0.05, y = Math.sin(a) * 0.3;
        g.beginPath(); g.moveTo(x - 0.06, y - 0.05); g.lineTo(x - 0.32, y * 1.5); g.lineTo(x + 0.06, y + 0.05); g.closePath(); g.fill(); g.stroke();
      }
      spots(g, [[1.04, -0.1, 0.05], [1.04, 0.1, 0.05]]);
    },
  };

  // Tamaño del dibujo de cada bicho (casillas) y fotogramas de patas (0 y 1).
  A.bug = function (type, frame) {
    const r = HB.ENEMIES[type].r;
    const s = type === 'brood' ? 3.0 : Math.max(0.9, r * 3.2);
    return V.sprite('bug:' + type + ':' + frame, s, s, s / 2, s / 2, function (g) {
      if (type === 'gilded') BUG_ART.swarmer(g, frame, true);
      else BUG_ART[type](g, frame);
    });
  };

  A.bugShadow = function () {
    return V.sprite('bugsh', 1, 0.6, 0.5, 0.3, function (g) { g.fillStyle = 'rgba(30,10,40,0.3)'; D.ellipse(g, 0, 0, 0.45, 0.22); g.fill(); });
  };

  // ---------- El Nido (al sur): montículo orgánico con agujeros que brillan ----------
  A.nest = function (broken) {
    return V.sprite('nest:' + (broken ? 1 : 0), 4.4, 3.4, 2.2, 2.2, function (g) {
      shadow(g, 0, 0.9, 2.0, 0.5, 0.35);
      g.fillStyle = broken ? '#3a2f36' : '#3b1d4f';
      D.ellipse(g, 0, 0.55, 1.95, 0.75); g.fill();
      const blobs = [[-1.1, 0.2, 0.75, 0.6], [1.05, 0.25, 0.7, 0.55], [0, -0.2, 1.1, 0.95], [-0.45, 0.45, 0.7, 0.5], [0.55, 0.5, 0.75, 0.5]];
      for (const b of blobs) {
        D.ellipse(g, b[0], b[1], b[2], b[3]);
        D.fillStroke(g, broken ? '#55474f' : '#5e2a86', LW);
      }
      D.ellipse(g, -0.25, -0.55, 0.45, 0.25); g.fillStyle = broken ? '#6b5d66' : '#8a45c2'; g.fill();
      if (!broken) {
        for (const h of [[-0.9, 0.35, 0.22], [0.1, -0.05, 0.3], [0.85, 0.4, 0.2], [-0.2, 0.6, 0.16], [0.5, -0.45, 0.14]]) {
          const gr = g.createRadialGradient(h[0], h[1], 0, h[0], h[1], h[2] * 1.6);
          gr.addColorStop(0, '#ffe0f0'); gr.addColorStop(0.35, P.acid); gr.addColorStop(1, 'rgba(255,79,163,0)');
          g.fillStyle = gr; D.ellipse(g, h[0], h[1], h[2] * 1.6, h[2] * 1.2); g.fill();
          D.ellipse(g, h[0], h[1], h[2] * 0.6, h[2] * 0.45); g.fillStyle = '#1a0a24'; g.fill();
        }
        g.fillStyle = '#efe6f7'; g.strokeStyle = P.ink; g.lineWidth = 0.04;
        for (const sp of [[-1.4, -0.1, -0.5], [1.4, -0.05, 0.5], [-0.3, -1.05, -0.2], [0.45, -0.95, 0.25]]) {
          g.beginPath(); g.moveTo(sp[0] - 0.1, sp[1] + 0.1); g.lineTo(sp[0] + sp[2], sp[1] - 0.5); g.lineTo(sp[0] + 0.1, sp[1] + 0.1); g.closePath(); g.fill(); g.stroke();
        }
      }
    });
  };

  // ---------- Escombro de un edificio roto (se reconstruye con placas) ----------
  A.rubble = function (w, h) {
    return V.sprite('rubble:' + w.toFixed(1) + ':' + h.toFixed(1), w + 0.6, h + 0.8, (w + 0.6) / 2, (h + 0.8) / 2 + 0.1, function (g) {
      shadow(g, 0, h / 2 - 0.05, w / 2 + 0.1, 0.2, 0.3);
      let seed = Math.round(w * 13 + h * 7);
      const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 14; i++) {
        const x = (rnd() - 0.5) * w * 0.9, y = (rnd() - 0.5) * h * 0.7, s = 0.12 + rnd() * 0.2;
        g.beginPath(); g.moveTo(x - s, y + s * 0.4); g.lineTo(x - s * 0.3, y - s * 0.6); g.lineTo(x + s * 0.8, y - s * 0.3); g.lineTo(x + s, y + s * 0.5); g.closePath();
        D.fillStroke(g, rnd() < 0.5 ? P.concD : '#5b6670', 0.04);
      }
      g.strokeStyle = '#3a2a1c'; g.lineWidth = 0.08;
      g.beginPath(); g.moveTo(-w * 0.3, h * 0.1); g.lineTo(w * 0.15, -h * 0.35); g.stroke();
      g.strokeStyle = P.orange; g.lineWidth = 0.04;
      g.beginPath(); g.moveTo(w * 0.1, h * 0.15); g.lineTo(w * 0.35, -h * 0.1); g.stroke();
    });
  };

  // Botín en el suelo: un billete con brillo.
  A.lootGlow = function () {
    return V.sprite('lootglow', 1, 1, 0.5, 0.5, function (g) {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.5);
      gr.addColorStop(0, 'rgba(155,232,168,0.9)'); gr.addColorStop(1, 'rgba(155,232,168,0)');
      g.fillStyle = gr; g.fillRect(-0.5, -0.5, 1, 1);
    });
  };

  // Viñeta de la noche (bordes rojos que laten) en píxeles de pantalla: se rehace al cambiar de tamaño.
  // Se hornea a los píxeles reales de la pantalla y se pinta con V.stamp, 1:1 (antes iba a un
  // cuarto de resolución y se reescalaba entero en cada fotograma de noche: lección 07 de CORE).
  A.vignette = function (w, h) {
    const key = 'vig:' + Math.round(w) + 'x' + Math.round(h);
    let c = V.cache[key];
    if (c) return c;
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * V.dpr)); c.height = Math.max(1, Math.round(h * V.dpr));
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.72);
    gr.addColorStop(0, 'rgba(160,0,40,0)'); gr.addColorStop(1, 'rgba(190,10,50,0.75)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    V.cache[key] = c;
    return c;
  };
})(globalThis.HB);
