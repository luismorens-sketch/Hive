// Hive Breaker — el dedo: joystick flotante (funcional 4.1 y pilar 8).
// Aparece donde apoyas el dedo y desaparece al soltar. Si arrastras más allá del borde, la base
// te sigue. En el ordenador también valen el ratón, las flechas y WASD.
(function (HB) {
  'use strict';

  const I = HB.Input = {
    RADIUS: 52,          // píxeles CSS
    DEAD: 0.12,          // zona muerta
    FULL: 0.55,          // a partir del 55 % del recorrido, velocidad máxima
    active: false, id: null,
    ox: 0, oy: 0, kx: 0, ky: 0,
    x: 0, y: 0,          // dirección resultante (largo 0..1)
    keys: {},
    lastInput: 0,
    onTap: null,         // function(x, y) → true si el toque era de un botón
  };

  function setVec() {
    let dx = I.kx - I.ox, dy = I.ky - I.oy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > I.RADIUS) {
      // la base sigue al dedo
      const k = (d - I.RADIUS) / d;
      I.ox += dx * k; I.oy += dy * k;
      dx = I.kx - I.ox; dy = I.ky - I.oy;
    }
    const m = Math.min(1, Math.sqrt(dx * dx + dy * dy) / I.RADIUS);
    if (m < I.DEAD) { I.x = 0; I.y = 0; return; }
    const s = Math.min(1, (m - I.DEAD) / (I.FULL - I.DEAD));
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    I.x = dx / len * s; I.y = dy / len * s;
  }

  function pos(ev, cv) {
    const r = cv.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  I.attach = function (cv) {
    cv.addEventListener('pointerdown', function (ev) {
      HB.userActed = true;
      HB.Audio.unlock();
      const p = pos(ev, cv);
      if (I.onTap && I.onTap(p.x, p.y)) { ev.preventDefault(); return; }
      if (I.active) return;
      I.active = true; I.id = ev.pointerId;
      I.ox = I.kx = p.x; I.oy = I.ky = p.y;
      I.x = 0; I.y = 0;
      I.lastInput = performance.now();
      try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* algunos navegadores no lo tienen */ }
      ev.preventDefault();
    });
    cv.addEventListener('pointermove', function (ev) {
      if (!I.active || ev.pointerId !== I.id) return;
      const p = pos(ev, cv);
      I.kx = p.x; I.ky = p.y;
      setVec();
      I.lastInput = performance.now();
      ev.preventDefault();
    });
    const end = function (ev) {
      if (ev.pointerId !== I.id) return;
      I.active = false; I.id = null; I.x = 0; I.y = 0;
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('lostpointercapture', end);
    cv.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

    window.addEventListener('keydown', function (ev) {
      I.keys[ev.key.toLowerCase()] = true;
      HB.userActed = true;
      HB.Audio.unlock();
    });
    window.addEventListener('keyup', function (ev) { I.keys[ev.key.toLowerCase()] = false; });
    window.addEventListener('blur', function () { I.keys = {}; I.active = false; I.x = 0; I.y = 0; });
  };

  // Dirección final: el dedo manda; si no, el teclado.
  I.read = function (out) {
    if (I.active) { out.x = I.x; out.y = I.y; return out; }
    const k = I.keys;
    let x = 0, y = 0;
    if (k.arrowleft || k.a) x -= 1;
    if (k.arrowright || k.d) x += 1;
    if (k.arrowup || k.w) y -= 1;
    if (k.arrowdown || k.s) y += 1;
    const m = Math.sqrt(x * x + y * y);
    if (m > 0) { x /= m; y /= m; I.lastInput = performance.now(); }
    out.x = x; out.y = y;
    return out;
  };
})(globalThis.HB);
