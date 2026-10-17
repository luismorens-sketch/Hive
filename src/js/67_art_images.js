// Hive Breaker — arte hecho con IA (docs/ARTE_PROMPTS.md), cuando lo haya.
//
// tools/recortar.py deja las imágenes en assets/sprites/ y tools/build.js las mete en el HTML
// como HB.SPRITES (nombre → imagen). Aquí se sustituyen los dibujos hechos con código por esas
// imágenes, una a una: si una imagen no está, sigue el dibujo de siempre. El resto del juego no
// se entera, porque todo sigue pasando por los mismos sprites en caché (HB.View.sprite).
//
// ART_SPECS: tamaño con el que se pinta cada imagen (ancho en casillas) y dónde se apoya.
//   base:   la parte de abajo de la imagen queda tantas casillas por debajo del borde delantero
//           del edificio (para que "pise" el suelo).
//   center: la imagen va centrada en su sitio (cosas planas, vistas desde arriba).
// Si una imagen sale descolocada o de tamaño raro, se ajusta su fila aquí.
(function (HB) {
  'use strict';

  const V = HB.View, A = HB.Art;

  const ART_SPECS = {
    hb_smelter: { w: 3.0, base: 0.2 },
    hb_ammo_fab: { w: 3.0, base: 0.2 },
    hb_hq: { w: 2.8, base: 0.2 },
    hb_solar: { w: 2.0, base: 0.15 },
    hb_dissipator: { w: 1.9, base: 0.15 },
    hb_export: { w: 3.0, center: true },
    hb_vein: { w: 1.9, base: 0.45 },
    hb_nest: { w: 4.4, base: 1.0 },
    hb_turret_base: { w: 1.6, center: true },
    hb_gatling_head: { w: 1.25, center: true },
    hb_cannon_head: { w: 1.35, center: true },
    hb_wall: { w: 1.0, base: 0.3 },
    hb_dronepad: { w: 1.4, center: true },
    hb_drone: { w: 0.8, center: true },
    hb_ship: { w: 3.0, center: true },
    hb_item_ore: { w: 0.5, base: 0.05 },
    hb_item_plate: { w: 0.5, base: 0.05 },
    hb_item_ammo: { w: 0.5, base: 0.05 },
    hb_item_bill: { w: 0.55, base: 0.05 },
    hb_bug_swarmer: { w: 0.95, center: true },
    hb_bug_leaper: { w: 1.1, center: true },
    hb_bug_crusher: { w: 1.6, center: true },
    hb_bug_brood: { w: 3.0, center: true },
    // el sargento Brass (retrato de los avisos): una imagen por cara
    hb_sgt_normal: { w: 2.2, center: true },
    hb_sgt_alarm: { w: 2.2, center: true },
    hb_sgt_happy: { w: 2.2, center: true },
  };

  const IMGS = {};
  function img(name) {
    const src = HB.SPRITES && HB.SPRITES[name];
    if (!src) return null;
    let im = IMGS[name];
    if (!im) {
      im = IMGS[name] = new Image();
      im.onload = function () { V.cache = {}; };   // se rehacen los sprites con la imagen ya cargada
      im.src = src;
    }
    return im.complete && im.naturalWidth ? im : null;
  }
  A.img = img;
  A.specs = ART_SPECS;

  // Imagen apoyada en el suelo: su borde de abajo queda en local y = bottom.
  function grounded(key, im, wt, bottom, flip) {
    const ht = wt * im.naturalHeight / im.naturalWidth;
    return V.sprite(key, wt, ht, wt / 2, ht - bottom, function (g) {
      if (flip) g.scale(-1, 1);
      g.drawImage(im, -wt / 2, bottom - ht, wt, ht);
    });
  }
  function centered(key, im, wt) {
    const ht = wt * im.naturalHeight / im.naturalWidth;
    return V.sprite(key, wt, ht, wt / 2, ht / 2, function (g) { g.drawImage(im, -wt / 2, -ht / 2, wt, ht); });
  }

  // Edificio: la imagen se apoya en el borde delantero de la huella (local y = h/2).
  function building(name, type, flip) {
    const im = img(name);
    if (!im) return null;
    const S = ART_SPECS[name], h = HB.MACHINES[type].h;
    if (S.center) return centered('i:' + name, im, S.w);
    return grounded('i:' + name + ':' + (flip ? 1 : 0), im, S.w, h / 2 + S.base, flip);
  }

  const orig = {
    vein: A.vein, smelter: A.smelter, ammo_fab: A.ammo_fab, export: A.export, hq: A.hq, solar: A.solar,
    dissipator: A.dissipator, ship: A.ship, item: A.item, billHud: A.billHud, turretBase: A.turretBase,
    turretHead: A.turretHead, wall: A.wall, dronePad: A.dronePad, drone: A.drone, bug: A.bug, nest: A.nest,
    sergeant: A.sergeant,
  };

  A.smelter = function (flip, lvl) { return building('hb_smelter', 'smelter', flip) || orig.smelter(flip, lvl); };
  A.ammo_fab = function (flip, lvl) { return building('hb_ammo_fab', 'ammo_fab', flip) || orig.ammo_fab(flip, lvl); };
  A.hq = function () { return building('hb_hq', 'hq', false) || orig.hq(); };
  A.solar = function () { return building('hb_solar', 'solar', false) || orig.solar(); };
  A.dissipator = function () { return building('hb_dissipator', 'dissipator', false) || orig.dissipator(); };
  A.export = function () { return building('hb_export', 'export', false) || orig.export(); };

  // la imagen de IA es la veta de Ore; la de cobre, de momento, siempre dibujada con código
  A.vein = function (item) {
    const im = (item || 'ore') === 'ore' ? img('hb_vein') : null;
    return im ? grounded('i:vein', im, ART_SPECS.hb_vein.w, ART_SPECS.hb_vein.base, false) : orig.vein(item);
  };
  A.nest = function (broken) {
    const im = img('hb_nest');
    if (!im || broken) return orig.nest(broken);
    return grounded('i:nest', im, ART_SPECS.hb_nest.w, ART_SPECS.hb_nest.base, false);
  };
  A.ship = function () { const im = img('hb_ship'); return im ? centered('i:ship', im, ART_SPECS.hb_ship.w) : orig.ship(); };
  A.drone = function () { const im = img('hb_drone'); return im ? centered('i:drone', im, ART_SPECS.hb_drone.w) : orig.drone(); };
  A.dronePad = function () { const im = img('hb_dronepad'); return im ? centered('i:dpad', im, ART_SPECS.hb_dronepad.w) : orig.dronePad(); };
  A.turretBase = function () { const im = img('hb_turret_base'); return im ? centered('i:tbase', im, ART_SPECS.hb_turret_base.w) : orig.turretBase(); };
  A.turretHead = function (type) {
    const name = type === 'cannon' ? 'hb_cannon_head' : 'hb_gatling_head', im = img(name);
    return im ? centered('i:' + name, im, ART_SPECS[name].w) : orig.turretHead(type);
  };
  A.item = function (it) {
    const name = 'hb_item_' + it, im = img(name);
    return im ? grounded('i:' + name, im, ART_SPECS[name].w, ART_SPECS[name].base, false) : orig.item(it);
  };
  A.billHud = function () { const im = img('hb_item_bill'); return im ? centered('i:billhud', im, 0.6) : orig.billHud(); };
  A.bug = function (type, frame) {
    const name = 'hb_bug_' + type, im = img(name);
    return im ? centered('i:' + name, im, ART_SPECS[name].w) : orig.bug(type, frame);
  };
  // El sargento: con imagen no mueve la boca (se queda la cara de cada momento).
  A.sergeant = function (mood, open) {
    const name = 'hb_sgt_' + mood, im = img(name);
    return im ? centered('i:' + name, im, ART_SPECS[name].w) : orig.sergeant(mood, open);
  };
  // Muro: el bloque se repite a lo largo del tramo.
  A.wall = function (len) {
    const im = img('hb_wall');
    if (!im) return orig.wall(len);
    const n = Math.max(1, Math.round(len)), seg = len / n, ht = seg * im.naturalHeight / im.naturalWidth;
    const h = HB.MACHINES.wall.h, bottom = h / 2 + ART_SPECS.hb_wall.base;
    return V.sprite('i:wall:' + len.toFixed(2), len + 0.2, ht + 0.2, (len + 0.2) / 2, ht - bottom + 0.1, function (g) {
      for (let i = 0; i < n; i++) g.drawImage(im, -len / 2 + i * seg, bottom - ht, seg, ht);
    });
  };
})(globalThis.HB);
