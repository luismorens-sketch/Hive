// Hive Breaker — efectos: partículas, objetos que vuelan y números flotantes.
//
// Reservas fijas (funcional 13.3): 400 partículas, 60 objetos voladores y 30 textos. Nada se
// crea ni se destruye durante el juego: se reutiliza. Si una reserva se llena, lo nuevo pisa a
// lo más viejo (partículas) o se da por llegado al instante (vuelos), para no perder nada.
(function (HB) {
  'use strict';

  const V = HB.View, P = HB.PAL;

  function makePool(n) { const a = []; for (let i = 0; i < n; i++) a.push({ on: false }); return a; }
  const parts = makePool(HB.FX.pools.particles);
  const flyers = makePool(HB.FX.pools.flyers);
  const texts = makePool(HB.FX.pools.texts);
  let pHead = 0;

  function free(pool, head) {
    for (let k = 0; k < pool.length; k++) {
      const i = (head + k) % pool.length;
      if (!pool[i].on) return i;
    }
    return -1;
  }

  function lowfx() { return !!((HB.settings && HB.settings.lowfx) || HB.autoLow); }

  // ---------- Dibujos de las partículas (en caché) ----------
  function glow(col) {
    return V.sprite('glow:' + col, 1, 1, 0.5, 0.5, function (g) {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.5);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(-0.5, -0.5, 1, 1);
    });
  }
  function puff(col) {
    return V.sprite('puff:' + col, 1, 1, 0.5, 0.5, function (g) {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.5);
      gr.addColorStop(0, col); gr.addColorStop(0.6, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.9; g.fillStyle = gr; g.fillRect(-0.5, -0.5, 1, 1);
    });
  }

  const K = { SPARK: 1, DUST: 2, CONF: 3, SMOKE: 4, RING: 5, RAY: 6 };
  const CONF_COL = [P.yellow, P.orange, P.tealL, '#ffffff', P.cashL, '#ff6fb0'];

  function part(kind, x, y, z) {
    let i = free(parts, pHead);
    if (i < 0) i = pHead % parts.length;   // llena: pisa a la más vieja
    pHead = i + 1;
    const p = parts[i];
    p.on = true; p.kind = kind; p.x = x; p.y = y; p.z = z || 0;
    p.vx = 0; p.vy = 0; p.vz = 0; p.grav = 0; p.drag = 0;
    p.t = 0; p.life = 0.5; p.size = 0.2; p.grow = 0; p.col = '#fff'; p.rot = 0; p.vr = 0; p.a = 1; p.round = false;
    return p;
  }

  const Fx = HB.Fx = {
    K: K,

    sparks: function (x, y, z, n, col) {
      if (lowfx()) n = Math.ceil(n / 2);
      for (let i = 0; i < n; i++) {
        const p = part(K.SPARK, x, y, z);
        const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 2.5;
        p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s * 0.5; p.vz = 1 + Math.random() * 2.5;
        p.grav = -9; p.life = 0.25 + Math.random() * 0.2; p.size = 0.18 + Math.random() * 0.12; p.col = col || P.yellow;
      }
    },

    dust: function (x, y, n, spread) {
      if (lowfx()) n = Math.ceil(n / 2);
      for (let i = 0; i < n; i++) {
        const p = part(K.DUST, x + (Math.random() - 0.5) * (spread || 0.6), y + (Math.random() - 0.5) * 0.3, 0.05);
        const a = Math.random() * Math.PI * 2, s = 0.6 + Math.random() * 1.6;
        p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s * 0.45; p.vz = 0.3 + Math.random() * 0.5; p.drag = 3;
        p.life = 0.45 + Math.random() * 0.35; p.size = 0.35 + Math.random() * 0.3; p.grow = 0.9; p.col = P.sandL;
      }
    },

    confetti: function (x, y, n) {
      if (lowfx()) n = Math.ceil(n / 2);
      for (let i = 0; i < n; i++) {
        const p = part(K.CONF, x, y, 0.8);
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
        p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s * 0.55; p.vz = 3 + Math.random() * 4;
        p.grav = -12; p.drag = 1.2; p.life = 1.1 + Math.random() * 0.6; p.size = 0.09 + Math.random() * 0.06;
        p.col = CONF_COL[i % CONF_COL.length]; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 18;
      }
    },

    // gotas de baba de colores al morir un bicho (violeta, rosa ácido; dorado para el raro)
    goo: function (x, y, n, gold) {
      if (lowfx()) n = Math.ceil(n / 2);
      const cols = gold ? [P.yellow, '#fff2b0', '#ffffff'] : [P.bug, P.acid, '#c27cf2', '#ff9ccf'];
      for (let i = 0; i < n; i++) {
        const p = part(K.CONF, x, y, 0.3);
        const a = Math.random() * Math.PI * 2, s = 0.8 + Math.random() * 2.4;
        p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s * 0.55; p.vz = 2 + Math.random() * 3;
        p.grav = -11; p.drag = 1.5; p.life = 0.7 + Math.random() * 0.5; p.size = 0.06 + Math.random() * 0.06;
        p.col = cols[i % cols.length]; p.rot = 0; p.vr = 0; p.round = true;
      }
    },

    smoke: function (x, y, z) {
      if (lowfx() && Math.random() < 0.5) return;
      const p = part(K.SMOKE, x + (Math.random() - 0.5) * 0.1, y, z);
      p.vx = 0.15 + Math.random() * 0.15; p.vz = 0.7 + Math.random() * 0.3;
      p.life = 1.1 + Math.random() * 0.4; p.size = 0.25; p.grow = 0.6; p.col = '#cfd3d6'; p.a = 0.55;
    },

    ring: function (x, y, r, col) {
      const p = part(K.RING, x, y, 0);
      p.life = 0.45; p.size = r || 1.4; p.col = col || P.sandL;
    },

    rays: function (x, y, z, col) {
      const p = part(K.RAY, x, y, z);
      p.life = 0.7; p.size = 1.6; p.col = col || P.yellow; p.rot = Math.random();
    },

    // Un objeto que vuela. o: { spr, x, y, z, to(out) o tx/ty/tz, dur, arc, screen, land(), scale, delay }
    fly: function (o) {
      const i = free(flyers, 0);
      if (i < 0) { if (o.land) o.land(); return null; }
      const f = flyers[i];
      f.on = true; f.spr = o.spr; f.sx = o.x; f.sy = o.y; f.sz = o.z || 0;
      f.to = o.to || null; f.tx = o.tx; f.ty = o.ty; f.tz = o.tz || 0;
      f.t = -(o.delay || 0); f.dur = o.dur || 0.3; f.arc = o.arc === undefined ? 0.6 : o.arc;
      f.screen = !!o.screen; f.land = o.land || null; f.scale = o.scale || 1; f.ease = o.ease || null;
      f.cx = f.sx; f.cy = f.sy; f.cz = f.sz;
      return f;
    },

    // Texto flotante. o: { s, x, y (mundo), col, size (px), dur, rise }
    text: function (o) {
      let i = free(texts, 0);
      if (i < 0) i = 0;
      const t = texts[i];
      t.on = true; t.s = o.s; t.x = o.x; t.y = o.y; t.col = o.col || '#ffffff';
      t.size = o.size || 26; t.dur = o.dur || 0.9; t.rise = o.rise === undefined ? 1.2 : o.rise; t.t = 0;
      return t;
    },

    update: function (dt) {
      for (const p of parts) {
        if (!p.on) continue;
        p.t += dt;
        if (p.t >= p.life) { p.on = false; continue; }
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
        p.vz += p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.z < 0 && p.grav < 0) {
          p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; p.vr *= 0.5;
        }
        p.rot += p.vr * dt;
      }
      const tmp = {};
      for (const f of flyers) {
        if (!f.on) continue;
        f.t += dt;
        if (f.t < 0) continue;
        let tx = f.tx, ty = f.ty, tz = f.tz;
        if (f.to) { f.to(tmp); tx = tmp.x; ty = tmp.y; tz = tmp.z || 0; }
        let p = Math.min(1, f.t / f.dur);
        const e = f.ease ? f.ease(p) : p;
        f.cx = f.sx + (tx - f.sx) * e;
        f.cy = f.sy + (ty - f.sy) * e;
        f.cz = f.sz + (tz - f.sz) * e + f.arc * 4 * p * (1 - p);
        if (p >= 1) { f.on = false; if (f.land) f.land(); }
      }
      for (const t of texts) {
        if (!t.on) continue;
        t.t += dt;
        if (t.t >= t.dur) t.on = false;
      }
    },

    // Con la transformación del mundo puesta.
    drawWorld: function () {
      const g = V.ctx;
      for (const p of parts) {
        if (!p.on) continue;
        const k = p.t / p.life;
        const y = p.y - p.z;
        if (p.kind === K.SPARK) {
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 1 - k;
          V.blit(glow(p.col), p.x, y, p.size * (1 - k * 0.5));
          g.globalCompositeOperation = 'source-over';
        } else if (p.kind === K.DUST || p.kind === K.SMOKE) {
          g.globalAlpha = (1 - k) * (p.a || 0.8);
          V.blit(puff(p.col), p.x, y, p.size * (1 + p.grow * k * 2));
        } else if (p.kind === K.CONF && p.round) {
          g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
          g.fillStyle = p.col;
          g.beginPath(); g.ellipse(p.x, y, p.size * 1.3, p.size, 0, 0, Math.PI * 2); g.fill();
        } else if (p.kind === K.CONF) {
          g.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1;
          g.save(); g.translate(p.x, y); g.rotate(p.rot); g.scale(1, Math.cos(p.rot * 1.7));
          g.fillStyle = p.col; g.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
          g.restore();
        } else if (p.kind === K.RING) {
          g.globalAlpha = 1 - k;
          g.lineWidth = 0.12 * (1 - k) + 0.02; g.strokeStyle = p.col;
          g.beginPath(); g.ellipse(p.x, p.y, p.size * (0.3 + k), p.size * (0.3 + k) * 0.5, 0, 0, Math.PI * 2); g.stroke();
        } else if (p.kind === K.RAY) {
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = (1 - k) * 0.7;
          g.fillStyle = p.col;
          g.save(); g.translate(p.x, y); g.rotate(p.rot + k * 0.6);
          for (let i = 0; i < 8; i++) {
            g.rotate(Math.PI / 4);
            g.beginPath(); g.moveTo(0, 0); g.lineTo(p.size * (0.6 + k * 0.6), -0.09); g.lineTo(p.size * (0.6 + k * 0.6), 0.09); g.closePath(); g.fill();
          }
          g.restore();
          g.globalCompositeOperation = 'source-over';
        }
      }
      g.globalAlpha = 1;
      for (const f of flyers) {
        if (!f.on || f.screen || f.t < 0) continue;
        V.blit(f.spr, f.cx, f.cy - f.cz, f.scale);
      }
    },

    // Con la transformación de pantalla puesta (píxeles CSS).
    drawScreen: function () {
      const g = V.ctx;
      for (const f of flyers) {
        if (!f.on || !f.screen || f.t < 0) continue;
        const s = f.scale * V.tile;
        g.drawImage(f.spr.c, f.cx - f.spr.ax * s, f.cy - f.cz - f.spr.ay * s, f.spr.w * s, f.spr.h * s);
      }
      const pt = {};
      for (const t of texts) {
        if (!t.on) continue;
        const k = t.t / t.dur;
        V.w2s(t.x, t.y - t.rise * HB.easeOutCubic(k), pt);
        const pop = k < 0.15 ? HB.easeOutBack(k / 0.15) : 1;
        g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        // que no se salga por los lados de la pantalla
        g.font = V.font(t.size);
        const hw = g.measureText(t.s).width / 2 + 8;
        const x = HB.clamp(pt.x, V.gx + hw, V.gx + V.gw - hw);
        V.text(t.s, x, pt.y, t.size * pop, t.col, P.ink);
      }
      g.globalAlpha = 1;
    },

    counts: function () {
      let a = 0, b = 0;
      for (const p of parts) if (p.on) a++;
      for (const f of flyers) if (f.on) b++;
      return { parts: a, flyers: b };
    },

    clear: function () {
      for (const p of parts) p.on = false;
      for (const f of flyers) f.on = false;
      for (const t of texts) t.on = false;
    },
  };
})(globalThis.HB);
