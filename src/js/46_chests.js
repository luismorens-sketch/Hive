// Hive Breaker — cofres (funcional 12, 13.2 y 9.5). Sin DOM: lo usa también el simulador.
//
// En el prototipo los cofres son gratis y con premio fijo (tabla HB.CHESTS en 20_data.js): uno
// tras la primera noche ganada y otro al caer la Madre de la Prole. Se apuntan en st.chests y la
// ventana del cofre (72_hud.js) los abre de uno en uno: tiembla, estalla y salen los premios.
(function (HB) {
  'use strict';

  function ev(st, k, a, b) { st.ev.push({ k: k, a: a, b: b }); }

  HB.Chests = {
    give: function (st, kind) {
      if (!HB.CHESTS[kind]) return;
      st.chests.push(kind);
      st.needSave = true;
      ev(st, 'chestGive', kind);
    },

    // El primer cofre que falta por abrir (o null).
    pending: function (st) { return st.chests && st.chests.length ? st.chests[0] : null; },

    prizes: function (kind) { return HB.CHESTS[kind] ? HB.CHESTS[kind].prizes : []; },

    // Cobrar el cofre abierto: Créditos a la cartera de la región, Gemas a la cuenta.
    claim: function (st) {
      const kind = st.chests.shift();
      if (!kind) return null;
      const R = st.regions[st.cur], list = HB.Chests.prizes(kind);
      for (const p of list) {
        if (p.k === 'credits') R.credits += p.n;
        else if (p.k === 'gems') st.gems += p.n;
      }
      st.needSave = true;
      ev(st, 'chestClaim', kind, list);
      HB.Logic.ftue(st, 'chest');
      return list;
    },
  };
})(globalThis.HB);
