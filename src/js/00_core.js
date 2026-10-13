// Hive Breaker — núcleo: espacio de nombres, utilidades, azar con semilla, números e idiomas.
//
// Los archivos 00-45 son la LÓGICA del juego y no tocan nunca el DOM ni el canvas: los carga
// también el simulador de Node (tools/sim_balance.js). Así el simulador juega exactamente con
// las mismas reglas que el móvil. Lo que dibuja, suena o lee el dedo va en 50-90.
//
// Cada archivo es una función que se llama a sí misma y recibe el espacio de nombres HB: así
// funcionan igual pegados en un solo HTML (tools/build.js) que cargados sueltos en Node.
globalThis.HB = globalThis.HB || {};

(function (HB) {
  'use strict';

  // ---------- Matemáticas pequeñas ----------
  HB.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  HB.lerp = function (a, b, t) { return a + (b - a) * t; };
  HB.dist = function (ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); };
  HB.dist2 = function (ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; };
  HB.easeOutCubic = function (t) { const u = 1 - t; return 1 - u * u * u; };
  HB.easeInCubic = function (t) { return t * t * t; };
  HB.easeOutBack = function (t) { const c1 = 1.70158, c3 = c1 + 1, u = t - 1; return 1 + c3 * u * u * u + c1 * u * u; };
  HB.easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  // ---------- Azar con semilla ----------
  // La lógica NUNCA usa Math.random: así una partida (y el simulador) se puede repetir igual.
  // El estado del azar vive en st.rng y se guarda con la partida. (mulberry32)
  HB.rand = function (st) {
    st.rng = (st.rng + 0x6D2B79F5) | 0;
    let t = st.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // ---------- Números: 999 · 1.2K · 3.4M · 5.6B · 7.8T · luego aa, ab… (funcional 20) ----------
  const UNITS = ['', 'K', 'M', 'B', 'T'];
  HB.fmt = function (n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    let tier = Math.floor(Math.log10(n) / 3);
    let v = n / Math.pow(10, tier * 3);
    // Se redondea hacia abajo: el contador nunca enseña más de lo que tienes.
    let s = v < 100 ? (Math.floor(v * 10) / 10).toFixed(1).replace(/\.0$/, '') : String(Math.floor(v));
    let u;
    if (tier < UNITS.length) u = UNITS[tier];
    else {
      const i = tier - UNITS.length;
      u = String.fromCharCode(97 + Math.floor(i / 26) % 26) + String.fromCharCode(97 + i % 26);
    }
    return s + u;
  };
  HB.money = function (n) { return '$' + HB.fmt(n); };

  // ---------- Idiomas ----------
  // Todo texto que ve el jugador sale de HB.STRINGS (10_strings.js). Inglés por defecto.
  HB.lang = 'en';
  HB.T = function (key, a, b) {
    const S = HB.STRINGS || {};
    let s = (S[HB.lang] && S[HB.lang][key]) || (S.en && S.en[key]) || key;
    if (a !== undefined) s = s.replace('{0}', a);
    if (b !== undefined) s = s.replace('{1}', b);
    return s;
  };
  HB.pickLang = function (wanted) {
    const S = HB.STRINGS || {};
    const l = String(wanted || 'en').slice(0, 2).toLowerCase();
    return S[l] ? l : 'en';
  };
})(globalThis.HB);
