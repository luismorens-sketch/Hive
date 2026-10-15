// Hive Breaker — TABLAS. Aquí vive el diseño en números (funcional 20: "Tablas").
//
// Regla: el balance se toca aquí, no en el código. Añadir un edificio = una fila en MACHINES y
// una función de dibujo; añadir una zona = una fila en REGIONS.<región>.zones.
// Todas las cifras son valores iniciales para el simulador (tools/sim_balance.js), no balance
// cerrado. Unidades: distancias en casillas, tiempos en segundos, dinero en Créditos ($),
// energía en MW.
(function (HB) {
  'use strict';

  HB.CONFIG = {
    version: '0.9.1',      // sube con cada versión que se publica para probar
    hito: 6,               // hito del funcional 21 en el que estamos
    tickHz: 30,            // movimiento, combate y acciones (funcional 20: paso fijo 30 Hz)
    econEvery: 3,          // la economía corre 1 de cada 3 pasos = 10 Hz
    viewTiles: 10,         // casillas que caben a lo ancho de la pantalla (en un móvil en vertical)
    viewMinH: 13,          // como mínimo caben 13 casillas a lo alto (pantallas bajas)

    cmd: {
      speed: 4,            // casillas/s (funcional 4.1)
      radius: 0.35,
      stackCap: 10,        // capacidad inicial de la pila (funcional 4.2)
      stackDraw: 25,       // como máximo se dibujan 25 objetos
      mineInterval: 0.4,   // cada 0,4 s salta un Ore por cada veta al alcance (funcional 4.1)
      mineRange: 1.55,     // distancia (centro a centro) para minar una veta
      mineFirst: 0.2,      // el primer Ore sale a los 0,2 s de llegar, para que se note enseguida
      depositInterval: 0.06,
      pickupInterval: 0.08,
      // combate (funcional 4.3)
      hp: 100,
      dmg: 10, rate: 3, range: 4,
      stillBonus: 1.3,     // quieto, +30 % de cadencia
      respawn: 5,          // reaparece en la Torre de mando a los 5 s
      magnet: 2.0,         // radio de imán del botín
      repairEvery: 0.25,   // reparar: una placa cada 0,25 s...
      repairHp: 30,        // ...arregla 30 puntos de vida
      repairReach: 0.75,   // distancia al edificio para repararlo
      repairCash: 10,      // sin Placas en la pila, cada tramo de reparación cuesta $10
    },

    pay: {
      dwell: 0.4,          // hay que quedarse 0,4 s encima antes de que empiece a pagar
      baseFrac: 0.35,      // a velocidad x1 se paga el 35 % del precio por segundo...
      accelTime: 1.5,      // ...y acelera de x1 a x5 en 1,5 s (funcional 13.2)
      maxMult: 5,
    },

    padRadius: 0.75,       // radio de las zonas que se pisan (entrada, salida, pago, dinero)

    ship: { land: 1.4, load: 1.0, leave: 1.2 },   // la nave de exportación, en segundos

    // El día y la noche (funcional 3 y 8)
    night: {
      warn: 10,            // «THE HIVE STIRS» durante 10 s antes de la noche
      dayCap: 360,         // si en 6 min la barra no se llena, la noche llega igualmente...
      capThreat: 0.5,      // ...con la mitad de amenaza
      provokeFrom: 3,      // el botón «provocar» aparece desde la noche 3
      provokeBonus: 0.5,   // botín extra = +50 % × parte vacía de la barra
      groupGap: 10,        // segundos entre grupos de bichos
      groupSize: 5,        // puntos de amenaza por grupo (más amenaza = más grupos)
      bonusBase: 15,       // premio por aguantar la noche: 15 × (1 + 0,5·n)
      hpGrow: 0.06,        // los bichos ganan un 6 % de vida por noche (escalan con la amenaza)
      lootGrow: 0.1,
      northFrom: 3,        // el flanco norte se activa desde la noche 3 (tras la Expansión)
      hideRange: 3,        // los drones se refugian si hay bichos a menos de 3 casillas
      secondChance: true,
      orbitalFrom: 5,      // el Orbital Strike se desbloquea en la noche 5 (funcional 4.4)
      lootDawn: 30,        // el botín que quedó en el suelo dura 30 s tras el amanecer
      firstSwarmers: 12,   // la primera noche, guionizada: solo Swarmers por el sur
      lostHq: 0.6,         // tras perder una noche, la Torre de mando se levanta con el 60 % de su vida
      mercy: 0.2,          // cada noche perdida seguida, la repetición trae un 20 % menos de amenaza...
      mercyMax: 0.6,       // ...hasta un 60 % menos como mucho
    },

    orbital: { delay: 1.5, radius: 1.6, dmg: 160 },

    save: { key: 'lmc_hb_save_v1', every: 20 },  // la clave NUNCA se renombra (funcional 20)

    // Suministro aéreo (funcional 15.3, vídeo n.º 4). Ver 47_supply.js. Prudente a propósito
    // (decidido 15/10/2026): el funcional dice cada 3-5 min; aquí, cada 4-5 y solo de día.
    supply: {
      from: 1,             // empieza a caer tras la primera noche ganada
      every: [240, 300],   // cada 4-5 min de día (al azar)
      fall: 1.2,           // segundos que tarda en bajar en paracaídas
      life: 60,            // en el suelo dura 60 s; luego se la lleva el viento
      secs: 90,            // con el vídeo da 90 s de producción en Créditos
      min: 25,             // y nunca menos de $25
    },

    // Mientras no juegas (funcional 14.4 y 20). Ver 44_offline.js.
    offline: {
      cap: 7200,           // tope de 2 h (decidido); la investigación lo subirá a 6 h (fase 3)
      minAway: 120,        // fuera menos de 2 min no sale la pantalla «WHILE YOU WERE AWAY»
      vault: true,         // provisional: tampoco offline se compra más de lo que cabe en la caja fuerte
    },
  };

  // Objetos que se cargan en la pila (funcional 5.1). h = alto en la pila (casillas).
  HB.ITEMS = {
    ore:   { h: 0.20, price: 0 },
    plate: { h: 0.15, price: 3 },
    ammo:  { h: 0.22, price: 10 },
  };

  // Máquinas, torretas y edificios. w × h = huella en el suelo (casillas). z = alto del dibujo.
  // kind: 'proc' transforma objetos · 'export' vende a la flota · 'hq' Torre de mando ·
  //       'power' da energía · 'cool' Disipador · 'turret' defiende · 'wall' muro ·
  //       'dronepad' base de drones (no ocupa sitio: se pisa).
  // power: MW que consume; supply: MW que da. heat: Calor por segundo mientras trabaja.
  // levels: nivel 1, 2 y 3 (funcional 6.2). Si un nivel trae `power`, ese nivel consume eso
  // (mejorar una máquina la hace más rápida, pero pide más energía).
  HB.MACHINES = {
    smelter: {
      kind: 'proc', w: 2.2, h: 1.8, z: 1.1, hp: 200, power: 2,
      inputs: { ore: 1 }, output: 'plate', heat: 1.0,
      levels: [
        { time: 0.8,  inCap: 20, outCap: 20, heatMul: 1,   power: 2 },
        { time: 0.6,  inCap: 30, outCap: 30, heatMul: 1,   power: 3 },
        { time: 0.45, inCap: 40, outCap: 40, heatMul: 0.7, power: 4 },
      ],
    },
    ammo_fab: {
      kind: 'proc', w: 2.2, h: 1.8, z: 1.0, hp: 200, power: 3,
      inputs: { plate: 2 }, output: 'ammo', heat: 1.5,
      levels: [
        { time: 1.4,  inCap: 20, outCap: 16, heatMul: 1,   power: 3 },
        { time: 1.0,  inCap: 30, outCap: 24, heatMul: 1,   power: 4 },
        { time: 0.75, inCap: 40, outCap: 32, heatMul: 0.7, power: 5 },
      ],
    },
    export: {
      kind: 'export', w: 2.4, h: 2.4, z: 0.25, hp: 250,
      accepts: ['ammo', 'plate'],     // la nave compra en este orden si no cabe todo en la caja
      levels: [
        { interval: 20, vault: 150,  inCap: 40 },
        { interval: 15, vault: 400,  inCap: 60 },
        { interval: 11, vault: 1000, inCap: 80 },
      ],
    },
    hq:         { kind: 'hq', w: 2.2, h: 2.0, z: 1.9, hp: 600, supply: 5 },
    solar:      { kind: 'power', w: 1.6, h: 1.2, z: 0.6, hp: 120, supply: 5 },
    dissipator: { kind: 'cool', w: 1.4, h: 1.4, z: 1.3, hp: 150, power: 3, heat: -2 },
    wall:       { kind: 'wall', w: 1, h: 0.5, z: 0.7, hp: 300 },

    // Torretas (funcional 9.1). dmg por disparo, rate disparos/s, range casillas,
    // shots = disparos por caja de munición, box = cajas que caben, splash = radio de área.
    // Niveles: multiplican daño y cadencia y suman alcance.
    gatling: {
      kind: 'turret', w: 1.2, h: 1.2, z: 0.9, hp: 160,
      dmg: 5, rate: 6, range: 4.5, shots: 25, box: 5, splash: 0, startBoxes: 2,
      levels: [{ dmg: 1, rate: 1, range: 0 }, { dmg: 1.35, rate: 1.2, range: 0.5 }, { dmg: 1.8, rate: 1.4, range: 1 }],
    },
    cannon: {
      kind: 'turret', w: 1.2, h: 1.2, z: 0.9, hp: 190,
      dmg: 26, rate: 0.8, range: 5, shots: 6, box: 5, splash: 1.0, startBoxes: 2, shellSpeed: 7,
      levels: [{ dmg: 1, rate: 1, range: 0 }, { dmg: 1.35, rate: 1.2, range: 0.5 }, { dmg: 1.8, rate: 1.4, range: 1 }],
    },

    // Drones (funcional 7): n drones por base, cap = carga, speed = casillas/s.
    dronepad: {
      kind: 'dronepad', w: 1.3, h: 1.3, z: 0.05, hp: 100,
      mineEvery: 0.5, moveEvery: 0.15,
      levels: [{ n: 1, cap: 4, speed: 2.5 }, { n: 2, cap: 5, speed: 2.8 }, { n: 3, cap: 6, speed: 3.1 }],
    },
  };

  // Bichos (funcional 9.5). cost = puntos de amenaza que gasta; loot = Créditos al morir.
  // from = primera noche en la que aparecen en R1. r = radio. dmg por golpe, rate golpes/s.
  HB.ENEMIES = {
    swarmer: { hp: 22,  speed: 1.5,  dmg: 8,  rate: 1.0, r: 0.28, cost: 1, loot: 3,  weight: 10, from: 1 },
    leaper:  { hp: 40,  speed: 1.8,  dmg: 8,  rate: 1.0, r: 0.32, cost: 3, loot: 6,  weight: 3,  from: 4, jump: true },
    crusher: { hp: 260, speed: 0.75, dmg: 25, rate: 0.6, r: 0.48, cost: 9, loot: 20, weight: 1.5, from: 6 },
    gilded:  { hp: 30,  speed: 2.4,  dmg: 0,  rate: 0,   r: 0.28, cost: 0, loot: 60, chance: 1 / 150, flee: true, gems: 5 },
    brood:   { hp: 1800, speed: 0.45, dmg: 40, rate: 0.6, r: 1.0, cost: 0, loot: 400, boss: true,
               phases: [0.75, 0.5, 0.25], brood: 6 },
  };

  // Regiones. Cada zona: id, kind, posición (x, y) y:
  //   'vein'      → aparece una veta en (x, y)
  //   'machine'   → se construye `type` con centro en (x, y); flip = entrada a la derecha
  //   'upgrade'   → sube un nivel `target`; la zona está en (x, y)
  //   'expansion' → la niebla retrocede hasta `fogY` y se abre el flanco norte
  //   'turret'    → torreta en (x, y): `type` fijo o `choice` (el jugador elige)
  //   'wall'      → muro horizontal de x0 a x1 en la fila y
  //   'drone'     → base de drones en (x, y) con su ruta: route.kind 'miner' (de las vetas a una
  //                 máquina) o 'cargo' (de la salida de una máquina a la entrada de otra)
  //   'nest'      → el Nido: pagarla permite lanzar la noche del jefe (funcional 3.4)
  // req: zonas que tienen que estar compradas para que esta aparezca.
  // Precio: P(n) = p0 × k^n × mult, con n = posición en la lista (funcional 6.3).
  // Se ven a la vez como mucho `visible` zonas: las primeras de la lista que cumplen req.
  HB.REGIONS = {
    r1: {
      name: 'Dust Flats',
      w: 12, h: 44,
      fogY: 15.4,           // por encima de esta fila hay niebla al empezar
      p0: 50, k: 1.15,
      // Las 5 primeras zonas cuestan menos (decidido 15/10/2026): el funcional 21 pide que la
      // primera zona se pague en menos de 45 s y el primer dron llegue antes de 3 min.
      early: [0.5, 0.55, 0.6, 0.6, 0.55],
      visible: 3,
      spawn: { x: 6.0, y: 26.4 },
      // Amenaza (funcional 8): barra de Calor B(n) = B0·(1 + 0,25·n); amenaza A(n) = A0·(1 + 0,15·n)
      B0: 140, A0: 16,
      flanks: {
        s: { y: 43.4, x0: 1.5, x1: 10.5 },
        n: { fromFog: true, x0: 1.5, x1: 10.5 },   // sale de la niebla
      },
      nestAt: { x: 6.0, y: 41.4 },
      // Reciclador (decisión provisional): quedarse encima vacía la pila. Evita el atasco de
      // tener la pila llena de mineral con la Fundición llena por los dos lados.
      trash: { x: 6.0, y: 31.3 },
      start: [
        { id: 'hq',        type: 'hq',      x: 6.0, y: 29.0 },
        { id: 'smelter_1', type: 'smelter', x: 6.0, y: 22.8 },
        { id: 'export',    type: 'export',  x: 9.6, y: 26.4 },
      ],
      veins: [ { id: 'vein_1', x: 2.4, y: 24.0 } ],
      zones: [
        { id: 'vein_2',        kind: 'vein',      x: 2.4,  y: 25.85 },
        { id: 'ammo_fab',      kind: 'machine',   x: 6.0,  y: 18.8, type: 'ammo_fab', flip: true, mult: 1.3 },
        { id: 'expansion_n',   kind: 'expansion', x: 9.8,  y: 16.4, fogY: 3, mult: 1.3 },
        { id: 'turret_s1',     kind: 'turret',    x: 4.0,  y: 33.4, type: 'gatling', mult: 1.2 },
        { id: 'drone_miner_1', kind: 'drone',     x: 2.2,  y: 21.4, mult: 1.3, route: { kind: 'miner', veins: ['vein_1', 'vein_2'], to: 'smelter_1' } },
        { id: 'smelter_1_l2',  kind: 'upgrade',   x: 6.0,  y: 24.65, target: 'smelter_1' },
        { id: 'drone_cargo_1', kind: 'drone',     x: 10.2, y: 21.4, req: ['ammo_fab'], route: { kind: 'cargo', from: 'smelter_1', to: 'ammo_fab' } },
        { id: 'solar_1',       kind: 'machine',   x: 2.4,  y: 28.8, type: 'solar' },
        { id: 'wall_s1',       kind: 'wall',      x: 1.7,  y: 35.2, x0: 0, x1: 3.4 },
        { id: 'vein_3',        kind: 'vein',      x: 1.8,  y: 11.6, req: ['expansion_n'] },
        { id: 'turret_s2',     kind: 'turret',    x: 8.0,  y: 33.4, choice: ['gatling', 'cannon'], mult: 1.2 },
        { id: 'export_l2',     kind: 'upgrade',   x: 11.1, y: 29.2, target: 'export' },
        { id: 'smelter_2',     kind: 'machine',   x: 6.6,  y: 10.6, type: 'smelter', req: ['expansion_n'], mult: 1.3 },
        { id: 'drone_cargo_2', kind: 'drone',     x: 2.2,  y: 17.4, req: ['ammo_fab'], route: { kind: 'cargo', from: 'ammo_fab', to: 'export' } },
        { id: 'turret_n1',     kind: 'turret',    x: 4.0,  y: 6.6, choice: ['gatling', 'cannon'], req: ['expansion_n'], mult: 1.2 },
        { id: 'ammo_fab_l2',   kind: 'upgrade',   x: 9.9,  y: 18.6, target: 'ammo_fab', req: ['ammo_fab'] },
        { id: 'drone_miner_2', kind: 'drone',     x: 1.2,  y: 10.0, req: ['smelter_2', 'vein_3'], route: { kind: 'miner', veins: ['vein_3', 'vein_4'], to: 'smelter_2' } },
        { id: 'vein_4',        kind: 'vein',      x: 1.8,  y: 13.45, req: ['expansion_n'] },
        { id: 'drone_cargo_3', kind: 'drone',     x: 10.6, y: 13.8, req: ['smelter_2', 'ammo_fab'], route: { kind: 'cargo', from: 'smelter_2', to: 'ammo_fab' } },
        { id: 'wall_s2',       kind: 'wall',      x: 10.3, y: 35.2, x0: 8.6, x1: 12 },
        { id: 'turret_s1_l2',  kind: 'upgrade',   x: 2.4,  y: 31.9, target: 'turret_s1', req: ['turret_s1'] },
        { id: 'smelter_1_l3',  kind: 'upgrade',   x: 6.0,  y: 24.65, target: 'smelter_1', req: ['smelter_1_l2'] },
        { id: 'wall_n1',       kind: 'wall',      x: 1.7,  y: 5.2, x0: 0, x1: 3.4, req: ['expansion_n'] },
        { id: 'turret_n2',     kind: 'turret',    x: 8.0,  y: 6.6, choice: ['gatling', 'cannon'], req: ['expansion_n'], mult: 1.2 },
        { id: 'drone_miner_1_l2', kind: 'upgrade', x: 2.2, y: 21.4, target: 'drone_miner_1', req: ['drone_miner_1'] },
        { id: 'export_l3',     kind: 'upgrade',   x: 11.1, y: 29.2, target: 'export', req: ['export_l2'] },
        { id: 'turret_s2_l2',  kind: 'upgrade',   x: 9.6,  y: 31.9, target: 'turret_s2', req: ['turret_s2'] },
        { id: 'smelter_2_l2',  kind: 'upgrade',   x: 6.6,  y: 12.45, target: 'smelter_2', req: ['smelter_2'] },
        { id: 'dissipator_1',  kind: 'machine',   x: 11.0, y: 22.8, type: 'dissipator' },
        { id: 'solar_2',       kind: 'machine',   x: 10.4, y: 9.2,  type: 'solar', req: ['expansion_n'] },
        { id: 'nest',          kind: 'nest',      x: 6.0,  y: 38.8, mult: 1.5 },
      ],
    },
  };

  // Tiempos y tamaños de la "jugosidad" (funcional 13.2). Se ajusta la sensación sin tocar código.
  HB.FX = {
    mineArc: 0.25,          // el Ore salta en arco a la pila
    mineArcH: 1.1,          // alto del arco (casillas)
    stackLag: 0.015,        // retardo del muelle por cada objeto de altura (15 ms)
    stackLean: 0.55,        // cuánto se inclina la pila al moverse
    depositFly: 0.2,        // vuelo de la pila a la máquina
    pickupFly: 0.2,
    squash: 0.16,           // la máquina "traga": se aplasta un 16 % y recupera
    billFly: 0.5,           // billetes al contador
    billStagger: 0.025,
    billMax: 15,            // máximo de billetes volando a la vez por cobro
    payBillEvery: 0.05,     // al pagar, un billete sale cada 50 ms
    counterPulse: 1.15,     // el contador crece al 115 % y vuelve
    counterRoll: 0.4,       // la cifra rueda durante 0,4 s
    unlockFlash: 0.08,
    rise: 0.35,             // el edificio sube del suelo: 60 % → 115 % → 100 %
    confetti: 40,
    shakePx: 4, shakeTime: 0.15,
    maxBounce: 0.45,
    hitFlash: 0.06,         // destello blanco del impacto
    splat: 10,              // gotas de baba al morir un bicho (8-12)
    hitstop: 0.12,          // pausa de los golpes grandes (élite y jefe)
    slowmo: 0.8, slowmoScale: 0.3,   // muerte del jefe: cámara lenta al 30 % durante 0,8 s
    pools: { particles: 400, flyers: 60, texts: 30 },
    lowFpsLimit: 50, lowFpsTime: 3,  // modo ahorro si baja de 50 FPS durante 3 s (funcional 13.3)
  };

  // Cofres (funcional 12, 13.2 y 9.5). En el prototipo son gratis y con premio fijo; las Gemas
  // solo se ganan y se ven (funcional 21: «Gemas sólo para probar el cofre»).
  // r = rareza, que da el color (funcional 13.1 regla 5): common blanco · rare azul ·
  // epic violeta · legendary dorado.
  HB.CHESTS = {
    first: { prizes: [{ k: 'credits', n: 150, r: 'common' }, { k: 'gems', n: 50, r: 'epic' }] },     // tras la primera noche ganada
    boss:  { prizes: [{ k: 'credits', n: 500, r: 'rare' }, { k: 'gems', n: 100, r: 'legendary' }] }, // al caer la Madre de la Prole
  };

  // Pasos del tutorial (funcional 12), en el orden en que se esperan. La lógica apunta en st.ftue
  // el segundo de juego en que pasa cada uno por primera vez; el menú de pruebas y el simulador
  // los enseñan en este orden (sirve para ver dónde se atasca quien juega por primera vez).
  HB.FTUE = ['intro', 'move', 'mine', 'feed', 'pickup', 'sell', 'collect', 'buy', 'drone', 'heat',
    'warn', 'night', 'win', 'chest', 'refill', 'power', 'choice', 'leaper', 'orbitalReady', 'orbital', 'boss',
    'cleared', 'offlineTip', 'away', 'supplyDrop', 'supply', 'trash'];

  // Lugares de vídeo recompensado (funcional 15.3). En el prototipo son SIMULADOS: el botón da
  // la recompensa sin anuncio y se cuenta en el menú de pruebas.
  HB.AD_PLACEMENTS = {
    night_x2:      { cap: 15 },
    offline_x2:    { cap: 3 },    // al volver: lo producido fuera, ×2
    supply:        { cap: 8 },    // suministro aéreo
    second_chance: { cap: 1 },    // por noche
  };
})(globalThis.HB);
