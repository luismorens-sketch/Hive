// Simulador de balance (funcional 20 y hito 1 del funcional 21).
//
// Un robot juega la región con las MISMAS reglas que el móvil (carga src/js/00-45) y cuenta
// cuánto tarda en poder pagar cada zona. Lo compara con los tiempos objetivo del funcional 6.3.
//
// Uso (desde la carpeta del repositorio):
//   node tools/sim_balance.js                 informe de la región 1
//   node tools/sim_balance.js --p0 15 --k 1.2 probar otra curva de precios sin tocar las tablas
//   node tools/sim_balance.js --minutos 30    tiempo máximo de juego simulado
//   node tools/sim_balance.js --json          salida en JSON (para otras herramientas)
//
// Ojo: el robot juega bien (no se despista ni duda). Un jugador nuevo irá más despacio.
'use strict';
const { loadLogic } = require('./load_logic');

function parseArgs(argv) {
  const a = { minutos: 60, seed: 12345, json: false };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--json') a.json = true;
    else if (k === '--minutos' || k === '--minutes') a.minutos = parseFloat(argv[++i]);
    else if (k === '--seed') a.seed = parseInt(argv[++i], 10);
    else if (k === '--p0') a.p0 = parseFloat(argv[++i]);
    else if (k === '--k') a.k = parseFloat(argv[++i]);
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
  const mem = {};
  const input = { x: 0, y: 0 };
  const dt = 1 / HB.CONFIG.tickHz;
  const maxT = opts.minutos * 60;
  const bought = [];
  const taskTime = {};
  let firstSale = null;

  while (st.time < maxT && !HB.Logic.allBought(R)) {
    const t = HB.Advisor.bot(st, mem, input);
    taskTime[t.kind] = (taskTime[t.kind] || 0) + dt;
    HB.Logic.step(st, input, dt);
    if (st.tick % HB.CONFIG.econEvery === 0) HB.Logic.econ(st, dt * HB.CONFIG.econEvery);
    for (const e of st.ev) {
      if (e.k === 'unlock') bought.push({ id: e.a.id, price: HB.Logic.price(R, e.a), t: st.time });
      if (e.k === 'shipBuy' && firstSale === null) firstSale = st.time;
    }
    st.ev.length = 0;
  }

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
    p0: rdef.p0, k: rdef.k,
    finished: HB.Logic.allBought(R),
    total: st.time,
    zones: rows,
    zonesTotal: rdef.zones.length,
    firstSale: firstSale,
    earned: st.stats.earned,
    mined: st.stats.mined,
    machines: machines,
    tasks: taskTime,
  };
}

function print(r) {
  const out = [];
  out.push('');
  out.push('SIMULADOR · Región 1 (Dust Flats) · P(n) = ' + r.p0 + ' × ' + r.k + '^n');
  out.push('Primera venta a la flota: ' + (r.firstSale === null ? 'nunca' : mmss(r.firstSale)));
  out.push('');
  out.push('  #  zona            precio  comprada  espera  objetivo   ');
  out.push('  -- --------------- ------  --------  ------  ---------- --');
  for (const z of r.zones) {
    out.push('  ' + String(z.n).padStart(2) + ' ' + z.id.padEnd(15) + ' ' + ('$' + z.price).padStart(6) +
      '  ' + mmss(z.t).padStart(8) + '  ' + (z.wait.toFixed(0) + ' s').padStart(6) +
      '  ' + (z.min + '-' + z.max + ' s').padStart(10) + ' ' + (z.ok ? 'ok' : (z.wait < z.min ? 'RÁPIDA' : 'LENTA')));
  }
  out.push('');
  out.push((r.finished ? 'Todas las zonas compradas en ' : 'Sin terminar tras ') + mmss(r.total) +
    ' (' + r.zones.length + '/' + r.zonesTotal + ' zonas). Ganado: $' + r.earned + '. Mineral minado: ' + r.mined + '.');
  out.push('');
  out.push('Máquinas (porcentaje del tiempo desde que existen):');
  for (const id in r.machines) {
    const m = r.machines[id];
    out.push('  ' + id.padEnd(12) + ' trabajando ' + pct(m.busy) + ' · salida llena ' + pct(m.full) + ' · sin material ' + pct(m.starve));
  }
  out.push('');
  out.push('En qué gasta el tiempo el comandante:');
  const tot = Object.values(r.tasks).reduce(function (a, b) { return a + b; }, 0) || 1;
  const names = { mine: 'minar', deliver: 'llevar a máquinas', pickup: 'recoger', collect: 'cobrar', pay: 'pagar zonas', wait: 'esperar' };
  for (const k of Object.keys(r.tasks).sort(function (a, b) { return r.tasks[b] - r.tasks[a]; })) {
    out.push('  ' + (names[k] || k).padEnd(18) + ' ' + pct(r.tasks[k] / tot));
  }
  out.push('');
  out.push('Recuerda: el robot juega sin dudar. Un jugador nuevo tardará más, sobre todo al principio.');
  console.log(out.join('\n'));
}

function pct(x) { return (Math.round(x * 100) + '%').padStart(4); }

if (require.main === module) {
  const opts = parseArgs(process.argv);
  const r = run(opts);
  if (opts.json) console.log(JSON.stringify(r, null, 2)); else print(r);
}

module.exports = { run: run };
