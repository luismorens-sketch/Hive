# Hive Breaker — prompts para generar el arte con IA

> Para el autor. Cada bloque gris es un **prompt para copiar y pegar tal cual** en Gemini (o la
> IA que uses). Están en inglés porque así salen mejor; la explicación va en español.
> Mientras no lleguen las imágenes, el juego usa los dibujos hechos con código: **no hay prisa
> ni orden obligatorio**, y cada imagen que llega sustituye a su dibujo sin tocar nada más.

## Cómo hacerlo (resumen)

1. **Primero genera solo la Fundición** (`hb_smelter`). Es la que fija el estilo de todo el
   juego. Repite hasta que te guste y mándamela.
2. Cuando la aprobemos, **en cada imagen siguiente adjunta la Fundición aprobada** como
   referencia y añade al final del prompt: `Match the exact art style, outline thickness,
   lighting and colors of the attached reference image.`
3. **Guarda cada imagen con el nombre exacto** que pone en su apartado (por ejemplo
   `hb_smelter.png`). Sin puntos en medio del nombre, sin espacios, sin mayúsculas.
4. Mándamelas por el chat (o, si estás en el ordenador, déjalas en la carpeta
   `arte/originales/` del repositorio). Yo quito el fondo, las recorto, las meto en el juego y
   te publico una versión para probar.

### Las cuatro reglas que ya costaron disgustos

- **Fondo de un solo color, liso**: magenta puro `#FF00FF` para todo… **menos los bichos y el
  Nido**, que son violeta y rosa: esos van sobre **verde puro `#00FF00`** (si no, al quitar el
  fondo se comería parte del bicho; es lo que pasó con el neón de MFP).
- **Ninguna palabra**: ni letras, ni números, ni logotipos. Los textos los pone el juego, en
  inglés y en español.
- **Un solo objeto por imagen**, centrado, entero (que no se corte por los bordes).
- **Adjunta siempre la paleta** (está más abajo, en el prompt) **y una referencia aprobada**.

## Estilo común (ya va dentro de cada prompt)

«Militar de juguete» (funcional 19): vista 3/4 desde arriba, colores saturados, siluetas gruesas
con contorno oscuro, lectura instantánea. Humanos y máquinas en verde oliva y turquesa con
naranja de seguridad; bichos en violeta y rosa ácido con puntos que brillan, amenazantes pero no
repulsivos (nada de vísceras).

Paleta: oliva `#6F9440`, turquesa `#27B3A4`, naranja de seguridad `#FF8A1F`, amarillo
`#FFD23F`, acero `#D5DEE2`, contorno `#1C2126`; bichos violeta `#8E3FD0` y rosa ácido `#FF4FA3`.

---

## 1. Edificios (fondo magenta)

### `hb_smelter` — Fundición (la primera: fija el estilo)

Un horno: puerta en arco al rojo vivo, ladrillo abajo, cúpula y chimenea. Entra mineral por una
tolva a la **izquierda** y sale una placa por un conducto a la **derecha**.

```
A chunky stylized mobile game building asset: a small industrial smelting furnace for a toy-military base on a desert planet. Three-quarter top-down view, camera about 35 degrees above, the front of the building facing the viewer. Dark steel body with an olive green stripe, a big glowing orange-yellow arched furnace door in the middle of the front wall, red brick base, a small rounded dome on the roof and a short metal chimney with a glowing orange top. A metal input hopper on the LEFT side of the roof and a short output chute sticking out on the RIGHT side. Thick dark outline (#1C2126) around every shape, saturated colors, soft clean cel shading, toy-like proportions, like a building from a polished casual mobile game. Palette: olive green #6F9440, teal #27B3A4, safety orange #FF8A1F, yellow #FFD23F, steel #D5DEE2, outline #1C2126. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF filling the whole background, no shadow on the background, no ground, no scenery. The object itself must contain no magenta or pink. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_ammo_fab` — Fábrica de munición

Una prensa verde oliva con el emblema de tres balas. Entra placa por la izquierda y sale la caja
de munición por la derecha (el juego la voltea si hace falta).

```
A chunky stylized mobile game building asset: a small ammunition factory for a toy-military base. Three-quarter top-down view, camera about 35 degrees above, the front facing the viewer. Olive green boxy body with a yellow and black hazard stripe at the bottom, a round yellow emblem on the front showing three brass bullets, a heavy hydraulic press frame with an orange top beam on the roof, a metal input hopper on the LEFT side of the roof and small output rollers on the RIGHT side. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, toy-like proportions, polished casual mobile game style. Palette: olive green #6F9440, teal #27B3A4, safety orange #FF8A1F, yellow #FFD23F, steel #D5DEE2, outline #1C2126. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no ground, no scenery. The object must contain no magenta or pink. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_export` — Plataforma de exportación

Donde aterriza la nave de la flota: una losa octogonal con aro amarillo y flechas hacia el centro.

```
A chunky stylized mobile game asset: an octagonal concrete landing pad for cargo ships, seen in three-quarter top-down view (camera about 50 degrees above). Dark grey concrete slab with a dashed yellow landing ring, four yellow arrows pointing to the center, small yellow lights on the corners, a short orange signpost on the back left corner with a blank sign. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. Palette: safety orange #FF8A1F, yellow #FFD23F, steel #D5DEE2, outline #1C2126. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos, the sign is blank.
```

### `hb_hq` — Torre de mando

```
A chunky stylized mobile game building asset: a military command tower, the main building of a toy-military base. Three-quarter top-down view, camera about 35 degrees above, front facing the viewer. Light grey concrete base with a yellow and black hazard stripe, a teal cabin on top with a wide light-blue window, a radar dish and a thin antenna with a red light on the roof, a small orange triangular flag. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, toy-like proportions, polished casual mobile game style. Palette: olive green #6F9440, teal #27B3A4, safety orange #FF8A1F, yellow #FFD23F, steel #D5DEE2, outline #1C2126. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_solar` — Panel solar

```
A chunky stylized mobile game asset: a small solar panel array on metal legs, tilted toward the sky, with a small olive battery box with a yellow lightning bolt symbol beside it. Three-quarter top-down view, camera about 35 degrees above, front facing the viewer. Deep blue photovoltaic cells with a light blue grid, silver frame. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_dissipator` — Disipador de calor

```
A chunky stylized mobile game asset: a heat dissipator tower, a boxy machine with tall vertical silver cooling fins on the front, a teal stripe, and a large round cooling fan on the roof with a soft cyan cold glow. Three-quarter top-down view, camera about 35 degrees above, front facing the viewer. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, toy-like proportions, polished casual mobile game style. Palette: teal #27B3A4, steel #D5DEE2, outline #1C2126. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_wall` — Un tramo de muro

Un solo bloque; el juego lo repite para hacer muros largos.

```
A chunky stylized mobile game asset: one single concrete jersey barrier block (a short defensive wall segment) with a yellow and black hazard stripe along its front side. Three-quarter top-down view, camera about 35 degrees above, the long side facing the viewer, about twice as wide as it is tall. Light grey concrete, thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_dronepad` — Base de drones

```
A chunky stylized mobile game asset: a small round metal helipad for delivery drones, dark grey plate with a thick yellow ring and four small teal lights around the edge, the center left plain (no letters). Seen from above at about 60 degrees. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

## 2. Torretas (fondo magenta)

La base y la cabeza van **por separado**, porque la cabeza gira para apuntar.

### `hb_turret_base` — Base de torreta

```
A chunky stylized mobile game asset: an octagonal concrete turret platform with a dashed yellow ring and four bolts, empty on top (no gun). Seen from above at about 50 degrees. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_gatling_head` — Cabeza de Gatling (vista desde arriba, cañones hacia la derecha)

```
A chunky stylized mobile game asset: the rotating head of a gatling gun turret seen exactly from above (top-down, 90 degrees), the three gun barrels pointing to the RIGHT. Round olive green armored dome with a small teal visor slit, dark grey triple barrels. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_cannon_head` — Cabeza de cañón (vista desde arriba, cañón hacia la derecha)

```
A chunky stylized mobile game asset: the rotating head of a heavy cannon turret seen exactly from above (top-down, 90 degrees), one thick barrel with a muzzle brake pointing to the RIGHT. Large dark olive armored dome with a small orange detail at the back. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

## 3. Objetos pequeños (fondo magenta)

Se ven muy pequeños en el móvil: tienen que leerse por forma y color, sin detalle fino.

### `hb_item_ore` — Mineral

```
A chunky stylized mobile game icon: a single chunk of blue-grey ore rock with a few bright light-blue crystal glints, faceted, seen from a three-quarter view. Thick dark outline (#1C2126), saturated colors, simple clean cel shading, readable at very small size. One single object, centered, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. No text, no letters, no numbers.
```

### `hb_item_plate` — Placa (lingote)

```
A chunky stylized mobile game icon: a single shiny silver metal ingot plate, trapezoid shape, seen from a three-quarter view, with a white highlight. Thick dark outline (#1C2126), saturated colors, simple clean cel shading, readable at very small size. One single object, centered, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. No text, no letters, no numbers.
```

### `hb_item_ammo` — Caja de munición

```
A chunky stylized mobile game icon: a single small olive green military ammunition crate with one bright yellow stripe across the front, seen from a three-quarter view. Thick dark outline (#1C2126), saturated colors, simple clean cel shading, readable at very small size. One single object, centered, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. No text, no letters, no numbers.
```

### `hb_item_bill` — Billete

```
A chunky stylized mobile game icon: a small stack of two green cash banknotes, slightly fanned, with a light green center oval left blank, seen from a three-quarter view. Thick dark outline (#1C2126), saturated colors, simple clean cel shading, readable at very small size. One single object, centered, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. No text, no letters, no numbers, no currency symbols.
```

### `hb_vein` — Veta de mineral

Tiene que leerse como «un montón del mismo mineral que se recoge».

```
A chunky stylized mobile game asset: a mineable ore deposit, a mound of many blue-grey ore rock chunks with bright light-blue crystal glints, sitting on a darker rocky base with a few loose chunks around it. Three-quarter top-down view, camera about 35 degrees above. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow on the background, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

## 4. Vehículos (fondo magenta)

### `hb_ship` — Nave de carga de la flota (vista desde arriba)

```
A chunky stylized mobile game asset: a small cargo dropship seen from above at about 70 degrees, nose pointing DOWN toward the viewer. Olive green rounded hull with a teal stripe, a light-blue cockpit dome at the front, two side engine pods with glowing orange nozzles, a dark cargo hatch on the back with a small yellow and black hazard stripe. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, toy-like proportions, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

### `hb_drone` — Dron de carga (vista desde arriba)

```
A chunky stylized mobile game asset: a small quadcopter delivery drone seen exactly from above (top-down), compact teal body with a small orange light, four short arms with dark round rotor housings. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, toy-like proportions, polished casual mobile game style. One single object, centered, fully inside the frame, square image. Plain solid pure magenta background #FF00FF, no shadow, no scenery. No magenta or pink in the object. Absolutely no text, no letters, no numbers, no logos.
```

## 5. El enjambre (fondo VERDE puro)

Vistos **desde arriba**, con la cabeza hacia la **derecha** y las patas abiertas (el juego los gira).

### `hb_bug_swarmer` — Swarmer (el pequeño y abundante)

```
A chunky stylized mobile game enemy creature seen exactly from above (top-down, 90 degrees), head pointing to the RIGHT, legs spread: a small alien beetle-like bug with a violet oval abdomen, darker thorax and head, six thin dark legs, small mandibles, and a few glowing acid-pink spots on its back. Menacing but cute, not gross, no gore. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. Palette: violet #8E3FD0, acid pink #FF4FA3, outline #1C2126. One single creature, centered, fully inside the frame, square image. Plain solid pure green background #00FF00 filling the whole background, no shadow, no scenery. The creature must contain no green. Absolutely no text, no letters, no numbers.
```

### `hb_bug_leaper` — Leaper (salta muros)

```
A chunky stylized mobile game enemy creature seen exactly from above (top-down, 90 degrees), head pointing to the RIGHT: a slim alien grasshopper-like bug with a long magenta-violet body, two big folded powerful hind legs, four smaller front legs, and glowing acid-pink spots. Menacing but cute, not gross, no gore. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. Palette: violet #8E3FD0, acid pink #FF4FA3, outline #1C2126. One single creature, centered, fully inside the frame, square image. Plain solid pure green background #00FF00, no shadow, no scenery. The creature must contain no green. Absolutely no text, no letters, no numbers.
```

### `hb_bug_crusher` — Crusher (el acorazado)

```
A chunky stylized mobile game enemy creature seen exactly from above (top-down, 90 degrees), head pointing to the RIGHT: a big heavily armored alien beetle with a wide dark violet shell made of plates joined by glowing acid-pink seams, thick short legs, and two pale curved horns on its head. Menacing but cute, not gross, no gore. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. Palette: violet #8E3FD0, acid pink #FF4FA3, outline #1C2126. One single creature, centered, fully inside the frame, square image. Plain solid pure green background #00FF00, no shadow, no scenery. The creature must contain no green. Absolutely no text, no letters, no numbers.
```

### `hb_bug_brood` — Madre de la Prole (el jefe)

```
A chunky stylized mobile game boss creature seen exactly from above (top-down, 90 degrees), head pointing to the RIGHT: a huge alien brood mother bug with an enormous bloated violet abdomen covered in glowing acid-pink egg sacs, a smaller armored thorax and head with a crown of pale spikes, eight thick legs spread out. Menacing and impressive but not gross, no gore. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. Palette: violet #8E3FD0, acid pink #FF4FA3, outline #1C2126. One single creature, centered, fully inside the frame, square image. Plain solid pure green background #00FF00, no shadow, no scenery. The creature must contain no green. Absolutely no text, no letters, no numbers.
```

### `hb_nest` — El Nido

```
A chunky stylized mobile game asset: an alien hive nest mound, an organic purple and violet mound made of rounded lumps, with several dark holes glowing acid pink inside, a few pale bony spikes sticking out. Three-quarter top-down view, camera about 35 degrees above. Menacing but not gross, no gore. Thick dark outline (#1C2126), saturated colors, soft clean cel shading, polished casual mobile game style. Palette: violet #8E3FD0, acid pink #FF4FA3, outline #1C2126. One single object, centered, fully inside the frame, square image. Plain solid pure green background #00FF00, no shadow on the background, no scenery. The object must contain no green. Absolutely no text, no letters, no numbers, no logos.
```

## 6. Más adelante

- **El comandante** (4 direcciones, andar y disparar). Es lo más difícil de conseguir coherente
  con IA (tiene que ser el mismo personaje en todas las poses). Lo dejo para cuando el estilo de
  los edificios esté aprobado; entonces preparo los prompts con la referencia.
- Cofre, zona de pago y suministro aéreo, cuando lleguen al juego.

---

## Para Claude: qué hacer con cada imagen que llegue

1. Guardar el original en `arte/originales/<nombre>.png` (se sube: es la fuente del arte).
2. `python3 tools/recortar.py` → quita el fondo (magenta o verde, lo detecta solo), recorta,
   reduce y guarda `assets/sprites/<nombre>.webp`. Necesita Python con Pillow (en la nube ya
   está; en el ordenador: `pip install pillow`).
3. `node tools/build.js` mete todo `assets/sprites/` dentro del HTML. En el juego,
   `src/js/65_art.js` usa la imagen si existe y, si no, el dibujo hecho con código. Si una
   imagen queda descolocada o de tamaño raro, se ajusta su fila en `ART_SPECS`
   (`src/js/65_art.js`): ancho en casillas y punto de apoyo.
4. Capturas (`node tools/capture.js`), revisar, publicar y subir.
