# Hive — instrucciones para Claude

Juego para **Android**, nuevo. **Todavía no hay nada decidido**: ni el género, ni el nombre
definitivo, ni con qué está hecho. "Hive" es, por ahora, el nombre del repositorio.

Este archivo existe desde el primer día a propósito: es lo único que ve **Claude en la nube
—el que se abre desde el móvil—**, que no ve la configuración del ordenador del autor.

## Lo primero, en cada sesión

1. **Traer lo último de GitHub.** Está automatizado (ver "Trabajar desde el ordenador y
   desde el móvil"), pero **hay que leer lo que dice al arrancar**: si avisa de que no ha
   podido traer, no se empieza a trabajar hasta resolverlo.
2. **Leer `docs/HIVE_Funcional_v01.md`**, que será la **fuente única de verdad** del diseño
   en cuanto tenga contenido. Hoy está casi vacío: es el esqueleto que hay que ir llenando
   con el autor.
3. **Terminar subiendo** (`git push`). Eso no está automatizado y es cosa de Claude.

## Cómo trabajar con el autor

- Escríbele siempre en **español**, en lenguaje llano y con las menos abreviaturas posibles.
  El texto dentro del juego irá en **inglés** (es lo que se hizo en sus otros juegos; si aquí
  se decide otra cosa, se escribe en el funcional).
- **No sabe programar.** Tú programas todo, compilas y le das algo que pueda probar. Él hace
  lo que tú no puedas hacer, prueba y te da su opinión.
- Antes de un cambio, explícale qué hace y qué puede romper.
- No des por hecho que sabe usar la terminal: dale el **comando exacto** y la carpeta desde la
  que ejecutarlo.
- Si algo tiene riesgo —borrar, publicar, sobrescribir—, avísale **antes**.
- **Cada cambio debería acabar en algo que pueda probar desde el móvil.**
- **Tú no generas imágenes.** Las genera él en Gemini u otra IA; tú escribes el prompt exacto
  y después recortas, compones y montas. (Dibujar con código sí puedes: en su juego anterior
  los edificios del tablero se dibujan con código y funcionó muy bien.)

### Cómo entregar una prueba

El visor de archivos de la app de Claude **enseña el HTML pero no ejecuta el `<script>`**, así
que mandarle un archivo por el chat no sirve para jugar. Para que pruebe desde el móvil hay
que **publicar la versión montada como Artifact**.

Dos reglas que ya costaron disgustos en los otros juegos:

- **Un Artifact publicado NO es la fuente.** Es código ya montado y comprimido. Si una sesión
  solo tiene el enlace de un Artifact y no el código, **no lo guarda ni lo parchea**: trae el
  repositorio (`git pull`). Lo que se prueba tiene que poder regenerarse desde `src/`.
- **Las banderas en la dirección (`?algo=1`) no funcionan dentro de un Artifact**, porque la
  página va en un iframe. Lo que haya que probar, se hornea en la versión que se publica.

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
  Antes de comprometer, buscarlas: `git grep -n "^<<<<<<< "`. Si sale algo, el conflicto no
  está resuelto.
- **Resolver un conflicto es decidir, no quedarse con las dos cosas.** Si dos sesiones hicieron
  lo mismo de dos maneras, hay que elegir una — y esa elección es del autor.
- Lo que se regenera (dependencias y versiones montadas) **no se sube**: para eso está
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
| `docs/HIVE_Funcional_v01.md` | El funcional. **Será la fuente única de verdad**; hoy es un esqueleto |
| `.claude/` | El gancho que trae lo último de GitHub al arrancar cada sesión |
| `.gitignore`, `.gitattributes` | Qué no se sube y los finales de línea |

Cuando exista el juego, aquí se apuntan sus carpetas (`src/`, `tools/`, …) y los comandos para
arrancarlo y probarlo. **Mantener esta tabla al día es parte del trabajo.**

## Lo que hay que decidir antes de programar

- **Qué juego es.** Género, bucle principal y cómo gana dinero. Va al funcional, no aquí.
- **El nombre**, del que depende el identificador de la app en Google Play
  (`com.lmcadvisors.algo`), que **no se puede cambiar nunca una vez publicado**. Hasta
  decidirlo no se crea el proyecto de Android.
- **Con qué se hace.** En los juegos anteriores del autor: HTML + Canvas 2D en un solo archivo
  (CORE, Hyper Drill) y Phaser + Vite con proyecto de carpetas (Mafia). El empaquetado para
  Android siempre ha sido **Capacitor**, y Android Studio ya está instalado en su ordenador.

## Lecciones que ya están pagadas (están en el ordenador del autor)

No hay que volver a descubrirlas, y **no se copian aquí**: se leen allí cuando toque.

- `C:\GitHub\CORE\LECCIONES-RENDIMIENTO.md` — 21 lecciones **medidas en un Android real**:
  qué cuesta de verdad un fotograma, el DOM dentro del bucle, las barras con `transform`, las
  trampas mudas del WebView de Android y cómo medir sin engañarse.
- `C:\GitHub\CORE\CLAUDE.md` y `C:\GitHub\Mafia\CLAUDE.md` — el camino entero de Capacitor,
  Play Console, firma, AdMob y compras, con los errores que costaron versiones.

Desde el móvil, en la nube, esas rutas **no existen**. Si hacen falta, el autor puede pegarlas
o se copia lo necesario a este repositorio.

## La clave de firma

Cuando exista, la clave de firma de Android **nunca entra en el repositorio**: `.gitignore` ya
excluye `*.keystore`, `*.jks` y `keystore.properties` desde el primer día. Si se pierde, no se
puede volver a publicar una actualización en Play; y en un repositorio público, cualquiera
podría firmar una app haciéndose pasar por esta.
