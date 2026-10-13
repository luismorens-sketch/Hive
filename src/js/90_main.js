// Hive Breaker — arranque, bucle principal y guardado.
//
// Bucle (funcional 20): la lógica va a paso fijo de 30 Hz (economía a 10 Hz) y el dibujo a lo
// que dé la pantalla, interpolando la posición del comandante. Si un fotograma se retrasa, la
// lógica se pone al día con varios pasos; nunca con un paso gigante.
(function (HB) {
  'use strict';

  const KEY = HB.CONFIG.save.key;

  const G = HB.Game = {
    st: null,
    mem: {},          // memoria del consejero para la flecha
    botMem: {},       // memoria del piloto automático
    input: { x: 0, y: 0 },
    prevX: 0, prevY: 0,
    autopilot: false, speed: 1, showFps: false,
    fps: 60, lowT: 0,
    paused: false,
    target: null, showGuide: false,
    acc: 0, last: 0, saveT: 0,
  };

  // ---------- Guardado (localStorage; en Android irá también a Preferences, hito F3) ----------
  function readSave() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function writeSave(text) { try { localStorage.setItem(KEY, text); return true; } catch (e) { return false; } }
  function eraseSave() { try { localStorage.removeItem(KEY); } catch (e) { /* nada que borrar */ } }

  G.save = function () {
    if (!G.st) return;
    G.st.savedAt = Date.now();
    G.st.needSave = false;
    writeSave(HB.State.serialize(G.st));
    G.saveT = 0;
  };

  G.reset = function () {
    eraseSave();
    G.st = HB.State.newGame(Date.now() & 0x7fffffff);
    setup();
  };

  G.applyLang = function () {
    const s = G.st.settings;
    HB.lang = HB.pickLang(s.lang || (navigator.language || 'en'));
    if (HB.View.ctx) { HB.View.cache = {}; HB.View.gen++; }
  };

  function setup() {
    const st = G.st;
    HB.settings = st.settings;
    HB.Audio.enabled = st.settings.sound !== false;
    G.applyLang();
    G.prevX = st.cmd.x; G.prevY = st.cmd.y;
    G.mem = {}; G.botMem = {};
    HB.resetVis(st);
    HB.View.cam.ready = false;
  }

  // ---------- Un paso de lógica ----------
  function step(dt) {
    const st = G.st, inp = G.input;
    if (G.autopilot) HB.Advisor.bot(st, G.botMem, inp);
    else HB.Input.read(inp);
    G.prevX = st.cmd.x; G.prevY = st.cmd.y;
    HB.Logic.step(st, inp, dt);
    if (st.tick % HB.CONFIG.econEvery === 0) HB.Logic.econ(st, dt * HB.CONFIG.econEvery);
    for (const e of st.ev) {
      HB.Juice.handle(st, e);
      if (e.k === 'unlock') { G.mem = {}; G.botMem = {}; }
    }
    st.ev.length = 0;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    let real = (now - G.last) / 1000;
    G.last = now;
    if (!(real > 0)) real = 0;
    if (real > 0.25) real = 0.25;
    if (real > 0) G.fps = G.fps * 0.95 + Math.min(120, 1 / real) * 0.05;

    // Modo ahorro automático: menos de 50 FPS durante 3 s (funcional 13.3).
    if (G.fps < HB.FX.lowFpsLimit) { G.lowT += real; if (G.lowT >= HB.FX.lowFpsTime) HB.autoLow = true; }
    else G.lowT = Math.max(0, G.lowT - real);

    const dt = 1 / HB.CONFIG.tickHz;
    let vdt = 0;
    if (!G.paused) {
      vdt = real * G.speed;
      G.acc += vdt;
      let n = 0;
      while (G.acc >= dt && n < 40) { step(dt); G.acc -= dt; n++; }
      if (n >= 40) G.acc = 0;
    }

    const st = G.st;
    G.target = HB.Advisor.target(st, G.mem);
    const idle = performance.now() - HB.Input.lastInput > 6000 && !st.cmd.moving;
    G.showGuide = G.target && (G.target.kind === 'pay' || st.stats.zones < 2 || idle || G.autopilot);

    HB.Render.frame(G, G.acc / dt, vdt || real * 0.0001);

    G.saveT += real;
    if (st.needSave || G.saveT > HB.CONFIG.save.every) G.save();
  }

  // ---------- Si algo falla, que se vea (para poder mandar una captura) ----------
  function showError(msg) {
    const el = document.getElementById('err');
    if (!el) return;
    el.hidden = false;
    el.textContent = 'ERROR · ' + msg;
  }
  window.addEventListener('error', function (ev) {
    showError((ev.message || 'error') + (ev.filename ? ' @' + String(ev.filename).split('/').pop() + ':' + ev.lineno : ''));
  });

  // ---------- Arranque ----------
  function start(hotData) {
    const cv = document.getElementById('cv');
    HB.View.init(cv);
    HB.Input.attach(cv);
    HB.Menu.init();
    HB.Input.onTap = function (x, y) {
      const gb = HB.HUD.gear;
      if (HB.dist(x, y, gb.x, gb.y) < 32) { HB.Menu.open(); return true; }
      return false;
    };

    let st = null;
    if (hotData && hotData.save) st = HB.State.deserialize(hotData.save);
    if (!st) { const txt = readSave(); if (txt) st = HB.State.deserialize(txt); }
    if (!st) st = HB.State.newGame(Date.now() & 0x7fffffff);
    G.st = st;
    setup();

    window.addEventListener('resize', function () { HB.View.resize(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) G.save(); });
    window.addEventListener('pagehide', function () { G.save(); });

    // La tipografía Teko llega por internet: al cargar, se rehacen los dibujos con texto.
    try {
      if (document.fonts && document.fonts.load) {
        document.fonts.load('600 30px Teko').then(function () { HB.View.cache = {}; HB.View.gen++; }, function () {});
      }
    } catch (e) { /* sin tipografía, se usa la de reserva */ }

    // Si la página se republica mientras se juega, el visor de Claude conserva la partida.
    try {
      const hot = window.claude && window.claude.hot;
      if (hot && hot.snapshot) hot.snapshot(function () { return { save: HB.State.serialize(G.st) }; });
    } catch (e) { /* fuera del visor no hay nada que hacer */ }

    G.last = performance.now();
    requestAnimationFrame(frame);
  }

  function boot() {
    let started = false;
    const once = function (data) { if (started) return; started = true; start(data || {}); };
    let hot = null;
    try { hot = window.claude && window.claude.hot; } catch (e) { hot = null; }
    if (hot && hot.ready) {
      try { hot.ready(once); } catch (e) { once({}); }
      // Por si el visor no llega a avisar: el juego arranca igual.
      setTimeout(function () { once({}); }, 1500);
    } else once((hot && hot.data) || {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(globalThis.HB);
