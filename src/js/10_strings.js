// Hive Breaker — textos que ve el jugador. Inglés y español desde el MVP (funcional 20 y 24.8).
// Regla: ningún texto de pantalla se escribe en el código; se pide con HB.T('clave').
// tools/check.js comprueba que las dos columnas tengan las mismas claves.
(function (HB) {
  'use strict';

  HB.STRINGS = {
    en: {
      // Pistas del tutorial (cortas: mano animada + flecha, sin textos largos)
      hint_drag: 'DRAG TO MOVE',
      hint_mine: 'MINE ORE',
      hint_deposit: 'FEED THE SMELTER',
      hint_feed: 'DROP IT OFF',
      hint_pickup: 'GRAB THE OUTPUT',
      hint_export: 'SELL TO THE FLEET',
      hint_collect: 'GRAB THE CASH',
      hint_pay: 'STAND HERE TO BUY',

      // Estados de máquinas y pilas
      max: 'MAX',
      no_input: 'NO INPUT',
      output_full: 'OUTPUT FULL',
      vault_full: 'VAULT FULL',

      // Objetos
      item_ore: 'Ore',
      item_plate: 'Plate',
      item_ammo: 'Ammo',

      // Edificios y zonas
      b_vein: 'Ore Vein',
      b_smelter: 'Smelter',
      b_ammo_fab: 'Ammo Factory',
      b_export: 'Export Pad',
      b_hq: 'Command Tower',
      b_expansion: 'Expansion',
      lvl: 'LV {0}',
      unlocked: 'UNLOCKED!',
      upgraded: 'UPGRADED!',
      area_open: 'NEW AREA!',
      export_sign: 'EXPORT',
      end_title: 'THAT\'S ALL FOR THIS BUILD',
      end_sub: 'Drones, turrets and the first night come next.',

      // Ajustes
      settings: 'SETTINGS',
      sound: 'Sound',
      vibration: 'Vibration',
      reduce_fx: 'Reduce effects',
      language: 'Language',
      lang_name: 'English',
      reset: 'Reset progress',
      reset_confirm: 'Tap again to erase everything',
      close: 'Close',
      on: 'ON',
      off: 'OFF',
      debug: 'Test tools',
      autopilot: 'Autopilot',
      speed4: 'Speed x4',
      add_money: '+$500',
      show_fps: 'Show FPS',
      build: 'Build {0}',
    },

    es: {
      hint_drag: 'ARRASTRA PARA MOVERTE',
      hint_mine: 'MINA MINERAL',
      hint_deposit: 'ALIMENTA LA FUNDICIÓN',
      hint_feed: 'DÉJALO AQUÍ',
      hint_pickup: 'RECOGE LO FABRICADO',
      hint_export: 'VENDE A LA FLOTA',
      hint_collect: 'RECOGE EL DINERO',
      hint_pay: 'QUÉDATE AQUÍ PARA COMPRAR',

      max: 'MAX',
      no_input: 'SIN MATERIAL',
      output_full: 'SALIDA LLENA',
      vault_full: 'CAJA LLENA',

      item_ore: 'Mineral',
      item_plate: 'Placa',
      item_ammo: 'Munición',

      b_vein: 'Veta',
      b_smelter: 'Fundición',
      b_ammo_fab: 'Fábrica de munición',
      b_export: 'Exportación',
      b_hq: 'Torre de mando',
      b_expansion: 'Expansión',
      lvl: 'NV {0}',
      unlocked: '¡DESBLOQUEADO!',
      upgraded: '¡MEJORADO!',
      area_open: '¡NUEVA ZONA!',
      export_sign: 'EXPORT',
      end_title: 'ESTO ES TODO EN ESTA VERSIÓN',
      end_sub: 'Lo siguiente: drones, torretas y la primera noche.',

      settings: 'AJUSTES',
      sound: 'Sonido',
      vibration: 'Vibración',
      reduce_fx: 'Menos efectos',
      language: 'Idioma',
      lang_name: 'Español',
      reset: 'Borrar progreso',
      reset_confirm: 'Toca otra vez para borrarlo todo',
      close: 'Cerrar',
      on: 'SÍ',
      off: 'NO',
      debug: 'Herramientas de prueba',
      autopilot: 'Piloto automático',
      speed4: 'Velocidad x4',
      add_money: '+$500',
      show_fps: 'Ver FPS',
      build: 'Versión {0}',
    },
  };
})(globalThis.HB);
