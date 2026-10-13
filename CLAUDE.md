# Hive Breaker — instrucciones para Claude

Juego para **Android**: un Arcade Idle con defensa nocturna. El comandante carga mineral, lo
funde, lo vende a la flota y con el dinero desbloquea máquinas que acaban trabajando solas;
de noche, lo construido tiene que aguantar al enjambre. "Hive" es el nombre del repositorio.

Este archivo es lo único que ve **Claude en la nube —el que se abre desde el móvil—**, que no
ve la configuración del ordenador del autor. Por eso todo lo necesario para trabajar está aquí.

## Lo primero, en cada sesión

1. **Traer lo último de GitHub.** Está automatizado (ver "Trabajar desde el ordenador y
   desde el móvil"), pero **hay que leer lo que dice al arrancar**: si avisa de que no ha
   podido traer, no se empieza a trabajar hasta resolverlo.
2. **Leer `docs/ESTADO.md`**: en qué hito estamos, qué se probó, qué opinó el autor y qué toca
   ahora. Es corto a propósito.
3. **Leer `docs/HIVE_Funcional.md`** (o el apartado que toque): es la **fuente única de
   verdad** del diseño. Si el código y el funcional se contradicen, manda el funcional: es el
   código el que está desalineado, y hay que decirlo, no adaptar el funcional al código.
4. **Antes de comprometer: `node tools/check.js`.** Si falla, no se compromete.
5. **Terminar subiendo** (`git push`) y **dejar `docs/ESTADO.md` al día**. Eso no está
   automatizado y es cosa de Claude.

## Cómo trabajar con el autor

- Escríbele siempre en **español**, en lenguaje llano y con las menos abreviaturas posibles.
  El texto dentro del juego va en **inglés y español** (funcional 24.8), siempre desde
  `src/js/10_strings.js`.
- **No sabe programar.** Tú programas todo, compilas y le das algo que pueda probar. Él hace
  lo que tú no puedas hacer, prueba y te da su opinión.
- Antes de un cambio, explícale qué hace y qué puede romper.
- No des por hecho que sabe usar la terminal: dale el **comando exacto** y la carpeta desde la
  que ejecutarlo.
- Si algo tiene riesgo —borrar, publicar, sobrescribir—, avísale **antes**.
- **Cada cambio debería acabar en algo que pueda probar desde el móvil** (ver "Cómo entregar
  una prueba").
- **Las decisiones de diseño son suyas.** Si el funcional no dice algo y hay que elegir para
  poder programar, elige lo más sencillo, apúntalo en `docs/ESTADO.md` como "decisión
  provisional" y pregúntaselo. No lo escribas en el funcional como si estuviera decidido.
- **Tú no generas imágenes.** Las genera él en Gemini u otra IA; tú escribes el prompt exacto
  y después recortas, compones y montas. (Dibujar con código sí puedes: de momento todo el
  arte del juego está dibujado con código en `src/js/65_art.js`.)

### Cómo entregar una prueba

El visor de archivos de la app de Claude **enseña el HTML pero no ejecuta el `<script>`**, así
que mandarle un archivo por el chat no sirve para jugar. Para que pruebe desde el móvil hay
que **publicar la versión montada como Artifact**, siempre en **el mismo enlace**:

- **Enlace de pruebas:** https://claude.ai/code/artifact/PENDIENTE
- Pasos: `node tools/check.js` → `node tools/build.js` → publicar
  `dist/hive_breaker_artifact.html` con la herramienta Artifact **pasando ese enlace como
  `url`** (si la sesión no lo ha publicado antes, primero se lee con `action: "read"`). Así el
  autor siempre prueba en el mismo sitio y conserva su partida.
- Antes de publicar, subir `CONFIG.version` en `src/js/20_data.js` y apuntar en
  `docs/ESTADO.md` qué hay que probar.

Dos reglas que ya costaron disgustos en los otros juegos:

- **Un Artifact publicado NO es la fuente.** Es código ya montado. Si una sesión solo tiene el
  enlace de un Artifact y no el código, **no lo guarda ni lo parchea**: trae el repositorio
  (`git pull`). Lo que se prueba tiene que poder regenerarse desde `src/`.
- **Las banderas en la dirección (`?algo=1`) no funcionan dentro de un Artifact**, porque la
  página va en un iframe. Lo que haya que probar va en el menú de ajustes (rueda dentada):
  "Herramientas de prueba" tiene piloto automático, velocidad ×4, FPS y +$500.

## Comandos

Todos desde la carpeta del repositorio: en el ordenador `C:\GitHub\Hive`, en la nube
`/home/user/Hive`. No hay nada que instalar: solo hace falta Node.

| Comando | Qué hace |
|---|---|
| `node tools/check.js` | Comprueba todo antes de comprometer: marcas de conflicto, sintaxis, textos en los dos idiomas, tablas y mapa (que nada se pise), una partida del robot, el guardado y el montaje |
| `node tools/build.js` | Monta el juego en un solo HTML: `dist/hive_breaker.html` (doble clic para jugar en el ordenador) y `dist/hive_breaker_artifact.html` (para publicar) |
| `node tools/sim_balance.js` | Simulador de balance: el robot juega la región y dice cuánto tarda en cada zona frente a los tiempos del funcional 6.3. `--k 1.2 --p0 15` prueba otra curva de precios sin tocar las tablas |
| `node tools/capture.js` | Solo en la nube: abre el juego en un móvil simulado, lo juega en piloto automático y guarda capturas en `capturas/`. Sirve para que Claude vea lo que dibuja antes de publicar |

## Cómo está hecho el código

**Un único HTML5 + Canvas 2D** (funcional 20), montado desde `src/` por `tools/build.js`. Sin
librerías ni dependencias. Para Android se empaquetará con **Capacitor** (todavía no).

Los archivos de `src/js/` se pegan en orden de número. La frontera importante está en el 50:

| Archivos | Qué son | Regla |
|---|---|---|
| `00_core` – `45_advisor` | **Lógica**: reglas, tablas, guardado, el consejero | **Nunca tocan el DOM ni el canvas.** Los usa también el simulador de Node, así el robot juega con las mismas reglas que el móvil |
| `50_audio` – `90_main` | **Presentación**: sonido, dibujo, efectos, dedo, menú, arranque | Leen el estado; no deciden reglas |

Dónde se toca cada cosa:

- **Balance y diseño en números** → `src/js/20_data.js`: `CONFIG`, `ITEMS`, `MACHINES`,
  `REGIONS` (con la lista de zonas de cada región) y `FX` (tiempos de la jugosidad). Añadir
  una zona = una fila; `tools/check.js` avisa si pisa algo.
- **Textos** → `src/js/10_strings.js` (inglés y español, mismas claves).
- **Reglas** → `src/js/40_logic.js`. La lógica avisa de lo que pasa con eventos (`st.ev`) y
  no sabe nada del dibujo.
- **Qué toca hacer ahora** (flecha guía, piloto automático y robot del simulador) →
  `src/js/45_advisor.js`. Es el mismo código para los tres.
- **Sensación** (vuelos, chispas, sonidos, vibración de cada momento) → `src/js/75_juice.js`.
- **Arte** → `src/js/65_art.js` (dibujado con código; cuando lleguen sprites de IA, se
  sustituyen ahí).

Reglas del código:

- **Rendimiento por delante del efecto** (pilar 9): sin `shadowBlur`, sin filtros, reservas
  fijas de partículas y vuelos, lo que no se mueve se dibuja una vez en caché, y solo se
  dibuja lo que se ve. Antes de añadir efectos caros, leer las lecciones de CORE (abajo).
- **La lógica nunca usa `Math.random`**: usa `HB.rand(st)`, con semilla guardada, para que
  una partida y el simulador se puedan repetir.
- **El guardado** usa la clave `lmc_hb_save_v1`, que **nunca se renombra**. Si cambia el
  formato, se sube `v` y se añade un paso en `migrate()` (`src/js/30_state.js`). El campo
  `perks` está reservado para la suscripción VIP aplazada.
- Comentarios en español; texto de pantalla solo por `HB.T('clave')`.

## Trabajar desde el ordenador y desde el móvil

Este repositorio se trabaja desde dos sitios: el ordenador (VS Code, `C:\GitHub\Hive`) y
Claude en la nube desde el móvil. Reglas, **decididas por el autor**:

- **Todo va a `main`. No se abren ramas.** Trabaja solo, y las ramas le obligaban a juntarlas
  a mano desde el móvil. Claude, en el móvil y en el ordenador, compromete y sube a `main`
  directamente.
- **El `git pull` de entrada está automatizado.** `.claude/hooks/session-start.sh` lo hace solo
  al arrancar cada sesión. Solo hace avance directo (`--ff-only`) y se planta sin tocar nada si
  hay cambios sin comprometer o si el avance directo no es posible: por diseño, no puede pisar
  trabajo ni dejar marcas de conflicto.
- **Terminar SIEMPRE subiendo (`git push`)**, en los dos sitios, en todas las sesiones. Como no
  hay ramas, lo único que evita el choque es que nadie se quede con trabajo sin subir. Si una
  sesión acaba sin subir, la siguiente trabajará sobre una copia vieja.
- **Nunca comprometer un archivo con marcas de conflicto** (`<<<<<<<`, `=======`, `>>>>>>>`).
  `node tools/check.js` las busca; a mano: `git grep -n "^<<<<<<< "`. Si sale algo, el
  conflicto no está resuelto.
- **Resolver un conflicto es decidir, no quedarse con las dos cosas.** Si dos sesiones hicieron
  lo mismo de dos maneras, hay que elegir una — y esa elección es del autor.
- Lo que se regenera (`dist/`, `capturas/`, dependencias) **no se sube**: para eso está
  `.gitignore`.

### Por qué estas reglas: lo que pasó en los otros juegos

- En **CORE**, dos sesiones hicieron a la vez el mismo cambio de dos formas distintas. Al
  juntarlas, git dejó marcas de conflicto dentro del JavaScript, se comprometieron y subieron
  así, y el juego dejó de arrancar.
- En **Mafia**, el ordenador no subió al terminar; desde el móvil, la sesión siguiente solo
  tenía el Artifact publicado y acabó parcheando código comprimido. Al juntarlo todo,
  `CLAUDE.md` se subió con marcas de conflicto.

Las tres reglas que lo habrían evitado: **subir siempre al terminar**, **no tratar un Artifact
como fuente** y **buscar marcas antes de comprometer**.

## Qué hay en el repositorio

| Carpeta / archivo | Qué es |
|---|---|
| `CLAUDE.md` | Este archivo: cómo se trabaja aquí |
| `docs/HIVE_Funcional.md` | El funcional (v0.3). **Fuente única de verdad** del diseño. La versión va dentro del documento; git guarda las anteriores |
| `docs/ESTADO.md` | Dónde estamos: hito, qué probar, opiniones del autor, decisiones provisionales, lo siguiente |
| `src/js/` | El código del juego (ver "Cómo está hecho el código") |
| `src/style.css`, `src/body.html` | La página que envuelve el canvas y la ventana de ajustes |
| `tools/` | `build.js`, `check.js`, `sim_balance.js`, `capture.js` y `load_logic.js` (carga la lógica en Node) |
| `package.json` | Solo atajos (`npm run build`, `check`, `sim`); no hay dependencias |
| `dist/`, `capturas/` | Se generan; **no se suben** |
| `.claude/` | Los ganchos: trae lo último de GitHub al arrancar y recuerda subir al terminar |
| `.gitignore`, `.gitattributes` | Qué no se sube y los finales de línea |

**Mantener esta tabla al día es parte del trabajo.**

## Lo que ya está decidido y lo que falta

Decidido (funcional 24): el juego entero, el nombre **Hive Breaker** (en tienda "Hive
Breaker: Idle Base Defense") y la técnica (HTML5 + Canvas en un archivo, Capacitor para
Android). En los juegos anteriores del autor: HTML + Canvas 2D en un solo archivo (CORE, Hyper
Drill) y Phaser + Vite (Mafia); Android Studio ya está instalado en su ordenador.

Falta, y **no se hace sin el autor**:

- **El identificador de la app en Google Play** (propuesta: `com.lmcadvisors.hivebreaker`).
  **No se puede cambiar nunca una vez publicado.** Antes hay que comprobar la marca "Hive
  Breaker" en EUIPO, USPTO y Play (funcional 16). Hasta entonces no se crea el proyecto de
  Android; el prototipo se prueba como Artifact.

## Lecciones que ya están pagadas (están en el ordenador del autor)

No hay que volver a descubrirlas, y **no se copian aquí**: se leen allí cuando toque.

- `C:\GitHub\CORE\LECCIONES-RENDIMIENTO.md` — 21 lecciones **medidas en un Android real**:
  qué cuesta de verdad un fotograma, el DOM dentro del bucle, las barras con `transform`, las
  trampas mudas del WebView de Android y cómo medir sin engañarse.
- `C:\GitHub\CORE\CLAUDE.md` y `C:\GitHub\Mafia\CLAUDE.md` — el camino entero de Capacitor,
  Play Console, firma, AdMob y compras, con los errores que costaron versiones.
- El **sistema de idiomas de CORE** (funcional 20): el de aquí es uno sencillo y compatible en
  espíritu (`HB.T('clave')`); cuando haga falta, alinearlo con el de CORE.

Desde el móvil, en la nube, esas rutas **no existen**. Si hacen falta, el autor puede pegarlas
o se copia lo necesario a este repositorio.

## La clave de firma

Cuando exista, la clave de firma de Android **nunca entra en el repositorio**: `.gitignore` ya
excluye `*.keystore`, `*.jks` y `keystore.properties` desde el primer día. Si se pierde, no se
puede volver a publicar una actualización en Play; y en un repositorio público, cualquiera
podría firmar una app haciéndose pasar por esta.
