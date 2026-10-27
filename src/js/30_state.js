// Hive Breaker — estado de la partida y guardado.
//
// Guardado (funcional 20): JSON versionado con migración desde el primer día. La clave
// 'lmc_hb_save_v1' NUNCA se renombra: si cambia el formato, sube `v` y se añade un paso a
// migrate(). El campo `perks` está reservado para la suscripción VIP aplazada (funcional 15.9).
//
// Las POSICIONES no se fían del guardado: al cargar, cada edificio se recoloca según las tablas
// (20_data.js) por su id. Así se puede rehacer el mapa sin romper las partidas guardadas.
// Lo que empieza por "_" (bichos, disparos, drones...) no se guarda: se rehace al cargar.
// Aquí no se toca localStorage: eso lo hace 90_main.js. Este archivo solo convierte a texto.
(function (HB) {
  'use strict';

  const SAVE_VERSION = 3;

  // Crea un edificio. opts: { flip, w, h (muros), route (drones) }
  function machineEntity(id, type, x, y, opts) {
    opts = opts || {};
    const def = HB.MACHINES[type];
    const e = { id: id, type: type, x: x, y: y, level: 1, flip: !!opts.flip, hp: def.hp, dead: false };
    if (opts.w) { e.w = opts.w; e.h = opts.h; }
    if (def.kind === 'proc') {
      e.inBuf = {};
      for (const k in def.inputs) e.inBuf[k] = 0;
      e.out = 0;          // objetos esperando en la salida
      e.busy = false;     // está fabricando una unidad
      e.prog = 0;         // segundos que lleva la unidad actual
      e.idle = 0;         // segundos seguidos parada
      e.worked = false;   // ha fabricado alguna vez (para no avisar "NO INPUT" al empezar)
      e.prio = 'balanced'; // DEFENSE / BALANCED / PROFIT para los drones (funcional 5.4)
    } else if (def.kind === 'export') {
      e.inBuf = {};
      for (const k of def.accepts) e.inBuf[k] = 0;
      e.ship = { st: 'away', t: 0 };   // la primera nave viene en cuanto hay algo que vender
    } else if (def.kind === 'turret') {
      e.ammo = def.shots * def.startBoxes;   // disparos que le quedan
      e.cd = 0;
      e.aim = -Math.PI / 2;
    } else if (def.kind === 'arsenal') {
      e.inBuf = {};
      for (const k of def.accepts) e.inBuf[k] = 0;
      e.t = 0;            // segundos hacia la siguiente caja que manda a una torreta
    } else if (def.kind === 'dronepad') {
      e.route = opts.route;
    }
    return e;
  }

  // Dónde dicen las tablas que va cada cosa (por id).
  function layout(rid) {
    const d = HB.REGIONS[rid];
    if (d._layout) return d._layout;
    const L = { ents: {}, veins: {} };
    for (const s of d.start) L.ents[s.id] = { type: s.type, x: s.x, y: s.y, opts: { flip: s.flip } };
    for (const v of d.veins) L.veins[v.id] = { x: v.x, y: v.y, item: v.item || 'ore' };
    for (const z of d.zones) {
      if (z.kind === 'vein') L.veins[z.id] = { x: z.x, y: z.y, item: z.item || 'ore' };
      else if (z.kind === 'machine') L.ents[z.id] = { type: z.type, x: z.x, y: z.y, opts: { flip: z.flip } };
      else if (z.kind === 'wall') L.ents[z.id] = { type: 'wall', x: (z.x0 + z.x1) / 2, y: z.y, opts: { w: z.x1 - z.x0, h: HB.MACHINES.wall.h } };
      else if (z.kind === 'drone') L.ents[z.id] = { type: 'dronepad', x: z.x, y: z.y, opts: { route: z.route } };
      else if (z.kind === 'turret') L.ents[z.id] = { type: z.type || null, x: z.x, y: z.y, opts: {} };
    }
    d._layout = L;
    return L;
  }

  function newRegion(rid) {
    const d = HB.REGIONS[rid];
    const R = {
      id: rid,
      credits: 0,
      fogY: d.fogY,
      paid: {},       // pagos parciales: lo pagado se guarda aunque te vayas (funcional 6.1)
      mats: {},       // materiales ya entregados a cada zona que los pide (funcional v0.4, 6.2)
      bought: {},     // zona → segundo de juego en que se compró
      ents: [],
      veins: [],
      pile: 0,        // billetes en el suelo junto a la exportación
      phase: 'day',   // 'day' · 'warn' (THE HIVE STIRS) · 'night'
      heat: 0,
      heatOn: false,  // el Calor empieza a contar al tener la primera torreta
      dayT: 0,
      nights: 0,      // noches superadas
      best: 0,        // mejor botín de una noche (récord)
      nestReady: false,
      cleared: false,
      lossStreak: 0,  // noches perdidas seguidas (la siguiente llega más suave)
    };
    for (const s of d.start) R.ents.push(machineEntity(s.id, s.type, s.x, s.y, { flip: s.flip }));
    for (const v of d.veins) R.veins.push({ id: v.id, x: v.x, y: v.y, item: v.item || 'ore' });
    return R;
  }

  // Recoloca todo según las tablas y quita lo que ya no exista en ellas.
  function relayout(R) {
    const L = layout(R.id);
    R.ents = R.ents.filter(function (e) {
      const p = L.ents[e.id];
      if (!p || !HB.MACHINES[e.type]) return false;
      e.x = p.x; e.y = p.y; e.flip = !!p.opts.flip;
      if (p.opts.w) { e.w = p.opts.w; e.h = p.opts.h; }
      if (p.opts.route) e.route = p.opts.route;
      const def = HB.MACHINES[e.type];
      if (e.hp === undefined) e.hp = def.hp;
      if (e.dead === undefined) e.dead = false;
      if (def.kind === 'proc' && !e.prio) e.prio = 'balanced';
      // Si una máquina acepta algo nuevo (la Exportación compra Bobinas desde la 0.10.0), su
      // hueco empieza en 0: sin esto, la cuenta saldría «NaN» y la nave dejaría de venir.
      if (e.inBuf) {
        const keys = def.kind === 'proc' ? Object.keys(def.inputs) : (def.accepts || []);
        for (const k of keys) if (!(e.inBuf[k] >= 0)) e.inBuf[k] = 0;
      }
      if (def.levels) e.level = Math.min(e.level || 1, def.levels.length);
      return true;
    });
    R.veins = R.veins.filter(function (v) {
      const p = L.veins[v.id];
      if (!p) return false;
      v.x = p.x; v.y = p.y; v.item = p.item;
      return true;
    });
  }

  HB.State = {
    SAVE_VERSION: SAVE_VERSION,
    machineEntity: machineEntity,
    layout: layout,

    newGame: function (seed) {
      const rid = 'r1';
      const sp = HB.REGIONS[rid].spawn;
      const st = {
        v: SAVE_VERSION,
        time: 0,          // segundos de juego
        tick: 0,
        rng: (seed === undefined ? 12345 : seed) | 0,
        perks: {},
        settings: { sound: true, vib: true, lowfx: false, lang: null },
        ftue: {},         // pasos del tutorial ya hechos (funcional 12)
        ads: { seen: 0, log: {} },   // vídeos simulados (funcional 15.3): para medir cuántos se usarían
        gems: 0,          // Gemas (permanentes, de toda la cuenta; funcional 5.2)
        chests: [],       // cofres ganados que faltan por abrir (46_chests.js)
        cur: rid,
        regions: {},
        cmd: {
          x: sp.x, y: sp.y, vx: 0, vy: 0, face: Math.PI / 2, moving: false,
          stack: [],
          mineT: {},      // temporizador de minado por veta
          pad: null,      // clave de la zona que está pisando
          padT: 0, actT: 0, payT: 0, payAcc: 0,
          hp: HB.CONFIG.cmd.hp, deadT: 0, cd: 0, stillT: 0, repT: 0,
        },
        report: null,     // informe de la noche pendiente de cerrar
        away: null,       // lo producido mientras no jugabas, pendiente de cobrar (44_offline.js)
        supply: null,     // caja del suministro aéreo abierta, pendiente de decidir (47_supply.js)
        savedAt: 0,       // hora real del último guardado (la pone 90_main.js)
        choice: null,     // torreta pagada pendiente de elegir tipo
        defeat: null,     // la Torre de mando ha caído: segunda oportunidad
        stats: { mined: 0, made: 0, sold: 0, earned: 0, zones: 0, idle: 0, kills: 0, m: {} },
      };
      st.regions[rid] = newRegion(rid);
      HB.State.relink(st);
      return st;
    },

    // Rehace lo que no se guarda (empieza por "_").
    relink: function (st) {
      for (const rid in st.regions) {
        const R = st.regions[rid];
        relayout(R);
        R._byId = {};
        for (const e of R.ents) R._byId[e.id] = e;
        R._solidsVer = (R._solidsVer || 0) + 1;
        R._dirty = true;
        R._bugs = []; R._shots = []; R._loot = []; R._strikes = []; R._drones = null; R._night = null;
        R.nightLoot = 0;
        if (!(R.pile >= 0)) R.pile = 0;
        if (!(R.credits >= 0)) R.credits = 0;
        // Una noche a medias no se guarda: al volver, es de día y la barra está casi llena.
        if (R.phase !== 'day') {
          R.phase = 'day';
          R.heat = Math.max(R.heat, HB.Night ? HB.Night.barSize(R) * 0.9 : 0);
        }
      }
      st.defeat = null;
      st.ev = [];
    },

    region: function (st) { return st.regions[st.cur]; },

    serialize: function (st) {
      return JSON.stringify(st, function (k, v) {
        if (k === 'ev' || (k.charAt(0) === '_')) return undefined;
        return v;
      });
    },

    deserialize: function (text) {
      let obj;
      try { obj = JSON.parse(text); } catch (e) { return null; }
      if (!obj || typeof obj !== 'object') return null;
      obj = HB.State.migrate(obj);
      if (!obj) return null;
      HB.State.relink(obj);
      return obj;
    },

    // Cada cambio de formato añade un paso aquí. Nunca se borra un paso viejo.
    migrate: function (obj) {
      if (typeof obj.v !== 'number') return null;
      if (obj.v > SAVE_VERSION) return null;   // guardado de una versión más nueva: no se toca
      if (obj.v === 1) {
        // v1 → v2 (versión 0.3.0): llegan la noche, las torretas, los drones y la vida de los
        // edificios. El mapa se rehízo: las posiciones salen de las tablas (relayout).
        for (const rid in obj.regions) {
          const R = obj.regions[rid];
          R.phase = 'day'; R.heat = 0; R.heatOn = false; R.dayT = 0; R.nights = 0; R.best = 0;
          R.nestReady = false; R.cleared = false;
          for (const e of R.ents) { e.hp = HB.MACHINES[e.type] ? HB.MACHINES[e.type].hp : 100; e.dead = false; }
        }
        const c = obj.cmd, sp = HB.REGIONS[obj.cur || 'r1'].spawn;
        c.x = sp.x; c.y = sp.y; c.hp = HB.CONFIG.cmd.hp; c.deadT = 0; c.cd = 0; c.stillT = 0; c.repT = 0;
        obj.ads = { seen: 0, log: {} };
        obj.report = null; obj.choice = null; obj.defeat = null;
        obj.v = 2;
      }
      if (obj.v === 2) {
        // v2 → v3 (versión 0.10.0): el mapa de la región 1 crece 12 filas hacia el norte para el
        // distrito del cobre (funcional v0.4). Los edificios se recolocan solos (relayout); aquí
        // se mueve lo demás: la niebla sin abrir, el comandante y la caja del suministro aéreo.
        for (const rid in obj.regions) {
          const R = obj.regions[rid];
          if (rid === 'r1' && R.fogY > 3.01) R.fogY = HB.REGIONS.r1.fogY;
          if (R.supply) R.supply.box = null;
          if (!R.mats) R.mats = {};
        }
        const c = obj.cmd, sp = HB.REGIONS[obj.cur || 'r1'].spawn;
        c.x = sp.x; c.y = sp.y; c.pad = null;
        obj.v = 3;
      }
      if (!obj.perks) obj.perks = {};
      if (!obj.settings) obj.settings = { sound: true, vib: true, lowfx: false, lang: null };
      if (!obj.ftue) obj.ftue = {};
      if (!obj.ads) obj.ads = { seen: 0, log: {} };
      if (!obj.stats) obj.stats = { mined: 0, made: 0, sold: 0, earned: 0, zones: 0, idle: 0, kills: 0, m: {} };
      if (obj.stats.kills === undefined) obj.stats.kills = 0;
      if (obj.away === undefined) obj.away = null;   // 0.5.0: pantalla de regreso pendiente
      if (obj.gems === undefined) obj.gems = 0;      // 0.8.0: Gemas y cofres
      if (!obj.chests) obj.chests = [];
      if (obj.supply === undefined) obj.supply = null;   // 0.9.0: suministro aéreo
      for (const rid in obj.regions) if (!obj.regions[rid].mats) obj.regions[rid].mats = {};   // 0.10.0
      return obj;
    },
  };
})(globalThis.HB);
