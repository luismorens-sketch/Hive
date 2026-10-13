#!/usr/bin/env python3
"""Recorta el arte generado con IA y lo deja listo para el juego (docs/ARTE_PROMPTS.md).

Uso (desde la carpeta del repositorio):
    python3 tools/recortar.py                 procesa todo arte/originales/*.png|jpg|webp
    python3 tools/recortar.py hb_smelter      solo esa imagen

Para cada imagen:
  1. Detecta el color de fondo mirando las esquinas (magenta #FF00FF o verde #00FF00).
  2. Lo vuelve transparente, con borde suave, y quita el tinte del fondo en los bordes.
  3. Recorta lo que sobra alrededor, reduce a un tamaño razonable y guarda
     assets/sprites/<nombre>.webp (WebP con transparencia: pesa poco).
Después: node tools/build.js mete assets/sprites/ dentro del HTML.

Necesita Pillow. En la nube de Claude ya está; en el ordenador: pip install pillow
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    print('[recortar] Falta Pillow. Instálalo con: pip install pillow')
    sys.exit(1)

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'arte', 'originales')
OUT = os.path.join(ROOT, 'assets', 'sprites')

# Lado máximo de la imagen final, en píxeles. Los objetos pequeños no necesitan más.
MAX_SIDE = {'default': 512}
for small in ('hb_item_ore', 'hb_item_plate', 'hb_item_ammo', 'hb_item_bill', 'hb_drone', 'hb_bug_swarmer', 'hb_bug_leaper'):
    MAX_SIDE[small] = 192

KEYS = {'magenta': (255, 0, 255), 'green': (0, 255, 0)}


def detect_key(im):
    w, h = im.size
    pts = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3), (w // 2, 2), (2, h // 2)]
    best, bd = 'magenta', 1e9
    for name, kc in KEYS.items():
        d = 0
        for p in pts:
            r, g, b = im.getpixel(p)[:3]
            d += abs(r - kc[0]) + abs(g - kc[1]) + abs(b - kc[2])
        if d < bd:
            best, bd = name, d
    return best


def key_out(im, key):
    """Fondo → transparente, con rampa suave y sin halo del color de fondo."""
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if key == 'magenta':
                # cuánto "magenta" tiene el píxel: rojo y azul altos frente al verde
                k = min(r, b) - g
                spill = max(0, k)
            else:
                k = g - max(r, b)
                spill = max(0, k)
            if k > 150:
                px[x, y] = (0, 0, 0, 0)
                continue
            alpha = 255 if k < 60 else int(255 * (150 - k) / 90)
            # quitar el tinte del fondo que queda en los bordes
            if key == 'magenta' and spill > 0:
                r = max(0, r - spill // 2); b = max(0, b - spill // 2)
            elif key == 'green' and spill > 0:
                g = max(0, g - spill)
            px[x, y] = (r, g, b, min(a, alpha))
    return im


def process(name, path):
    im = Image.open(path).convert('RGB')
    key = detect_key(im)
    out = key_out(im, key)
    bbox = out.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
    if not bbox:
        print('[recortar] %s: no queda nada tras quitar el fondo (¿fondo raro?)' % name)
        return False
    pad = 4
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(out.width, bbox[2] + pad), min(out.height, bbox[3] + pad))
    out = out.crop(bbox)
    side = MAX_SIDE.get(name, MAX_SIDE['default'])
    s = min(1.0, side / max(out.size))
    if s < 1:
        out = out.resize((max(1, round(out.width * s)), max(1, round(out.height * s))), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, name + '.webp')
    out.save(dst, 'WEBP', quality=90, method=6)
    print('[recortar] %-18s fondo %-7s → %s (%dx%d, %d KB)' % (name, key, os.path.relpath(dst, ROOT), out.width, out.height, os.path.getsize(dst) // 1024))
    return True


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    if not os.path.isdir(SRC):
        print('[recortar] No existe %s. Deja ahí las imágenes generadas.' % os.path.relpath(SRC, ROOT))
        return 1
    n = 0
    for f in sorted(os.listdir(SRC)):
        base, ext = os.path.splitext(f)
        if ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
            continue
        if '.' in base or ' ' in base:
            print('[recortar] %s: el nombre no puede llevar puntos ni espacios (ver docs/ARTE_PROMPTS.md)' % f)
            continue
        if only and base != only:
            continue
        if process(base, os.path.join(SRC, f)):
            n += 1
    print('[recortar] %d imagen(es) listas. Ahora: node tools/build.js' % n)
    return 0


if __name__ == '__main__':
    sys.exit(main())
