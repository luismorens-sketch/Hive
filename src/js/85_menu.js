// Hive Breaker — ventana de ajustes (funcional 18) y herramientas de prueba.
// Es DOM normal: solo existe mientras está abierta, nunca dentro del bucle del juego.
(function (HB) {
  'use strict';

  let root = null, rows = null, resetArmed = false;

  function T(k, a, b) { return HB.T(k, a, b); }

  function row(label, value, onClick, cls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'row' + (cls ? ' ' + cls : '');
    const l = document.createElement('span'); l.className = 'lbl'; l.textContent = label;
    b.appendChild(l);
    if (value !== null && value !== undefined) {
      const v = document.createElement('span'); v.className = 'val'; v.textContent = value;
      b.appendChild(v);
    }
    b.addEventListener('click', function (ev) { ev.stopPropagation(); onClick(); });
    rows.appendChild(b);
    return b;
  }

  function heading(text) {
    const h = document.createElement('h3');
    h.textContent = text;
    rows.appendChild(h);
  }

  function onoff(v) { return v ? T('on') : T('off'); }
  function mmss(t) { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }

  function render() {
    const G = HB.Game, s = G.st.settings;
    root.querySelector('#menu-title').textContent = T('settings');
    root.querySelector('#menu-ver').textContent = T('build', HB.CONFIG.version + ' · ' + (HB.BUILD || 'dev'));
    rows.textContent = '';
    // Idioma: cada uno con su nombre en su propio idioma, y la etiqueta en varios idiomas a la
    // vez, para quien abra esto sin entender el idioma en el que está el juego (como en CORE).
    row(T('language'), T('lang_name'), function () {
      const langs = HB.langs();
      const i = langs.indexOf(HB.lang);
      G.setLang(langs[(i < 0 ? 0 : i + 1) % langs.length]);
      render();
    });
    row(T('sound'), onoff(s.sound), function () { s.sound = !s.sound; HB.Audio.enabled = s.sound; render(); });
    row(T('vibration'), onoff(s.vib), function () { s.vib = !s.vib; if (s.vib) HB.buzz(20); render(); });
    row(T('reduce_fx'), onoff(s.lowfx), function () { s.lowfx = !s.lowfx; render(); });
    // Tu partida (funcional 21, hito 7): resumen y cuándo hizo cada cosa por primera vez. Lo ve
    // cualquiera, para que en la prueba con 5 personas baste una captura de esta ventana.
    heading(T('game_log'));
    const R0 = G.st.regions[G.st.cur], ads = G.st.ads && G.st.ads.log ? G.st.ads.log : {};
    const nAds = Object.keys(ads).reduce(function (a, k) { return a + ads[k]; }, 0);
    const sum = document.createElement('p');
    sum.className = 'ftue-log';
    sum.textContent = [T('sum_time', mmss(G.st.time)), T('sum_zones', Object.keys(R0.bought).length, HB.REGIONS[R0.id].zones.length),
      T('sum_nights', R0.nights, G.st.stats.lost || 0), T('sum_ads', nAds)].join(' · ');
    rows.appendChild(sum);
    const ft = G.st.ftue, done = HB.FTUE.filter(function (k) { return ft[k] !== undefined; });
    const ftLog = document.createElement('p');
    ftLog.className = 'ftue-log';
    ftLog.textContent = T('tut_log') + ': ' + (done.length ? done.map(function (k) { return T('ft_' + k) + ' ' + mmss(ft[k]); }).join(' · ') : T('tut_none'));
    rows.appendChild(ftLog);
    // Herramientas de prueba: solo en el móvil del autor (5 toques en la versión las enciende o
    // las apaga). Así quien prueba el juego no se las encuentra.
    if (G.dev) {
      heading(T('debug'));
      row(T('autopilot'), onoff(G.autopilot), function () { G.autopilot = !G.autopilot; render(); });
      row(T('speed4'), onoff(G.speed > 1), function () { G.speed = G.speed > 1 ? 1 : 4; render(); });
      row(T('show_fps'), onoff(G.showFps), function () { G.showFps = !G.showFps; render(); });
      // Pseudo-idioma: textos un 30 % más largos y entre corchetes, para ver qué no cabe y qué no
      // pasa por el sistema de idiomas. Al apagarlo vuelve el idioma del móvil.
      row(T('pseudo_lang'), onoff(HB.lang === 'qa'), function () { G.setLang(HB.lang === 'qa' ? '' : 'qa'); render(); });
      row(T('ads_log'), String(nAds), function () {}, 'info');
      row(T('add_money'), null, function () {
        R0.credits += 500;
        HB.Vis.credPulse = 1;
        G.save();
        close();
      });
      row(T('test_chest'), null, function () {
        close();
        HB.Chests.give(G.st, 'first');
        G.save();
      });
      row(T('test_supply'), null, function () {
        close();
        if (!R0.supply) R0.supply = { next: 0, box: null };
        R0.supply.box = null; R0.supply.next = 0;
        const was = R0.nights;
        if (R0.nights < HB.CONFIG.supply.from) R0.nights = HB.CONFIG.supply.from;   // para que caiga ya
        HB.Supply.step(G.st, R0, 0.01);
        R0.nights = was;
      });
      row(T('sim_away'), null, function () {
        close();
        if (!G.checkAway(3600)) HB.HUD.showBanner(T('away_none_t'), HB.PAL.amber, 2.6, T('away_none'));
      });
    }
    const rb = row(resetArmed ? T('reset_confirm') : T('reset'), null, function () {
      if (!resetArmed) { resetArmed = true; render(); return; }
      resetArmed = false;
      G.reset();
      close();
    }, 'danger');
    if (resetArmed) rb.classList.add('armed');
    row(T('close'), null, close, 'close');
  }

  function open() {
    if (!root) return;
    resetArmed = false;
    HB.Game.paused = true;
    render();
    root.hidden = false;
  }

  function close() {
    if (!root) return;
    root.hidden = true;
    resetArmed = false;
    HB.Game.paused = false;
    HB.Game.save();
  }

  HB.Menu = {
    init: function () {
      root = document.getElementById('menu');
      rows = document.getElementById('menu-rows');
      root.addEventListener('click', function (ev) { if (ev.target === root) close(); });
      // cinco toques seguidos en la versión: herramientas de prueba sí / no
      const ver = document.getElementById('menu-ver');
      let taps = 0, last = 0;
      ver.addEventListener('click', function (ev) {
        ev.stopPropagation();
        const now = Date.now();
        taps = now - last < 1500 ? taps + 1 : 1;
        last = now;
        if (taps >= 5) { taps = 0; HB.Game.setDev(!HB.Game.dev); render(); }
      });
      window.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') { if (root.hidden) open(); else close(); }
      });
    },
    open: open,
    close: close,
    isOpen: function () { return root && !root.hidden; },
  };
})(globalThis.HB);
