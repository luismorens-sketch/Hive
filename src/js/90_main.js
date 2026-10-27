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
    hitstop: 0, slow: 0,   // golpes grandes: pausa corta y cámara lenta (funcional 13.1 regla 6)
    intro: null,           // la entrada de una partida nueva: { t } (70_render.js la dibuja)
  };

  // Fin de la entrada (o un toque la salta): empieza el juego.
  G.endIntro = function () {
    if (!G.intro) return;
    G.intro = null;
    HB.Logic.ftue(G.st, 'intro');
    G.save();
  };

  // Vídeo recompensado SIMULADO (funcional 15.3): da la recompensa sin anuncio y lo apunta para
  // medir cuántos se usarían. El primero de la vida del jugador es gratis («THIS ONE'S ON US»).
  G.watchAd = function (placement, cb) {
    const st = G.st;
    const free = !st.ads.seen;
    st.ads.seen++;
    st.ads.log[placement] = (st.ads.log[placement] || 0) + 1;
    if (free) { cb(); return; }
    HB.HUD.ad = { t: 0, dur: 2, cb: cb, done: false };
  };

  // Lo producido mientras no jugabas (funcional 14.4). Se mira al abrir el juego y al volver a
  // él (el móvil lo deja en segundo plano). fakeAway: segundos fuera, para el menú de pruebas.
  G.checkAway = function (fakeAway) {
    const st = G.st;
    if (fakeAway) st.savedAt = Date.now() - fakeAway * 1000;
    const a = HB.Offline.check(st, Date.now());
    G.save();
    return a;
  };

  // Interruptor de la salida para los drones: DEFENSA → EQUILIBRIO → BENEFICIO (funcional 5.4).
  G.cyclePrio = function (e) {
    const order = ['defense', 'balanced', 'profit'];
    e.prio = order[(order.indexOf(e.prio || 'balanced') + 1) % order.length];
    G.save();
  };

  // ---------- Herramientas de prueba: solo en el móvil del autor ----------
  // Se guardan aparte de la partida (borrar el progreso no las apaga). Si no se ha decidido nunca,
  // se encienden donde ya había una partida con progreso (el móvil del autor) y se apagan en uno
  // nuevo (el de quien prueba el juego). Cinco toques en la versión las cambian (85_menu.js).
  const DEV_KEY = 'lmc_hb_dev';
  function readDev() { try { const v = localStorage.getItem(DEV_KEY); return v === null ? null : v === '1'; } catch (e) { return null; } }
  G.setDev = function (v) { G.dev = !!v; try { localStorage.setItem(DEV_KEY, G.dev ? '1' : '0'); } catch (e) { /* sin almacenamiento */ } };

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

  // ---------- Idioma (el sistema de CORE) ----------
  // Se guarda en su propia clave, aparte de la partida: borrar el progreso no lo cambia. Orden:
  // lo que eligió el jugador y, si no, el idioma del móvil; lo que no tengamos, en inglés.
  const LANG_KEY = 'lmc_hb_lang_v1';
  function readLang() { try { return localStorage.getItem(LANG_KEY) || ''; } catch (e) { return ''; } }
  // force: el idioma que se acaba de elegir (por si el móvil no deja guardar nada).
  G.applyLang = function (force) {
    let want = force !== undefined ? force : readLang();
    // Partidas de antes de la 0.9.2: el idioma iba dentro del guardado. Se pasa a su clave.
    const old = G.st && G.st.settings && G.st.settings.lang;
    if (!want && old) { want = old; try { localStorage.setItem(LANG_KEY, old); } catch (e) { /* sin almacenamiento */ } }
    HB.lang = HB.pickLang(want || navigator.language || 'en');
    try { document.documentElement.lang = HB.lang === 'qa' ? 'en' : HB.lang; } catch (e) { /* sin documento */ }
    if (HB.View.ctx) { HB.View.cache = {}; HB.View.gen++; }
  };
  // cod: 'en', 'es'... ; 'qa' enciende el pseudo-idioma; '' lo apaga y vuelve el que había.
  G.setLang = function (cod) {
    const s = G.st && G.st.settings;
    if (cod && cod !== 'qa' && s) s.lang = cod;   // también en la partida, como respaldo
    const keep = cod || (s && s.lang) || '';
    try { if (keep) localStorage.setItem(LANG_KEY, keep); else localStorage.removeItem(LANG_KEY); } catch (e) { /* sin almacenamiento */ }
    G.applyLang(keep);
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
    // Partida nueva: la nave aterriza y el comandante salta al suelo (funcional 12, 0:00).
    G.intro = st.ftue.intro === undefined && st.time < 1 ? { t: 0 } : null;
  }

  // ---------- Un paso de lógica ----------
  function step(dt) {
    const st = G.st, inp = G.input;
    if (G.intro) return;   // durante la entrada el juego espera
    if (G.autopilot) { HB.Advisor.decide(st, G.botMem); HB.Advisor.bot(st, G.botMem, inp); }
    else HB.Input.read(inp);
    if (HB.HUD.modal(st)) return;   // con una ventana abierta el juego espera
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

    // Modo ahorro automático: menos de 50 FPS durante 3 s (funcional 13.3). Y se quita solo si el
    // móvil se recupera (lección 18 de CORE: una calidad que solo sabe bajar se queda abajo hasta
    // cerrar la app, aunque el bajón fuera de un momento, como al volver de otra app).
    if (!HB.autoLow) {
      if (G.fps < HB.FX.lowFpsLimit) { G.lowT += real; if (G.lowT >= HB.FX.lowFpsTime) { HB.autoLow = true; G.okT = 0; } }
      else G.lowT = Math.max(0, G.lowT - real);
    } else if (G.fps >= HB.FX.lowFpsBack) {
      G.okT = (G.okT || 0) + real;
      if (G.okT >= HB.FX.lowFpsBackTime) { HB.autoLow = false; G.lowT = 0; }
    } else G.okT = 0;

    const dt = 1 / HB.CONFIG.tickHz;
    let vdt = 0;
    if (G.intro && !G.paused) { G.intro.t += real * G.speed; if (G.intro.t >= HB.Render.INTRO_DUR) G.endIntro(); }
    if (!G.paused) {
      vdt = real * G.speed;
      if (G.hitstop > 0) { G.hitstop -= real; vdt = 0; }
      else if (G.slow > 0) { G.slow -= real; vdt *= HB.FX.slowmoScale; }
      G.acc += vdt;
      let n = 0;
      while (G.acc >= dt && n < 40) { step(dt); G.acc -= dt; n++; }
      if (n >= 40) G.acc = 0;
    }

    const st = G.st;
    G.target = HB.Advisor.target(st, G.mem);
    const idle = performance.now() - HB.Input.lastInput > 6000 && !st.cmd.moving;
    G.showGuide = G.target && (G.target.kind === 'pay' || G.target.gather || st.stats.zones < 2 || idle || G.autopilot);

    HB.Audio.music(st.regions[st.cur].phase);
    HB.Render.frame(G, G.acc / dt, vdt || (HB.HUD.modal(st) ? real : real * 0.0001));

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

    let st = null;
    if (hotData && hotData.save) st = HB.State.deserialize(hotData.save);
    if (!st) { const txt = readSave(); if (txt) st = HB.State.deserialize(txt); }
    const dev = readDev();
    if (dev === null) G.setDev(!!(st && st.time > 60)); else G.dev = dev;
    if (!st) st = HB.State.newGame(Date.now() & 0x7fffffff);
    G.st = st;
    setup();
    G.checkAway();

    window.addEventListener('resize', function () { HB.View.resize(); });
    document.addEventListener('visibilitychange', function () {
      // El sonido se para fuera del juego (lección 20 de CORE: en el WebView de Android sigue
      // sonando en segundo plano). Al volver se reanuda; si el móvil no deja, en el primer toque.
      HB.Audio.sleep(document.hidden);
      if (document.hidden) G.save(); else G.checkAway();
    });
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
