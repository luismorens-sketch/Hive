// Hive Breaker — la vista: canvas, escala, cámara, colores y caché de dibujos.
//
// Todo el mundo del juego se dibuja en CASILLAS: View.world() pone la transformación para que
// 1 unidad = 1 casilla. El HUD se dibuja en píxeles de pantalla con View.screen().
// Regla de rendimiento (pilar 9): nada de shadowBlur ni filtros; lo que no se mueve se dibuja una
// vez en un canvas aparte (View.sprite) y luego solo se copia.
(function (HB) {
  'use strict';

  // Paleta "militar de juguete" (funcional 19): humanos oliva y turquesa con naranja de
  // seguridad; bichos violeta y rosa ácido; contorno oscuro y grueso.
  HB.PAL = {
    ink: '#1c2126',
    olive: '#6f9440', oliveL: '#93bb57', oliveD: '#4c6a2a',
    teal: '#27b3a4', tealL: '#64dccd', tealD: '#1a7d73',
    orange: '#ff8a1f', orangeL: '#ffb45a',
    yellow: '#ffd23f', amber: '#ffb020',
    sand: '#d8b679', sandL: '#e6c890', sandD: '#c09a5d', crack: '#a8834c',
    conc: '#a3abae', concL: '#c3cacc', concD: '#737c80',
    steel: '#d5dee2', steelD: '#93a3aa',
    ore: '#7d93ab', oreL: '#b2c7dc', oreD: '#506279', glint: '#9fe3ff',
    cash: '#4fc768', cashL: '#9be8a8', cashD: '#2c8a43',
    bug: '#8e3fd0', acid: '#ff4fa3',
    fog: '#191d23',
    white: '#ffffff',
    hud: 'rgba(20,24,28,0.82)',
  };

  const V = HB.View = {
    cv: null, ctx: null,
    dpr: 1, cssW: 1, cssH: 1,
    gx: 0, gw: 1, gh: 1,      // zona de juego (columna vertical centrada en pantallas anchas)
    tile: 40,                 // píxeles CSS por casilla
    S: 40,                    // píxeles reales por casilla
    cam: { x: 6, y: 28, shake: 0, shakeT: 0, ox: 0, oy: 0 },
    cache: {},
    fontsReady: false,
    gen: 0,                   // sube cada vez que hay que rehacer los dibujos en caché
  };

  V.init = function (canvas) {
    V.cv = canvas;
    V.ctx = canvas.getContext('2d', { alpha: false });
    V.resize();
  };

  V.resize = function () {
    const box = V.cv.parentElement.getBoundingClientRect();
    V.cssW = Math.max(1, Math.round(box.width));
    V.cssH = Math.max(1, Math.round(box.height));
    // Más de 2× no se nota en un móvil y cuesta memoria y tiempo (lecciones de CORE).
    V.dpr = Math.min(window.devicePixelRatio || 1, 2);
    V.cv.width = Math.round(V.cssW * V.dpr);
    V.cv.height = Math.round(V.cssH * V.dpr);
    V.cv.style.width = V.cssW + 'px';
    V.cv.style.height = V.cssH + 'px';
    // La casilla se elige para llenar el ancho del móvil (10 casillas) sin bajar de viewMinH
    // casillas a lo alto: en una pantalla baja (el visor de Claude en el iPhone) caben más
    // casillas a lo ancho, hasta el ancho entero del mapa. Solo si la pantalla es más ancha que
    // el mapa entero (ordenador, móvil en horizontal) queda una columna en el centro.
    V.gh = V.cssH;
    V.tile = Math.min(V.cssW / HB.CONFIG.viewTiles, V.cssH / HB.CONFIG.viewMinH);
    let mapW = HB.CONFIG.viewTiles;
    for (const k in HB.REGIONS) mapW = Math.max(mapW, HB.REGIONS[k].w);
    V.gw = Math.min(V.cssW, Math.round(mapW * V.tile));
    V.gx = Math.round((V.cssW - V.gw) / 2);
    V.S = V.tile * V.dpr;
    V.cache = {};
    V.gen++;
  };

  // Tamaño visible del mundo en casillas.
  V.viewW = function () { return V.gw / V.tile; };
  V.viewH = function () { return V.gh / V.tile; };

  V.world = function () {
    const c = V.cam, S = V.S, d = V.dpr;
    V.ctx.setTransform(S, 0, 0, S,
      d * (V.gx + V.gw / 2 + c.ox) - c.x * S,
      d * (V.gh / 2 + c.oy) - c.y * S);
  };

  V.screen = function () { V.ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); };

  // Copia un lienzo ya horneado a píxeles reales, 1:1 y en píxeles enteros (sin reescalar).
  // x, y en píxeles CSS de la pantalla. Respeta globalAlpha y el recorte que haya puestos.
  V.stamp = function (c, x, y) {
    const g = V.ctx;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(c, Math.round(x * V.dpr), Math.round(y * V.dpr));
    g.restore();
  };

  // Mundo (casillas) → pantalla (píxeles CSS).
  V.w2s = function (wx, wy, out) {
    out = out || {};
    out.x = V.gx + V.gw / 2 + V.cam.ox + (wx - V.cam.x) * V.tile;
    out.y = V.gh / 2 + V.cam.oy + (wy - V.cam.y) * V.tile;
    return out;
  };

  V.onScreen = function (wx, wy, margin) {
    const m = margin || 2, hw = V.viewW() / 2 + m, hh = V.viewH() / 2 + m;
    return Math.abs(wx - V.cam.x) < hw && Math.abs(wy - V.cam.y) < hh;
  };

  V.font = function (px, weight) {
    return (weight || 600) + ' ' + Math.round(px) + 'px Teko, "Arial Narrow", "Roboto Condensed", sans-serif';
  };

  // Texto con contorno, en píxeles CSS (llamar con V.screen() puesto).
  V.text = function (s, x, y, px, fill, stroke, align, weight) {
    const g = V.ctx;
    g.font = V.font(px, weight);
    g.textAlign = align || 'center';
    g.textBaseline = 'middle';
    if (stroke) {
      g.lineJoin = 'round';
      g.lineWidth = Math.max(2, px * 0.16);
      g.strokeStyle = stroke;
      g.strokeText(s, x, y);
    }
    g.fillStyle = fill;
    g.fillText(s, x, y);
  };

  // Dibujo en caché. w, h: tamaño en casillas; ax, ay: dónde cae el punto de anclaje dentro
  // del dibujo (en casillas desde la esquina de arriba a la izquierda). draw(g) dibuja en
  // casillas con el anclaje en (0, 0).
  V.sprite = function (key, w, h, ax, ay, draw) {
    let s = V.cache[key];
    if (s) return s;
    const S = V.S;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * S));
    c.height = Math.max(1, Math.ceil(h * S));
    const g = c.getContext('2d');
    g.setTransform(S, 0, 0, S, ax * S, ay * S);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    draw(g);
    s = { c: c, w: w, h: h, ax: ax, ay: ay };
    V.cache[key] = s;
    return s;
  };

  // Pinta un dibujo en caché con su anclaje en (x, y) del mundo, con escala opcional.
  V.blit = function (s, x, y, sx, sy) {
    const g = V.ctx;
    if (sx === undefined) sx = 1;
    if (sy === undefined) sy = sx;
    g.drawImage(s.c, x - s.ax * sx, y - s.ay * sy, s.w * sx, s.h * sy);
  };

  V.shake = function (px, t) {
    if (HB.settings && HB.settings.lowfx) px *= 0.5;
    V.cam.shake = Math.max(V.cam.shake, px);
    V.cam.shakeT = Math.max(V.cam.shakeT, t);
  };

  // ---------- Ayudas de dibujo (en casillas) ----------
  HB.Draw = {
    rr: function (g, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    },
    fillStroke: function (g, fill, lw, stroke) {
      g.fillStyle = fill; g.fill();
      if (lw) { g.lineWidth = lw; g.strokeStyle = stroke || HB.PAL.ink; g.stroke(); }
    },
    ellipse: function (g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); },
    // Caja en vista 3/4: huella w×d centrada en x, con el borde delantero en y; alto z.
    box: function (g, x, y, w, d, z, top, front, lw) {
      const x0 = x - w / 2, td = d * 0.75;
      HB.Draw.rr(g, x0, y - z, w, z, 0.08);
      HB.Draw.fillStroke(g, front, lw);
      HB.Draw.rr(g, x0, y - z - td, w, td, 0.1);
      HB.Draw.fillStroke(g, top, lw);
    },
  };
})(globalThis.HB);
