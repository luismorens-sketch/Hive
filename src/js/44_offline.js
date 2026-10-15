// Hive Breaker — lo que produce la base mientras no juegas (funcional 14.4 y 20). Sin DOM.
//
// Offline ANALÍTICO (funcional 20): no se simula nada, se calcula ritmo × tiempo, con topes.
//   - El ritmo es lo que la base vende SOLA: lo que los drones llevan a la Plataforma de
//     exportación, sin comandante. Si los drones no llegan a la exportación, no se gana nada.
//   - Tope de tiempo: 2 h (decidido, funcional 24.1 n.º 5).
//   - Tope de la caja fuerte (decisión provisional): como cuando juegas, la nave deja de comprar
//     cuando se llena la caja fuerte; al volver tienes, como mucho, lo que cabe en ella.
//   - No hay noches y el Calor se queda como estaba (funcional 8.1).
//   - Si la hora del móvil va hacia atrás, no se gana nada (funcional 20).
// El tiempo real (Date.now) lo pasa 90_main.js: la lógica nunca lo lee por su cuenta.
(function (HB) {
  'use strict';

  function C() { return HB.CONFIG.offline; }
  function def(e) { return HB.MACHINES[e.type]; }

  // Dónde se para un dron (igual que en 42_drones.js).
  function hover(idx, p) { return { x: p.x + (idx - 1) * 0.32, y: p.y - 0.15 }; }

  // La veta que trabaja el dron idx de una base minera (misma regla que 42_drones.js).
  function minerVein(R, route, idx) {
    let vein = null, k = 0;
    for (const v of R.veins) {
      if (route.veins.indexOf(v.id) < 0) continue;
      if (!vein || k === idx % route.veins.length) vein = v;
      k++;
    }
    return vein;
  }

  // Objetos por segundo que mueven los drones de una base: carga / (ida + vuelta + cargar + soltar).
  function routeCap(R, pad) {
    if (pad.dead) return 0;
    const P = HB.MACHINES.dronepad, lv = HB.Drones.padLevel(pad), route = pad.route;
    const dst = R._byId[route.to];
    if (!dst || dst.dead) return 0;
    const drop = hover(0, HB.Logic.padPos(dst, 'in'));
    let total = 0;
    for (let i = 0; i < lv.n; i++) {
      let dist, load;
      if (route.kind === 'miner') {
        const v = minerVein(R, route, i);
        if (!v) return 0;
        const a = -Math.PI / 2 + (i - 1) * 0.9;
        dist = HB.dist(v.x + Math.cos(a) * 0.75, v.y - 0.35 + Math.sin(a) * 0.4, drop.x, drop.y);
        load = lv.cap * P.mineEvery;
      } else {
        const src = R._byId[route.from];
        if (!src || src.dead) return 0;
        const p = hover(0, HB.Logic.padPos(src, 'out'));
        dist = HB.dist(p.x, p.y, drop.x, drop.y);
        load = lv.cap * P.moveEvery;
      }
      total += lv.cap / (load + lv.cap * P.moveEvery + 2 * dist / lv.speed);
    }
    return total;
  }

  // Lo que vende la base sola, en $/s. Recorre la cadena vetas → máquinas → exportación: cada
  // máquina fabrica lo que le dejan sus entradas (y su energía, y su vida), y cada ruta de carga
  // se lleva lo que puede de la salida de su máquina.
  function rate(st) {
    const R = st.regions[st.cur];
    HB.Logic.ensure(R);
    const f = R.power ? R.power.f : 1;
    const pads = R.ents.filter(function (e) { return def(e).kind === 'dronepad' && e.route; });
    const caps = {};
    for (const p of pads) caps[p.id] = routeCap(R, p);
    let prod = {}, inflow = {};
    // Unas pocas vueltas bastan: cada vuelta propaga la cadena un eslabón más.
    for (let pass = 0; pass < 8; pass++) {
      inflow = {};
      const add = function (id, it, n) {
        const b = inflow[id] || (inflow[id] = {});
        b[it] = (b[it] || 0) + n;
      };
      for (const p of pads) if (p.route.kind === 'miner') add(p.route.to, 'ore', caps[p.id]);
      const left = {};
      for (const id in prod) left[id] = prod[id];
      for (const p of pads) {
        if (p.route.kind !== 'cargo') continue;
        const src = R._byId[p.route.from], dst = R._byId[p.route.to];
        // En DEFENSA, la salida se guarda entera para las torretas: no va nada a la exportación.
        if (!src || !dst || def(src).kind !== 'proc' || HB.Drones.reserve(src, dst) === Infinity) continue;
        const n = Math.min(caps[p.id], left[src.id] || 0);
        left[src.id] = (left[src.id] || 0) - n;
        add(p.route.to, def(src).output, n);
      }
      const next = {};
      for (const e of R.ents) {
        const d = def(e);
        if (d.kind !== 'proc' || e.dead) continue;
        let r = f * HB.Logic.eff(e) / HB.Logic.level(e).time;
        for (const k in d.inputs) r = Math.min(r, ((inflow[e.id] || {})[k] || 0) / d.inputs[k]);
        next[e.id] = r;
      }
      prod = next;
    }
    let money = 0;
    for (const e of R.ents) {
      const d = def(e);
      if (d.kind !== 'export' || e.dead) continue;
      let m = 0;
      for (const it of d.accepts) m += ((inflow[e.id] || {})[it] || 0) * HB.ITEMS[it].price;
      // La nave no compra más de una caja fuerte por viaje.
      const L = HB.Logic.level(e);
      money += Math.min(m, L.vault / L.interval);
    }
    return money;
  }

  // Lo que cabe en las cajas fuertes de las plataformas de exportación.
  function vaultCap(R) {
    let v = 0;
    for (const e of R.ents) if (def(e).kind === 'export' && !e.dead) v += HB.Logic.level(e).vault;
    return v;
  }

  // ¿Cuánto ha producido la base desde el último guardado? null si no hay nada que enseñar.
  function compute(st, now) {
    if (!(st.savedAt > 0) || !(now > 0)) return null;
    const away = (now - st.savedAt) / 1000;
    if (!(away >= C().minAway)) return null;      // también si la hora ha ido hacia atrás
    const R = st.regions[st.cur];
    const secs = Math.min(away, C().cap);
    const r = rate(st);
    let amount = r * secs, capped = away > C().cap ? 'time' : null;
    if (C().vault) {
      const v = vaultCap(R);
      if (amount >= v) { amount = v; capped = 'vault'; }
    }
    return { away: away, secs: secs, rate: r, amount: Math.floor(amount), capped: capped };
  }

  HB.Offline = {
    rate: rate,
    vaultCap: vaultCap,
    compute: compute,

    // Al abrir el juego (o al volver a él): apunta lo ganado para la pantalla «WHILE YOU WERE
    // AWAY». Si ya había una pantalla pendiente, se suma (con el mismo tope). Devuelve lo apuntado.
    check: function (st, now) {
      const info = compute(st, now);
      st.savedAt = now;
      if (!info || info.amount < 1) return null;
      const prev = st.away;
      if (prev) {
        let total = prev.amount + info.amount;
        if (C().vault) total = Math.min(total, vaultCap(st.regions[st.cur]));
        info.amount = Math.max(prev.amount, total);
        info.away += prev.away;
        if (prev.capped && !info.capped) info.capped = prev.capped;
      }
      st.away = { amount: info.amount, away: Math.round(info.away), capped: info.capped };
      st.needSave = true;
      HB.Logic.ev(st, 'away', st.away);
      return st.away;
    },

    // Cobrar la pantalla de regreso; mult = 2 si se ha visto el vídeo (funcional 15.3 n.º 2).
    claim: function (st, mult) {
      const a = st.away;
      if (!a) return;
      const R = st.regions[st.cur];
      const amount = Math.round(a.amount * (mult || 1));
      R.credits += amount;
      st.away = null;
      st.needSave = true;
      HB.Logic.ev(st, 'awayClaim', amount);
      HB.Logic.ftue(st, 'away');
    },
  };
})(globalThis.HB);
