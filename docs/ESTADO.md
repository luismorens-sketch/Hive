# Hive Breaker — estado del proyecto

> Se actualiza al final de cada sesión. Dice dónde estamos y qué toca; el diseño está en
> `HIVE_Funcional.md`, que es quien manda.

**Última actualización:** 15/10/2026 · **Versión publicada:** 0.5.0 ·
**Enlace de pruebas:** https://claude.ai/artifact/6qNBWM2zfcDEKoC8AWSEL9

## Dónde estamos

Fase 2 del funcional (prototipo jugable): **hitos 4 y 5 hechos; primer pase de ritmo y
dificultad (0.4.0) y lo producido mientras no juegas (0.5.0), pendientes de tu prueba.**

| Hito (funcional 21) | Estado |
|---|---|
| 1. Simulador + tablas en Node | Hecho. Juega la región entera, con noches y jefe |
| 2. Comandante, joystick, pila, minado, Fundición, Exportación, zonas | Hecho y probado por el autor (0.2.0) |
| 3. Jugosidad de recoger, cobrar y desbloquear | Primer pase hecho; se pule con tu opinión |
| 4. Drones, torretas, munición, bichos, campo de flujo, noche | Hecho y probado por el autor (0.3.0) |
| 5. Calor-reloj, energía, brownout, jefe | Hecho y probado por el autor (0.3.0) |
| 6. Tutorial, guardado/offline, vídeos simulados | A medias: guardado sí; **mientras no juegas con «WHILE YOU WERE AWAY» y su vídeo ×2, sí (0.5.0)**; vídeos del informe (×2) y de la segunda oportunidad sí; tutorial guionizado y suministro aéreo, no |
| 7. Balance, prueba con 5 personas, vídeo de 30 s | **Primer pase de ritmo y dificultad hecho (0.4.0)** |

## Lo nuevo de la 0.5.0: lo que produce la base mientras no juegas

Decidido contigo el 15/10/2026 (funcional 14.4 y 20):

- **Al volver al juego** tras más de 2 minutos fuera (cerrándolo o dejándolo en segundo plano)
  sale la pantalla **«WHILE YOU WERE AWAY»** («MIENTRAS NO ESTABAS»): cuánto tiempo estuviste
  fuera y lo que vendió la base, con la cifra rodando. Dos botones: **COBRAR** y **×2 · AD**
  (el vídeo simulado; el primero de la partida es gratis, como en el informe de la noche).
- **Qué produce**: solo lo que la base hace **sola**, es decir, lo que los drones llevan a la
  Exportación y compra la nave. El comandante no está, así que sin drones no se gana nada. En
  la región 1 eso empieza con el dron de carga que lleva la munición a la Exportación (hacia el
  minuto 9): unos **$4,5-5 por segundo**.
- **Topes**: 2 horas como mucho (decidido en el funcional) y, de forma **provisional**, lo que
  quepa en la **caja fuerte** de la Exportación: **$150, $400 o $1.000** según su nivel. Al
  volver tienes, como mucho, más o menos lo que cuesta una zona (el doble con el vídeo).
- **No hay noches mientras no juegas** y el Calor se queda como estaba.
- **Si la hora del móvil va hacia atrás**, no se gana nada (para que no se pueda hacer trampa).
- Si cierras el juego con la pantalla abierta sin cobrar, se guarda y vuelve a salir.
- Arreglo de paso: al abrir el juego, los drones ya no dicen otra vez «¡DRON CONTRATADO!».

**Por qué la caja fuerte (decisión provisional, dime si la cambias):** la base sola vende unos
$5 por segundo, así que sin ese tope 2 horas fuera darían unos **$32.000**: más que todas las
zonas de la región 1 juntas ($27.000). Volverías y la terminarías de golpe. Con la caja fuerte
pasa lo mismo que cuando juegas y no recoges el dinero: la nave deja de comprar cuando se
llena. Se cambia en `src/js/20_data.js` (`offline.vault`): con `false`, cuenta solo el tope
de 2 horas.

## Tu opinión de la 0.3.1 y qué hice con ella (versión 0.4.0)

- *«Lo veía en el iPhone. Prefiero que el juego ocupe todo el ancho.»* → En el móvil en
  vertical el juego ocupa siempre todo el ancho, también en pantallas bajas como el visor de
  Claude: caben 10 casillas a lo ancho y, como mínimo, 13 a lo alto. Solo si la pantalla es
  más ancha que el mapa entero (ordenador, móvil en horizontal) quedan bandas oscuras a los
  lados.
- *«Avanza muy rápido y es muy fácil: en 5 min tenía todo y los bichos apenas me tocaban.»* →
  - **Zonas más caras**: la primera cuesta $50 (antes $15) y cada una un 15 % más que la
    anterior. Con el robot del simulador, la zona 15 llega a los 10 min (antes 4) y la región
    entera, en 55-70 min (antes 20). Una persona tardará más.
  - **Noches más largas y fuertes**: más bichos (amenaza base 16, antes 10), en grupos más
    pequeños y más seguidos. Duran casi un minuto (antes 23 s). El Swarmer muerde más fuerte
    (8, antes 6). La primera noche trae 12 Swarmers (antes 8).
  - **Días de unos 3 minutos** de mediana.
- *«La electricidad no influye en nada; quiero verla junto al dinero.»* →
  - Arriba, junto al dinero, está la energía **usada / disponible** («6/10 MW»). Ámbar cuando
    estás cerca del límite; roja y latiendo cuando falta.
  - **Ahora influye**: mejorar una máquina la hace más rápida, pero consume 1 MW más por nivel.
    Al subir la primera Fundición a nivel 2 ya falta energía, y la cinta dice cuánto te frena
    («POCA ENERGÍA · 83 % VELOCIDAD»). El panel solar llega justo después.
  - **Segundo panel solar** al final de la región (en el norte): con el Disipador y las
    mejoras vuelve a faltar energía, y una noche con poca energía duele (las torretas también
    van más lentas).

Dos fallos que encontré por el camino, y que ya están arreglados:

- **Matar al jefe y perder la noche a la vez**: si caía la Madre de la Prole pero sus crías
  tiraban después la Torre de mando, la región quedaba conquistada y la noche, perdida. Ahora,
  con la Madre caen todos sus bichos (y sueltan su botín).
- **La partida podía atascarse para siempre**: si los bichos rompían todas las Fundiciones, no
  quedaba de dónde sacar Placas, y sin Placas no se podía reparar nada. Ahora, si reparas sin
  Placas en la pila, se paga con Créditos.

## Qué probar ahora (versión 0.5.0)

**Importante: borra el progreso antes de probar.** Tu partida ya tiene todo comprado, así que
no notarías el nuevo ritmo. Rueda dentada → «Borrar progreso» y otra vez para confirmar (se
pierde la partida de prueba, nada más).

- **La pantalla**: que el juego llene todo el ancho del iPhone, sin bandas negras.
- **La energía** junto al dinero: compra la Fábrica de munición (5/5), luego mejora la
  Fundición y mira cómo se pone roja y sale la cinta. Compra el panel solar y vuelve a blanco.
- **El ritmo**: ¿cada zona cuesta lo justo, o ahora se hace pesado?
- **Las noches**: ¿llegan a tocarte la base? ¿Tienes que rellenar torretas y reparar?
- **Los arreglos de la 0.3.1**: el dinero de la plataforma de la nave ya no debería quedarse
  «fantasma» si esperas encima.
- **Mientras no juegas (nuevo en la 0.5.0)**. Dos formas de probarlo:
  - **Sin esperar**: rueda dentada → «Herramientas de prueba» → «Simular 1 h fuera». Si aún
    no tienes el dron que lleva la munición a la Exportación, sale el aviso «NADA VENDIDO».
  - **De verdad**: juega hasta tener ese dron, cierra el juego (o cambia de aplicación) al
    menos 2 minutos y vuelve.
  - Prueba los dos botones: **COBRAR** y **×2**. El dinero tiene que volar al contador.

Preguntas para ti:

1. ¿El ritmo nuevo está bien, o nos hemos pasado de lento o de difícil?
2. ¿Se entiende la energía con el indicador y la cinta?
3. ¿Va fluido de noche con más bichos? Activa «Ver FPS» en los ajustes y dime la cifra.
4. **Mientras no juegas**: ¿te parece bien que el tope sea la caja fuerte (como mucho una zona
   al volver), o quieres que dé más?

## Duración de la región 1: decidido por el autor (15/10/2026)

El apartado **6.3** pide unos tiempos por zona que suman unos **50 minutos** para la región 1,
pero el **6.4** dice que la región 1 dura **15-25 minutos**. Como el autor pidió más lento,
**se sigue la tabla 6.3**: el robot tarda 55-70 min.

**Decisión del autor: los tiempos se quedan así por ahora.** Habrá que recalibrar cuando
entren más elementos en el juego; entonces se ajusta también la 6.4 del funcional. Hasta
entonces, que el código no cumpla la 6.4 **no es un error**: no hay que «arreglarlo».

Además, el funcional pide en la 6.3 que cada zona suba un 18-25 % de precio; uso un 15 %
porque, con más subida, el final de la región se hace eterno. Lo apunto como provisional.

## Decisiones provisionales (las tomé para poder programar; dime si cambias alguna)

Todas están en las tablas (`src/js/20_data.js`) y se cambian en un minuto.

De la 0.2.0, siguen igual:

- Estar entre dos vetas mina de las dos a la vez.
- La nave espera a que haya mercancía.
- La caja fuerte limita lo que compra la nave.
- Para pagar hay que quedarse 0,4 s encima.
- Guardado automático.

De la 0.3.0 (con lo que cambió en la 0.4.0):

1. **Mapa de la región 1** (12 × 44 casillas). La base en el centro; el flanco sur ataca desde
   la primera noche; el norte se abre con la Expansión, pero **no ataca hasta la noche 3**.
2. **El Calor solo sube mientras una máquina trabaja** (Fundición 1/s, Fábrica de munición
   1,5/s; el Disipador lo baja 2/s). Empieza a contar al comprar la primera torreta.
   - Barra B(n) = **140** × (1 + 0,25·n) (antes 120).
   - Amenaza A(n) = **16** × (1 + 0,15·n) (antes 10).
   - **Nuevo**: los bichos llegan en grupos de 5 puntos de amenaza, cada 10 s.
3. **La primera noche está guionizada**: **12** Swarmers por el sur, y la Torre de mando no se
   puede caer (funcional 12).
4. **Bichos**: Leapers desde la noche 4 (saltan muros), Crushers desde la 6, el dorado 1 de
   cada 150. Ganan un **6 %** de vida por noche (antes 8 %: ahora hay más noches). El Swarmer
   muerde **8** (antes 6).
5. **Torretas**: caja de 5 cajas de munición, empiezan con 2. Gatling 25 disparos por caja,
   Cañón 6. Tres niveles: daño, cadencia y alcance.
6. **Energía**: la Torre de mando da 5 MW y cada panel solar 5 más (hay **dos** paneles).
   Consumen: Fundición **2 / 3 / 4** MW según su nivel, Fábrica de munición **3 / 4 / 5** y
   Disipador 3. Si falta, todo va más lento en proporción, torretas incluidas.
7. **Edificios dañados**: rinden entre el 100 % y el 50 %; rotos quedan como escombro.
   Reparar: quieto al lado, una Placa cada 0,25 s, +30 de vida. **Sin Placas, cada tramo cuesta
   $10.** Un escombro vuelve a funcionar a la mitad de su vida.
8. **Noche perdida**: se repite la misma noche, la Torre de mando se levanta al **60 %** (antes
   35 %) y **cada derrota seguida hace la repetición un 20 % más suave** (hasta −60 %). Sin
   esto, una noche demasiado dura se perdía una y otra vez y la partida no avanzaba.
9. **Botín de la noche**: se cobra al cerrar el informe y se pierde si se pierde la noche; lo
   que queda en el suelo dura 30 s tras el amanecer. Premio por aguantar: 15 × (1 + 0,5·n).
10. **DEFENSA / EQUILIBRIO / BENEFICIO**: solo afecta a los drones que llevan cosas a la
    exportación. EQUILIBRIO deja la mitad para tus torretas.
11. **El jefe** (Madre de la Prole): 1.800 de vida; pare 6 crías al 75, 50 y 25 %; el punto
    verde quiere decir que tu defensa la mataría en unos 20 s. **Al morir ella, mueren todos
    sus bichos.**
12. **Orbital Strike**: desde la noche 5, una carga por noche.
13. **Precios**: P(n) = **50 × 1,15^n** (antes 15 × 1,16^n).
14. **Al conquistar la región**: las noches siguen, sin jefe; sale el aviso de la región 2.
15. **Orden de las zonas** (0.4.0): el primer panel solar sale justo después de mejorar la
    Fundición; el segundo, al final, junto al Disipador.

De la 0.5.0 (mientras no juegas):

16. **Tope de la caja fuerte**: fuera del juego tampoco se compra más de lo que cabe en la caja
    fuerte de la Exportación ($150 / $400 / $1.000). Ver «Lo nuevo de la 0.5.0».
17. **La pantalla de regreso sale tras 2 minutos fuera** como mínimo; menos, no se nota.
18. **Los topes diarios de vídeos** (funcional 15.3: 3 al día para «×2 al volver», 15 para el
    informe) **todavía no se aplican**: en el prototipo los vídeos son simulados y solo se
    cuentan («Vídeos simulados» en el menú de pruebas).

## Simulador (versión 0.4.0)

16 partidas del robot (8 `balanced`, 4 `defense`, 4 `profit`): **todas conquistan la región**,
en **55-70 min** (mediana ~57), con 12-16 noches y 0-3 derrotas. Las noches duran ~1 min y los
días ~3 min. Zona 5 a los 3 min, zona 15 a los 10, zona 29 a los 42. A lo largo de la región
los bichos rompen entre 4 y 16 edificios. El robot defiende sin dudar: una persona perderá más.

Para el robot también hubo mejoras: si un bicho muerde la base por donde no llega ninguna
torreta, ahora se acerca a dispararle (antes se quedaba quieto junto a una torreta lejana).

## Lo siguiente

1. **Tu opinión de la 0.4.0**: dificultad, energía y pantalla (el ritmo se queda así por ahora).
2. **Arte con IA**: empieza por la Fundición con el prompt de `docs/ARTE_PROMPTS.md` y
   mándamela. Cuando aprobemos el estilo, el resto de edificios, objetos y bichos.
3. **Hito 6**, lo que falta:
   - Tutorial guionizado de los primeros 20 minutos (funcional 12). Al final de la región
     explica lo que produce la base mientras no juegas.
   - Suministro aéreo: el último vídeo simulado (funcional 15.3 n.º 4). Pendiente de que me
     digas si lo quieres (también regala dinero).
4. **Hito 7**: balance fino con tu opinión y la prueba con 5 personas.

## Pendientes técnicos (no urgentes)

- **Proyecto de Android**: no se crea hasta comprobar la marca y fijar el identificador
  (propuesta `com.lmcadvisors.hivebreaker`; no se puede cambiar nunca después).
- **Tipografías** (Teko y Barlow Semi Condensed): llegan de Google Fonts. Dentro de la app de
  Android habrá que meterlas en el propio archivo.
- **Guardado** en `localStorage`; en Android irá también a Preferences (funcional 20). Una
  noche a medias no se guarda: al volver, es de día con la barra de Calor casi llena.
- **Avisos en el móvil** (funcional 14.4: «caja fuerte llena», como mucho 2 al día): necesitan
  la app de Android; dentro de un Artifact no se pueden enviar.
- **El funcional no está marcado** con PENDIENTE/ACTUAL: lo hago cuando validemos el balance.
- **El sonido** está sintetizado (también la percusión de la noche) y no lo he podido oír:
  dime si algo suena mal o molesta.
- **El robot se atasca a veces con la pila llena de mineral** cuando las Fundiciones están
  llenas (no hay forma de tirar cosas de la pila). Una persona podría caer en lo mismo: si te
  pasa, dímelo y pensamos una papelera o algo parecido.
