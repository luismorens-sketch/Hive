// Hive Breaker — TABLAS. Aquí vive el diseño en números (funcional 20: "Tablas").
//
// Regla: el balance se toca aquí, no en el código. Añadir un edificio = una fila en MACHINES y
// una función de dibujo; añadir una zona = una fila en REGIONS.<región>.zones.
// Todas las cifras son valores iniciales para el simulador (tools/sim_balance.js), no balance
// cerrado. Unidades: distancias en casillas, tiempos en segundos, dinero en Créditos ($).
(function (HB) {
  'use strict';

  HB.CONFIG = {
    version: '0.2.0',      // sube con cada versión que se publica para probar
    hito: 2,               // hito del funcional 21 en el que estamos
    tickHz: 30,            // movimiento y acciones del comandante (funcional 20: paso fijo 30 Hz)
    econEvery: 3,          // la economía corre 1 de cada 3 pasos = 10 Hz
    viewTiles: 10,         // casillas que caben a lo ancho de la pantalla

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
    },

    pay: {
      dwell: 0.4,          // hay que quedarse 0,4 s encima antes de que empiece a pagar (pasar por encima corriendo no paga)
      baseFrac: 0.35,      // a velocidad x1 se paga el 35 % del precio por segundo...
      accelTime: 1.5,      // ...y acelera de x1 a x5 en 1,5 s (funcional 13.2)
      maxMult: 5,
    },

    padRadius: 0.75,       // radio de las zonas que se pisan (entrada, salida, pago, dinero)

    ship: { land: 1.4, load: 1.0, leave: 1.2 },   // la nave de exportación, en segundos

    save: { key: 'lmc_hb_save_v1', every: 20 },  // la clave NUNCA se renombra (funcional 20)
  };

  // Objetos que se cargan en la pila (funcional 5.1). h = alto en la pila (casillas).
  HB.ITEMS = {
    ore:   { h: 0.20, price: 0 },
    plate: { h: 0.15, price: 3 },
    ammo:  { h: 0.22, price: 10 },
  };

  // Máquinas y edificios. w × h = huella en el suelo (casillas). z = alto del dibujo.
  // kind: 'proc' transforma objetos; 'export' vende a la flota; 'decor' de momento solo se ve.
  // levels: nivel 1, 2 y 3 (funcional 6.2: velocidad · capacidad · menos Calor).
  HB.MACHINES = {
    smelter: {
      kind: 'proc', w: 2.2, h: 1.8, z: 1.1,
      inputs: { ore: 1 }, output: 'plate', heat: 1.0,
      levels: [
        { time: 0.8,  inCap: 20, outCap: 20, heatMul: 1 },
        { time: 0.6,  inCap: 30, outCap: 30, heatMul: 1 },
        { time: 0.45, inCap: 40, outCap: 40, heatMul: 0.7 },
      ],
    },
    ammo_fab: {
      kind: 'proc', w: 2.2, h: 1.8, z: 1.0,
      inputs: { plate: 2 }, output: 'ammo', heat: 1.5,
      levels: [
        { time: 1.4,  inCap: 20, outCap: 16, heatMul: 1 },
        { time: 1.0,  inCap: 30, outCap: 24, heatMul: 1 },
        { time: 0.75, inCap: 40, outCap: 32, heatMul: 0.7 },
      ],
    },
    export: {
      kind: 'export', w: 2.4, h: 2.4, z: 0.25,
      accepts: ['ammo', 'plate'],     // la nave compra en este orden si no cabe todo en la caja
      levels: [
        { interval: 20, vault: 150,  inCap: 40 },
        { interval: 15, vault: 400,  inCap: 60 },
        { interval: 11, vault: 1000, inCap: 80 },
      ],
    },
    hq: { kind: 'decor', w: 2.2, h: 2.0, z: 1.9 },
  };

  // Regiones. Cada zona: id, kind, posición (x, y) de la zona que se pisa, y:
  //   kind 'vein'      → aparece una veta en (x, y)
  //   kind 'machine'   → se construye `type` con centro en (x, y); flip = entrada a la derecha
  //   kind 'upgrade'   → sube un nivel `target`; la zona está en (x, y)
  //   kind 'expansion' → la niebla retrocede hasta `fogY`
  // req: zonas que tienen que estar compradas para que esta aparezca.
  // Precio: P(n) = p0 × k^n × mult, con n = posición en la lista (funcional 6.3).
  // Se ven a la vez como mucho `visible` zonas: las primeras de la lista que cumplen req.
  HB.REGIONS = {
    r1: {
      name: 'Dust Flats',
      w: 12, h: 36,
      fogY: 16,             // por encima de esta fila hay niebla al empezar
      p0: 15, k: 1.25,
      visible: 3,
      spawn: { x: 6.0, y: 28.6 },
      start: [
        { id: 'hq',        type: 'hq',      x: 6.0, y: 31.2 },
        { id: 'smelter_1', type: 'smelter', x: 6.0, y: 23.8 },
        { id: 'export',    type: 'export',  x: 9.6, y: 27.8 },
      ],
      veins: [ { id: 'vein_1', x: 2.4, y: 24.9 } ],
      zones: [
        { id: 'vein_2',       kind: 'vein',      x: 2.4,  y: 26.75 },
        { id: 'ammo_fab',     kind: 'machine',   x: 6.0,  y: 19.6, type: 'ammo_fab', flip: true, mult: 1.3 },
        { id: 'smelter_1_l2', kind: 'upgrade',   x: 6.0,  y: 25.65, target: 'smelter_1' },
        { id: 'export_l2',    kind: 'upgrade',   x: 11.1, y: 30.6, target: 'export' },
        { id: 'expansion_n',  kind: 'expansion', x: 6.0,  y: 17.1, fogY: 4, mult: 1.3 },
        { id: 'vein_3',       kind: 'vein',      x: 1.8,  y: 12.6, req: ['expansion_n'] },
        { id: 'smelter_2',    kind: 'machine',   x: 6.6,  y: 11.4, type: 'smelter', req: ['expansion_n'], mult: 1.3 },
        { id: 'ammo_fab_l2',  kind: 'upgrade',   x: 9.9,  y: 19.4, target: 'ammo_fab', req: ['ammo_fab'] },
        { id: 'vein_4',       kind: 'vein',      x: 1.8,  y: 14.45, req: ['expansion_n'] },
        { id: 'smelter_1_l3', kind: 'upgrade',   x: 6.0,  y: 25.65, target: 'smelter_1', req: ['smelter_1_l2'] },
        { id: 'export_l3',    kind: 'upgrade',   x: 11.1, y: 30.6, target: 'export', req: ['export_l2'] },
        { id: 'smelter_2_l2', kind: 'upgrade',   x: 6.6,  y: 13.25, target: 'smelter_2', req: ['smelter_2'] },
        { id: 'ammo_fab_l3',  kind: 'upgrade',   x: 9.9,  y: 19.4, target: 'ammo_fab', req: ['ammo_fab_l2'] },
        { id: 'smelter_2_l3', kind: 'upgrade',   x: 6.6,  y: 13.25, target: 'smelter_2', req: ['smelter_2_l2'] },
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
    pools: { particles: 400, flyers: 60, texts: 30 },
    lowFpsLimit: 50, lowFpsTime: 3,  // modo ahorro si baja de 50 FPS durante 3 s (funcional 13.3)
  };
})(globalThis.HB);
