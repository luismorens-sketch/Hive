// Hive Breaker — estado de la partida y guardado.
//
// Guardado (funcional 20): JSON versionado con migración desde el primer día. La clave
// 'lmc_hb_save_v1' NUNCA se renombra: si cambia el formato, sube `v` y se añade un paso a
// migrate(). El campo `perks` está reservado para la suscripción VIP aplazada (funcional 15.9).
// Aquí no se toca localStorage: eso lo hace 90_main.js. Este archivo solo convierte a texto.
(function (HB) {
  'use strict';

  const SAVE_VERSION = 1;

  function machineEntity(id, type, x, y, flip) {
    const def = HB.MACHINES[type];
    const e = { id: id, type: type, x: x, y: y, level: 1, flip: !!flip };
    if (def.kind === 'proc') {
      e.inBuf = {};
      for (const k in def.inputs) e.inBuf[k] = 0;
      e.out = 0;          // objetos esperando en la salida
      e.busy = false;     // está fabricando una unidad
      e.prog = 0;         // segundos que lleva la unidad actual
      e.idle = 0;         // segundos seguidos parada
      e.worked = false;   // ha fabricado alguna vez (para no avisar "NO INPUT" al empezar)
    } else if (def.kind === 'export') {
      e.inBuf = {};
      for (const k of def.accepts) e.inBuf[k] = 0;
      e.ship = { st: 'away', t: 0 };   // la primera nave viene en cuanto hay algo que vender
    }
    return e;
  }

  function newRegion(rid) {
    const def = HB.REGIONS[rid];
    const R = {
      id: rid,
      credits: 0,
      fogY: def.fogY,
      paid: {},       // pagos parciales: lo pagado se guarda aunque te vayas (funcional 6.1)
      bought: {},     // zona → segundo de juego en que se compró
      ents: [],
      veins: [],
      pile: 0,        // billetes en el suelo junto a la exportación
    };
    for (const s of def.start) R.ents.push(machineEntity(s.id, s.type, s.x, s.y, s.flip));
    for (const v of def.veins) R.veins.push({ id: v.id, x: v.x, y: v.y });
    return R;
  }

  HB.State = {
    SAVE_VERSION: SAVE_VERSION,
    machineEntity: machineEntity,

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
        cur: rid,
        regions: {},
        cmd: {
          x: sp.x, y: sp.y, vx: 0, vy: 0, face: Math.PI / 2, moving: false,
          stack: [],
          mineT: {},      // temporizador de minado por veta
          pad: null,      // clave de la zona que está pisando
          padT: 0, actT: 0, payT: 0, payAcc: 0,
        },
        stats: { mined: 0, made: 0, sold: 0, earned: 0, zones: 0, idle: 0, m: {} },
      };
      st.regions[rid] = newRegion(rid);
      HB.State.relink(st);
      return st;
    },

    // Rehace los índices que no se guardan (empiezan por "_").
    relink: function (st) {
      for (const rid in st.regions) {
        const R = st.regions[rid];
        R._byId = {};
        for (const e of R.ents) R._byId[e.id] = e;
        R._solidsVer = (R._solidsVer || 0) + 1;
      }
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
      // if (obj.v === 1) { ...convertir a v2...; obj.v = 2; }
      if (obj.v > SAVE_VERSION) return null;   // guardado de una versión más nueva: no se toca
      if (!obj.perks) obj.perks = {};
      if (!obj.settings) obj.settings = { sound: true, vib: true, lowfx: false, lang: null };
      if (!obj.ftue) obj.ftue = {};
      if (!obj.stats) obj.stats = { mined: 0, made: 0, sold: 0, earned: 0, zones: 0, idle: 0, m: {} };
      return obj;
    },
  };
})(globalThis.HB);
