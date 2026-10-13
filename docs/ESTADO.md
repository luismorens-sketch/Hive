# Hive Breaker — estado del proyecto

> Se actualiza al final de cada sesión. Dice dónde estamos y qué toca; el diseño está en
> `HIVE_Funcional.md`, que es quien manda.

**Última actualización:** 13/10/2026 · **Versión publicada:** 0.2.0 ·
**Enlace de pruebas:** https://claude.ai/artifact/6qNBWM2zfcDEKoC8AWSEL9

## Dónde estamos

Fase 2 del funcional (prototipo jugable), **hitos 1 y 2 hechos, pendientes de tu prueba.**

| Hito (funcional 21) | Estado |
|---|---|
| 1. Simulador + tablas en Node | Hecho: `node tools/sim_balance.js` |
| 2. Comandante, joystick, pila, minado, Fundición, Exportación, zonas de pago (sin noche) | Hecho, **esperando tu prueba** |
| 3. Jugosidad de recoger, cobrar y desbloquear | Primer pase hecho (vuelos, sonidos, confeti, contador que rueda); se pule con tu opinión |
| 4. Drones, torretas, munición, bichos, campo de flujo, noche | Pendiente |
| 5. Calor-reloj, energía, brownout, jefe | Pendiente |
| 6. Tutorial, guardado/offline, vídeos simulados | El guardado básico ya está; lo demás pendiente |
| 7. Balance, prueba con 5 personas, vídeo de 30 s | Pendiente |

## Qué probar ahora (versión 0.2.0)

Abre el enlace de pruebas en el móvil. Es la **primera prueba del funcional: ¿apetece mover y
apilar?** Lo que hay:

- Joystick: apoya el dedo en cualquier sitio y arrastra.
- Junto a la veta, el mineral salta solo a la pila de la espalda (10 como máximo: sale «MAX»).
- Pisa la zona amarilla de la Fundición para dejar el mineral y la turquesa para recoger las
  placas.
- Pisa la zona amarilla de la Exportación: la nave baja, compra y deja billetes; pisa el
  montón verde para cobrar.
- Quédate encima de un círculo con precio para comprarlo. Hay 14 zonas: segunda veta, Fábrica
  de munición (convierte 2 placas en 1 caja que vale más), mejoras de máquinas, la Expansión
  norte (se levanta la niebla) y una segunda Fundición.
- La rueda dentada abre los ajustes: idioma, sonido, vibración, menos efectos y
  **herramientas de prueba** (piloto automático, velocidad ×4, ver FPS, +$500, borrar
  progreso).
- La partida se guarda sola.

Preguntas para ti:

1. ¿Apetece moverse y apilar? ¿El comandante va rápido o lento? ¿La pila se balancea bien?
2. ¿Se entiende adónde ir sin leer nada (la flecha amarilla y las pistas de arriba)?
3. ¿Qué momento se siente flojo: minar, dejar en la máquina, cobrar o comprar?
4. ¿Suena bien? ¿Vibra? (El sonido está sintetizado; no he podido oírlo.)
5. ¿Va fluido en tu móvil? Activa "Ver FPS" en los ajustes y dime la cifra.

## Decisiones provisionales (las tomé para poder programar; dime si cambias alguna)

El funcional no las concreta. Están en las tablas (`src/js/20_data.js`) y se cambian en un
minuto:

1. **Estar entre dos vetas mina de las dos a la vez.** Por eso la segunda veta se nota.
2. **La nave espera a que haya mercancía**: la primera baja en cuanto dejas algo; después,
   una cada 20 s (15 y 11 con mejoras).
3. **La caja fuerte limita lo que compra la nave**: si el montón de billetes está lleno, la
   nave no compra más (aviso «VAULT FULL»). Tamaño 150 / 400 / 1.000.
4. **Velocidades de las máquinas**: Fundición 0,8 s por placa (0,6 y 0,45 con mejoras);
   Fábrica de munición 1,4 s por caja (1,0 y 0,75).
5. **Pagar una zona**: hay que quedarse 0,4 s encima (pasar corriendo no paga); después
   acelera de ×1 a ×5 como dice el funcional. Lo pagado se queda aunque te vayas.
6. **Curva de precios** P(n) = 15 × 1,25^n; las zonas "grandes" (Fábrica, Expansión,
   segunda Fundición) cuestan ×1,3.
7. **Zonas de esta versión**: solo las de sistemas que ya existen (14). Torretas, muros,
   drones, Solar, Disipador y Nido se añaden con sus hitos.
8. **Mapa de la región 1**: 12 × 36 casillas, se ven 10 de ancho. La base al sur; al norte,
   niebla hasta la Expansión.
9. **Guardado automático** al comprar una zona, al salir de la app y cada 20 s.

## Lo siguiente

1. **Tu opinión de la 0.2.0** y ajustar la sensación (hito 3).
2. **Hito 4**: Dron minero y de carga (el momento «funciona sin mí»), torretas Gatling y
   Cannon con su caja de munición, Swarmers por el sur, campo de flujo y la primera noche.
3. Prompts para el primer pase de sprites (comandante, pila, billetes: funcional 19 y 21).

## Pendientes técnicos (no urgentes)

- **Proyecto de Android**: no se crea hasta comprobar la marca y fijar el identificador
  (propuesta `com.lmcadvisors.hivebreaker`; no se puede cambiar nunca después).
- **Tipografías** (Teko y Barlow Semi Condensed): ahora llegan de Google Fonts. Dentro de la
  app de Android habrá que meterlas en el propio archivo para que funcione sin internet.
- **Guardado** en `localStorage`; en Android irá también a Preferences (funcional 20).
- **Offline** (producción mientras no juegas): hito 6.
- **El funcional no está marcado** con PENDIENTE/ACTUAL todavía: lo hecho es parcial. Cuando
  validemos el hito 2, se marcan los apartados que correspondan.

## Simulador (versión 0.2.0)

El robot termina las 14 zonas en **8:09**. Las 5 primeras caen entre 3 y 25 s (el funcional
pide 15-40 s: alguna sale antes porque el robot compra dos seguidas). De la 6 a la 14, entre
3 y 88 s, casi todas dentro de los 40-90 s. **El cuello de botella es el comandante**: las
máquinas pasan el 70-90 % del tiempo esperando material. Es lo esperado sin drones; los drones
(hito 4) son justo lo que lo resuelve.
