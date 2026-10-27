# Hive Breaker — estado del proyecto

> Se actualiza al final de cada sesión. Dice dónde estamos y qué toca; el diseño está en
> `HIVE_Funcional.md`, que es quien manda.

**Última actualización:** 27/10/2026 · **Versión publicada:** 0.11.0 ·
**Enlace de pruebas:** https://claude.ai/artifact/6qNBWM2zfcDEKoC8AWSEL9

## Dónde estamos

Fase 2 del funcional (prototipo jugable), **ampliada el 16/10/2026** (funcional v0.4): más
materiales y edificios, la región 2 y una primera investigación; sin prueba con 5 personas
(se probará en la prueba cerrada de Play Console). **Hito 6 terminado** (0.9.0). **Hito 7 en
marcha: la región 1 con dos metales**; la 0.10.0 trajo el cobre, la Bobinadora y las obras
que piden materiales, y la 0.11.0 el Taller de celdas y la torreta de choque. Pendientes de tu
prueba: el tutorial (0.6.0), el Sargento Brass (0.7.0), el cofre (0.8.0), el arranque rápido
con el suministro aéreo (0.9.0), el cobre (0.10.0) y las celdas con la torreta de choque
(0.11.0).

| Hito (funcional 21) | Estado |
|---|---|
| 1. Simulador + tablas en Node | Hecho. Juega la región entera, con noches y jefe |
| 2. Comandante, joystick, pila, minado, Fundición, Exportación, zonas | Hecho y probado (0.2.0) |
| 3. Jugosidad de recoger, cobrar y desbloquear | Primer pase hecho; se pule con tu opinión |
| 4. Drones, torretas, munición, bichos, campo de flujo, noche | Hecho y probado (0.3.0) |
| 5. Calor-reloj, energía, brownout, jefe | Hecho y probado (0.3.0) |
| 6. Tutorial, guardado/offline, vídeos simulados | **Hecho**: guardado, mientras no juegas (0.5.0), tutorial (0.6.0) con el Sargento Brass (0.7.0), cofre (0.8.0) y los 4 vídeos simulados (0.9.0) |
| 7. Región 1 con dos metales (Copper, Bobinadora, Taller de celdas, Shock, Arsenal, Radar, zonas con materiales), unos 25 min | **En marcha**: cobre, Bobinadora, obras con materiales (0.10.0); Taller de celdas, torreta de choque y región de ~25 min (0.11.0). Falta: Arsenal y Radar |
| 8. Mapa del planeta + región 2 (The Mire) | Pendiente |
| 9. Investigación, primera versión | Pendiente |
| 10. Balance, vídeos y prueba cerrada en Play Console → seguir o no | Pendiente. Primer pase de ritmo y dificultad hecho (0.4.0) |

Historial corto: 0.2.0 el bucle básico · 0.3.0 noche, torretas, drones, jefe · 0.3.1 arreglos
del dinero fantasma y del recorte en pantallas anchas · 0.4.0 ritmo más lento, noches más
duras, energía visible · 0.5.0 mientras no juegas · 0.6.0 tutorial · 0.7.0 el Sargento Brass · 0.7.1 los galones del sargento, dentro del brazo · 0.8.0 el cofre y las Gemas · 0.9.0 arranque rápido y suministro aéreo · 0.9.1 listo para la prueba con 5 personas · 0.9.2 rendimiento e idiomas (lecciones y sistema de CORE) · 0.10.0 el cobre, la Bobinadora, las obras con materiales y la región de ~27 min · 0.11.0 el Taller de celdas, la torreta de choque y la región de ~25 min.

## Lo nuevo de la 0.11.0: las celdas y la torreta de choque (hito 7, segunda parte)

- **El Taller de celdas** (Bobina + Placa → Celda), en el distrito del cobre, justo encima de
  la Bobinadora. Pide dinero **y 6 Bobinas**. Un dron de carga le lleva las Bobinas, otro las
  Placas de la Fundición 2 y un tercero saca las Celdas a la Exportación. La Celda se vende a
  $12 (la nave compra ahora Celdas, Munición, Bobinas y Placas). Su mejora pide 4 Celdas.
- **La torreta de choque**: lanza una descarga eléctrica alrededor que **frena a los bichos a
  la mitad durante 2 segundos** y apenas hace daño; los sujeta delante de las otras torretas.
  Gasta Celdas (una cada 8 descargas) y se rellena como las demás: con Celdas en la pila, te
  acercas. Los bichos frenados llevan un anillo azul claro debajo. **Al jefe no lo frena.**
  - La primera está en el hueco del muro sur (pide 4 Bobinas).
  - La segunda torreta del norte deja ahora **elegir entre tres**: Gatling, Cañón o Choque.
- **Más energía**: con las máquinas del cobre, dos paneles se quedaban cortos toda la región.
  El segundo panel llega antes y hay un **tercero** al lado del Taller de celdas (6 Bobinas).
- **La flecha y los materiales**: si una obra te pide un material que no llevas, la flecha te
  lleva a la máquina que lo hace y la pista dice qué coger («COGE BOBINAS PARA LA OBRA»).
- **La región, de unos 25 minutos**, como decidiste: los precios suben ahora un 6 % por zona
  (antes un 8 %), porque hay más zonas (44). Con el robot: 25-30 min con cualquier
  estrategia, sin perder ninguna noche.
- **El Sargento Brass** avisa con el Taller de celdas («¡CELDAS DE ENERGÍA!») y con la torreta
  de choque («¡TORRETA DE CHOQUE LISTA!»).

## Lo nuevo de la 0.10.0: el cobre (hito 7, primera parte)

Lo que decidiste el 16/10/2026 (funcional v0.4), primera tanda:

- **El mapa crece 12 casillas hacia el norte.** Entre la línea de defensa norte y la
  Fundición 2 aparece el **distrito del cobre**, que abre la Expansión. Tu partida se recoloca
  sola al cargar: no pierdes nada (el comandante aparece en la Torre de mando).
- **La Bobinadora** (Copper → Coil): es la **primera obra que pide materiales**: dinero **y 8
  Placas**. Al verla, el Sargento Brass avisa: «¡LAS OBRAS GRANDES PIDEN MATERIAL!». Te quedas
  encima y las Placas saltan de la pila; lo entregado se guarda aunque te vayas. Debajo del
  precio, el cartel dice qué falta (en ámbar si no lo llevas encima). Si te falta material, la
  flecha te lleva a por él: «COGE PLACAS PARA LA OBRA».
- **Las vetas de cobre** (dos) y su **dron minero**; un **dron de carga** lleva las Bobinas a la
  Exportación. Las Bobinas se venden a $4 (la nave compra Munición, Bobinas y Placas).
- **Más obras con materiales**: mejorar la Bobinadora (6 Bobinas), la Fundición 2 nivel 2 (10
  Placas), la Exportación nivel 3 (10 Bobinas), el Disipador (10 Placas) y el segundo panel
  solar (8 Bobinas).
- **La región, de unos 27 minutos** (antes 55): los precios suben un 8 % por zona en lugar de
  un 15 %, y la Madre de la Prole tiene 1.500 de vida (antes 1.800), porque llega con menos
  noches encima. Con el robot: 26-30 min con cualquier estrategia; con vídeos, 23.
- **Arreglado de paso**: en una partida vieja, la Exportación no tenía hueco para las Bobinas
  y eso habría estropeado el montón de dinero (la nave dejaba de venir). Ahora se repara al
  cargar, y `tools/check.js` prueba que una partida de la 0.9.x carga y sigue vendiendo.

## Lo nuevo de la 0.9.2: el sistema de idiomas de CORE

El funcional (apartado 20) pide el sistema de idiomas de CORE. Ya está:

- **Un archivo por idioma**: el inglés (la fuente) en `src/js/10_strings.js` y el español en
  `src/js/11_idioma_es.js`. Para el lanzamiento (portugués, alemán, francés, japonés y
  coreano) cada idioma será un archivo más.
- **El idioma elegido se guarda aparte de la partida**: «Borrar progreso» ya no lo cambia. Si
  nunca has elegido, el del móvil.
- **La fila del idioma dice «Language · Idioma»** en todos los idiomas, para quien abra los
  ajustes sin entender el idioma puesto.
- **Pseudo-idioma** en «Herramientas de prueba»: alarga cada texto un 30 % (lo que crece el
  alemán) y lo pone entre corchetes. Ya encontró un fallo: en un móvil estrecho, la barra de la
  noche y el botín se pisaban. Arreglado. Lo que sale sin corchetes es solo dinero, cifras y la
  «H» de las bases de drones: no hay ningún texto que se quede sin traducir.
- **`tools/check.js`** comprueba ahora que ninguna traducción se coma un hueco (`{0}`), que no
  haya claves de más (una errata al copiar) y que todo texto que pide el código exista (si no,
  en pantalla saldría su nombre interno). Probado rompiéndolo a propósito: lo detecta.

## Lo nuevo de la 0.9.2: rendimiento, con las lecciones de CORE

Repasadas las 23 lecciones de `C:GitHubCORELECCIONES-RENDIMIENTO.md` contra el código, midiendo
antes y después con un banco nuevo (`node tools/bench.js`): **el dibujo cuesta un 40 % menos**,
de día y de noche. No cambia nada de lo que se ve.

- **El suelo** (casi la mitad del fotograma): se guardaba a menos resolución que la pantalla y
  se reescalaba entero en cada fotograma. Ahora se guarda al tamaño exacto y se copia tal cual
  (lección 07). Fuera los dos rellenos de fondo que el suelo ya tapaba (lección 03).
- **El borde rojo de la noche**: se guardaba a un cuarto de resolución y se reescalaba. Ahora,
  al tamaño exacto (lección 07).
- **Números de daño**: como mucho 6 por segundo (lecciones 10 y 11).
- **Modo ahorro**: se quita solo si el móvil se recupera; antes, una vez puesto, no se iba
  hasta cerrar el juego (lección 18).
- **El sonido se para** cuando sales del juego (lección 20).
- **El dedo**: la posición del lienzo se lee al apoyarlo, no en cada movimiento (lección 02).

Banco (ordenador, sin GPU; las cifras solo valen para comparar): día 8,4-9,7 → 4,5-6,5 ms;
noche dura con 47 bichos 18-19 → 10-12 ms. Lo que ya cumplía: sin `shadowBlur`, sin filtros
ni `backdrop-filter`, la interfaz no lee del DOM en cada fotograma, los degradados se hornean,
el bucle no se frena por debajo de 30 FPS y solo se dibuja lo que se ve. **El número de verdad
(criterio 5: 60 FPS en un Galaxy A34) solo se puede medir en un Android real.**

## Lo nuevo de la 0.9.1: preparado para la prueba con 5 personas

- **Reciclador** (decisión provisional): un contenedor debajo de la Torre de mando; quedarse
  encima vacía la pila. Evita el único atasco sin salida que había: la pila llena de mineral
  con la Fundición llena por los dos lados (no puede fabricar y tú no puedes recoger). Solo
  cuando estás atascado de verdad, la flecha te lleva a él con la pista «¿ATASCADO? VACÍA LA
  PILA AQUÍ».
- **Las herramientas de prueba solo salen en tu móvil.** En uno nuevo (el de quien prueba)
  están escondidas, para que nadie toque «+$500» o el piloto automático. En tu móvil se
  quedan, porque ya tenías una partida; si alguna vez no salen: **cinco toques seguidos en el
  número de versión** (abajo, en la ventana de ajustes).
- **«Tu partida»** en la ventana de ajustes, para todos: tiempo jugado, zonas, noches ganadas y
  perdidas, vídeos, y cuándo hizo cada cosa por primera vez. En la prueba basta una captura.
- **Guía de la prueba con 5 personas**: borrada el 17/10/2026 (ya no hay esa prueba).

## Lo nuevo de la 0.9.0: arranque rápido y suministro aéreo

Decidido contigo el 15/10/2026 (ya está en el funcional):

- **Las 5 primeras zonas, más baratas**: $25, $41, $52, $55 y $63 (antes $50, $75, $86, $91 y
  $115). El resto, igual. Con el robot: primera zona a los **0:25** (antes 0:45), primer dron
  a los **2:00** (antes 3:49) y primera noche a los 3:32. Es casi la tabla del funcional 12
  (0:35, 2:30 y 3:30) y deja margen para que una persona cumpla el criterio de éxito 1 (primera
  zona en menos de 45 s, dron antes de 3 min). La región sigue durando lo mismo.
- **Suministro aéreo** (el cuarto vídeo simulado): tras la primera noche ganada, de día, cada
  4-5 min cae en paracaídas una caja cerca de la Torre de mando, con una baliza naranja; si
  queda fuera de la pantalla, una flecha naranja en el borde dice dónde está. El Sargento Brass
  avisa la primera vez. Al pisarla: **ABRIR · AD** da 90 s de lo que vende tu base (como
  mínimo $25) y **DEJARLA** no da nada. Si no la coges en 60 s, se va (parpadea los últimos
  10 s). Con el robot, cada caja da entre $400 y $1.000.
- Para probarlo sin esperar: «Herramientas de prueba» → «Lanzar una caja de suministros».

## Lo nuevo de la 0.8.0: el cofre y las Gemas (funcional 12, 13.2 y 9.5)

- **Cofre de suministros**: tras la **primera noche ganada** (el «primer cofre con 50 Gemas»
  del tutorial) y al **caer la Madre de la Prole**. Lo entrega el Sargento Brass.
- Como pide el funcional: **tiembla cada vez más** (0,8 s, con redoble), **estalla al
  tocarlo** (destello y rayos) y los **premios salen en fila**, cada uno con el color de su
  rareza; los raros, con rayos extra. Un toque acelera; «COBRAR» y todo vuela a su contador.
- **Las Gemas** aparecen arriba, junto a la rueda dentada, en cuanto tienes alguna. Todavía
  no se gastan en nada: en el prototipo solo se ganan (funcional 21).
- El **Swarmer dorado** da ahora también 5 Gemas.
- Para probarlo sin jugar: «Herramientas de prueba» → «Abrir un cofre de prueba».

## Lo nuevo de la 0.7.0: el Sargento Brass

Decidido contigo el 15/10/2026 (ya está en el funcional, apartados 12 y 19):

- Un **sargento de la flota que habla por radio**: casco como el del comandante (con las gafas
  turquesa subidas), cascos de radio, bigote, galones y condecoraciones. Tres caras: normal,
  alarmado y contento. Mientras no llegue el arte de Gemini, lo dibujo yo con código.
- **Asoma al lado de los avisos de abajo**, mueve la boca mientras «habla» y suena un chasquido
  de radio. Nunca para el juego: dice su frase y se va solo; un toque sobre el aviso lo quita.
- **Cuándo habla**: al aterrizar («¡Comandante en tierra!»), con el primer dron, la barra de
  Calor, la falta de energía, los Leapers y en los **momentos fuertes**: la primera noche
  («¡Ahí vienen!»), la primera noche ganada («¡Buena puntería!»), la llegada del jefe y, en
  la tarjeta final, la región conquistada (contento).
- La mano de «arrastra para moverte» está un poco más arriba, para no pisar sus avisos.

## Lo nuevo de la 0.6.0: el tutorial de los primeros minutos (funcional 12)

Sin textos largos ni menús: lo de siempre (mano animada, flecha, pista corta arriba) más avisos
cortos abajo, **uno cada vez y solo la primera vez**:

- **La entrada** (minuto 0): en una partida nueva, la nave de la flota aterriza en la
  Exportación, el comandante salta al suelo y la nave se va (unos 4 s; un toque la salta).
  Después, la mano: «ARRASTRA PARA MOVERTE».
- **El bucle** (minar → Fundición → recoger → vender → cobrar → comprar): con las pistas de
  arriba y la flecha, como antes.
- **Avisos de una sola vez**, abajo, sin parar el juego:
  - Primer dron: «LOS DRONES TRABAJAN SOLOS».
  - Primera torreta (aparece la barra de Calor): «OJO CON EL CALOR · Cuando la barra se llena,
    ataca el enjambre».
  - Primera vez que falta energía: «FALTA ENERGÍA · Construye un panel solar».
  - Primer Leaper: «¡LEAPERS! · Saltan por encima de los muros».
- **Noche 1**: pista «QUIETO DISPARAS MÁS RÁPIDO». Sigue sin poder perderse.
- **Noche 2**: una torreta empieza casi sin munición **a propósito**, para que aprendas a
  rellenarla (solo si tienes munición a mano; si ya sabías rellenar, no pasa).
- **Noche 5**: cuando sale el Orbital, pista «TOCA ORBITAL Y LUEGO LOS BICHOS» hasta que lo uses.
- **Al conquistar la región**: tarjeta «TU BASE NUNCA DUERME», que explica lo que produce la
  base mientras no juegas.
- **Para la prueba con 5 personas** (hito 7): la rueda dentada → «Herramientas de prueba»
  enseña **cuándo hizo cada cosa por primera vez** (en tiempo de juego). Si alguien se atasca,
  ahí se ve en qué paso. Basta con una captura de esa pantalla.

## Qué probar ahora (versión 0.11.0)

**Lo nuevo, las celdas y la torreta de choque** (en tu partida de siempre, sin borrar nada):

- **El Taller de celdas**: ¿se entiende que necesita Bobinas **y** Placas? ¿Se distinguen las
  Celdas en la pila?
- **La torreta de choque**: de noche, ¿se ve la descarga? ¿Se nota que los bichos van más
  lentos (el anillo azul claro)? ¿Sirve de algo o es mejor otra torreta?
- **Elegir entre tres** en la segunda torreta del norte: ¿se lee bien la ventana?
- **La flecha**: cuando te falta un material para una obra, ¿te lleva a por él?
- **El ritmo**: la región debería durar unos 25 minutos. Para verlo de verdad, desde cero
  (rueda dentada → «Borrar progreso»), y mira el tiempo en «Tu partida».

**Lo de la 0.10.0, el cobre**:

- Que tu partida cargue bien en el mapa nuevo (deberías aparecer en la Torre de mando).
- **La Bobinadora**: ¿se entiende que pide Placas además de dinero? ¿Se lee el cartel (×8 y el
  icono de la Placa)? ¿La flecha te lleva a por las Placas cuando te faltan?
- **El cobre**: mínalo, llévalo a la Bobinadora y recoge las Bobinas. ¿Se distinguen bien el
  Cobre, las Bobinas y lo demás en la pila?
- ¿Se nota el carrete girando cuando la Bobinadora trabaja?
**Lo de antes** (versión 0.9.2):

**Para ver el tutorial hay que empezar de cero**: rueda dentada → «Borrar progreso» y otra vez
para confirmar (se pierde la partida de prueba, nada más).

- Que la entrada se vea bien y que un toque la salte; después, el saludo del sargento.
- **El sargento**: que se entienda quién es, que se lea lo que dice y que no estorbe.
- **El cofre**: con «Abrir un cofre de prueba» o ganando la primera noche. ¿Se siente como un
  premio? ¿Se ven bien las Gemas arriba?
- **El arranque**: desde cero, ¿pagas la primera zona en menos de 45 s y contratas el dron
  antes de 3 min? El registro de pasos del menú de pruebas te lo dice («Comprar» y «Dron»).
- **El suministro aéreo**: con «Lanzar una caja de suministros». ¿Se ve la caja? ¿Apetece
  abrirla?
- **El reciclador**: el contenedor debajo de la Torre de mando. Para verlo funcionar, llena la
  pila de mineral con la Fundición llena y sin recoger sus Placas.
- **Que en tu móvil sigan las herramientas de prueba** (si no, cinco toques en la versión).
- Que los avisos de abajo se lean y no estorben (salen uno detrás de otro).
- La noche 2: que veas la torreta casi vacía y sepas qué hacer.
- Al final, la tarjeta «TU BASE NUNCA DUERME».
- El registro de pasos, ahora en «Tu partida» (rueda dentada), a la vista de cualquiera.
- El idioma (0.9.2): cámbialo, borra el progreso y comprueba que no se pierde.
- Lo de la 0.5.0 sigue ahí: «Simular 1 h fuera».

Preguntas para ti:

1. ¿Se entiende el juego sin que nadie te explique nada?
2. ¿Hay demasiados avisos, o falta alguno?

## Decidido por el autor

- **Más materiales y edificios** (16/10/2026, funcional v0.4):
  - Regla para todas las regiones, **por ahora**: cada región trae un material nuevo que se
    combina con los anteriores; las recetas, región a región.
  - **Región 1 con dos metales**: Copper → Bobinadora → Coil; Coil + Plate → Taller de celdas
    → Cell; la Cell alimenta la **torreta Shock**, que frena a los bichos.
  - **Construir cuesta materiales**: las zonas grandes piden dinero y materiales.
- **Duración de la región 1** (16/10/2026): **unos 25 min, por ahora**. Sustituye a lo del
  15/10 (dejarla en 55 min «hasta que entren más elementos»): ahora entran. Hasta que se
  programe el hito 7, el código sigue en 55 min.
- **El test de mercado** (17/10/2026): al subir a producción, **lo último del proyecto**. **No
  recordárselo hasta entonces.**
- **Sin prueba con 5 personas** (16/10/2026): se probará en la prueba cerrada de Play Console.
  El prototipo suma la región 2 y una primera investigación antes de esa prueba.
- **El ritmo y la dificultad de la 0.4.0** (15/10/2026): «por ahora está bien».
- **El nombre del sargento** (16/10/2026): **Brass**. Ya está en el funcional.
- **Guía con personaje** (15/10/2026): un sargento con el mismo casco que el comandante y
  condecoraciones, en el tutorial y en los momentos fuertes.
- **El arte** (15/10/2026): se queda el dibujado con código, «me gusta tu estilo». El de
  Gemini queda aparcado (los prompts siguen en `docs/ARTE_PROMPTS.md`).
- **Arranque rápido** (15/10/2026): las 5 primeras zonas, más baratas (ver 0.9.0).
- **Suministro aéreo** (15/10/2026): sí, prudente: cada 4-5 min, solo de día, desde la
  primera noche ganada, y desaparece a los 60 s si no se coge.
- **Mientras no juegas** (15/10/2026): se programa ya, con **tope de 2 h** (funcional) y **tope
  de la caja fuerte** de la Exportación ($150 / $400 / $1.000): al volver, como mucho más o
  menos una zona (el doble con el vídeo). Sin la caja fuerte, 2 h darían ~$32.000, más que
  toda la región 1. Se cambia en `src/js/20_data.js` (`offline`).

## Decisiones provisionales (las tomé para poder programar; dime si cambias alguna)

Todas están en las tablas (`src/js/20_data.js`) y se cambian en un minuto.

- **Bucle básico**: estar entre dos vetas mina de las dos; la nave espera a que haya
  mercancía y no compra más de lo que cabe en la caja fuerte; para pagar hay que quedarse
  0,4 s encima; guardado automático.
- **Precios** (0.11.0): P(n) = 50 × 1,06^n (en la 0.10.0, 1,08^n) (las 5 primeras, con descuento). **Choca con el
  funcional 6.3**, que pide subir un 18-25 % por zona: con 37 zonas y la región de ~25 min que
  decidiste (6.4), la subida tenía que ser de un 8 %; con las 44 zonas de la 0.11.0, de un
  **6 %** (P(n) = 50 × 1,06^n). Hay que corregir la 6.3 (su tabla de tiempos entre zonas es de
  cuando la región duraba 50 min): ¿la ajusto?
- **El mapa** (0.10.0): 12 casillas más al norte para el distrito del cobre. Qué obras piden
  materiales y cuántos (ver «Lo nuevo de la 0.10.0» y «de la 0.11.0») lo elegí yo.
- **La torreta de choque** (0.11.0): daño 4, una descarga cada 1,7 s, alcance 3,2 casillas,
  frena al 50 % durante 2 s, 8 descargas por Celda; **no frena al jefe** (si no, sería
  demasiado fácil). La primera, en el hueco del muro sur; la segunda del norte se puede elegir
  de choque. El tercer panel solar y el adelanto del segundo, para que no falte energía.
- **Detalles de la v0.4 del funcional** (los concreté yo al escribirla; dime si cambias algo):
  - Nombres: Bobinadora, Taller de celdas y torreta Shock (en inglés: Copper, Coil, Cell,
    Shock).
  - Precios de venta: Coil $4 y Cell $12 (Plate $3, Ammo $10). Calor: Bobinadora 1,0/s,
    Taller de celdas 1,5/s.
  - La Shock frena un 50 % durante 2 s, hace poco daño y gasta 1 Cell cada 8 descargas.
  - El **Arsenal** y el **Radar** pasan de la investigación a ser edificios de la región 1
    (se construyen con Coils); la investigación los mejora (Arsenal II, Radar II).
  - El cobre está al norte, junto al flanco que abre la Expansión: más expuesto.
  - El tutorial (funcional 12) se alarga a 25 min: cobre a los 8:30, Shock a los 12:00,
    Arsenal y Radar a los 18:00, jefe a los 20-25.
  - Los criterios de éxito «4 de 5» y «3 de 5» pasan a 80 % y 60 % de los probadores de la
    prueba cerrada, medidos con la analítica.
- **Reciclador** (0.9.1): debajo de la Torre de mando; vacía la pila entera (lo tirado se
  pierde, no da nada). La flecha solo lo señala cuando no hay otra salida.
- **Suministro aéreo**: el premio es «90 s de producción» = lo que ha vendido la base en los
  últimos 3 minutos (o lo que vendería sola, si es más), con un mínimo de $25. Quien ve todos
  los vídeos termina la región unos 8 min antes (el robot: 52 → 44 min); quien no, igual que
  antes.
- **Mapa de la región 1** (12 × 44 casillas): la base en el centro; el flanco sur ataca desde
  la noche 1; el norte se abre con la Expansión y **no ataca hasta la noche 3**.
- **Calor**: solo sube mientras una máquina trabaja (Fundición 1/s, Fábrica de munición 1,5/s;
  el Disipador lo baja 2/s); empieza con la primera torreta. Barra 140 × (1 + 0,25·n);
  amenaza 16 × (1 + 0,15·n), en grupos de 5 puntos cada 10 s.
- **Noche 1**: 12 Swarmers por el sur; la Torre de mando no se puede caer (funcional 12).
- **Bichos**: Leapers desde la noche 4, Crushers desde la 6, el dorado 1 de cada 150; +6 % de
  vida por noche; el Swarmer muerde 8.
- **Torretas**: 5 cajas de munición, empiezan con 2; Gatling 25 disparos por caja, Cañón 6;
  tres niveles.
- **Energía**: Torre de mando 5 MW y cada panel solar 5 (hay dos). Consumen: Fundición
  2/3/4 MW según nivel, Fábrica de munición 3/4/5, Disipador 3. Si falta, todo va más lento.
- **Edificios dañados**: rinden del 100 % al 50 %; rotos, escombro. Reparar: quieto al lado,
  una Placa cada 0,25 s (+30 de vida); sin Placas, $10 cada tramo.
- **Noche perdida**: se repite; la Torre de mando se levanta al 60 % y cada derrota seguida
  hace la repetición un 20 % más suave (hasta −60 %).
- **Botín**: se cobra al cerrar el informe y se pierde si se pierde la noche; lo del suelo dura
  30 s tras el amanecer. Premio por aguantar: 15 × (1 + 0,5·n).
- **DEFENSA / EQUILIBRIO / BENEFICIO**: solo afecta a los drones que llevan cosas a la
  exportación; EQUILIBRIO deja la mitad para las torretas.
- **El jefe**: 1.500 de vida (1.800 hasta la 0.9.2); pare 6 crías al 75, 50 y 25 %; al morir
  ella mueren sus bichos.
  Orbital Strike desde la noche 5, una carga por noche.
- **Al conquistar la región**: las noches siguen, sin jefe; sale el aviso de la región 2.
- **Mientras no juegas**: la pantalla sale tras 2 min fuera como mínimo. Los topes diarios de
  vídeos (funcional 15.3) todavía no se aplican: los vídeos son simulados y solo se cuentan.
- **Cofres (0.8.0)**: el de la primera noche da $150 y 50 Gemas (el funcional dice 50); el del
  jefe, $500 y 100 Gemas. Premio fijo, sin azar. Arriba, con las Gemas, la energía pierde el
  «MW» si no cabe todo.
- **Tutorial (0.6.0)**:
  - La **rueda dentada se ve desde el principio** (el funcional pide 5 min sin menús) porque
    ahí están las herramientas de prueba. En la versión de tienda se esconderá.
  - Los avisos van **por lo que pasa, no por minutos**: con el ritmo de la 0.4.0 todo llega
    más tarde que en la tabla del funcional 12 (el robot: primera compra 0:45, primera noche
    4:50, primer Leaper 14:00, Orbital 17:00, jefe 57:00).
  - **Lo que todavía no existe en el juego y no hay en el tutorial**: el primer cofre con
    Gemas, los botones de Tienda y Misiones (minuto 5-7), el mapa con la región 2 iluminada y
    el permiso de notificaciones (este necesita la app de Android).

## Simulador (versión 0.11.0)

Sin vídeos, 3 partidas de cada estrategia conquistan la región sin perder ninguna noche:
`balanced` **25-27 min**, `profit` 25-29, `defense` 25-30; 8 noches, el jefe cae a la primera.
El robot: Taller de celdas a los 9:06, torreta de choque a los 12:38 y la primera Celda en la
mano a los 12:46; en una partida, las torretas de choque frenan a unos 50 bichos.

Versión 0.10.0: sin vídeos, 3 partidas de cada estrategia conquistan la región: `balanced` **27-28 min**,
`profit` 26-29, `defense` 28-30; 7 noches, el jefe cae a la primera. **Con vídeos** (×2 del
informe, segunda oportunidad y suministro aéreo): **23 min**. El cobre, con el robot: la
primera obra con Placas a los 7:17, la Bobinadora a los 7:18, el primer Cobre a los 10:08 y
las primeras Bobinas a los 12:25. (En la 0.9.0, la región duraba 53-61 min.) El robot
defiende sin dudar: una persona perderá más. El simulador también dice cuándo hace el robot
cada paso del tutorial, cuántas cajas de suministro caen y las Gemas que gana (150: los dos
cofres).

## Lo siguiente

1. **Hito 7: la región 1 con dos metales** (funcional v0.4: 5.1, 5.4, 6.2, 9.1 y 12). Hecho:
   el cobre, la Bobinadora y las obras con materiales (0.10.0); el Taller de celdas, la
   torreta de choque y el ritmo de ~25 min (0.11.0). Falta: el **Arsenal** y el **Radar**
   (se construyen con Bobinas) y el último ajuste de los 25 min.
2. **Hito 8**: el mapa del planeta y la región 2 (The Mire).
3. **Hito 9**: la investigación, primera versión.
4. **Hito 10**: balance, vídeos y prueba cerrada en Play Console (antes: comprobar la marca y
   fijar el identificador de la app).

Mientras tanto, tu prueba de la 0.6.0 a la 0.11.0 (ver «Qué probar ahora»).
Arte con IA: aparcado (te gusta el dibujado con código).

## Pendientes técnicos (no urgentes)

- **El suelo en caché** (0.10.0): con el mapa de 56 filas ocupa unos 27 MB en un móvil (antes
  21). Si en el Android real va justo de memoria, se parte en trozos.

- **Al empaquetar para Android** (lecciones 19 y 20 de CORE, fallan sin avisar):
  `domStorageEnabled = true` (si no, el guardado se borra en cada arranque), `configChanges`
  en el manifiesto (si no, girar el móvil recarga el juego), suspender el sonido en `onPause`,
  y que Gradle copie el HTML montado y aborte si no coincide con el del repositorio. Y medir
  con `adb shell dumpsys gfxinfo` en un móvil real (lección 13).

- **Proyecto de Android**: no se crea hasta comprobar la marca y fijar el identificador
  (propuesta `com.lmcadvisors.hivebreaker`; no se puede cambiar nunca después).
- **Tipografías** (Teko y Barlow Semi Condensed): llegan de Google Fonts. Dentro de la app de
  Android habrá que meterlas en el propio archivo.
- **Guardado** en `localStorage`; en Android irá también a Preferences (funcional 20). Una
  noche a medias no se guarda: al volver, es de día con la barra de Calor casi llena.
- **Avisos en el móvil** (funcional 14.4: «caja fuerte llena», como mucho 2 al día) y el
  permiso de notificaciones: necesitan la app de Android.
- **El funcional no está marcado** con PENDIENTE/ACTUAL: lo hago cuando validemos el balance.
- **El sonido** está sintetizado y no lo he podido oír: dime si algo suena mal o molesta.
