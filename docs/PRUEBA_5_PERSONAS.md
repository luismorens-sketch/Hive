# Prueba con 5 personas (hito 7 del funcional)

> Guía para el autor. La prueba decide si el bucle «cargar → automatizar → defender» engancha
> (funcional 21). Lo que miden los criterios de éxito sale casi todo de **una captura** de la
> ventana de ajustes de cada persona.

## Antes

1. **Compartir el enlace.** El Artifact es privado: en la página del juego, menú
   **«Compartir»** → que lo pueda abrir **cualquiera con el enlace**. Envía el enlace a cada
   persona: https://claude.ai/artifact/6qNBWM2zfcDEKoC8AWSEL9
2. Cada persona juega **en su propio móvil**, con el sonido puesto, **sin que nadie le explique
   nada**. En su móvil no salen las herramientas de prueba (solo en el tuyo).
3. Si alguien ya lo había abierto antes, que empiece de cero: rueda dentada → «Borrar
   progreso» y otra vez para confirmar.
4. Mejor gente que no sepa nada del juego. Al menos 2 que no jueguen a juegos de móvil a menudo.

## Durante (15-20 minutos)

- **Mira sin hablar.** Apunta cuándo duda, qué toca sin querer, dónde se queda parado.
- **No ayudes**, salvo que lleve **más de 1 minuto atascado**: entonces ayuda y apúntalo.
- Fíjate sobre todo en tres momentos:
  - **La primera zona**: ¿entiende que hay que quedarse encima para pagar?
  - **El primer «MAX» o «SIN MATERIAL»** (pila llena, máquina parada): ¿lo entiende solo?
    ¿Cuánto tarda en resolverlo?
  - **La primera noche**: ¿sabe qué hacer? ¿Se queda quieto para disparar más?

## Después

1. **Captura de la ventana de ajustes**: rueda dentada → la parte «TU PARTIDA» (tiempo jugado,
   zonas, noches, vídeos y cuándo hizo cada cosa por primera vez). Si no cabe entera, dos
   capturas.
2. Tres preguntas, con sus palabras:
   - ¿Qué es lo que más te ha gustado?
   - ¿Hubo algo que no entendiste o que te molestó?
   - Del 1 al 5, ¿seguirías jugando? ¿Por qué?
3. Una pregunta sobre los vídeos: ¿viste alguno (los botones «AD»)? ¿Por qué sí o por qué no?

**Mándamelo todo por aquí** (capturas y lo que apuntaste) y yo saco los números.

## Lo que mide cada criterio de éxito (funcional 21)

| # | Criterio | De dónde sale |
|---|---|---|
| 1 | 4 de 5 pagan su primera zona en < 45 s y contratan el primer dron antes de 3 min, sin ayuda | Captura: «Comprar» y «Dron» |
| 2 | 3 de 5 siguen jugando por su cuenta más de 15 min y terminan la región 1 | Captura: «Jugado» y «Región conquistada» |
| 3 | Entienden un cuello de botella («MAX» o «SIN MATERIAL») en < 2 min desde que aparece | Lo que apuntes mirando |
| 4 | Dos estrategias llegan al jefe; en el simulador ninguna gana más del 60 % | Simulador (ya se cumple) |
| 5 | 60 FPS en un Galaxy A34 | Si alguien tiene un Android de gama media: en tu móvil, «Ver FPS» |
| 6 | La región 1 dura 15-25 min | **No se cumple a propósito**: decidiste que dure ~55 min por ahora |

Ojo con el 2: con el ritmo actual, terminar la región lleva más de 15 minutos. Que alguien siga
jugando más de 15 minutos por su cuenta ya es buena señal, aunque no la termine.

## Resultados (rellenar)

| Persona | Primera zona | Primer dron | Jugado | Zonas | Noches (ganadas / perdidas) | ¿Conquistó? | Vídeos | ¿Seguiría? (1-5) | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |
| 4 | | | | | | | | | |
| 5 | | | | | | | | | |

## Y después: ¿seguimos o no? (go / no-go)

- **Seguir** si se cumplen el 1 y el 2 (o casi) y la mayoría responde 4 o 5 en «¿seguirías
  jugando?». Entonces toca el test de mercado (funcional 21, fase 2.5) con los vídeos de 30 s.
- **Arreglar antes** si mucha gente se atasca en el mismo sitio: eso se ve en el registro de
  pasos y es lo primero que cambiaríamos.
- **Replantear** si nadie quiere seguir jugando: el problema sería el gancho, no el código.
