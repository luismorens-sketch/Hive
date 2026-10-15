# Hive Breaker — estado del proyecto

> Se actualiza al final de cada sesión. Dice dónde estamos y qué toca; el diseño está en
> `HIVE_Funcional.md`, que es quien manda.

**Última actualización:** 15/10/2026 · **Versión publicada:** 0.6.0 ·
**Enlace de pruebas:** https://claude.ai/artifact/6qNBWM2zfcDEKoC8AWSEL9

## Dónde estamos

Fase 2 del funcional (prototipo jugable): **hito 6 casi terminado** (falta el suministro
aéreo, pendiente de tu decisión). Lo nuevo, el tutorial (0.6.0), está pendiente de tu prueba.

| Hito (funcional 21) | Estado |
|---|---|
| 1. Simulador + tablas en Node | Hecho. Juega la región entera, con noches y jefe |
| 2. Comandante, joystick, pila, minado, Fundición, Exportación, zonas | Hecho y probado (0.2.0) |
| 3. Jugosidad de recoger, cobrar y desbloquear | Primer pase hecho; se pule con tu opinión |
| 4. Drones, torretas, munición, bichos, campo de flujo, noche | Hecho y probado (0.3.0) |
| 5. Calor-reloj, energía, brownout, jefe | Hecho y probado (0.3.0) |
| 6. Tutorial, guardado/offline, vídeos simulados | Guardado, mientras no juegas (0.5.0), **tutorial (0.6.0)** y 3 de los 4 vídeos simulados, hechos. Falta el **suministro aéreo** |
| 7. Balance, prueba con 5 personas, vídeo de 30 s | Primer pase de ritmo y dificultad hecho (0.4.0) |

Historial corto: 0.2.0 el bucle básico · 0.3.0 noche, torretas, drones, jefe · 0.3.1 arreglos
del dinero fantasma y del recorte en pantallas anchas · 0.4.0 ritmo más lento, noches más
duras, energía visible · 0.5.0 mientras no juegas · 0.6.0 tutorial.

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

## Qué probar ahora (versión 0.6.0)

**Para ver el tutorial hay que empezar de cero**: rueda dentada → «Borrar progreso» y otra vez
para confirmar (se pierde la partida de prueba, nada más).

- Que la entrada se vea bien y que un toque la salte.
- Que los avisos de abajo se lean y no estorben (salen uno detrás de otro).
- La noche 2: que veas la torreta casi vacía y sepas qué hacer.
- Al final, la tarjeta «TU BASE NUNCA DUERME».
- El registro de pasos en «Herramientas de prueba».
- Lo de la 0.5.0 sigue ahí: «Simular 1 h fuera».

Preguntas para ti:

1. ¿Se entiende el juego sin que nadie te explique nada?
2. ¿Hay demasiados avisos, o falta alguno?

## Decidido por el autor

- **Duración de la región 1** (15/10/2026): el apartado 6.3 del funcional suma unos 50 min y
  el 6.4 pide 15-25. Se sigue la 6.3 (el robot tarda 55-70 min) **y se queda así por ahora**;
  se recalibra cuando entren más elementos, y entonces se ajusta también la 6.4. Que el código
  no cumpla la 6.4 **no es un error**.
- **El ritmo y la dificultad de la 0.4.0** (15/10/2026): «por ahora está bien».
- **Mientras no juegas** (15/10/2026): se programa ya, con **tope de 2 h** (funcional) y **tope
  de la caja fuerte** de la Exportación ($150 / $400 / $1.000): al volver, como mucho más o
  menos una zona (el doble con el vídeo). Sin la caja fuerte, 2 h darían ~$32.000, más que
  toda la región 1. Se cambia en `src/js/20_data.js` (`offline`).

## Decisiones provisionales (las tomé para poder programar; dime si cambias alguna)

Todas están en las tablas (`src/js/20_data.js`) y se cambian en un minuto.

- **Bucle básico**: estar entre dos vetas mina de las dos; la nave espera a que haya
  mercancía y no compra más de lo que cabe en la caja fuerte; para pagar hay que quedarse
  0,4 s encima; guardado automático.
- **Precios**: P(n) = 50 × 1,15^n. El funcional pide subir un 18-25 % por zona; con más del
  15 % el final de la región se hace eterno.
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
- **Tutorial (0.6.0)**:
  - La **rueda dentada se ve desde el principio** (el funcional pide 5 min sin menús) porque
    ahí están las herramientas de prueba. En la versión de tienda se esconderá.
  - Los avisos van **por lo que pasa, no por minutos**: con el ritmo de la 0.4.0 todo llega
    más tarde que en la tabla del funcional 12 (el robot: primera compra 0:45, primera noche
    4:50, primer Leaper 14:00, Orbital 17:00, jefe 57:00).
  - **Lo que todavía no existe en el juego y no hay en el tutorial**: el primer cofre con
    Gemas, los botones de Tienda y Misiones (minuto 5-7), el mapa con la región 2 iluminada y
    el permiso de notificaciones (este necesita la app de Android).

## Simulador (versión 0.4.0)

16 partidas del robot (8 `balanced`, 4 `defense`, 4 `profit`): **todas conquistan la región**,
en **55-70 min** (mediana ~57), con 12-16 noches y 0-3 derrotas. Noches de ~1 min, días de
~3 min. Zona 5 a los 3 min, zona 15 a los 10, zona 29 a los 42. El robot defiende sin dudar:
una persona perderá más. Desde la 0.6.0 el simulador también dice cuándo hace el robot cada
paso del tutorial.

## Lo siguiente

1. **Tu prueba del tutorial** (0.6.0).
2. **Suministro aéreo** (el último vídeo simulado, funcional 15.3 n.º 4): una caja cae en el
   mapa cada 3-5 min y, con un vídeo, da 90 s de producción. **Dime si lo quieres**: también
   regala dinero.
3. **Arte con IA**: empieza por la Fundición con el prompt de `docs/ARTE_PROMPTS.md`.
4. **Hito 7**: la prueba con 5 personas (con el registro de pasos del tutorial) y el vídeo de
   30 s.

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
