// Hive Breaker — sonido sintetizado con Web Audio (sin archivos de audio).
// En Hyper Drill salió mucho más barato sintetizar (~9 KB) que empaquetar audio (~1,9 MB).
// El navegador solo deja sonar después de que el jugador toque la pantalla: HB.Audio.unlock().
(function (HB) {
  'use strict';

  let ac = null, master = null, noiseBuf = null;
  const last = {};
  let streak = 0, streakT = -10;

  // Separación mínima entre dos sonidos iguales, para que no se amontonen.
  const GAP = { tic: 0.028, drop: 0.03, cling: 0.024, chunk: 0.09, payTick: 0.055, clunk: 0.25 };

  function now() { return ac ? ac.currentTime : 0; }

  function makeNoise() {
    const n = ac.sampleRate * 0.5;
    const b = ac.createBuffer(1, n, ac.sampleRate);
    const d = b.getChannelData(0);
    let s = 7;
    for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
    return b;
  }

  function gainEnv(t0, attack, decay, peak) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    g.connect(master);
    return g;
  }

  function tone(type, f0, f1, t0, dur, vol) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    o.connect(gainEnv(t0, Math.min(0.01, dur * 0.2), dur, vol));
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function noise(t0, dur, vol, ftype, f0, f1, q) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = ftype; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    s.connect(f);
    f.connect(gainEnv(t0, Math.min(0.01, dur * 0.2), dur, vol));
    s.start(t0, Math.random() * 0.3);
    s.stop(t0 + dur + 0.05);
  }

  // ±5 % de tono al azar en los sonidos repetidos para que no cansen (funcional 13.4).
  function jit() { return 1 + (Math.random() - 0.5) * 0.1; }
  function semi(s) { return Math.pow(2, s / 12); }

  const SFX = {
    // Minar y recoger: "tic" que sube un semitono por recogida seguida (funcional 13.1 regla 3).
    tic: function (t, o) { const f = 640 * semi(o.step || 0) * jit(); tone('triangle', f, f * 1.02, t, 0.07, 0.16 * o.vol); tone('sine', f * 2, 0, t, 0.05, 0.05 * o.vol); },
    drop: function (t, o) { const f = 820 * semi(-(o.step || 0) * 0.5) * jit(); tone('triangle', f, f * 0.85, t, 0.06, 0.12 * o.vol); },
    clunk: function (t, o) { tone('sine', 150, 55, t, 0.2, 0.32 * o.vol); noise(t, 0.06, 0.15 * o.vol, 'lowpass', 500); },
    chunk: function (t, o) { noise(t, 0.06, 0.09 * o.vol, 'bandpass', 900 * jit(), 0, 1.2); tone('square', 120, 70, t, 0.05, 0.035 * o.vol); },
    whoosh: function (t, o) { noise(t, 1.0, 0.08 * o.vol, 'bandpass', 250, 1400, 2); },
    whooshUp: function (t, o) { noise(t, 1.0, 0.07 * o.vol, 'bandpass', 1400, 250, 2); },
    thud: function (t, o) { tone('sine', 95, 40, t, 0.25, 0.28 * o.vol); },
    chaching: function (t, o) {
      noise(t, 0.1, 0.1 * o.vol, 'highpass', 4500);
      tone('triangle', 1318, 0, t, 0.08, 0.16 * o.vol);
      tone('triangle', 1760, 0, t + 0.07, 0.28, 0.18 * o.vol);
    },
    cling: function (t, o) { const f = 1046 * semi(o.step || 0) * jit(); tone('sine', f, 0, t, 0.09, 0.1 * o.vol); tone('triangle', f * 1.5, 0, t, 0.04, 0.03 * o.vol); },
    payTick: function (t, o) { const f = 260 + 760 * (o.p || 0); tone('triangle', f, f * 1.03, t, 0.05, 0.09 * o.vol); },
    tada: function (t, o) {
      tone('sine', 98, 60, t, 0.3, 0.3 * o.vol);
      [523, 659, 784, 1046].forEach(function (f, i) { tone('triangle', f, 0, t + i * 0.07, 0.2, 0.15 * o.vol); });
      noise(t + 0.21, 0.3, 0.16 * o.vol, 'bandpass', 3200, 0, 9);
    },
    up: function (t, o) { [784, 988, 1175, 1568].forEach(function (f, i) { tone('triangle', f, 0, t + i * 0.05, 0.14, 0.12 * o.vol); }); },
    pop: function (t, o) { tone('sine', 420 * jit(), 900, t, 0.08, 0.14 * o.vol); },
  };

  HB.Audio = {
    enabled: true,

    // Hay que llamarlo desde un toque del jugador.
    unlock: function () {
      try {
        if (!ac) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ac = new AC();
          master = ac.createGain();
          master.gain.value = 0.8;
          master.connect(ac.destination);
          noiseBuf = makeNoise();
        }
        if (ac.state === 'suspended') ac.resume();
      } catch (e) { ac = null; }
    },

    // name: clave de SFX. o: { vol, step, p, delay }.
    play: function (name, o) {
      if (!this.enabled || !ac || ac.state !== 'running') return;
      o = o || {};
      if (o.vol === undefined) o.vol = 1;
      if (o.vol <= 0.02) return;
      const t = now() + (o.delay || 0);
      const g = GAP[name] || 0;
      if (g && !o.delay && last[name] !== undefined && t - last[name] < g) return;
      last[name] = t;
      try { SFX[name](t, o); } catch (e) { /* un sonido que falla no para el juego */ }
    },

    // Para las pruebas automáticas (tools/capture.js): hace sonar todo y devuelve los fallos.
    test: function () {
      const errs = [];
      if (!ac) return ['sin AudioContext'];
      for (const k in SFX) {
        try { SFX[k](now(), { vol: 0.01, step: 3, p: 0.5 }); } catch (e) { errs.push(k + ': ' + e.message); }
      }
      return errs;
    },

    // Escala de tono de las rachas: 0..12 y vuelve a empezar; se corta si pasa 0,7 s sin recoger.
    step: function () {
      const t = performance.now() / 1000;
      streak = t - streakT < 0.7 ? (streak + 1) % 13 : 0;
      streakT = t;
      return streak;
    },
  };

  // Vibración corta y escasa (funcional 13.1 regla 8). En el navegador del móvil puede no estar.
  HB.buzz = function (ms) {
    // Chrome se queja si se vibra antes de que el jugador haya tocado la pantalla.
    if (!HB.settings || !HB.settings.vib || !HB.userActed) return;
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* sin vibración */ }
  };
})(globalThis.HB);
