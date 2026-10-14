// Hive Breaker — dibujo del mundo en cada fotograma.
//
// Orden: suelo (en caché) → lo que está en el suelo (zonas, bases de drones, botín, sombras) →
// cosas ordenadas por profundidad (vetas, edificios, montones, bichos, comandante, Nido) →
// lo que vuela (nave, drones, proyectiles) → efectos → niebla → noche → etiquetas.
// El HUD y las ventanas van en 72_hud.js. Solo se dibuja lo que cae en pantalla (pilar 9).
(function (HB) {
  'use strict';

  const V = HB.View, P = HB.PAL, D = HB.Draw, A = HB.Art;

  // Estado solo visual (no se guarda). Lo llena también 75_juice.js.
  const vis = HB.Vis = {
    ent: {},          // id → { sq, sqv, rise, flash, muzzle }
    stackIn: 0,       // objetos volando hacia la pila (aún no se dibujan en ella)
    inIn: {},         // id → objetos volando hacia la tolva de la máquina
    outIn: {},        // id → objetos volando de la máquina a su montón de salida
    goodsIn: {},      // id → objetos volando hacia la plataforma de exportación
    pileShown: 0,     // dinero que se ve en el montón de billetes
    credInFlight: 0,  // dinero que aún vuela hacia el contador
    credDisp: 0,      // cifra que enseña el contador (rueda hacia la real)
    credPulse: 0,
    lootPulse: 0,
    fogY: null,
    hist: new Float32Array(64 * 3), histN: 0, histI: 0,
    phase: 0, face: 0,
    maxT: 9, trembleT: 9,
    stackBase: { x: 0, y: 0 },
    slotY: new Float32Array(64),
    flash: 0, hurt: 0,
    ship: { st: 'away', t: 0 },
    idle: 0,
    labels: [],
    taps: [],          // botones del mundo que se pueden tocar (en píxeles de pantalla)
    tracers: [],       // disparos de Gatling y del comandante (trazos que se apagan)
    ground: null, groundGen: -1, groundS: 0,
    fogEdge: null,
    endT: 0,
    clock: 0,
    cmdMuzzle: 0,
  };

  HB.entVis = function (id) {
    let v = vis.ent[id];
    if (!v) v = vis.ent[id] = { sq: 0, sqv: 0, rise: 1, flash: 0, muzzle: 0 };
    return v;
  };

  HB.resetVis = function (st) {
    vis.ent = {}; vis.stackIn = 0; vis.inIn = {}; vis.outIn = {}; vis.goodsIn = {};
    const R = st.regions[st.cur];
    vis.pileShown = R.pile; vis.credInFlight = 0; vis.credDisp = R.credits; vis.fogY = R.fogY;
    vis.histN = 0; vis.flash = 0; vis.hurt = 0; vis.ship = { st: 'away', t: 0 }; vis.tracers.length = 0;
    HB.Fx.clear();
  };

  HB.tracer = function (x0, y0, x1, y1, col) {
    if (vis.tracers.length > 40) vis.tracers.shift();
    vis.tracers.push({ x0: x0, y0: y0, x1: x1, y1: y1, t: 0, col: col || '#fff3a0' });
  };

  function glowSprite(col) {
    return V.sprite('glow:' + col, 1, 1, 0.5, 0.5, function (q) {
      const gr = q.createRadialGradient(0, 0, 0, 0, 0, 0.5);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      q.fillStyle = gr; q.fillRect(-0.5, -0.5, 1, 1);
    });
  }
  HB.glowSprite = glowSprite;

  // ---------- Suelo (se dibuja una vez por tamaño de pantalla) ----------
  function buildGround(R) {
    const d = HB.REGIONS[R.id];
    const gs = Math.min(V.S, 64);
    const c = document.createElement('canvas');
    c.width = Math.ceil(d.w * gs); c.height = Math.ceil(d.h * gs);
    const g = c.getContext('2d');
    g.setTransform(gs, 0, 0, gs, 0, 0);
    let seed = 99;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.fillStyle = P.sand; g.fillRect(0, 0, d.w, d.h);
    for (let i = 0; i < 90; i++) {
      g.globalAlpha = 0.28;
      g.fillStyle = rnd() < 0.5 ? P.sandL : P.sandD;
      D.ellipse(g, rnd() * d.w, rnd() * d.h, 0.8 + rnd() * 2, 0.5 + rnd() * 1.2); g.fill();
    }
    g.globalAlpha = 1;
    g.strokeStyle = P.crack; g.lineWidth = 0.035; g.lineCap = 'round';
    for (let i = 0; i < 44; i++) {
      let x = rnd() * d.w, y = rnd() * d.h;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 0.9; y += (rnd() - 0.5) * 0.6; g.lineTo(x, y); }
      g.globalAlpha = 0.55; g.stroke();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 330; i++) {
      const x = rnd() * d.w, y = rnd() * d.h, r = 0.03 + rnd() * 0.07;
      g.fillStyle = P.crack; D.ellipse(g, x, y, r * 1.3, r); g.fill();
      g.fillStyle = P.sandL; D.ellipse(g, x - r * 0.3, y - r * 0.4, r * 0.6, r * 0.4); g.fill();
    }
    // más allá del muro sur: tierra de bichos, cada vez más morada hacia el Nido
    const sy = 36.5;
    const gr = g.createLinearGradient(0, sy, 0, d.h);
    gr.addColorStop(0, 'rgba(90,40,90,0)'); gr.addColorStop(1, 'rgba(70,25,80,0.6)');
    g.fillStyle = gr; g.fillRect(0, sy, d.w, d.h - sy);
    for (let i = 0; i < 26; i++) {
      const x = rnd() * d.w, y = sy + 1.5 + rnd() * (d.h - sy - 1.5);
      g.globalAlpha = 0.45; g.fillStyle = P.bug; D.ellipse(g, x, y, 0.3 + rnd() * 0.5, 0.15 + rnd() * 0.2); g.fill();
      g.globalAlpha = 0.8; g.fillStyle = P.acid; D.ellipse(g, x + 0.1, y - 0.03, 0.05, 0.03); g.fill();
    }
    g.globalAlpha = 1;
    for (const side of [0, 1]) {
      for (let y = 0; y < d.h; y += 0.35) {
        const x = side ? d.w - rnd() * 0.25 : rnd() * 0.25;
        g.fillStyle = '#8f7146'; D.ellipse(g, x, y, 0.35, 0.25); g.fill();
        g.fillStyle = '#a78857'; D.ellipse(g, x - 0.05, y - 0.06, 0.2, 0.12); g.fill();
      }
    }
    vis.ground = c; vis.groundS = gs; vis.groundGen = V.gen;
  }

  function buildFogEdge(R) {
    const d = HB.REGIONS[R.id];
    vis.fogEdge = V.sprite('fogedge', d.w + 10, 2.2, 5, 0.4, function (g) {
      const gr = g.createLinearGradient(0, 0, 0, 1.6);
      gr.addColorStop(0, P.fog); gr.addColorStop(1, 'rgba(25,29,35,0)');
      g.fillStyle = gr; g.fillRect(-5, -0.4, d.w + 10, 2.0);
      g.fillStyle = P.fog;
      let seed = 7;
      const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let x = -5; x < d.w + 5; x += 0.45) {
        D.ellipse(g, x, 0.05 + rnd() * 0.25, 0.4 + rnd() * 0.35, 0.3 + rnd() * 0.2); g.fill();
      }
    });
  }

  // ---------- Posiciones de los montones (las usan también los vuelos) ----------
  const tmpP = {};
  HB.slot = {
    stack: function (i, out) {
      const b = vis.stackBase;
      i = Math.min(i, HB.CONFIG.cmd.stackDraw - 1);
      out.x = b.x + lean(i); out.y = b.y - vis.slotY[i] - 0.1; out.z = 0;
      return out;
    },
    out: function (e, i, out) {
      const p = HB.Logic.padPos(e, 'out');
      const it = HB.MACHINES[e.type].output, h = HB.ITEMS[it].h;
      const layer = Math.floor(i / 4), k = i % 4;
      out.x = p.x + (k % 2 ? 0.18 : -0.18); out.y = p.y + (k < 2 ? -0.06 : 0.14) - layer * h; out.z = 0;
      return out;
    },
    hopper: function (e, i, out) {
      const m = HB.MACHINES[e.type], s = e.flip ? -1 : 1;
      const cx = e.x + s * (-m.w / 2 + 0.42), cy = e.y + m.h / 2 - 0.12 - m.z - 0.6;
      i = Math.min(i, 7);
      out.x = cx + ((i % 4) - 1.5) * 0.15; out.y = cy - Math.floor(i / 4) * 0.12; out.z = 0;
      return out;
    },
    chute: function (e, out) {
      const m = HB.MACHINES[e.type], s = e.flip ? -1 : 1;
      out.x = e.x + s * (m.w / 2 + 0.3); out.y = e.y + m.h / 2 - 0.4; out.z = 0;
      return out;
    },
    goods: function (e, i, out) {
      const layer = Math.floor(i / 6), k = i % 6;
      out.x = e.x + ((k % 3) - 1) * 0.42; out.y = e.y + (k < 3 ? -0.05 : 0.3) - layer * 0.2; out.z = 0;
      return out;
    },
    bill: function (e, i, out) {
      const p = HB.Logic.padPos(e, 'pile');
      const rows = [5, 4, 3, 2, 1];
      let r = 0, k = i;
      while (r < rows.length - 1 && k >= rows[r]) { k -= rows[r]; r++; }
      out.x = p.x + (k - (rows[r] - 1) / 2) * 0.27 + ((i * 37) % 7 - 3) * 0.012;
      out.y = p.y + 0.12 - r * 0.11 + ((i * 53) % 5 - 2) * 0.015; out.z = 0;
      return out;
    },
    billCount: function (v) { return v <= 0 ? 0 : Math.min(15, Math.max(1, Math.ceil(Math.sqrt(v / 3) * 2))); },
    // caja de munición de una torreta
    box: function (R, e, out) { const p = HB.Logic.padPos(e, 'box', R.id); out.x = p.x; out.y = p.y; out.z = 0; return out; },
  };

  // Inclinación del objeto i de la pila: va retrasado 15 ms por altura (efecto muelle).
  function lean(i) {
    const n = vis.histN;
    if (n < 2) return 0;
    const lag = i * HB.FX.stackLag;
    const now = vis.hist[((vis.histI - 1 + 64) % 64) * 3];
    let k = 1;
    while (k < n - 1 && now - vis.hist[((vis.histI - 1 - k + 64) % 64) * 3] < lag) k++;
    const j = ((vis.histI - 1 - k + 64) % 64) * 3;
    const cur = ((vis.histI - 1 + 64) % 64) * 3;
    let dx = (vis.hist[j + 1] - vis.hist[cur + 1]) * HB.FX.stackLean;
    if (dx > 0.45) dx = 0.45; else if (dx < -0.45) dx = -0.45;
    let tremble = 0;
    if (vis.trembleT < 0.35) tremble = Math.sin(vis.trembleT * 70 + i) * 0.03 * (1 - vis.trembleT / 0.35) * i / 4;
    return dx + tremble;
  }

  // ---------- Cámara ----------
  function updateCamera(st, cx, cy, dt) {
    const R = st.regions[st.cur], d = HB.REGIONS[R.id];
    const vw = V.viewW(), vh = V.viewH();
    let tx = cx + st.cmd.vx * 0.18, ty = cy + st.cmd.vy * 0.18;
    const fogTop = vis.fogY - 3;
    const minX = vw / 2, maxX = d.w - vw / 2;
    tx = minX > maxX ? d.w / 2 : HB.clamp(tx, minX, maxX);
    const minY = fogTop + vh / 2, maxY = d.h - vh / 2 + 0.5;
    ty = minY > maxY ? maxY : HB.clamp(ty, minY, maxY);
    const k = 1 - Math.exp(-dt * 6);
    const c = V.cam;
    if (!c.ready) { c.x = tx; c.y = ty; c.ready = true; }
    c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
    if (c.shakeT > 0) {
      c.shakeT -= dt;
      const a = c.shake * (c.shakeT > 0 ? 1 : 0);
      c.ox = (Math.random() - 0.5) * 2 * a; c.oy = (Math.random() - 0.5) * 2 * a;
      if (c.shakeT <= 0) c.shake = 0;
    } else { c.ox = 0; c.oy = 0; }
  }

  // ---------- Suelo, niebla y lo que está pegado al suelo ----------
  function drawGround(R) {
    const g = V.ctx, d = HB.REGIONS[R.id];
    g.fillStyle = '#3a2f22';
    g.fillRect(-6, -6, d.w + 12, d.h + 12);
    if (vis.groundGen !== V.gen) buildGround(R);
    const gs = vis.groundS, vw = V.viewW(), vh = V.viewH();
    const x0 = Math.max(0, V.cam.x - vw / 2 - 1), y0 = Math.max(0, V.cam.y - vh / 2 - 1);
    const x1 = Math.min(d.w, V.cam.x + vw / 2 + 1), y1 = Math.min(d.h, V.cam.y + vh / 2 + 1);
    if (x1 <= x0 || y1 <= y0) return;
    g.drawImage(vis.ground, x0 * gs, y0 * gs, (x1 - x0) * gs, (y1 - y0) * gs, x0, y0, x1 - x0, y1 - y0);
  }

  function drawFog(R) {
    const g = V.ctx, d = HB.REGIONS[R.id];
    const fy = vis.fogY;
    if (fy <= 0.05) return;
    if (!vis.fogEdge || !V.cache.fogedge) buildFogEdge(R);
    g.fillStyle = P.fog;
    g.fillRect(-6, -6, d.w + 12, fy - 0.4 + 6);
    V.blit(vis.fogEdge, 0, fy - 0.4);
  }

  function drawPads(st, R) {
    for (const p of HB.Logic.pads(R)) {
      if (p.kind === 'zone' || p.kind === 'nest' || !V.onScreen(p.x, p.y)) continue;
      const e = p.e, def = HB.MACHINES[e.type];
      if (p.kind === 'pile') { V.blit(A.pad('pile', 0, null), p.x, p.y); continue; }
      if (p.kind === 'box') { V.blit(A.pad('box', 0, 'ammo'), p.x, p.y); continue; }
      const toMachine = e.x > p.x ? 1 : -1;
      if (p.kind === 'in') {
        const item = def.kind === 'proc' ? Object.keys(def.inputs)[0] : null;
        V.blit(A.pad('in', toMachine, item), p.x, p.y);
      } else {
        V.blit(A.pad('out', -toMachine, def.output), p.x, p.y);
      }
    }
  }

  // Bases de drones y sus rutas (líneas discontinuas en el suelo).
  function drawDronePads(st, R) {
    const g = V.ctx, c = st.cmd;
    for (const e of R.ents) {
      if (HB.MACHINES[e.type].kind !== 'dronepad') continue;
      if (V.onScreen(e.x, e.y)) V.blit(A.dronePad(), e.x, e.y);
      const rt = e.route;
      let a = null, b = null;
      if (rt.kind === 'miner') {
        const v = R.veins.find(function (q) { return rt.veins.indexOf(q.id) >= 0; });
        const m = R._byId[rt.to];
        if (v && m) { a = v; b = HB.Logic.padPos(m, 'in'); }
      } else {
        const s = R._byId[rt.from], m = R._byId[rt.to];
        if (s && m) { a = HB.Logic.padPos(s, 'out'); b = HB.Logic.padPos(m, 'in'); }
      }
      if (!a || !b) continue;
      const near = HB.dist(c.x, c.y, e.x, e.y) < 3;
      g.globalAlpha = near ? 0.7 : 0.22;
      g.setLineDash([0.2, 0.18]); g.lineDashOffset = -vis.clock * 0.6;
      g.lineWidth = 0.07; g.strokeStyle = P.tealL;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      g.setLineDash([]); g.lineDashOffset = 0;
      g.globalAlpha = 1;
    }
  }

  function drawZones(st, R, t) {
    const g = V.ctx;
    for (const z of HB.Logic.visibleZones(R)) {
      const p = HB.Logic.zonePadPos(z);
      if (!V.onScreen(p.x, p.y, 4)) continue;
      const pr = HB.Logic.price(R, z), paid = R.paid[z.id] || 0;
      const can = R.credits >= pr - paid;
      // plano fantasma de lo que se va a construir
      const L = HB.State.layout(R.id).ents[z.id];
      if (z.kind === 'machine') {
        const m = HB.MACHINES[z.type];
        g.globalAlpha = 0.22;
        drawBuildingSprite({ x: z.x, y: z.y, type: z.type, flip: z.flip, level: 1, id: '_ghost' }, 1, 1);
        g.globalAlpha = 0.7;
        g.setLineDash([0.18, 0.12]); g.lineWidth = 0.05; g.strokeStyle = '#ffffff';
        g.strokeRect(z.x - m.w / 2, z.y - m.h / 2, m.w, m.h); g.setLineDash([]);
        g.globalAlpha = 1;
      } else if (z.kind === 'vein') {
        g.globalAlpha = 0.25; V.blit(A.vein(), z.x, z.y); g.globalAlpha = 1;
      } else if (z.kind === 'wall' && L) {
        g.globalAlpha = 0.25; V.blit(A.wall(L.opts.w), L.x, L.y); g.globalAlpha = 1;
      } else if (z.kind === 'turret') {
        g.globalAlpha = 0.25; V.blit(A.turretBase(), z.x, z.y); g.globalAlpha = 1;
      } else if (z.kind === 'drone') {
        g.globalAlpha = 0.35; V.blit(A.dronePad(), z.x, z.y); g.globalAlpha = 1;
      }
      const pulse = can ? 1 + Math.sin(t * 6) * 0.04 : 1;
      const r = 0.8 * pulse;
      D.ellipse(g, p.x, p.y, r, r * 0.82);
      g.fillStyle = can ? 'rgba(255,210,63,0.28)' : 'rgba(28,33,38,0.45)'; g.fill();
      g.setLineDash([0.16, 0.11]); g.lineWidth = 0.07; g.strokeStyle = can ? P.yellow : 'rgba(255,255,255,0.85)'; g.stroke(); g.setLineDash([]);
      if (paid > 0) {
        g.beginPath(); g.ellipse(p.x, p.y, r, r * 0.82, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * paid / pr);
        g.lineWidth = 0.16; g.strokeStyle = P.yellow; g.stroke();
      }
      V.blit(A.zoneIcon(z), p.x, p.y - 0.24, 0.6);
      let sub = null;
      if (z.kind === 'upgrade') {
        const e = R._byId[z.target];
        if (e) sub = HB.T('lvl', e.level + 1);
      } else if (z.kind === 'nest') sub = HB.T('b_nest');
      vis.labels.push({ k: 'price', x: p.x, y: p.y + 0.2, s: HB.money(pr - paid), can: can, sub: sub, subY: p.y + 0.98 });
    }
    // el Nido ya pagado: zona para lanzar el asalto, con el poder recomendado
    if (R.nestReady && !R.cleared && R.phase === 'day') {
      const z = HB.REGIONS[R.id].zones.find(function (q) { return q.kind === 'nest'; });
      if (z && V.onScreen(z.x, z.y, 4)) {
        const rate = HB.Night.bossRating(R);
        const col = rate.level === 'green' ? P.cashL : (rate.level === 'amber' ? P.amber : '#ff5a5a');
        const pulse = 1 + Math.sin(t * 5) * 0.05;
        D.ellipse(g, z.x, z.y, 0.85 * pulse, 0.7 * pulse);
        g.fillStyle = 'rgba(255,79,163,0.25)'; g.fill();
        g.lineWidth = 0.09; g.strokeStyle = P.acid; g.stroke();
        const c = st.cmd;
        if (c.pad === 'nest' && R.phase === 'day') {
          g.beginPath(); g.ellipse(z.x, z.y, 0.85, 0.7, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, c.padT / 1.5));
          g.lineWidth = 0.16; g.strokeStyle = '#ffffff'; g.stroke();
        }
        V.blit(A.zoneIcon(z), z.x, z.y - 0.05, 0.7);
        vis.labels.push({ k: 'nest', x: z.x, y: z.y - 1.15, s: HB.T('assault'), col: col, sub: HB.T('power_rec') });
      }
    }
  }

  function drawLootGround(R) {
    const g = V.ctx;
    if (!R._loot || !R._loot.length) return;
    const bill = A.item('bill'), gl = A.lootGlow();
    for (const l of R._loot) {
      if (!V.onScreen(l.x, l.y)) continue;
      const bob = Math.sin(vis.clock * 5 + l.x * 3) * 0.05;
      const fade = l.dawn ? HB.clamp((HB.CONFIG.night.lootDawn - l.t) / 5, 0, 1) : 1;
      if (fade < 1 && Math.floor(vis.clock * 8) % 2) continue;
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.55 + Math.sin(vis.clock * 6 + l.y) * 0.2;
      V.blit(gl, l.x, l.y - 0.1, 0.9);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      V.blit(bill, l.x, l.y + bob, 0.8);
    }
  }

  // ---------- Edificios ----------
  function buildingSprite(e) {
    const t = e.type, d = HB.MACHINES[t];
    if (e.dead) { const m = HB.Logic.dims(e); return A.rubble(m.w, m.h); }
    if (t === 'smelter') return A.smelter(e.flip, e.level);
    if (t === 'ammo_fab') return A.ammo_fab(e.flip, e.level);
    if (t === 'export') return A.export();
    if (t === 'solar') return A.solar();
    if (t === 'dissipator') return A.dissipator();
    if (t === 'wall') return A.wall(HB.Logic.dims(e).w);
    if (d.kind === 'turret') return A.turretBase();
    return A.hq();
  }

  function drawBuildingSprite(e, sx, sy) {
    const g = V.ctx, m = HB.Logic.dims(e);
    const s = buildingSprite(e);
    const gy = e.y + m.h / 2;
    if (sx === 1 && sy === 1) { V.blit(s, e.x, e.y); return s; }
    g.save();
    g.translate(e.x, gy); g.scale(sx, sy);
    V.blit(s, 0, -m.h / 2);
    g.restore();
    return s;
  }

  function riseScale(k) {
    if (k >= 1) return 1;
    if (k < 0.5) return HB.lerp(0.6, 1.15, HB.easeOutCubic(k / 0.5));
    return HB.lerp(1.15, 1.0, (k - 0.5) / 0.5);
  }

  const RECIPE_Y = { smelter: -2.2, ammo_fab: -2.25, export: -1.75, solar: -1.65, dissipator: -2.15 };

  function drawMachine(st, R, e) {
    const g = V.ctx, m = HB.MACHINES[e.type], dm = HB.Logic.dims(e), ve = HB.entVis(e.id);
    const rs = riseScale(ve.rise);
    const sx = rs * (1 + ve.sq * 0.5), sy = rs * (1 - ve.sq);
    const s = drawBuildingSprite(e, sx, sy);
    if (ve.flash > 0) {
      g.save();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, ve.flash);
      g.translate(e.x, e.y + dm.h / 2); g.scale(sx, sy); V.blit(s, 0, -dm.h / 2);
      g.restore();
    }
    if (e.dead) {
      if (Math.random() < 0.05) HB.Fx.smoke(e.x + (Math.random() - 0.5) * dm.w * 0.6, e.y, 0.4);
      vis.labels.push({ k: 'warn', x: e.x, y: e.y - dm.h / 2 - 0.7, s: HB.T('broken'), col: P.orange });
      return;
    }
    const flick = R.power && R.power.f < 1 && (Math.floor(vis.clock * 7 + e.x) % 3 === 0);
    if (m.kind === 'proc') {
      const item = Object.keys(m.inputs)[0];
      const n = Math.max(0, Math.min(8, e.inBuf[item] - (vis.inIn[e.id] || 0)));
      const spr = A.item(item);
      g.save(); g.translate(e.x, e.y + dm.h / 2); g.scale(sx, sy); g.translate(-e.x, -(e.y + dm.h / 2));
      for (let i = 0; i < n; i++) { HB.slot.hopper(e, i, tmpP); V.blit(spr, tmpP.x, tmpP.y, 0.75); }
      g.restore();
      const top = e.y + dm.h / 2 - 0.12 - m.z, side = e.flip ? -1 : 1;
      if (e.type === 'smelter' && e.busy && !flick) {
        // la puerta del horno respira cuando trabaja
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.35 + Math.sin(vis.clock * 9 + e.x) * 0.12;
        V.blit(glowSprite(P.orange), e.x, e.y + dm.h / 2 - 0.55, 1.6);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      } else if (e.type === 'ammo_fab') {
        // el martillo de la prensa
        const k = e.busy ? Math.abs(Math.sin(vis.clock * 7)) : 0;
        const hx = e.x + side * 0.55, hy = top - 1.25 + k * 0.62;
        D.rr(g, hx - 0.3, hy, 0.6, 0.2, 0.04); D.fillStroke(g, P.steelD, 0.05);
      }
    } else if (m.kind === 'export') {
      let i = 0;
      const hidden = vis.goodsIn[e.id] || 0;
      const total = HB.Logic.totalIn(e) - hidden;
      for (const it of m.accepts) {
        const spr = A.item(it);
        for (let k = 0; k < e.inBuf[it] && i < Math.min(24, total); k++, i++) {
          HB.slot.goods(e, i, tmpP); V.blit(spr, tmpP.x, tmpP.y);
        }
      }
      const blink = vis.ship.st === 'land' ? (Math.floor(vis.clock * 8) % 2) : 0;
      for (const c of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        D.ellipse(g, e.x + c[0] * (dm.w / 2 - 0.15), e.y - 0.12 + c[1] * (dm.h / 2 - 0.2), 0.08, 0.06);
        g.fillStyle = blink ? '#fff6a8' : P.yellow; g.fill();
        g.lineWidth = 0.03; g.strokeStyle = P.ink; g.stroke();
      }
    } else if (m.kind === 'cool') {
      // aspas del ventilador
      const cx = e.x, cy = e.y + dm.h / 2 - 0.05 - m.z - 0.48;
      const a0 = flick ? 0 : vis.clock * 9;
      g.strokeStyle = '#cfe8ef'; g.lineWidth = 0.07;
      for (let i = 0; i < 3; i++) {
        const a = a0 + i * Math.PI * 2 / 3;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 0.33, cy + Math.sin(a) * 0.19); g.stroke();
      }
      if (!flick) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3;
        V.blit(glowSprite(P.tealL), cx, cy - 0.3, 1.2);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      }
    }
    if (flick) {
      // brownout: las luces parpadean (funcional 5.3)
      g.globalAlpha = 0.28; g.fillStyle = '#0b0f14';
      g.fillRect(e.x - dm.w / 2, e.y - dm.h / 2 - m.z - 0.5, dm.w, dm.h + m.z + 0.4);
      g.globalAlpha = 1;
    }
    // cartel de receta: qué entra y qué sale
    const rec = A.recipe(e.type);
    if (rec) {
      const near = HB.dist(st.cmd.x, st.cmd.y, e.x, e.y) < 4.5;
      g.globalAlpha = near ? 1 : 0.6;
      V.blit(rec, e.x + (e.type === 'export' ? 0.6 : 0), e.y + RECIPE_Y[e.type], 0.85);
      g.globalAlpha = 1;
    }
    hpLabel(e, e.y - dm.h / 2 - m.z - 0.35);
    const stt = HB.Logic.status(R, e);
    if (stt && stt !== 'dead') {
      const key = { full: 'output_full', starve: 'no_input', vault: 'vault_full', power: 'low_power', noammo: 'no_ammo' }[stt];
      vis.labels.push({ k: 'warn', x: e.x, y: e.y - dm.h / 2 - m.z - 0.75, s: HB.T(key) });
    }
    // interruptor DEFENSA / EQUILIBRIO / BENEFICIO en la salida, si un dron la lleva a exportar
    if (m.kind === 'proc' && exportsByDrone(R, e)) prioSwitch(e);
  }

  function hpLabel(e, y) {
    const max = HB.MACHINES[e.type].hp;
    if (e.hp < max && !e.dead) vis.labels.push({ k: 'hp', x: e.x, y: y, f: e.hp / max });
  }

  function exportsByDrone(R, e) {
    for (const p of R.ents) {
      if (HB.MACHINES[p.type].kind !== 'dronepad' || p.route.kind !== 'cargo' || p.route.from !== e.id) continue;
      const dst = R._byId[p.route.to];
      if (dst && HB.MACHINES[dst.type].kind === 'export') return true;
    }
    return false;
  }

  function prioSwitch(e) {
    const p = HB.Logic.padPos(e, 'out');
    const s = e.flip ? -1 : 1;
    vis.labels.push({ k: 'prio', x: p.x + s * 0.2, y: p.y + 0.95, e: e });
  }

  function drawTurret(st, R, e) {
    const g = V.ctx, ve = HB.entVis(e.id), T = HB.MACHINES[e.type];
    const rs = riseScale(ve.rise);
    if (e.dead) { drawBuildingSprite(e, rs, rs); vis.labels.push({ k: 'warn', x: e.x, y: e.y - 1.1, s: HB.T('broken'), col: P.orange }); return; }
    drawBuildingSprite(e, rs, rs);
    const hx = e.x, hy = e.y - 0.42;
    g.save(); g.translate(hx, hy); g.scale(rs, rs); g.rotate(e.aim);
    const recoil = ve.muzzle > 0 ? -0.06 : 0;
    V.blit(A.turretHead(e.type), recoil, 0);
    g.restore();
    if (ve.muzzle > 0) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, ve.muzzle * 12);
      V.blit(glowSprite(P.yellow), hx + Math.cos(e.aim) * 0.7, hy + Math.sin(e.aim) * 0.7, e.type === 'cannon' ? 1.0 : 0.6);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    // niveles
    for (let i = 0; i < 3; i++) {
      D.ellipse(g, e.x - 0.17 + i * 0.17, e.y + 0.42, 0.055, 0.05);
      g.fillStyle = i < e.level ? P.yellow : 'rgba(28,33,38,0.5)'; g.fill();
    }
    // la caja de munición: 5 huecos que se vacían (funcional 9.1)
    const bp = HB.Logic.padPos(e, 'box', R.id);
    const crates = e.ammo / T.shots;
    for (let i = 0; i < T.box; i++) {
      const x = bp.x - 0.44 + i * 0.22, y = bp.y - 0.55;
      const f = HB.clamp(crates - i, 0, 1);
      D.rr(g, x - 0.09, y - 0.09, 0.18, 0.18, 0.03);
      g.fillStyle = 'rgba(28,33,38,0.7)'; g.fill();
      if (f > 0) { D.rr(g, x - 0.09, y + 0.09 - 0.18 * f, 0.18, 0.18 * f, 0.03); g.fillStyle = f >= 1 ? P.oliveL : P.yellow; g.fill(); }
      D.rr(g, x - 0.09, y - 0.09, 0.18, 0.18, 0.03); g.lineWidth = 0.03; g.strokeStyle = P.ink; g.stroke();
    }
    hpLabel(e, e.y - 1.15);
    if (e.ammo <= 0) vis.labels.push({ k: 'warn', x: e.x, y: e.y - 1.45, s: HB.T('no_ammo') });
  }

  function drawWall(st, R, e) {
    const ve = HB.entVis(e.id);
    drawBuildingSprite(e, 1, riseScale(ve.rise));
    hpLabel(e, e.y - 1.0);
    if (e.dead) vis.labels.push({ k: 'warn', x: e.x, y: e.y - 0.9, s: HB.T('broken'), col: P.orange });
  }

  function drawOutPile(e) {
    if (e.dead) return;
    const def = HB.MACHINES[e.type];
    const n = Math.max(0, Math.min(20, e.out - (vis.outIn[e.id] || 0)));
    const spr = A.item(def.output);
    for (let i = 0; i < n; i++) { HB.slot.out(e, i, tmpP); V.blit(spr, tmpP.x, tmpP.y); }
    if (e.out >= HB.Logic.level(e).outCap) {
      const p = HB.Logic.padPos(e, 'out');
      vis.labels.push({ k: 'max', x: p.x, y: p.y - 0.4 - Math.ceil(n / 4) * HB.ITEMS[def.output].h });
    }
  }

  function drawBills(R, e) {
    // Lo dibujado nunca supera lo que hay de verdad: si el comandante cobra mientras los billetes
    // de la nave aún caen, los que aterrizan después no pueden dejar un montón fantasma.
    if (vis.pileShown > R.pile) vis.pileShown = R.pile;
    const n = HB.slot.billCount(vis.pileShown);
    const spr = A.item('bill');
    for (let i = 0; i < n; i++) { HB.slot.bill(e, i, tmpP); V.blit(spr, tmpP.x, tmpP.y); }
    if (vis.pileShown >= 1) {
      const p = HB.Logic.padPos(e, 'pile');
      vis.labels.push({ k: 'cash', x: p.x, y: p.y - 0.75, s: HB.money(vis.pileShown) });
    }
  }

  // ---------- Comandante y su pila ----------
  function drawStack(st, bx, by) {
    const c = st.cmd;
    vis.stackBase.x = bx; vis.stackBase.y = by;
    const n = Math.min(c.stack.length, HB.CONFIG.cmd.stackDraw);
    let y = 0;
    for (let i = 0; i < n; i++) { vis.slotY[i] = y; y += HB.ITEMS[c.stack[i]].h; }
    vis.slotY[n] = y;
    const shown = Math.max(0, n - vis.stackIn);
    for (let i = 0; i < shown; i++) V.blit(A.item(c.stack[i]), bx + lean(i), by - vis.slotY[i]);
    vis.stackTop = by - vis.slotY[shown];
  }

  function faceFrom(a) {
    const cx = Math.cos(a), cy = Math.sin(a);
    return Math.abs(cx) > Math.abs(cy) * 0.9 ? (cx > 0 ? 1 : 3) : (cy > 0 ? 0 : 2);
  }

  function drawCommander(st, x, y, dt) {
    const c = st.cmd, g = V.ctx, k = 1.25;
    if (c.deadT > 0) {
      // caído: tumbado y medio transparente hasta que reaparece (funcional 4.3)
      g.save(); g.globalAlpha = 0.55; g.translate(x, y); g.rotate(Math.PI / 2); g.scale(k, k);
      A.commander(g, 0, 0, 1, 0, false, null);
      g.restore(); g.globalAlpha = 1;
      vis.labels.push({ k: 'respawn', x: x, y: y - 1.0, s: String(Math.ceil(c.deadT)) });
      return;
    }
    if (c.moving) { vis.phase += dt * 14; vis.face = faceFrom(c.face); }
    else if (c.aimT > 0) vis.face = faceFrom(c.aim);
    g.save(); g.translate(x, y); g.scale(k, k);
    A.commander(g, 0, 0, vis.face, vis.phase, c.moving, function (bx, by) {
      g.save(); V.world(); drawStack(st, x + bx * k, y + by * k); g.restore();
    });
    g.restore();
    if (vis.cmdMuzzle > 0) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, vis.cmdMuzzle * 14);
      V.blit(glowSprite(P.yellow), x + Math.cos(c.aim) * 0.45, y - 0.45 + Math.sin(c.aim) * 0.3, 0.5);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    if (c.hp < HB.CONFIG.cmd.hp) vis.labels.push({ k: 'hp', x: x, y: y - 1.45, f: c.hp / HB.CONFIG.cmd.hp, cmd: true });
  }

  // ---------- Bichos ----------
  function drawBug(b) {
    const g = V.ctx, E = HB.ENEMIES[b.type];
    const fr = (Math.floor(vis.clock * (b.st === 'move' ? 10 : 4) + b.id) % 2);
    const sh = A.bugShadow();
    V.blit(sh, b.x, b.y + 0.05, b.r * 2.3);
    const spr = A.bug(b.type, fr);
    g.save(); g.translate(b.x, b.y - b.z - (E.boss ? 0.2 : 0.05)); g.rotate(b.dir);
    if (b.st === 'atk') g.translate(Math.sin(vis.clock * 18 + b.id) * 0.04, 0);
    V.blit(spr, 0, 0);
    if (b.hitT > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.8; V.blit(spr, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    g.restore();
    if (E.boss || ((b.type === 'crusher' || b.type === 'leaper') && b.hp < b.maxHp)) {
      vis.labels.push({ k: 'hp', x: b.x, y: b.y - b.r - 0.35, f: b.hp / b.maxHp, bug: true, big: E.boss });
    }
    if (b.type === 'gilded' && Math.random() < 0.3) HB.Fx.sparks(b.x, b.y, 0.2, 1, P.yellow);
  }

  // ---------- Lo que vuela ----------
  function drawShip(R, e, dt) {
    const g = V.ctx, sv = vis.ship, sh = e.ship, S = HB.CONFIG.ship;
    if (sh.st !== sv.st) { sv.st = sh.st; sv.t = sh.st === 'away' ? 0 : S[sh.st] !== undefined ? S[sh.st] : 0; }
    else sv.t = Math.max(0, sv.t - dt);
    let alt;
    if (sv.st === 'land') alt = HB.lerp(10, 1.15, HB.easeOutCubic(1 - sv.t / S.land));
    else if (sv.st === 'load') alt = 1.15 + Math.sin(vis.clock * 3) * 0.06;
    else if (sv.st === 'leave') alt = 1.15 + HB.easeInCubic(1 - sv.t / S.leave) * 12;
    else return;
    vis.shipAlt = alt;
    const x = e.x, gy = e.y - 0.12;
    const sa = HB.clamp(1 - alt / 10, 0, 1);
    g.fillStyle = 'rgba(20,15,10,' + (0.32 * sa) + ')';
    D.ellipse(g, x, gy + 0.05, 1.1 * (0.6 + sa * 0.4), 0.45 * (0.6 + sa * 0.4)); g.fill();
    if (sv.st === 'load') {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.35 + Math.sin(vis.clock * 18) * 0.08;
      const gr = g.createLinearGradient(0, gy - alt, 0, gy);
      gr.addColorStop(0, 'rgba(120,255,240,0.9)'); gr.addColorStop(1, 'rgba(120,255,240,0.1)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x - 0.35, gy - alt + 0.2); g.lineTo(x + 0.35, gy - alt + 0.2); g.lineTo(x + 1.0, gy + 0.1); g.lineTo(x - 1.0, gy + 0.1); g.closePath(); g.fill();
      g.restore();
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of [-1.1, 1.1]) {
      g.globalAlpha = 0.7 + Math.random() * 0.3;
      V.blit(glowSprite(P.orange), x + s, gy - alt + 0.55, 0.9 + Math.random() * 0.2);
    }
    g.restore();
    V.blit(A.ship(), x, gy - alt);
  }

  function drawDrones(R, shadows) {
    const g = V.ctx;
    if (!R._drones) return;
    const body = A.drone();
    for (const d of R._drones) {
      if (!V.onScreen(d.x, d.y)) continue;
      const drop = d.drop > 0 ? d.drop : 0;
      const alt = 0.95 + drop * 5 + Math.sin(vis.clock * 4 + d.idx) * 0.05;
      if (shadows) { g.fillStyle = 'rgba(20,15,10,0.22)'; D.ellipse(g, d.x, d.y + 0.05, 0.28, 0.1); g.fill(); continue; }
      const y = d.y - alt;
      // lo que lleva, colgando debajo
      for (let i = 0; i < Math.min(3, d.carry.length); i++) V.blit(A.item(d.carry[i]), d.x, y + 0.42 - i * 0.12, 0.7);
      if (drop > 0) {
        // baja en paracaídas (funcional 13.2: «el dron baja en paracaídas»)
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.025;
        g.beginPath(); g.moveTo(d.x - 0.2, y); g.lineTo(d.x - 0.4, y - 0.7); g.moveTo(d.x + 0.2, y); g.lineTo(d.x + 0.4, y - 0.7); g.stroke();
        g.beginPath(); g.ellipse(d.x, y - 0.75, 0.5, 0.3, 0, Math.PI, 0); g.closePath();
        D.fillStroke(g, P.orange, 0.04);
      }
      V.blit(body, d.x, y);
      // hélices
      g.fillStyle = 'rgba(255,255,255,0.45)';
      const sp = vis.clock * 30;
      for (const p of [[-0.24, -0.16], [0.24, -0.16], [-0.24, 0.16], [0.24, 0.16]]) {
        D.ellipse(g, d.x + p[0], y + p[1], 0.13, 0.04 + Math.abs(Math.sin(sp + p[0] * 9)) * 0.03); g.fill();
      }
    }
  }

  function drawShots(R, dt) {
    const g = V.ctx;
    // trazos de las Gatling y del comandante
    g.globalCompositeOperation = 'lighter';
    for (let i = vis.tracers.length - 1; i >= 0; i--) {
      const t = vis.tracers[i];
      t.t += dt;
      if (t.t > 0.09) { vis.tracers.splice(i, 1); continue; }
      g.globalAlpha = 1 - t.t / 0.09;
      g.strokeStyle = t.col; g.lineWidth = 0.06;
      g.beginPath(); g.moveTo(t.x0, t.y0); g.lineTo(t.x1, t.y1); g.stroke();
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // obuses del cañón: bola con arco
    for (const s of R._shots || []) {
      const k = Math.min(1, s.t / s.dur);
      const x = HB.lerp(s.x, s.tx, k), y = HB.lerp(s.y, s.ty, k) - Math.sin(Math.PI * k) * 0.9;
      D.ellipse(g, x, y, 0.1, 0.1); D.fillStroke(g, '#2b3135', 0.03);
      g.fillStyle = '#ffffff'; D.ellipse(g, x - 0.03, y - 0.03, 0.03, 0.03); g.fill();
    }
    // ataque orbital en camino: diana roja que se cierra
    for (const s of R._strikes || []) {
      const k = 1 - s.t / HB.CONFIG.orbital.delay, r = HB.CONFIG.orbital.radius;
      g.lineWidth = 0.08; g.strokeStyle = '#ff3b3b'; g.setLineDash([0.25, 0.15]);
      D.ellipse(g, s.x, s.y, r * (1.3 - k * 0.3), r * 0.6 * (1.3 - k * 0.3)); g.stroke(); g.setLineDash([]);
      g.globalAlpha = 0.25 + k * 0.4; g.fillStyle = '#ff3b3b';
      D.ellipse(g, s.x, s.y, r * k, r * 0.6 * k); g.fill(); g.globalAlpha = 1;
    }
  }

  // ---------- La noche: tinte azul y bordes rojos que laten ----------
  function drawNight(st, R) {
    const g = V.ctx;
    const night = R.phase === 'night', warn = R.phase === 'warn';
    if (!night && !warn) return;
    const ww = V.gw, hh = V.gh;
    if (night) { g.fillStyle = 'rgba(10,20,60,0.3)'; g.fillRect(V.gx, 0, ww, hh); }
    const pulse = 0.5 + Math.sin(vis.clock * (warn ? 6 : 3)) * 0.5;
    g.globalAlpha = (warn ? 0.35 : 0.22) + pulse * (warn ? 0.4 : 0.18);
    g.drawImage(A.vignette(ww, hh), V.gx, 0, ww, hh);
    g.globalAlpha = 1;
  }

  // Flechas en el borde por donde llegarán los bichos (lenguaje de CORE, funcional 3.2).
  function drawFlankArrows(st, R) {
    const g = V.ctx, list = [];
    if (R.phase === 'warn' && R._plan) for (const f of R._plan.flanks) list.push(f);
    if (R.phase === 'night' && R._night) {
      for (const gr of R._night.groups) if (!gr.done && gr.t - R._night.t < 3 && list.indexOf(gr.flank) < 0) list.push(gr.flank);
    }
    if (!list.length) return;
    const pulse = 1 + Math.sin(vis.clock * 8) * 0.12;
    for (const f of list) {
      const down = f === 'n';
      const x = V.gx + V.gw / 2, y = down ? 150 : V.gh - 120;
      g.save(); g.translate(x, y); g.scale(pulse, pulse); if (down) g.rotate(Math.PI);
      g.beginPath(); g.moveTo(0, -34); g.lineTo(30, 0); g.lineTo(12, 0); g.lineTo(12, 26); g.lineTo(-12, 26); g.lineTo(-12, 0); g.lineTo(-30, 0); g.closePath();
      g.fillStyle = '#ff3b3b'; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
      g.restore();
      V.text('!', x, y + (down ? -6 : 6), 28, '#ffffff', P.ink);
    }
  }

  // ---------- Etiquetas (en píxeles de pantalla) ----------
  function pill(x, y, w, h, fill) {
    const g = V.ctx;
    D.rr(g, x - w / 2, y - h / 2, w, h, h / 2);
    g.fillStyle = fill; g.fill();
    g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
  }
  HB.pill = pill;

  function drawLabels(st) {
    const g = V.ctx, T = V.tile, pt = {};
    vis.taps.length = 0;
    for (const L of vis.labels) {
      V.w2s(L.x, L.y, pt);
      if (L.k === 'price') {
        const fs = T * (L.s.length > 4 ? 0.48 : 0.56);
        V.text(L.s, pt.x, pt.y + 2, fs, L.can ? '#ffffff' : '#d9dde0', P.ink);
        if (L.sub) { const q = V.w2s(L.x, L.subY, {}); V.text(L.sub, q.x, q.y, T * 0.4, P.yellow, P.ink); }
      } else if (L.k === 'warn') {
        const bob = Math.sin(vis.clock * 4) * 2;
        g.font = V.font(T * 0.42);
        const w = g.measureText(L.s).width + T * 0.5;
        pill(pt.x, pt.y + bob, w, T * 0.52, L.col || P.amber);
        V.text(L.s, pt.x, pt.y + bob + 1, T * 0.42, P.ink, null);
      } else if (L.k === 'max') {
        const b = 1 + Math.sin(vis.clock * 7) * 0.08;
        V.text(HB.T('max'), pt.x, pt.y, T * 0.5 * b, P.amber, P.ink);
      } else if (L.k === 'cash') {
        V.text(L.s, pt.x, pt.y, T * 0.5, P.cashL, P.ink);
      } else if (L.k === 'hp') {
        const w = L.big ? T * 2.4 : T * 0.9, h = L.big ? 9 : 6;
        D.rr(g, pt.x - w / 2 - 1, pt.y - h / 2 - 1, w + 2, h + 2, 3); g.fillStyle = P.ink; g.fill();
        g.fillStyle = L.bug ? P.acid : (L.f > 0.5 ? P.cashL : (L.f > 0.25 ? P.amber : '#ff5a5a'));
        g.fillRect(pt.x - w / 2, pt.y - h / 2, w * HB.clamp(L.f, 0, 1), h);
        if (L.big) V.text(HB.T('boss_name'), pt.x, pt.y - 14, 18, '#ffffff', P.ink);
      } else if (L.k === 'nest') {
        V.text(L.s, pt.x, pt.y, T * 0.5, P.acid, P.ink);
        g.font = V.font(T * 0.34);
        const w = g.measureText(L.sub).width;
        V.text(L.sub, pt.x - 8, pt.y + T * 0.42, T * 0.34, '#ffffff', P.ink);
        D.ellipse(g, pt.x + w / 2 + 4, pt.y + T * 0.42, 7, 7); g.fillStyle = L.col; g.fill(); g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
      } else if (L.k === 'respawn') {
        V.text(L.s, pt.x, pt.y, T * 0.7, '#ffffff', P.ink);
      } else if (L.k === 'prio') {
        // interruptor que se toca: cambia DEFENSA → EQUILIBRIO → BENEFICIO
        const e = L.e, key = 'prio_' + (e.prio || 'balanced');
        const col = e.prio === 'defense' ? P.tealL : (e.prio === 'profit' ? P.cashL : P.yellow);
        g.font = V.font(T * 0.36);
        const w = g.measureText(HB.T(key)).width + T * 0.4;
        pill(pt.x, pt.y, w, T * 0.48, 'rgba(20,24,28,0.85)');
        V.text(HB.T(key), pt.x, pt.y + 1, T * 0.36, col, null);
        vis.taps.push({ x: pt.x, y: pt.y, r: Math.max(26, w / 2), fn: function () { HB.Game.cyclePrio(e); } });
      }
    }
    vis.labels.length = 0;
  }

  function drawStackCounter(st) {
    const c = st.cmd, cap = HB.CONFIG.cmd.stackCap;
    if (!c.stack.length || c.deadT > 0) return;
    const pt = V.w2s(vis.stackBase.x, (vis.stackTop || vis.stackBase.y) - 0.35, {});
    const T = V.tile;
    if (c.stack.length >= cap) {
      const k = Math.min(1, vis.maxT / HB.FX.maxBounce);
      const s = vis.maxT < HB.FX.maxBounce ? 0.6 + HB.easeOutBack(k) * 0.4 : 1 + Math.sin(vis.clock * 6) * 0.04;
      V.text(HB.T('max'), pt.x, pt.y, T * 0.62 * s, P.amber, P.ink);
    } else {
      V.text(c.stack.length + '/' + cap, pt.x, pt.y, T * 0.45, '#ffffff', P.ink);
    }
  }

  function arrowShape(g, x, y, ang, size, col) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath();
    g.moveTo(size, 0); g.lineTo(-size * 0.4, -size * 0.75); g.lineTo(-size * 0.1, 0); g.lineTo(-size * 0.4, size * 0.75);
    g.closePath();
    g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.lineJoin = 'round'; g.stroke();
    g.restore();
  }

  function drawGuide(st, tgt, show) {
    if (!tgt || !show || tgt.kind === 'wait' || tgt.kind === 'defend' || tgt.kind === 'loot') return;
    const c = st.cmd;
    if (HB.dist(c.x, c.y, tgt.x, tgt.y) < 1.0) return;   // si ya está ahí, la flecha sobra
    const g = V.ctx, T = V.tile;
    const bob = Math.abs(Math.sin(vis.clock * 4)) * T * 0.25;
    const p = V.w2s(tgt.x, tgt.y, {});
    const m = T * 0.8;
    const inside = p.x > V.gx + m && p.x < V.gx + V.gw - m && p.y > m * 2 && p.y < V.gh - m;
    const col = tgt.kind === 'refill' ? P.orange : P.yellow;
    if (inside) arrowShape(g, p.x, p.y - T * 1.25 - bob, Math.PI / 2, T * 0.42, col);
    else {
      const cx = V.gx + V.gw / 2, cy = V.gh / 2;
      const a = Math.atan2(p.y - cy, p.x - cx);
      const hw = V.gw / 2 - m, hh = V.gh / 2 - m * 1.5;
      const k = Math.min(Math.abs(hw / Math.cos(a)), Math.abs(hh / Math.sin(a)));
      const pulse = 1 + Math.sin(vis.clock * 6) * 0.08;
      arrowShape(g, cx + Math.cos(a) * k, cy + Math.sin(a) * k, a, T * 0.45 * pulse, col);
    }
  }

  // ---------- Fotograma ----------
  HB.Render = {
    vis: vis,

    frame: function (game, alpha, dt) {
      const st = game.st, R = st.regions[st.cur], c = st.cmd, g = V.ctx;
      vis.clock += dt;
      vis.maxT += dt; vis.trembleT += dt;
      vis.flash = Math.max(0, vis.flash - dt / HB.FX.unlockFlash);
      vis.hurt = Math.max(0, vis.hurt - dt * 3);
      vis.cmdMuzzle = Math.max(0, vis.cmdMuzzle - dt);
      if (vis.fogY === null) vis.fogY = R.fogY;
      vis.fogY += (R.fogY - vis.fogY) * Math.min(1, dt * 1.6);
      if (Math.abs(R.fogY - vis.fogY) < 0.01) vis.fogY = R.fogY;

      // posición interpolada del comandante (la lógica va a 30 Hz, el dibujo a 60)
      const x = HB.lerp(game.prevX, c.x, alpha), y = HB.lerp(game.prevY, c.y, alpha);
      const hi = vis.histI * 3;
      vis.hist[hi] = vis.clock; vis.hist[hi + 1] = x; vis.hist[hi + 2] = y;
      vis.histI = (vis.histI + 1) % 64; vis.histN = Math.min(64, vis.histN + 1);

      for (const id in vis.ent) {
        const v = vis.ent[id];
        const a = -260 * v.sq - 16 * v.sqv;
        v.sqv += a * dt; v.sq += v.sqv * dt;
        if (Math.abs(v.sq) < 0.0005 && Math.abs(v.sqv) < 0.01) { v.sq = 0; v.sqv = 0; }
        if (v.rise < 1) v.rise = Math.min(1, v.rise + dt / HB.FX.rise);
        if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 2.5);
        if (v.muzzle > 0) v.muzzle = Math.max(0, v.muzzle - dt);
      }
      HB.Fx.update(dt);
      updateCamera(st, x, y, dt);

      V.screen();
      g.fillStyle = '#121519';
      g.fillRect(0, 0, V.cssW, V.cssH);

      // En pantallas más anchas que el juego (ordenador, móvil en horizontal) el mundo se recorta
      // a la columna: si no, se veía lo de fuera del mapa moverse con la cámara. En un móvil en
      // vertical la columna ocupa toda la pantalla y no se recorta nada.
      const clip = V.gx > 0;
      if (clip) { g.save(); g.beginPath(); g.rect(V.gx, 0, V.gw, V.gh); g.clip(); }

      V.world();
      drawGround(R);
      drawPads(st, R);
      drawDronePads(st, R);
      drawZones(st, R, vis.clock);
      drawLootGround(R);
      drawDrones(R, true);

      // cosas con profundidad: se ordenan por su borde delantero
      const list = game.drawList || (game.drawList = []);
      list.length = 0;
      for (const v of R.veins) if (V.onScreen(v.x, v.y)) list.push({ y: v.y + 0.35, k: 0, o: v });
      let ex = null;
      for (const e of R.ents) {
        const m = HB.MACHINES[e.type], dm = HB.Logic.dims(e);
        if (m.kind === 'export') ex = e;
        if (m.kind === 'dronepad' || !V.onScreen(e.x, e.y, 4)) continue;
        list.push({ y: e.y + dm.h / 2, k: m.kind === 'turret' ? 7 : (m.kind === 'wall' ? 8 : 1), o: e });
        if (m.kind === 'proc') list.push({ y: HB.Logic.padPos(e, 'out').y + 0.3, k: 2, o: e });
        if (m.kind === 'export') list.push({ y: HB.Logic.padPos(e, 'pile').y + 0.2, k: 3, o: e });
      }
      for (const b of R._bugs || []) if (!b.dead && V.onScreen(b.x, b.y, 2)) list.push({ y: b.y + b.r * 0.5, k: 5, o: b });
      const nestAt = HB.REGIONS[R.id].nestAt;
      if (nestAt && V.onScreen(nestAt.x, nestAt.y, 4)) list.push({ y: nestAt.y + 0.9, k: 6, o: nestAt });
      list.push({ y: y + 0.01, k: 4, o: c });
      list.sort(function (a, b) { return a.y - b.y; });
      for (const it of list) {
        if (it.k === 0) V.blit(A.vein(), it.o.x, it.o.y);
        else if (it.k === 1) drawMachine(st, R, it.o);
        else if (it.k === 2) drawOutPile(it.o);
        else if (it.k === 3) drawBills(R, it.o);
        else if (it.k === 5) drawBug(it.o);
        else if (it.k === 6) {
          V.blit(A.nest(R.cleared), it.o.x, it.o.y);
          if (!R.cleared) {
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 + Math.sin(vis.clock * 2.5) * 0.12;
            V.blit(glowSprite(P.acid), it.o.x, it.o.y - 0.2, 3.2);
            g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
          }
        }
        else if (it.k === 7) drawTurret(st, R, it.o);
        else if (it.k === 8) drawWall(st, R, it.o);
        else drawCommander(st, x, y, dt);
      }
      if (ex) drawShip(R, ex, dt);
      drawDrones(R, false);
      drawShots(R, dt);
      HB.Fx.drawWorld();
      drawFog(R);

      V.screen();
      drawNight(st, R);
      drawFlankArrows(st, R);
      drawLabels(st);
      if (clip) g.restore();
      drawStackCounter(st);
      drawGuide(st, game.target, game.showGuide);
      HB.Fx.drawScreen();
      HB.HUD.draw(game, dt);
      if (vis.flash > 0) {
        g.globalAlpha = vis.flash * 0.55; g.fillStyle = '#ffffff';
        g.fillRect(V.gx, 0, V.gw, V.gh); g.globalAlpha = 1;
      }
      if (vis.hurt > 0) {
        g.globalAlpha = vis.hurt * 0.5;
        g.drawImage(A.vignette(V.gw, V.gh), V.gx, 0, V.gw, V.gh); g.globalAlpha = 1;
      }
    },
  };
})(globalThis.HB);
