// Hive Breaker — dibujo de cada fotograma.
//
// Orden: suelo (en caché) → zonas del suelo → cosas ordenadas por profundidad (vetas,
// máquinas, montones, comandante) → nave → efectos → niebla → etiquetas → HUD.
// Solo se dibuja lo que cae en pantalla (pilar 9).
(function (HB) {
  'use strict';

  const V = HB.View, P = HB.PAL, D = HB.Draw, A = HB.Art;

  // Estado solo visual (no se guarda). Lo llena también 75_juice.js.
  const vis = HB.Vis = {
    ent: {},          // id → { sq, sqv, rise, flash }
    stackIn: 0,       // objetos volando hacia la pila (aún no se dibujan en ella)
    inIn: {},         // id → objetos volando hacia la tolva de la máquina
    outIn: {},        // id → objetos volando de la máquina a su montón de salida
    goodsIn: {},      // id → objetos volando hacia la plataforma de exportación
    pileShown: 0,     // dinero que se ve en el montón de billetes
    credInFlight: 0,  // dinero que aún vuela hacia el contador
    credDisp: 0,      // cifra que enseña el contador (rueda hacia la real)
    credPulse: 0,
    fogY: null,
    hist: new Float32Array(64 * 3), histN: 0, histI: 0,
    phase: 0, face: 0,
    maxT: 9, trembleT: 9,
    stackBase: { x: 0, y: 0 },
    slotY: new Float32Array(64),
    flash: 0,
    ship: { st: 'away', t: 0 },
    idle: 0,
    labels: [],
    ground: null, groundGen: -1, groundS: 0,
    fogEdge: null,
    endT: 0,
    clock: 0,
  };

  HB.entVis = function (id) {
    let v = vis.ent[id];
    if (!v) v = vis.ent[id] = { sq: 0, sqv: 0, rise: 1, flash: 0 };
    return v;
  };

  HB.resetVis = function (st) {
    vis.ent = {}; vis.stackIn = 0; vis.inIn = {}; vis.outIn = {}; vis.goodsIn = {};
    const R = st.regions[st.cur];
    vis.pileShown = R.pile; vis.credInFlight = 0; vis.credDisp = R.credits; vis.fogY = R.fogY;
    vis.histN = 0; vis.flash = 0; vis.ship = { st: 'away', t: 0 };
    HB.Fx.clear();
  };

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
    for (let i = 0; i < 70; i++) {
      g.globalAlpha = 0.28;
      g.fillStyle = rnd() < 0.5 ? P.sandL : P.sandD;
      D.ellipse(g, rnd() * d.w, rnd() * d.h, 0.8 + rnd() * 2, 0.5 + rnd() * 1.2); g.fill();
    }
    g.globalAlpha = 1;
    // grietas
    g.strokeStyle = P.crack; g.lineWidth = 0.035; g.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      let x = rnd() * d.w, y = rnd() * d.h;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 0.9; y += (rnd() - 0.5) * 0.6; g.lineTo(x, y); }
      g.globalAlpha = 0.55; g.stroke();
    }
    g.globalAlpha = 1;
    // piedrecitas
    for (let i = 0; i < 260; i++) {
      const x = rnd() * d.w, y = rnd() * d.h, r = 0.03 + rnd() * 0.07;
      g.fillStyle = P.crack; D.ellipse(g, x, y, r * 1.3, r); g.fill();
      g.fillStyle = P.sandL; D.ellipse(g, x - r * 0.3, y - r * 0.4, r * 0.6, r * 0.4); g.fill();
    }
    // el sur: tierra de bichos (de aquí vendrán por la noche, hito 4)
    const sy = d.h - 3.2;
    const gr = g.createLinearGradient(0, sy, 0, d.h);
    gr.addColorStop(0, 'rgba(90,40,90,0)'); gr.addColorStop(1, 'rgba(70,25,80,0.55)');
    g.fillStyle = gr; g.fillRect(0, sy, d.w, d.h - sy);
    for (let i = 0; i < 16; i++) {
      const x = rnd() * d.w, y = sy + 1 + rnd() * 2.2;
      g.globalAlpha = 0.45; g.fillStyle = P.bug; D.ellipse(g, x, y, 0.3 + rnd() * 0.5, 0.15 + rnd() * 0.2); g.fill();
      g.globalAlpha = 0.8; g.fillStyle = P.acid; D.ellipse(g, x + 0.1, y - 0.03, 0.05, 0.03); g.fill();
    }
    g.globalAlpha = 1;
    // bordes rocosos del mapa
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
    // Hueco i de la pila del comandante (según el último fotograma dibujado).
    stack: function (i, out) {
      const b = vis.stackBase;
      i = Math.min(i, HB.CONFIG.cmd.stackDraw - 1);
      out.x = b.x + lean(i); out.y = b.y - vis.slotY[i] - 0.1; out.z = 0;
      return out;
    },
    // Montón de la salida de una máquina: 4 por capa.
    out: function (e, i, out) {
      const p = HB.Logic.padPos(e, 'out');
      const it = HB.MACHINES[e.type].output, h = HB.ITEMS[it].h;
      const layer = Math.floor(i / 4), k = i % 4;
      out.x = p.x + (k % 2 ? 0.18 : -0.18); out.y = p.y + (k < 2 ? -0.06 : 0.14) - layer * h; out.z = 0;
      return out;
    },
    // Tolva en el tejado de una máquina.
    hopper: function (e, i, out) {
      const m = HB.MACHINES[e.type], s = e.flip ? -1 : 1;
      const cx = e.x + s * (-m.w / 2 + 0.45), cy = e.y + m.h / 2 - 0.12 - m.z - 0.55;
      i = Math.min(i, 7);
      out.x = cx + ((i % 4) - 1.5) * 0.15; out.y = cy - Math.floor(i / 4) * 0.12; out.z = 0;
      return out;
    },
    chute: function (e, out) {
      const m = HB.MACHINES[e.type], s = e.flip ? -1 : 1;
      out.x = e.x + s * (m.w / 2 + 0.3); out.y = e.y + m.h / 2 - 0.4; out.z = 0;
      return out;
    },
    // Mercancía sobre la plataforma de exportación: 6 por capa.
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

  // ---------- Partes del dibujo ----------
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
      if (p.kind === 'zone' || !V.onScreen(p.x, p.y)) continue;
      const e = p.e, def = HB.MACHINES[e.type];
      if (p.kind === 'pile') { V.blit(A.pad('pile', 0, null), p.x, p.y); continue; }
      const toMachine = e.x > p.x ? 1 : -1;
      if (p.kind === 'in') {
        const item = def.kind === 'proc' ? Object.keys(def.inputs)[0] : null;
        V.blit(A.pad('in', toMachine, item), p.x, p.y);
      } else {
        V.blit(A.pad('out', -toMachine, def.output), p.x, p.y);
      }
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
      if (z.kind === 'machine') {
        const m = HB.MACHINES[z.type];
        g.globalAlpha = 0.2;
        drawMachineSprite({ x: z.x, y: z.y, type: z.type, flip: z.flip, level: 1, id: '_ghost' }, 1, 1);
        g.globalAlpha = 0.7;
        g.setLineDash([0.18, 0.12]); g.lineWidth = 0.05; g.strokeStyle = '#ffffff';
        g.strokeRect(z.x - m.w / 2, z.y - m.h / 2, m.w, m.h); g.setLineDash([]);
        g.globalAlpha = 1;
      } else if (z.kind === 'vein') {
        g.globalAlpha = 0.25; V.blit(A.vein(), z.x, z.y); g.globalAlpha = 1;
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
      // icono arriba y precio abajo, dentro de la zona: así no tapa los edificios de alrededor
      V.blit(A.zoneIcon(z), p.x, p.y - 0.24, 0.6);
      let sub = null;
      if (z.kind === 'upgrade') {
        const e = R._byId[z.target];
        if (e) sub = HB.T('lvl', e.level + 1);
      }
      vis.labels.push({ k: 'price', x: p.x, y: p.y + 0.2, s: HB.money(pr - paid), can: can, sub: sub, subY: p.y + 0.98 });
    }
  }

  function drawMachineSprite(e, sx, sy) {
    const g = V.ctx, m = HB.MACHINES[e.type];
    let s;
    if (e.type === 'smelter') s = A.smelter(e.flip, e.level);
    else if (e.type === 'ammo_fab') s = A.ammo_fab(e.flip, e.level);
    else if (e.type === 'export') s = A.export();
    else s = A.hq();
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

  function drawMachine(st, R, e) {
    const g = V.ctx, m = HB.MACHINES[e.type], ve = HB.entVis(e.id);
    const rs = riseScale(ve.rise);
    const sx = rs * (1 + ve.sq * 0.5), sy = rs * (1 - ve.sq);
    const s = drawMachineSprite(e, sx, sy);
    if (ve.flash > 0) {
      g.save();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, ve.flash);
      g.translate(e.x, e.y + m.h / 2); g.scale(sx, sy); V.blit(s, 0, -m.h / 2);
      g.restore();
    }
    // tolva: lo que espera dentro de la máquina
    if (m.kind === 'proc') {
      const item = Object.keys(m.inputs)[0];
      const n = Math.max(0, Math.min(8, e.inBuf[item] - (vis.inIn[e.id] || 0)));
      const spr = A.item(item);
      g.save(); g.translate(e.x, e.y + m.h / 2); g.scale(sx, sy); g.translate(-e.x, -(e.y + m.h / 2));
      for (let i = 0; i < n; i++) { HB.slot.hopper(e, i, tmpP); V.blit(spr, tmpP.x, tmpP.y, 0.75); }
      g.restore();
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
      // luces de las esquinas: parpadean cuando viene la nave
      const blink = vis.ship.st === 'land' ? (Math.floor(vis.clock * 8) % 2) : 0;
      for (const c of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        D.ellipse(g, e.x + c[0] * (m.w / 2 - 0.15), e.y - 0.12 + c[1] * (m.h / 2 - 0.2), 0.08, 0.06);
        g.fillStyle = blink ? '#fff6a8' : P.yellow; g.fill();
        g.lineWidth = 0.03; g.strokeStyle = P.ink; g.stroke();
      }
    }
    const stt = HB.Logic.status(R, e);
    if (stt) {
      const key = stt === 'full' ? 'output_full' : (stt === 'starve' ? 'no_input' : 'vault_full');
      vis.labels.push({ k: 'warn', x: e.x, y: e.y - m.h / 2 - m.z - 0.75, s: HB.T(key) });
    }
  }

  function drawOutPile(e) {
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
    const n = HB.slot.billCount(vis.pileShown);
    const spr = A.item('bill');
    for (let i = 0; i < n; i++) { HB.slot.bill(e, i, tmpP); V.blit(spr, tmpP.x, tmpP.y); }
    if (vis.pileShown >= 1) {
      const p = HB.Logic.padPos(e, 'pile');
      vis.labels.push({ k: 'cash', x: p.x, y: p.y - 0.75, s: HB.money(vis.pileShown) });
    }
  }

  function drawStack(st, bx, by) {
    const c = st.cmd, g = V.ctx;
    vis.stackBase.x = bx; vis.stackBase.y = by;
    const n = Math.min(c.stack.length, HB.CONFIG.cmd.stackDraw);
    let y = 0;
    for (let i = 0; i < n; i++) { vis.slotY[i] = y; y += HB.ITEMS[c.stack[i]].h; }
    vis.slotY[n] = y;
    const shown = Math.max(0, n - vis.stackIn);
    for (let i = 0; i < shown; i++) {
      V.blit(A.item(c.stack[i]), bx + lean(i), by - vis.slotY[i]);
    }
    vis.stackTop = by - vis.slotY[shown];
    void g;
  }

  function drawCommander(st, x, y, dt) {
    const c = st.cmd;
    if (c.moving) {
      vis.phase += dt * 14;
      const a = c.face, cx = Math.cos(a), cy = Math.sin(a);
      vis.face = Math.abs(cx) > Math.abs(cy) * 0.9 ? (cx > 0 ? 1 : 3) : (cy > 0 ? 0 : 2);
    }
    // El comandante se dibuja un 25 % más grande que su caja de choque: es el protagonista.
    const g = V.ctx, k = 1.25;
    g.save(); g.translate(x, y); g.scale(k, k);
    A.commander(g, 0, 0, vis.face, vis.phase, c.moving, function (bx, by) {
      g.save(); V.world(); drawStack(st, x + bx * k, y + by * k); g.restore();
    });
    g.restore();
  }

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
    // sombra
    const sa = HB.clamp(1 - alt / 10, 0, 1);
    g.fillStyle = 'rgba(20,15,10,' + (0.32 * sa) + ')';
    D.ellipse(g, x, gy + 0.05, 1.1 * (0.6 + sa * 0.4), 0.45 * (0.6 + sa * 0.4)); g.fill();
    // rayo tractor
    if (sv.st === 'load') {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.35 + Math.sin(vis.clock * 18) * 0.08;
      const gr = g.createLinearGradient(0, gy - alt, 0, gy);
      gr.addColorStop(0, 'rgba(120,255,240,0.9)'); gr.addColorStop(1, 'rgba(120,255,240,0.1)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x - 0.35, gy - alt + 0.2); g.lineTo(x + 0.35, gy - alt + 0.2); g.lineTo(x + 1.0, gy + 0.1); g.lineTo(x - 1.0, gy + 0.1); g.closePath(); g.fill();
      g.restore();
    }
    // llamas de los motores
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of [-1.1, 1.1]) {
      g.globalAlpha = 0.7 + Math.random() * 0.3;
      V.blit(V.sprite('glow:' + P.orange, 1, 1, 0.5, 0.5, function (q) {
        const gr2 = q.createRadialGradient(0, 0, 0, 0, 0, 0.5);
        gr2.addColorStop(0, '#ffffff'); gr2.addColorStop(0.25, P.orange); gr2.addColorStop(1, 'rgba(0,0,0,0)');
        q.fillStyle = gr2; q.fillRect(-0.5, -0.5, 1, 1);
      }), x + s, gy - alt + 0.55, 0.9 + Math.random() * 0.2);
    }
    g.restore();
    V.blit(A.ship(), x, gy - alt);
  }

  // ---------- Etiquetas, flecha y HUD (en píxeles de pantalla) ----------
  function pill(x, y, w, h, fill) {
    const g = V.ctx;
    D.rr(g, x - w / 2, y - h / 2, w, h, h / 2);
    g.fillStyle = fill; g.fill();
    g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
  }

  function drawLabels(st) {
    const g = V.ctx, T = V.tile, pt = {};
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
        pill(pt.x, pt.y + bob, w, T * 0.52, P.amber);
        V.text(L.s, pt.x, pt.y + bob + 1, T * 0.42, P.ink, null);
      } else if (L.k === 'max') {
        const b = 1 + Math.sin(vis.clock * 7) * 0.08;
        V.text(HB.T('max'), pt.x, pt.y, T * 0.5 * b, P.amber, P.ink);
      } else if (L.k === 'cash') {
        V.text(L.s, pt.x, pt.y, T * 0.5, P.cashL, P.ink);
      }
    }
    vis.labels.length = 0;
  }

  function drawStackCounter(st) {
    const c = st.cmd, cap = HB.CONFIG.cmd.stackCap;
    if (!c.stack.length) return;
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
    if (!tgt || !show || tgt.kind === 'wait') return;
    // Si ya está ahí, la flecha sobra (y taparía la pila).
    const c = st.cmd;
    if (HB.dist(c.x, c.y, tgt.x, tgt.y) < 1.0) return;
    const g = V.ctx, T = V.tile;
    const bob = Math.abs(Math.sin(vis.clock * 4)) * T * 0.25;
    const p = V.w2s(tgt.x, tgt.y, {});
    const m = T * 0.8;
    const inside = p.x > V.gx + m && p.x < V.gx + V.gw - m && p.y > m * 2 && p.y < V.gh - m;
    if (inside) {
      arrowShape(g, p.x, p.y - T * 1.25 - bob, Math.PI / 2, T * 0.42, P.yellow);
    } else {
      const cx = V.gx + V.gw / 2, cy = V.gh / 2;
      const a = Math.atan2(p.y - cy, p.x - cx);
      const hw = V.gw / 2 - m, hh = V.gh / 2 - m * 1.5;
      const k = Math.min(Math.abs(hw / Math.cos(a)), Math.abs(hh / Math.sin(a)));
      const pulse = 1 + Math.sin(vis.clock * 6) * 0.08;
      arrowShape(g, cx + Math.cos(a) * k, cy + Math.sin(a) * k, a, T * 0.45 * pulse, P.yellow);
    }
  }

  function gear(g, x, y, r) {
    g.save(); g.translate(x, y);
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, rr = i % 2 ? r * 0.72 : r;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath(); g.fillStyle = '#e8ecee'; g.fill(); g.lineWidth = 2; g.strokeStyle = P.ink; g.stroke();
    g.beginPath(); g.arc(0, 0, r * 0.32, 0, Math.PI * 2); g.fillStyle = P.ink; g.fill();
    g.restore();
  }

  HB.HUD = { gear: { x: 0, y: 0, r: 24 } };

  function drawHUD(st, tgt, game, dt) {
    const g = V.ctx, R = st.regions[st.cur];
    // contador de dinero: rueda hacia la cifra real y "late" al recibir
    const target = R.credits - vis.credInFlight;
    const diff = target - vis.credDisp;
    if (Math.abs(diff) < 0.5) vis.credDisp = target;
    else vis.credDisp += diff * Math.min(1, dt / (HB.FX.counterRoll / 4));
    vis.credPulse = Math.max(0, vis.credPulse - dt * 5);
    const sc = 1 + (HB.FX.counterPulse - 1) * vis.credPulse;
    const x = V.gx + 14, y = 14, h = 46;
    const txt = HB.money(Math.max(0, Math.round(vis.credDisp)));
    g.font = V.font(34 * sc);
    const w = Math.max(118, g.measureText(txt).width + 70);
    g.save();
    g.translate(x + 30, y + h / 2); g.scale(sc, sc); g.translate(-(x + 30), -(y + h / 2));
    D.rr(g, x, y, w, h, 14); g.fillStyle = P.hud; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
    const b = A.billHud();
    g.drawImage(b.c, x + 6, y + 4, 54, 40);
    V.text(txt, x + 62, y + h / 2 + 3, 34, '#ffffff', P.ink, 'left');
    g.restore();
    vis.hudCredits = { x: x + 32, y: y + h / 2 };

    // botón de ajustes
    const gx = V.gx + V.gw - 38, gy = 37;
    HB.HUD.gear.x = gx; HB.HUD.gear.y = gy;
    D.ellipse(g, gx, gy, 24, 24); g.fillStyle = P.hud; g.fill();
    gear(g, gx, gy, 14);

    // pista del tutorial (cortita) mientras se aprende el bucle
    const learning = R.bought && Object.keys(R.bought).length < 2;
    let hint = null;
    if (st.ftue.move === undefined) hint = 'hint_drag';
    else if (learning && tgt && tgt.hint) hint = tgt.hint;
    if (hint) {
      const hy = 92 + Math.sin(vis.clock * 3) * 3;
      V.text(HB.T(hint), V.gx + V.gw / 2, hy, 30, P.yellow, P.ink);
    }
    if (st.ftue.move === undefined) drawHand();

    // fin de esta versión
    if (HB.Logic.allBought(R)) {
      vis.endT += dt;
      const a = Math.min(1, vis.endT / 0.5);
      g.globalAlpha = a;
      const pw = Math.min(V.gw - 32, 360), px = V.gx + V.gw / 2;
      D.rr(g, px - pw / 2, 74, pw, 70, 16); g.fillStyle = P.hud; g.fill();
      g.lineWidth = 2; g.strokeStyle = P.yellow; g.stroke();
      V.text(HB.T('end_title'), px, 98, 26, P.yellow, null);
      V.text(HB.T('end_sub'), px, 124, 19, '#ffffff', null, 'center', 500);
      g.globalAlpha = 1;
    }

    if (game.showFps) {
      const cnt = HB.Fx.counts();
      V.text(Math.round(game.fps) + ' FPS · ' + cnt.parts + 'p ' + cnt.flyers + 'f' + (HB.autoLow ? ' · LOW' : ''),
        V.gx + 10, V.gh - 16, 18, '#ffffff', P.ink, 'left', 500);
    }
  }

  function drawHand() {
    const g = V.ctx;
    const t = vis.clock;
    const cx = V.gx + V.gw / 2 + Math.sin(t * 2.2) * V.gw * 0.18, cy = V.gh * 0.72 + Math.cos(t * 4.4) * 8;
    g.globalAlpha = 0.9;
    D.ellipse(g, cx, cy, 26, 26); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke();
    // dedo
    g.save(); g.translate(cx + 10, cy + 14); g.rotate(-0.35);
    D.rr(g, -9, -30, 18, 44, 9); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
    D.rr(g, -16, 2, 32, 30, 12); g.fill(); g.stroke();
    g.restore();
    g.globalAlpha = 1;
  }

  function drawJoystick(inp) {
    if (!inp.active) return;
    const g = V.ctx, R = HB.Input.RADIUS;
    D.ellipse(g, inp.ox, inp.oy, R, R);
    g.fillStyle = 'rgba(20,24,28,0.25)'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.stroke();
    D.ellipse(g, inp.kx, inp.ky, R * 0.45, R * 0.45);
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill(); g.lineWidth = 3; g.strokeStyle = P.ink; g.stroke();
  }

  // ---------- Fotograma ----------
  HB.Render = {
    vis: vis,

    frame: function (game, alpha, dt) {
      const st = game.st, R = st.regions[st.cur], c = st.cmd, g = V.ctx;
      vis.clock += dt;
      vis.maxT += dt; vis.trembleT += dt;
      vis.flash = Math.max(0, vis.flash - dt / HB.FX.unlockFlash);
      if (vis.fogY === null) vis.fogY = R.fogY;
      vis.fogY += (R.fogY - vis.fogY) * Math.min(1, dt * 1.6);
      if (Math.abs(R.fogY - vis.fogY) < 0.01) vis.fogY = R.fogY;

      // posición interpolada del comandante (la lógica va a 30 Hz, el dibujo a 60)
      const x = HB.lerp(game.prevX, c.x, alpha), y = HB.lerp(game.prevY, c.y, alpha);
      const hi = vis.histI * 3;
      vis.hist[hi] = vis.clock; vis.hist[hi + 1] = x; vis.hist[hi + 2] = y;
      vis.histI = (vis.histI + 1) % 64; vis.histN = Math.min(64, vis.histN + 1);

      // muelles de las máquinas
      for (const id in vis.ent) {
        const v = vis.ent[id];
        const a = -260 * v.sq - 16 * v.sqv;
        v.sqv += a * dt; v.sq += v.sqv * dt;
        if (Math.abs(v.sq) < 0.0005 && Math.abs(v.sqv) < 0.01) { v.sq = 0; v.sqv = 0; }
        if (v.rise < 1) v.rise = Math.min(1, v.rise + dt / HB.FX.rise);
        if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 2.5);
      }
      HB.Fx.update(dt);
      updateCamera(st, x, y, dt);

      // fondo fuera de la columna de juego (ordenador)
      V.screen();
      g.fillStyle = '#121519';
      g.fillRect(0, 0, V.cssW, V.cssH);

      V.world();
      drawGround(R);
      drawPads(st, R);
      drawZones(st, R, vis.clock);

      // cosas con profundidad: se ordenan por su borde delantero
      const list = game.drawList || (game.drawList = []);
      list.length = 0;
      for (const v of R.veins) if (V.onScreen(v.x, v.y)) list.push({ y: v.y + 0.35, k: 0, o: v });
      let ex = null;
      for (const e of R.ents) {
        const m = HB.MACHINES[e.type];
        if (m.kind === 'export') ex = e;
        if (!V.onScreen(e.x, e.y, 4)) continue;
        list.push({ y: e.y + m.h / 2, k: 1, o: e });
        if (m.kind === 'proc') list.push({ y: HB.Logic.padPos(e, 'out').y + 0.3, k: 2, o: e });
        if (m.kind === 'export') list.push({ y: HB.Logic.padPos(e, 'pile').y + 0.2, k: 3, o: e });
      }
      list.push({ y: y + 0.01, k: 4, o: c });
      list.sort(function (a, b) { return a.y - b.y; });
      for (const it of list) {
        if (it.k === 0) V.blit(A.vein(), it.o.x, it.o.y);
        else if (it.k === 1) drawMachine(st, R, it.o);
        else if (it.k === 2) drawOutPile(it.o);
        else if (it.k === 3) drawBills(R, it.o);
        else drawCommander(st, x, y, dt);
      }
      if (ex) drawShip(R, ex, dt);
      HB.Fx.drawWorld();
      drawFog(R);

      V.screen();
      drawLabels(st);
      drawStackCounter(st);
      drawGuide(st, game.target, game.showGuide);
      HB.Fx.drawScreen();
      drawHUD(st, game.target, game, dt);
      drawJoystick(HB.Input);
      if (vis.flash > 0) {
        g.globalAlpha = vis.flash * 0.55; g.fillStyle = '#ffffff';
        g.fillRect(V.gx, 0, V.gw, V.gh); g.globalAlpha = 1;
      }
    },
  };
})(globalThis.HB);
