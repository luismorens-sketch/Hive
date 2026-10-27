// Hive Breaker — sonido sintetizado con Web Audio (sin archivos de audio).
// En Hyper Drill salió mucho más barato sintetizar (~9 KB) que empaquetar audio (~1,9 MB).
// El navegador solo deja sonar después de que el jugador toque la pantalla: HB.Audio.unlock().
(function (HB) {
  'use strict';

  let ac = null, master = null, noiseBuf = null;
  const last = {};
  let streak = 0, streakT = -10;

  // Separación mínima entre dos sonidos iguales, para que no se amontonen.
  const GAP = { tic: 0.028, drop: 0.03, cling: 0.024, chunk: 0.09, payTick: 0.055, clunk: 0.25, gun: 0.05, blaster: 0.06, splat: 0.04, thwip: 0.03, bite: 0.08, hurt: 0.2, click: 0.4, cannon: 0.1, shock: 0.15 };

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
    // combate (funcional 13.2)
    gun: function (t, o) { noise(t, 0.04, 0.09 * o.vol, 'bandpass', 2200 * jit(), 0, 1.5); tone('square', 180 * jit(), 90, t, 0.03, 0.03 * o.vol); },
    blaster: function (t, o) { tone('square', 1100 * jit(), 500, t, 0.05, 0.05 * o.vol); },
    cannon: function (t, o) { tone('sine', 120, 45, t, 0.25, 0.3 * o.vol); noise(t, 0.12, 0.15 * o.vol, 'lowpass', 900); },
    boom: function (t, o) { noise(t, 0.4, 0.28 * o.vol, 'lowpass', 1400, 120); tone('sine', 80, 35, t, 0.35, 0.3 * o.vol); },
    splat: function (t, o) { noise(t, 0.08, 0.12 * o.vol, 'bandpass', 600 * jit(), 220, 2); tone('sine', 300 * jit(), 120, t, 0.07, 0.06 * o.vol); },
    thwip: function (t, o) { tone('triangle', 900 * jit(), 400, t, 0.04, 0.05 * o.vol); },
    bite: function (t, o) { noise(t, 0.05, 0.1 * o.vol, 'highpass', 1800); },
    click: function (t, o) { tone('square', 1400, 0, t, 0.02, 0.06 * o.vol); tone('square', 900, 0, t + 0.06, 0.02, 0.05 * o.vol); },
    shock: function (t, o) { noise(t, 0.12, 0.08 * o.vol, 'bandpass', 3500 * jit(), 1200, 3); tone('square', 880 * jit(), 220, t, 0.1, 0.04 * o.vol); },
    // el Radar ve algo: dos pitidos limpios, como un sonar
    ping: function (t, o) { tone('sine', 1320, 1250, t, 0.18, 0.12 * o.vol); tone('sine', 1320, 1250, t + 0.32, 0.22, 0.07 * o.vol); },
    zap: function (t, o) { tone('sawtooth', 220, 140, t, 0.35, 0.07 * o.vol); noise(t, 0.3, 0.05 * o.vol, 'bandpass', 3000, 0, 4); },
    siren: function (t, o) {
      const os = ac.createOscillator(); os.type = 'sawtooth';
      os.frequency.setValueAtTime(420, t); os.frequency.linearRampToValueAtTime(760, t + 0.6); os.frequency.linearRampToValueAtTime(420, t + 1.2);
      os.frequency.linearRampToValueAtTime(760, t + 1.8);
      os.connect(gainEnv(t, 0.1, 1.9, 0.07 * o.vol)); os.start(t); os.stop(t + 2.1);
    },
    roar: function (t, o) { noise(t, 0.9, 0.22 * o.vol, 'lowpass', 500, 180, 3); tone('sawtooth', 70, 45, t, 0.9, 0.12 * o.vol); },
    hurt: function (t, o) { tone('square', 220, 110, t, 0.12, 0.08 * o.vol); },
    fanfare: function (t, o) { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone('triangle', f, 0, t + i * 0.09, 0.25, 0.13 * o.vol); }); },
    // redoble del cofre: golpes cada vez más seguidos durante unos 0,8 s
    roll: function (t, o) {
      let tt = t;
      for (let i = 0; i < 14; i++) { noise(tt, 0.05, (0.05 + i * 0.006) * o.vol, 'bandpass', 1800, 0, 1.5); tt += 0.09 - i * 0.005; }
    },
    // la radio del sargento: chasquido y dos pitidos cortos
    radio: function (t, o) {
      noise(t, 0.06, 0.07 * o.vol, 'bandpass', 2600, 0, 3);
      tone('square', 1320, 0, t + 0.04, 0.05, 0.045 * o.vol);
      tone('square', 1760, 0, t + 0.11, 0.06, 0.045 * o.vol);
    },
    lose: function (t, o) { [392, 330, 262].forEach(function (f, i) { tone('triangle', f, f * 0.97, t + i * 0.18, 0.3, 0.12 * o.vol); }); },
  };

  // ---------- Música de la noche: percusión tensa (funcional 13.4) ----------
  // De día, silencio (de momento). La percusión entra y sale con 1 s de transición.
  let mus = null;
  function drum(kind, t) {
    if (kind === 'k') { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); o.connect(gainEnvTo(t, 0.005, 0.2, 0.5, mus.gain)); o.start(t); o.stop(t + 0.3); }
    else if (kind === 's') { const s2 = ac.createBufferSource(); s2.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; s2.connect(f); f.connect(gainEnvTo(t, 0.003, 0.12, 0.25, mus.gain)); s2.start(t, Math.random() * 0.3); s2.stop(t + 0.2); }
    else { const s3 = ac.createBufferSource(); s3.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; s3.connect(f); f.connect(gainEnvTo(t, 0.002, 0.04, 0.12, mus.gain)); s3.start(t, Math.random() * 0.3); s3.stop(t + 0.08); }
  }
  function gainEnvTo(t0, a, d, peak, dest) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    g.connect(dest);
    return g;
  }
  const PATTERN = ['k', 'h', 'h', 'h', 's', 'h', 'k', 'h', 'k', 'h', 'h', 'h', 's', 'h', 'h', 's'];

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

    // Fuera del juego (pestaña o app en segundo plano) el sonido se duerme; al volver, se despierta.
    sleep: function (hidden) {
      if (!ac) return;
      try { if (hidden) ac.suspend(); else if (HB.userActed) ac.resume(); } catch (e) { /* si no se puede, ya se hará en el próximo toque */ }
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

    // Llamar cada fotograma con la fase del día ('day', 'warn', 'night').
    music: function (phase) {
      if (!ac || ac.state !== 'running') return;
      const want = this.enabled && phase === 'night';
      if (!mus) {
        if (!want) return;
        mus = { gain: ac.createGain(), next: 0, step: 0, on: false };
        mus.gain.gain.value = 0.0001;
        mus.gain.connect(master);
      }
      const t = ac.currentTime;
      if (want !== mus.on) {
        mus.on = want;
        mus.gain.gain.cancelScheduledValues(t);
        mus.gain.gain.setValueAtTime(want ? 0.0001 : 0.5, t);
        mus.gain.gain.exponentialRampToValueAtTime(want ? 0.5 : 0.0001, t + 1.0);
        if (want) mus.next = t + 0.1;
      }
      if (!mus.on) return;
      const beat = 60 / 112 / 4;   // semicorcheas a 112 por minuto
      while (mus.next < t + 0.2) {
        drum(PATTERN[mus.step % PATTERN.length], mus.next);
        mus.step++;
        mus.next += beat;
      }
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
