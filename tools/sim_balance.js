// Simulador de balance (funcional 20 y hito 1 del funcional 21).
//
// Un robot juega la región con las MISMAS reglas que el móvil (carga src/js/00-49): mina,
// fabrica, compra zonas, rellena torretas, defiende las noches y al final ataca el Nido. Cuenta
// cuánto tarda en cada zona y cómo le va cada noche, y lo compara con el funcional.
//
// Uso (desde la carpeta del repositorio):
//   node tools/sim_balance.js                  informe de la región 1
//   node tools/sim_balance.js --estrategia profit    (balanced · profit · defense)
//   node tools/sim_balance.js --anuncios       el robot ve los vídeos (×2 del informe, 2.ª oportunidad)
//   node tools/sim_balance.js --p0 15 --k 1.2  probar otra curva de precios sin tocar las tablas
//   node tools/sim_balance.js --partidas 10    varias partidas con semillas distintas (resumen)
//   node tools/sim_balance.js --minutos 60     tiempo máximo de juego simulado
//   node tools/sim_balance.js --json           salida en JSON (para otras herramientas)
//
// Ojo: el robot juega bien (no se despista ni duda). Un jugador nuevo irá más despacio.
'use strict';
const { loadLogic } = require('./load_logic');

function parseArgs(argv) {
  const a = { minutos: 60, seed: 12345, json: false, estrategia: 'balanced', anuncios: false, partidas: 1 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--json') a.json = true;
    else if (k === '--anuncios') a.anuncios = true;
    else if (k === '--minutos' || k === '--minutes') a.minutos = parseFloat(argv[++i]);
    else if (k === '--seed') a.seed = parseInt(argv[++i], 10);
    else if (k === '--p0') a.p0 = parseFloat(argv[++i]);
    else if (k === '--k') a.k = parseFloat(argv[++i]);
    else if (k === '--estrategia') a.estrategia = argv[++i];
    else if (k === '--partidas') a.partidas = parseInt(argv[++i], 10);
  }
  return a;
}

// Tiempo objetivo hasta la siguiente zona (funcional 6.3), por número de zona (1, 2, 3...).
function target(n) {
  if (n <= 5) return [15, 40];
  if (n <= 15) return [40, 90];
  if (n <= 30) return [90, 180];
  return [180, 360];
}

function mmss(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function run(opts) {
  const HB = loadLogic();
  const rdef = HB.REGIONS.r1;
  if (opts.p0) rdef.p0 = opts.p0;
  if (opts.k) rdef.k = opts.k;

  const st = HB.State.newGame(opts.seed);
  const R = st.regions[st.cur];
  const mem = { strat: opts.estrategia || 'balanced', ads: !!opts.anuncios };
  const input = { x: 0, y: 0 };
  const dt = 1 / HB.CONFIG.tickHz;
  const maxT = (opts.minutos || 60) * 60;
  const bought = [];
  const nights = [];
  const taskTime = {};
  let firstSale = null, nightStart = 0, cmdDowns = 0, ads = 0, destroyed = 0;
  let clearedAt = null;

  while (st.time < maxT && clearedAt === null) {
    const d = HB.Advisor.decide(st, mem);
    if (d === 'x2' || d === 'second') ads++;
    const t = HB.Advisor.bot(st, mem, input);
    taskTime[t.kind] = (taskTime[t.kind] || 0) + dt;
    HB.Logic.step(st, input, dt);
    if (st.tick % HB.CONFIG.econEvery === 0) HB.Logic.econ(st, dt * HB.CONFIG.econEvery);
    for (const e of st.ev) {
      if (e.k === 'unlock' && e.a && !bought.some(function (b) { return b.id === e.a.id; })) bought.push({ id: e.a.id, price: HB.Logic.price(R, e.a), t: st.time });
      if (e.k === 'shipBuy' && firstSale === null) firstSale = st.time;
      if (e.k === 'nightStart') nightStart = st.time;
      if (e.k === 'cmdDown') cmdDowns++;
      if (e.k === 'destroyed') destroyed++;
      if (e.k === 'nightEnd') {
        const r = e.a, H = R._byId.hq;
        nights.push({ n: r.n, at: nightStart, len: st.time - nightStart, won: r.won, kills: r.kills, loot: r.loot + r.bonus, lost: r.lostLoot, damage: r.damage, boss: r.boss, bossHp: r.bossHp, tip: r.tip, hq: Math.round(H.hp / HB.MACHINES.hq.hp * 100) });
        if (r.cleared) clearedAt = st.time;
      }
    }
    st.ev.length = 0;
  }

  // al caer el jefe, cerrar su informe y abrir su cofre (como haría el jugador)
  for (let i = 0; i < 4; i++) HB.Advisor.decide(st, mem);

  const rows = bought.map(function (b, i) {
    const prev = i === 0 ? 0 : bought[i - 1].t;
    const wait = b.t - prev;
    const tg = target(i + 1);
    return { n: i + 1, id: b.id, price: b.price, t: b.t, wait: wait, min: tg[0], max: tg[1], ok: wait >= tg[0] && wait <= tg[1] };
  });

  const machines = {};
  for (const id in st.stats.m) {
    const m = st.stats.m[id], tot = m.busy + m.full + m.starve || 1;
    machines[id] = { busy: m.busy / tot, full: m.full / tot, starve: m.starve / tot };
  }

  return {
    p0: rdef.p0, k: rdef.k, strat: mem.strat, ads: mem.ads,
    finished: HB.Logic.allBought(R),
    cleared: clearedAt,
    total: st.time,
    zones: rows,
    zonesTotal: rdef.zones.length,
    nights: nights,
    firstSale: firstSale,
    earned: st.stats.earned,
    mined: st.stats.mined,
    kills: st.stats.kills,
    cmdDowns: cmdDowns, destroyed: destroyed, adsWatched: ads,
    machines: machines,
    tasks: taskTime,
    ftue: st.ftue,
    gems: st.gems,
  };
}

function pct(x) { return (Math.round(x * 100) + '%').padStart(4); }

function print(r) {
  const out = [];
  out.push('');
  out.push('SIMULADOR · Región 1 (Dust Flats) · P(n) = ' + r.p0 + ' × ' + r.k + '^n · estrategia ' + r.strat + (r.ads ? ' · con vídeos' : ' · sin vídeos'));
  out.push('Primera venta a la flota: ' + (r.firstSale === null ? 'nunca' : mmss(r.firstSale)));
  out.push('');
  out.push('  #  zona              precio  comprada  espera  objetivo   ');
  out.push('  -- ----------------- ------  --------  ------  ---------- --');
  for (const z of r.zones) {
    out.push('  ' + String(z.n).padStart(2) + ' ' + z.id.padEnd(17) + ' ' + ('$' + z.price).padStart(6) +
      '  ' + mmss(z.t).padStart(8) + '  ' + (z.wait.toFixed(0) + ' s').padStart(6) +
      '  ' + (z.min + '-' + z.max + ' s').padStart(10) + ' ' + (z.ok ? 'ok' : (z.wait < z.min ? 'RÁPIDA' : 'LENTA')));
  }
  out.push('');
  out.push('Noches:');
  out.push('  n   empieza  dura   resultado         bajas  botín  daño  torre');
  for (const n of r.nights) {
    const res = n.won ? (n.boss ? 'JEFE VENCIDO' : 'aguantada') : (n.boss ? 'jefe al ' + n.bossHp + '%' : 'PERDIDA (' + n.tip + ')');
    out.push('  ' + String(n.n).padStart(2) + '  ' + mmss(n.at).padStart(7) + '  ' + (Math.round(n.len) + 's').padStart(4) +
      '   ' + res.padEnd(17) + ' ' + String(n.kills).padStart(5) + '  ' + ('$' + n.loot).padStart(5) + '  ' + String(n.damage).padStart(4) + '  ' + (n.hq + '%').padStart(5));
  }
  out.push('');
  if (r.cleared !== null) out.push('REGIÓN CONQUISTADA en ' + mmss(r.cleared) + ' (el funcional pide 15-25 min para R1).');
  else out.push('Sin conquistar tras ' + mmss(r.total) + ' (' + r.zones.length + '/' + r.zonesTotal + ' zonas).');
  out.push('Gemas al final: ' + r.gems + ' (cofres de la primera noche y del jefe, y Swarmers dorados)');
  out.push('Ganado vendiendo: $' + r.earned + ' · bichos muertos: ' + r.kills + ' · comandante caído: ' + r.cmdDowns +
    ' veces · edificios destruidos: ' + r.destroyed + (r.ads ? ' · vídeos vistos: ' + r.adsWatched : ''));
  out.push('');
  // Pasos del tutorial (funcional 12): cuándo hace el robot cada cosa por primera vez.
  const HBd = loadLogic();
  const steps = HBd.FTUE.filter(function (k) { return r.ftue[k] !== undefined; });
  out.push('Tutorial (robot, primera vez): ' + steps.map(function (k) { return k + ' ' + mmss(r.ftue[k]); }).join(' · '));
  out.push('');
  out.push('Máquinas (porcentaje del tiempo desde que existen):');
  for (const id in r.machines) {
    const m = r.machines[id];
    out.push('  ' + id.padEnd(12) + ' trabajando ' + pct(m.busy) + ' · salida llena ' + pct(m.full) + ' · sin material ' + pct(m.starve));
  }
  out.push('');
  out.push('En qué gasta el tiempo el comandante:');
  const tot = Object.values(r.tasks).reduce(function (a, b) { return a + b; }, 0) || 1;
  const names = { mine: 'minar', deliver: 'llevar a máquinas', pickup: 'recoger', collect: 'cobrar', pay: 'pagar zonas', wait: 'esperar',
    refill: 'rellenar torretas', defend: 'defender', loot: 'recoger botín', repair: 'reparar', nest: 'ir al Nido' };
  for (const k of Object.keys(r.tasks).sort(function (a, b) { return r.tasks[b] - r.tasks[a]; })) {
    out.push('  ' + (names[k] || k).padEnd(18) + ' ' + pct(r.tasks[k] / tot));
  }
  out.push('');
  out.push('Recuerda: el robot juega sin dudar. Un jugador nuevo tardará más, sobre todo al principio.');
  console.log(out.join('\n'));
}

function summary(list, opts) {
  const cleared = list.filter(function (r) { return r.cleared !== null; });
  const times = cleared.map(function (r) { return r.cleared; }).sort(function (a, b) { return a - b; });
  const lost = list.reduce(function (a, r) { return a + r.nights.filter(function (n) { return !n.won; }).length; }, 0);
  const nightsTot = list.reduce(function (a, r) { return a + r.nights.length; }, 0);
  console.log('\nRESUMEN de ' + list.length + ' partidas · estrategia ' + opts.estrategia + (opts.anuncios ? ' · con vídeos' : ''));
  console.log('  conquistan la región: ' + cleared.length + '/' + list.length +
    (times.length ? ' · tiempo: mín ' + mmss(times[0]) + ', mediana ' + mmss(times[Math.floor(times.length / 2)]) + ', máx ' + mmss(times[times.length - 1]) : ''));
  console.log('  noches perdidas: ' + lost + ' de ' + nightsTot);
}

if (require.main === module) {
  const opts = parseArgs(process.argv);
  if (opts.partidas > 1) {
    const list = [];
    for (let i = 0; i < opts.partidas; i++) list.push(run(Object.assign({}, opts, { seed: opts.seed + i * 7919 })));
    if (opts.json) console.log(JSON.stringify(list, null, 2)); else summary(list, opts);
  } else {
    const r = run(opts);
    if (opts.json) console.log(JSON.stringify(r, null, 2)); else print(r);
  }
}

module.exports = { run: run };
