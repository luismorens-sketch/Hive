# Hive Breaker — estado del proyecto

> Se actualiza al final de cada sesión. Dice dónde estamos y qué toca; el diseño está en
> `HIVE_Funcional.md`, que es quien manda.

**Última actualización:** 15/10/2026 · **Versión publicada:** 0.9.0 ·
**Enlace de pruebas:** https://claude.ai/artifact/6qNBWM2zfcDEKoC8AWSEL9

## Dónde estamos

Fase 2 del funcional (prototipo jugable): **hito 6 terminado** (0.9.0). Toca el hito 7: la
prueba con 5 personas y el vídeo de 30 s. Pendientes de tu prueba: el tutorial (0.6.0), el
Sargento Brass (0.7.0), el cofre (0.8.0) y el arranque rápido con el suministro aéreo (0.9.0).

| Hito (funcional 21) | Estado |
|---|---|
| 1. Simulador + tablas en Node | Hecho. Juega la región entera, con noches y jefe |
| 2. Comandante, joystick, pila, minado, Fundición, Exportación, zonas | Hecho y probado (0.2.0) |
| 3. Jugosidad de recoger, cobrar y desbloquear | Primer pase hecho; se pule con tu opinión |
| 4. Drones, torretas, munición, bichos, campo de flujo, noche | Hecho y probado (0.3.0) |
| 5. Calor-reloj, energía, brownout, jefe | Hecho y probado (0.3.0) |
| 6. Tutorial, guardado/offline, vídeos simulados | **Hecho**: guardado, mientras no juegas (0.5.0), tutorial (0.6.0) con el Sargento Brass (0.7.0), cofre (0.8.0) y los 4 vídeos simulados (0.9.0) |
| 7. Balance, prueba con 5 personas, vídeo de 30 s | Primer pase de ritmo y dificultad hecho (0.4.0) |

Historial corto: 0.2.0 el bucle básico · 0.3.0 noche, torretas, drones, jefe · 0.3.1 arreglos
del dinero fantasma y del recorte en pantallas anchas · 0.4.0 ritmo más lento, noches más
duras, energía visible · 0.5.0 mientras no juegas · 0.6.0 tutorial · 0.7.0 el Sargento Brass · 0.7.1 los galones del sargento, dentro del brazo · 0.8.0 el cofre y las Gemas · 0.9.0 arranque rápido y suministro aéreo.

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

## Qué probar ahora (versión 0.9.0)

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
- Que los avisos de abajo se lean y no estorben (salen uno detrás de otro).
- La noche 2: que veas la torreta casi vacía y sepas qué hacer.
- Al final, la tarjeta «TU BASE NUNCA DUERME».
- El registro de pasos en «Herramientas de prueba».
- Lo de la 0.5.0 sigue ahí: «Simular 1 h fuera».

Preguntas para ti:

1. ¿Se entiende el juego sin que nadie te explique nada?
2. ¿Hay demasiados avisos, o falta alguno?
3. ¿Te gusta el nombre **Sargento Brass**? Es provisional (ver abajo).

## Decidido por el autor

- **Duración de la región 1** (15/10/2026): el apartado 6.3 del funcional suma unos 50 min y
  el 6.4 pide 15-25. Se sigue la 6.3 (el robot tarda 55-70 min) **y se queda así por ahora**;
  se recalibra cuando entren más elementos, y entonces se ajusta también la 6.4. Que el código
  no cumpla la 6.4 **no es un error**.
- **El ritmo y la dificultad de la 0.4.0** (15/10/2026): «por ahora está bien».
- **Guía con personaje** (15/10/2026): un sargento con el mismo casco que el comandante y
  condecoraciones, en el tutorial y en los momentos fuertes.
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
- **Precios**: P(n) = 50 × 1,15^n (las 5 primeras, con descuento). El funcional pide subir un
  18-25 % por zona; con más del 15 % el final de la región se hace eterno.
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
- **El jefe**: 1.800 de vida; pare 6 crías al 75, 50 y 25 %; al morir ella mueren sus bichos.
  Orbital Strike desde la noche 5, una carga por noche.
- **Al conquistar la región**: las noches siguen, sin jefe; sale el aviso de la región 2.
- **Mientras no juegas**: la pantalla sale tras 2 min fuera como mínimo. Los topes diarios de
  vídeos (funcional 15.3) todavía no se aplican: los vídeos son simulados y solo se cuentan.
- **El nombre del sargento: «Brass»** (0.7.0). En inglés es el latón de los casquillos de
  bala y también «los mandos» (*the brass*); suena igual en los dos idiomas. He comprobado que
  no hay ningún personaje de videojuego conocido con ese nombre (el más parecido es un capitán
  de policía de la serie *CSI*). Alternativas: **Stomp** («pisotón», aplasta bichos) o
  **Swatter** («matamoscas»). Evité Sarge (*Army Men*), Brick (*Boom Beach*) y Hammer
  (*StarCraft*), que ya son de otros juegos.
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

## Simulador (versión 0.9.0)

Sin vídeos: 8 partidas `balanced` conquistan la región en **53-61 min** (mediana 55:33), con
4 noches perdidas de 103; `defense` y `profit` quedan en 54-57 min. **Con vídeos** (×2 del
informe, segunda oportunidad y suministro aéreo): **42-46 min**, sin noches perdidas. El robot
defiende sin dudar: una persona perderá más. El simulador también dice cuándo hace el robot
cada paso del tutorial, cuántas cajas de suministro caen y las Gemas que gana (150: los dos
cofres).

## Lo siguiente

1. **Tu prueba** de la 0.6.0 a la 0.9.0 (ver «Qué probar ahora»).
2. **Preparar la prueba con 5 personas** (hito 7): evitar que alguien se quede atascado con la
   pila llena de mineral, y compartir el enlace (el Artifact es privado: se comparte desde su
   menú «Compartir»).
3. **Arte con IA**: empieza por la Fundición con el prompt de `docs/ARTE_PROMPTS.md`. El
   sargento tiene sus tres prompts en el apartado 6 (primero la cara normal, y las otras dos
   en la misma conversación de Gemini, para que salga el mismo personaje).
4. **Hito 7**: la prueba con 5 personas (con el registro de pasos del tutorial) y el **vídeo
   de 30 s**, que puedo grabar yo con el juego en piloto automático.

## Pendientes técnicos (no urgentes)

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
- **El robot se atasca a veces con la pila llena de mineral** cuando las Fundiciones están
  llenas (no hay forma de tirar cosas de la pila). Si te pasa a ti, pensamos una papelera.
