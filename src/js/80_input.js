// Hive Breaker — el dedo: joystick flotante (funcional 4.1 y pilar 8) y toques cortos.
// El joystick aparece donde apoyas el dedo y desaparece al soltar; si arrastras más allá del
// borde, la base te sigue. Un toque corto (sin arrastrar) va a los botones del HUD, a las
// ventanas, al interruptor de prioridad o al Orbital (72_hud.js). En el ordenador también valen
// el ratón, las flechas y WASD.
(function (HB) {
  'use strict';

  const I = HB.Input = {
    RADIUS: 52,          // píxeles CSS
    DEAD: 0.12,          // zona muerta
    FULL: 0.55,          // a partir del 55 % del recorrido, velocidad máxima
    TAP_PX: 14,          // un toque corto se mueve menos de 14 px...
    TAP_MS: 450,         // ...y dura menos de 0,45 s
    active: false, id: null,
    ox: 0, oy: 0, kx: 0, ky: 0,
    x: 0, y: 0,          // dirección resultante (largo 0..1)
    keys: {},
    lastInput: 0,
    down: null,          // dónde y cuándo empezó el toque actual
  };

  function setVec() {
    let dx = I.kx - I.ox, dy = I.ky - I.oy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > I.RADIUS) {
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

  // La posición del lienzo se lee al apoyar el dedo, no en cada movimiento (lección 02 de CORE:
  // leer del DOM a 60-120 veces por segundo obliga al navegador a recalcular la página).
  let rect = null;
  function pos(ev, cv, fresh) {
    if (fresh || !rect) rect = cv.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  I.attach = function (cv) {
    cv.addEventListener('pointerdown', function (ev) {
      HB.userActed = true;
      HB.Audio.unlock();
      const p = pos(ev, cv, true);
      ev.preventDefault();
      if (I.down) return;   // un solo dedo manda
      const G = HB.Game;
      const onButton = G && G.st && (HB.HUD.modal(G.st) || HB.HUD.hitButton(p.x, p.y));
      I.down = { x: p.x, y: p.y, t: performance.now(), id: ev.pointerId, joy: !onButton };
      try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* algunos navegadores no lo tienen */ }
      if (!onButton) {
        I.active = true; I.id = ev.pointerId;
        I.ox = I.kx = p.x; I.oy = I.ky = p.y;
        I.x = 0; I.y = 0;
        I.lastInput = performance.now();
      }
    });
    cv.addEventListener('pointermove', function (ev) {
      if (!I.active || ev.pointerId !== I.id) return;
      const p = pos(ev, cv);
      I.kx = p.x; I.ky = p.y;
      setVec();
      I.lastInput = performance.now();
      ev.preventDefault();
    });
    const end = function (ev, cancelled) {
      const d = I.down;
      if (!d || ev.pointerId !== d.id) return;
      I.down = null;
      I.active = false; I.id = null; I.x = 0; I.y = 0;
      if (cancelled) return;
      const p = pos(ev, cv);
      const quick = HB.dist(p.x, p.y, d.x, d.y) < I.TAP_PX && performance.now() - d.t < I.TAP_MS;
      if (quick && HB.Game) HB.HUD.tap(p.x, p.y, HB.Game);
    };
    cv.addEventListener('pointerup', function (ev) { end(ev, false); });
    cv.addEventListener('pointercancel', function (ev) { end(ev, true); });
    cv.addEventListener('lostpointercapture', function (ev) { if (I.down && ev.pointerId === I.down.id) end(ev, true); });
    cv.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

    window.addEventListener('keydown', function (ev) {
      I.keys[ev.key.toLowerCase()] = true;
      HB.userActed = true;
      HB.Audio.unlock();
    });
    window.addEventListener('keyup', function (ev) { I.keys[ev.key.toLowerCase()] = false; });
    window.addEventListener('blur', function () { I.keys = {}; I.active = false; I.down = null; I.x = 0; I.y = 0; });
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
