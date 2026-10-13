// Hive Breaker — ventana de ajustes (funcional 18) y herramientas de prueba.
// Es DOM normal: solo existe mientras está abierta, nunca dentro del bucle del juego.
(function (HB) {
  'use strict';

  let root = null, rows = null, resetArmed = false;

  function T(k, a) { return HB.T(k, a); }

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

  function render() {
    const G = HB.Game, s = G.st.settings;
    root.querySelector('#menu-title').textContent = T('settings');
    root.querySelector('#menu-ver').textContent = T('build', HB.CONFIG.version + ' · ' + (HB.BUILD || 'dev'));
    rows.textContent = '';
    row(T('language'), T('lang_name'), function () {
      const langs = Object.keys(HB.STRINGS);
      s.lang = langs[(langs.indexOf(HB.lang) + 1) % langs.length];
      G.applyLang();
      render();
    });
    row(T('sound'), onoff(s.sound), function () { s.sound = !s.sound; HB.Audio.enabled = s.sound; render(); });
    row(T('vibration'), onoff(s.vib), function () { s.vib = !s.vib; if (s.vib) HB.buzz(20); render(); });
    row(T('reduce_fx'), onoff(s.lowfx), function () { s.lowfx = !s.lowfx; render(); });
    heading(T('debug'));
    row(T('autopilot'), onoff(G.autopilot), function () { G.autopilot = !G.autopilot; render(); });
    row(T('speed4'), onoff(G.speed > 1), function () { G.speed = G.speed > 1 ? 1 : 4; render(); });
    row(T('show_fps'), onoff(G.showFps), function () { G.showFps = !G.showFps; render(); });
    const log = G.st.ads && G.st.ads.log ? G.st.ads.log : {};
    const total = Object.keys(log).reduce(function (a, k) { return a + log[k]; }, 0);
    row(T('ads_log'), String(total), function () {}, 'info');
    row(T('add_money'), null, function () {
      const R = G.st.regions[G.st.cur];
      R.credits += 500;
      HB.Vis.credPulse = 1;
      G.save();
      close();
    });
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
      window.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') { if (root.hidden) open(); else close(); }
      });
    },
    open: open,
    close: close,
    isOpen: function () { return root && !root.hidden; },
  };
})(globalThis.HB);
