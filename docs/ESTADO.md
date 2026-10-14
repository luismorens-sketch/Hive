# Hive Breaker — estado del proyecto

> Se actualiza al final de cada sesión. Dice dónde estamos y qué toca; el diseño está en
> `HIVE_Funcional.md`, que es quien manda.

**Última actualización:** 14/10/2026 · **Versión publicada:** 0.3.1 ·
**Enlace de pruebas:** https://claude.ai/artifact/6qNBWM2zfcDEKoC8AWSEL9

## Dónde estamos

Fase 2 del funcional (prototipo jugable): **hitos 4 y 5 hechos, pendientes de tu prueba.**

| Hito (funcional 21) | Estado |
|---|---|
| 1. Simulador + tablas en Node | Hecho. Ahora juega la región entera, con noches y jefe |
| 2. Comandante, joystick, pila, minado, Fundición, Exportación, zonas | Hecho y probado por el autor (0.2.0) |
| 3. Jugosidad de recoger, cobrar y desbloquear | Primer pase hecho; se pule con tu opinión |
| 4. Drones, torretas, munición, bichos, campo de flujo, noche | **Hecho, esperando tu prueba** |
| 5. Calor-reloj, energía, brownout, jefe | **Hecho, esperando tu prueba** |
| 6. Tutorial, guardado/offline, vídeos simulados | A medias: guardado sí; vídeos simulados del informe (×2) y de la segunda oportunidad sí; tutorial guionizado, offline y los otros 2 vídeos, no |
| 7. Balance, prueba con 5 personas, vídeo de 30 s | Pendiente |

## Tu opinión de la 0.2.0 y qué hice con ella

- *«En general correcto; fluidez y velocidad correctas.»* → No he tocado ni el movimiento ni
  la velocidad.
- *«Las vetas y las construcciones no parecen muy intuitivas.»* →
  - Las vetas ahora son **un montón del mismo mineral que recoges**.
  - Cada edificio tiene **una silueta distinta**: la Fundición es un horno con la puerta al
    rojo, la Fábrica de munición una prensa con tres balas.
  - Encima de cada máquina hay **un cartel con lo que entra ▸ lo que sale**.
  - Además, en `docs/ARTE_PROMPTS.md` tienes **los prompts para generar el arte de verdad con
    Gemini** (ver "Lo siguiente").
- *«Hay pocas estructuras y recursos: da poco juego.»* → Llegan los hitos 4 y 5:
  - 30 zonas en lugar de 14.
  - Drones, torretas, muros, panel solar y disipador.
  - Bichos y noches, y el jefe en el Nido.

## Arreglos de la 0.3.1 (lo que me contaste de la 0.3.0)

- *«A veces el dinero de la plataforma de la nave no se puede coger y se queda ahí.»* → Era
  dinero **fantasma**: si estabas encima del montón cuando la nave compraba, el dinero se cobraba
  al momento, pero los billetes que aún caían se seguían dibujando. Ahora el montón dibujado
  nunca supera al de verdad.
- *«Con la barrera sur, al ir a la derecha, el borde izquierdo se pone negro y la barrera queda
  encima.»* → Pasaba en pantallas más anchas que el juego (ordenador, móvil en horizontal): se
  veía lo de fuera del mapa moverse con la cámara. Ahora el juego se recorta a su columna. En un
  móvil en vertical no cambia nada.

## Qué probar ahora (versión 0.3.0, con los arreglos de la 0.3.1)

Se abre en el mismo enlace de siempre. **Tu partida anterior se conserva** (dinero y zonas),
pero el mapa ha cambiado de sitio. Si prefieres empezar de cero: rueda dentada → «Borrar
progreso» (dos toques).

- **El día**: lo mismo que antes, pero al comprar la **primera torreta** aparece arriba la
  **barra de Calor**. Se llena mientras las máquinas trabajan.
- **«LA COLMENA DESPIERTA»**: la barra se ha llenado. Suena la sirena, sale una flecha roja por
  donde van a entrar y a los 10 s empieza la noche.
- **La noche**:
  - Los bichos vienen del sur. Desde la noche 3, también del norte, si compraste la Expansión.
  - Las torretas disparan solas mientras tengan munición. **Rellénalas pisando su caja
    naranja** con cajas de munición en la pila.
  - Tu comandante dispara solo; **quieto dispara más rápido**.
  - El botín vuela hacia ti si estás cerca. Si cae lejos, pásale por encima: dura 30 s después
    del amanecer.
- **El informe**: al amanecer. El botón **×2 · AD** es un **vídeo simulado** (el primero es
  gratis). Así medimos cuántos vídeos se usarían.
- **Si cae la Torre de mando**: «Segunda oportunidad · AD» o «Rendirse». Rendirse solo te quita
  el botín de esa noche, nunca lo ahorrado ni lo construido.
- **Drones**:
  - El minero lleva mineral a la Fundición. Los de carga mueven placas y munición; su ruta se
    ve en el suelo.
  - Sobre la salida de la Fábrica de munición hay un **cartel que se toca**: DEFENSA /
    EQUILIBRIO / BENEFICIO. Decide si el dron se lleva toda la munición a vender o te deja
    una parte para las torretas.
- **Energía**: al construir la segunda Fundición falta energía. Sale la cinta «POCA ENERGÍA» y
  todo va más lento hasta que compras el panel solar.
- **Torretas**: la primera es una Gatling. En las siguientes **eliges** Gatling (rápida) o
  Cañón (daño en área).
- **Edificios rotos**: si los bichos rompen algo, queda el escombro. Quédate quieto al lado con
  placas en la pila para repararlo.
- **El jefe**: la última zona es el Nido, al sur, fuera del muro.
  - Al pagarla aparece «ATACAR EL NIDO» con un punto de color: **verde** quiere decir que tu
    defensa está a la altura.
  - Quédate encima 1,5 s y sale la **Madre de la Prole**.
  - Desde la noche 5 tienes el **Orbital**: el botón de abajo a la derecha, y luego tocas
    dónde quieres que caiga.

Preguntas para ti:

1. ¿Se entiende ahora qué es cada edificio y qué hace?
2. ¿La primera noche asusta lo justo? ¿Se entiende que hay que rellenar las torretas?
3. ¿Las noches llegan demasiado seguidas o demasiado espaciadas?
4. ¿El jefe es demasiado fácil o demasiado difícil?
5. ¿Va fluido de noche, con muchos bichos? Activa «Ver FPS» en los ajustes y dime la cifra.

## Una contradicción del funcional que tienes que decidir

El apartado **6.3** pide unos tiempos por zona: 15-40 s en las 5 primeras, 40-90 s hasta la 15
y 1,5-3 min hasta la 30. Con las 30 zonas de la región 1, eso suma unos **50 minutos**. Pero el
apartado **6.4** dice que **la región 1 dura 15-25 minutos**. Las dos cosas no caben a la vez.
**He dado prioridad a la 6.4**: el robot del simulador conquista la región en 19-25 minutos,
así que las zonas van más rápido de lo que pide la 6.3. ¿Lo dejamos así (la tabla 6.3 valdría
para las regiones siguientes) o prefieres otra cosa?

## Decisiones provisionales (las tomé para poder programar; dime si cambias alguna)

Todas están en las tablas (`src/js/20_data.js`) y se cambian en un minuto.

De la 0.2.0, siguen igual:

- Estar entre dos vetas mina de las dos a la vez.
- La nave espera a que haya mercancía.
- La caja fuerte limita lo que compra la nave.
- Para pagar hay que quedarse 0,4 s encima.
- Guardado automático.

Nuevas en la 0.3.0:

1. **Mapa de la región 1 rehecho** (12 × 44 casillas) para poder defenderlo.
   - La base está en el centro.
   - El flanco sur ataca desde la primera noche; al sur del muro queda el Nido.
   - El flanco norte se abre con la Expansión, pero **no ataca hasta la noche 3**, para dar
     tiempo a montar algo.
2. **El Calor solo sube mientras una máquina trabaja** (Fundición 1/s, Fábrica de munición
   1,5/s; el Disipador lo baja 2/s).
   - Barra B(n) = 120 × (1 + 0,25·n).
   - Amenaza A(n) = 10 × (1 + 0,15·n).
   - El Calor empieza a contar al comprar la primera torreta.
3. **La primera noche está guionizada**: 8 Swarmers por el sur, y la Torre de mando no se
   puede caer (funcional 12).
4. **Bichos y cuándo aparecen**:
   - Leapers desde la noche 4; saltan los muros.
   - Crushers desde la noche 6.
   - El dorado sale 1 de cada 150 y huye hacia el borde.
   - Los bichos ganan un 8 % de vida por noche.
5. **Torretas**:
   - Caja de 5 cajas de munición; empiezan con 2.
   - Gatling: 25 disparos por caja. Cañón: 6.
   - 3 niveles: daño, cadencia y alcance.
6. **Energía**: la Torre de mando da 5 MW; cada panel solar, 5 MW más.
   - Consumen: Fundición 2, Fábrica de munición 3 y Disipador 3.
   - Si falta, todo va más lento en proporción, torretas incluidas.
7. **Edificios dañados**:
   - Rinden entre el 100 % (sanos) y el 50 % (casi rotos).
   - Rotos quedan como escombro.
   - **Reparar**: quieto junto a ellos, una placa cada 0,25 s, +30 de vida. Un escombro vuelve
     a funcionar al llegar a la mitad de su vida.
8. **Noche perdida**: no cuenta (se repite la misma noche) y la Torre de mando se levanta al
   35 %.
9. **Botín de la noche**:
   - Se cobra al cerrar el informe. Si se pierde la noche, se pierde.
   - Lo que queda en el suelo dura 30 s tras el amanecer.
   - Premio por aguantar: 15 × (1 + 0,5·n).
10. **DEFENSA / EQUILIBRIO / BENEFICIO**:
    - Solo afecta a los drones que llevan cosas a la exportación.
    - EQUILIBRIO deja en la salida la mitad del montón (para tus torretas).
    - DEFENSA no se lleva nada; BENEFICIO se lo lleva todo.
11. **El jefe** (Madre de la Prole):
    - 1.800 de vida.
    - Pare 6 crías al 75, 50 y 25 % de su vida.
    - El punto verde quiere decir que tu defensa la mataría en unos 20 s.
12. **Orbital Strike**: desde la noche 5, una carga por noche.
13. **Precios**: P(n) = 15 × 1,16^n (antes 1,25: ahora hay el doble de zonas).
14. **Al conquistar la región**: las noches siguen, pero sin jefe; sale el aviso de que la
    región 2 llegará en otra versión.

## Simulador (versión 0.3.0)

El robot conquista la región 1 en **19-25 minutos** (mediana ~20:30) con las tres
estrategias (`balanced`, `profit`, `defense`), y pierde alrededor de **1 noche de cada 10**,
casi siempre la 6 (la primera con Crushers) o el primer intento contra el jefe. **El cuello de
botella ya no es solo el comandante**: con drones, las máquinas trabajan el 45-65 % del tiempo.
Recuerda que el robot juega sin dudar: una persona tardará más.

## Lo siguiente

1. **Tu opinión de la 0.3.0**, sobre todo la noche y el jefe.
2. **Arte con IA**: empieza por la Fundición con el prompt de `docs/ARTE_PROMPTS.md` y
   mándamela. Cuando aprobemos el estilo, el resto de edificios, objetos y bichos.
3. **Hito 6**:
   - Tutorial guionizado de los primeros 20 minutos (funcional 12).
   - Producción mientras no juegas (tope de 2 h) con la pantalla «WHILE YOU WERE AWAY».
   - Los otros dos vídeos simulados: offline ×2 y suministro aéreo.
4. **Hito 7**: balance fino con el simulador y la prueba con 5 personas.

## Pendientes técnicos (no urgentes)

- **Proyecto de Android**: no se crea hasta comprobar la marca y fijar el identificador
  (propuesta `com.lmcadvisors.hivebreaker`; no se puede cambiar nunca después).
- **Tipografías** (Teko y Barlow Semi Condensed): llegan de Google Fonts. Dentro de la app de
  Android habrá que meterlas en el propio archivo.
- **Guardado** en `localStorage`; en Android irá también a Preferences (funcional 20). Una
  noche a medias no se guarda: al volver, es de día con la barra de Calor casi llena.
- **El funcional no está marcado** con PENDIENTE/ACTUAL: lo hago cuando validemos los hitos 4 y 5.
- **El sonido** está sintetizado (también la percusión de la noche) y no lo he podido oír:
  dime si algo suena mal o molesta.
