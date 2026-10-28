# HIVE BREAKER — Funcional v0.5

Arcade Idle Tycoon para Android. Aterrizas como comandante en un planeta infestado:
recoges mineral con tus propias manos, lo fundes, lo vendes a la flota y con cada
crédito desbloqueas máquinas, torretas y drones que acaban haciendo el trabajo por ti.
Pero cada máquina hace ruido, y el ruido despierta al enjambre: de noche, lo que has
construido tiene que aguantar. Región a región, hasta matar a la Reina.

> Convención: todo está **PENDIENTE** hasta que se implemente. Cuando exista código,
> cada apartado pasa a **ACTUAL** y manda el funcional sobre el código (igual que en Hyper Drill).
> Textos en pantalla en inglés; este documento y los comentarios en español.
> Todas las cifras son **valores iniciales para el simulador**, no balance cerrado.
> Las palabras del sector (RV, FTUE, D1...) están explicadas en el glosario (apartado 25).

---

## 0. Cambios

### v0.5 (28/10/2026)
- **Mejoras de las máquinas**: todas las máquinas de la región llegan al **nivel 3**, y el
  cartel de cada mejora dice lo que da («+50 % almacén · +33 % velocidad»). Al acercarse a la
  bandeja de entrada o de salida de una máquina se ve cuánto lleva y cuánto cabe («12/30»)
  (6.2, 18).
- **Laboratorio**: la investigación (10.3) se hace en un **edificio que se construye** en la
  región y se abre **al pisarlo**, como todo lo demás (4.1). Se paga con **Muestras** + tiempo.
- **Dron artillero** en la región 1 (antes, fase 3): se compra **en cada torreta** y lleva la
  munición de la fábrica a su torreta; de noche se refugia como los demás drones (7).
- **Vida del comandante**: la barra se ve siempre de noche y **se cura sola de día** (4.3).
- **Orden del prototipo**: las mejoras y el laboratorio van **antes** que la región 2 (21).
- **Los ajustes de balance se posponen** (27/10/2026) para equilibrar varias facetas a la
  vez: la curva de precios (6.3) y la duración de la región 1 (6.4) (24.1).

### v0.4.1 (17/10/2026)
- **El test de mercado, lo último del proyecto**: se hace al subir el juego a producción en
  Google Play, no al terminar el prototipo (21, 24.1).

### v0.4 (16/10/2026)
- **Más materiales y edificios.** Regla para todas las regiones: cada región trae un material
  nuevo que se combina con los anteriores (5.4). La región 1 suma un segundo metal: **Copper →
  Bobinadora → Coil**; **Coil + Plate → Taller de celdas → Cell**; la Cell alimenta la nueva
  **torreta Shock**, que frena a los bichos (5.1, 9.1).
- **Construir cuesta materiales**: las zonas grandes piden Créditos y materiales (6.2). El
  **Arsenal** y el **Radar** pasan a ser edificios de la región 1 que se construyen con Coils; la
  investigación los mejora (9.1, 10.3).
- **La región 1 dura unos 25 min** (por ahora), con el tutorial ampliado (6.4, 12).
- **El prototipo crece**: entran la región 2 (The Mire), el mapa del planeta y una primera
  investigación. **Fuera la prueba con 5 personas**: se probará en la prueba cerrada de Play
  Console (21, 22).

### v0.3.2 (16/10/2026)
- **El nombre del guía, decidido**: el **Sargento Brass** (12, 24.1).

### v0.3.1 (15/10/2026)
- **Offline**: lo ganado fuera tampoco supera lo que cabe en la caja fuerte de la Exportación,
  además del tope de 2 h (5.5, 14.4).
- **Guía con personaje**: el **Sargento Brass** habla en los avisos del tutorial y en los
  momentos fuertes (12, 19). El nombre es provisional.
- **Las 5 primeras zonas, más baratas** (6.3), para cumplir el criterio de éxito 1 del
  apartado 21 (primera zona en < 45 s, primer dron antes de 3 min).
- **Suministro aéreo prudente** (15.3): cada 4-5 min, solo de día, desde la primera noche
  ganada; si no se recoge en 60 s, desaparece.

### v0.3 (13/10/2026)
- Cerradas las 10 decisiones abiertas (apartado 24).
- **La suscripción VIP se aplaza** hasta después del soft launch: primero hay que
  demostrar que el juego retiene jugadores (15.9).
- Nombre fijado: **Hive Breaker**. Repositorio: `Hive`.

### v0.2 respecto a v0.1

| Tema | v0.1 | v0.2 | Por qué |
|---|---|---|---|
| Género y control | Constructor por toques en cuadrícula 8×12 | **Comandante con joystick** que carga pilas, paga zonas y contrata drones | Decisión tomada (13/10/2026). Es el formato Arcade Idle: tacto, ritmo y progreso visible |
| Construcción | Colocación libre | **Mapa diseñado a mano** por región, con zonas de pago; el jugador elige el tipo de torreta en cada pad | Ritmo controlado = progreso y monetización controlables; cero fricción con el dedo |
| Logística | Hubs con capacidad de paso | **Drones visibles** en rutas fijas; el cuello de botella es una **pila física** que desborda | Mismo concepto de Factorio, legible sin números |
| Día y noche | Fases cronometradas | **El Calor es el reloj**: la barra se llena al producir; al llenarse, noche. Botón «provocar» con bonus | Une los pilares del ruido y la fábrica; el jugador controla el ritmo |
| Capa activa | Sólo habilidades de mando | + **el comandante dispara solo** y se posiciona; quieto dispara más rápido | Arcade de verdad sin exigir precisión |
| Ciencia | 3 colores de Muestras dentro de la base | **Investigación permanente** (entre regiones) con Muestras + tiempo | Progreso a largo plazo y sumidero de tiempo monetizable |
| Monetización | 2 vídeos, sin intersticiales, cosmética | **Híbrida**: 10 puntos de vídeo, intersticiales controlados, Sin anuncios, Starter, pase, ofertas por momento (VIP aplazado) | El objetivo es monetizar |
| Retención | No definida | Primeros 20 min guionizados, diarias, calendario, pase, eventos, notificaciones locales | La adicción se diseña; no aparece sola |
| Estética | Chapa gastada | **«Militar de juguete»**: brillante y legible + catálogo de efectos con tiempos | La sensación es el producto |
| Bichos | Nombres de Starship Troopers | Nombres propios | Evitar conflictos de propiedad intelectual y rechazos en tienda |
| Offline | 4 h (8 h con mejora) | 2 h base → 6 h con investigación; aviso al llenarse | Más regresos al día = más sesiones |
| Medición | Simulador de balance | + analítica, ajuste remoto, KPIs de lanzamiento, test de mercado | No se monetiza lo que no se mide |

---

## 1. Visión

### 1.1 La frase
**«Hazlo con tus manos. Automatízalo. Defiéndelo.»**

### 1.2 Fantasía del jugador
Soy el comandante que convierte un páramo infestado en una fortaleza industrial. Al
principio cargo mineral a la espalda; una hora después, veinte drones trabajan para
mí y mis torretas trituran oleadas que antes me habrían arrasado.

### 1.3 Por qué destaca en su género
Los Arcade Idle de referencia (Burger Please!, My Perfect Hotel) tienen un bucle muy
adictivo pero **sin amenaza**: nada puede salir mal. Hive Breaker añade dos cosas:

1. **Una noche que pone en riesgo lo construido** (tensión → alivio → botín).
2. **Una decisión constante: vender para crecer o guardar para defender.**

Es el diferenciador. Tiene que verse en los primeros 5 minutos de juego y en
cualquier vídeo de 15 segundos.

### 1.4 Público
Adultos casuales y «mid-core ligero». Audiencia objetivo en Play: **16+**, no dirigido
a niños (ver 16). Sesiones de 3-10 minutos, varias veces al día.

---

## 2. Pilares (lo que no se negocia)

1. **Hazlo a mano, luego automatízalo.** Toda tarea nueva se hace primero con el
   comandante; después se contrata un dron que la hace solo. El jugador tiene que
   *sentir* la diferencia.
2. **La fábrica es el arma.** La munición sale de la cadena que tú montas. Si la
   cadena se rompe, la defensa se apaga.
3. **El bicho responde a tu ruido.** Producir llena la barra de Calor; la barra llena
   trae la noche. Crecer cuesta.
4. **Siempre hay un siguiente objetivo a la vista.** En la primera hora, nunca más de
   60 s sin poder comprar algo, y siempre una flecha que dice adónde ir.
5. **Todo lo que se gana vuela, suena y suma.** Ningún número cambia sin animación
   (apartado 13).
6. **El cuello de botella se ve.** Una pila que desborda («MAX») o una máquina con
   icono ámbar. Factorio sin cintas: el esfuerzo está en decidir.
7. **Sesión corta, progreso largo.** 3-5 minutos deben ser satisfactorios; la base
   produce offline (con tope).
8. **Un dedo, vertical.** Joystick flotante en portrait. Las acciones básicas son por
   proximidad: cero botones.
9. **Rendimiento por delante del efecto.** Reglas de Hyper Drill: sin `shadowBlur`,
   sin `backdrop-filter`, pools, sólo se dibuja lo visible, 60 FPS.
10. **Monetización dentro del bucle, no encima.** Cada anuncio u oferta aparece en un
    momento de deseo, es opcional y su precio se entiende.

---

## 3. Bucles de juego

```
10 s     RECOGER ──► CARGAR ──► DEPOSITAR ──► COBRAR
         (minar o      (pila a     (entrada de   (billetes vuelan
          recoger)      la espalda)  la máquina)   al contador)

1-3 min  CRÉDITOS ─► PAGAR ZONA ─► máquina / torreta / dron nuevo
              ▲                          │
              │                          ▼
            BOTÍN ◄── NOCHE ◄── CALOR ◄── más producción

Sesión   avanzar zonas ─► preparar el NIDO ─► jefe de región ─► región nueva
(5-15 m)

Días     regiones · investigación · outposts · pase · eventos · Reina · prestigio
```

### 3.1 El día
- La producción corre; el comandante carga, paga zonas y contrata.
- La **barra de Calor** (arriba) se llena según lo que produzcas (8.1). Al 100 %:
  aviso **«THE HIVE STIRS»** durante 10 s y empieza la noche.
- **Provocar la noche** (botón junto a la barra, desde la noche 3): la noche empieza
  ya, con botín extra = **+50 % × parte vacía de la barra**. Riesgo y recompensa para
  el jugador impaciente.
- **Tope del día:** si en 6 min la barra no se llena, la noche llega igualmente (con
  amenaza mínima). Evita quedarse atascado sin producir.
- Duración objetivo: 90-150 s al empezar cada región; 3-4 min al final.

### 3.2 La noche
- Oleadas por 1-3 flancos, avisadas con flechas en el borde (lenguaje de CORE).
- Las torretas disparan solas con la munición de su caja (9.1).
- El comandante dispara solo al bicho más cercano; **quieto, +30 % de cadencia**
  (decisión: plantarse o moverse).
- Los drones siguen trabajando, pero se refugian si hay bichos a menos de 3 casillas:
  de noche la producción baja. Tensión.
- Habilidades de mando: botones abajo a la derecha, sólo de noche (4.4).
- Duración: 45-90 s.

### 3.3 El informe (3-5 s, se salta tocando)
Botín (Créditos, Muestras, Quitina), daños y récord. Botones **[x2 · AD]** y
**[CONTINUE]**. Al cerrar, el botín llueve hacia los contadores.

### 3.4 El Nido (jefe de región)
La última zona de cada mapa es **«ASSAULT THE NEST»**. Pagarla abre la noche del
jefe **cuando el jugador quiera**, con un indicador de poder recomendado
(verde / ámbar / rojo). Ganar = región conquistada → Outpost → región siguiente.

---

## 4. El Comandante

Un único comandante fijo, personalizable con skins (decisión 24).

### 4.1 Control: todo por proximidad
Joystick flotante: aparece donde apoyas el dedo y desaparece al soltar.
Velocidad inicial: 4 casillas/s.

| Acción | Cómo se hace |
|---|---|
| Minar | Estar junto a una veta: cada 0,4 s salta un Mineral a la pila |
| Depositar | Pisar la zona de entrada de una máquina: salen de la pila los objetos que acepta |
| Recoger | Pisar la zona de salida de una máquina |
| Cobrar | Pisar el montón de billetes de la plataforma de exportación |
| Pagar | Pisar una zona de pago: los Créditos vuelan a ella con velocidad creciente; si pide materiales, saltan de la pila |
| Rellenar torreta | Pisar su caja de munición con Munición en la pila |
| Reparar | Pisar un muro o edificio dañado (gasta Placas de la pila) |

### 4.2 La pila
- Los objetos se apilan a la espalda y se balancean con efecto muelle al moverse.
- Capacidad inicial **10**; con investigación, hasta 60.
- Pila mixta: se apila en orden; al depositar sólo salen los del tipo aceptado.
- Contador **«8/10»** sobre la cabeza; al llenarse, **«MAX»** rebota en ámbar.
- Se dibujan como máximo 25 objetos; por encima, la pila se ve llena y manda el contador.

### 4.3 Combate y vida
- Auto-apuntado al bicho más cercano en rango (4 casillas). Daño base 10, cadencia 3/s.
- **Vida 100** (la investigación la sube, 4.5). Barra sobre la cabeza: **siempre visible de
  noche**, y de día mientras esté herido. **De día se cura sola** (decidido 28/10/2026).
- Si cae, reaparece en la Torre de mando a los 5 s (con vídeo, al instante).
  **Nunca hay «game over» por el comandante.**

### 4.4 Habilidades de mando
Dos ranuras. Cada habilidad tiene **cargas por noche** (se recargan al amanecer) y
enfriamiento entre usos:

| Habilidad (UI) | Efecto | Desde |
|---|---|---|
| Orbital Strike | Tocar un punto: daño en área tras 1,5 s de aviso | R1 (noche 5) |
| Emergency Repair | Tocar un edificio: restaura vida | R2 |
| Decoy | Desvía un grupo (usa el campo de flujo) | R3 |
| Overcharge | Una torreta dispara x2 durante 6 s a costa de Calor | R4 |

Regla (de v0.1): **ninguna habilidad sustituye a la defensa**; sólo salva el fallo puntual.

### 4.5 Mejoras del comandante
Sólo en investigación (permanentes, 10.3): pila, velocidad, minado, daño, vida y radio
de imán. Regla heredada: **una estadística se compra en un solo sitio.**

---

## 5. Objetos, monedas y cadenas

### 5.1 Objetos físicos (se cargan en la pila)
Cada objeto tiene **forma y color propios** (legible para daltónicos).

| Objeto (UI) | Aspecto | Origen | Uso | Desde |
|---|---|---|---|---|
| Ore | Roca gris azulada | Veta (a mano o dron minero) | Fundición | R1 |
| Plate | Lingote plateado | Fundición (1 Ore) | Munición, Cells, exportar, reparar, construir | R1 |
| Ammo | Caja oliva con franja amarilla | Fáb. de munición (2 Plate) | Torretas, exportar | R1 |
| Copper | Pepita cobriza con vetas verdes | Veta de cobre (a mano o dron minero) | Bobinadora | R1 |
| Coil | Carrete de hilo cobrizo | Bobinadora (1 Copper) | Cells, construir, exportar | R1 |
| Cell | Pila cian con un rayo | Taller de celdas (1 Coil + 1 Plate) | Torreta Shock, exportar | R1 |
| Biomass | Gota verde | Bichos muertos | Refinería | R2 |
| Fuel | Bidón naranja | Refinería (2 Biomass) | Generadores, Flamer | R2 |
| Chitin | Esquirla violeta | Bichos élite | Taller de blindaje | R3 |
| Armor | Placa con remaches | Taller (1 Chitin + 2 Plate) | Muros reforzados, exportar | R3 |

### 5.2 Monedas (en la cartera, no se cargan)

| Moneda | Ámbito | Se gana | Se gasta |
|---|---|---|---|
| **Créditos** | Por región (cada región tiene su cartera) | Exportar, bichos, suministros aéreos | Zonas, mejoras de máquinas / drones / torretas, reparaciones |
| **Muestras**: común, rara, Núcleo de nido (verde / azul / violeta, como en v0.1) | Permanente | Bichos (común), élites (rara), jefes (Núcleo), Outposts | Investigación |
| **Gemas** | Permanente, premium | Compra; pequeñas cantidades en cofres, diarias, pase gratis, jefes | Acelerar, saltos de tiempo, cosmética, revivir sin vídeo |
| **Fichas de evento** | Sólo durante el evento | Jugando el evento | Tienda del evento (caducan, con aviso previo) |

Reglas:
- **Una sola moneda premium.** Las fichas de evento no se compran con dinero.
- Las mejoras de región cuestan Créditos; la tecnología cuesta Muestras. Dos
  economías separadas (regla de v0.1).

### 5.3 Energía y Calor (indicadores, no se cargan)
- **Energía = capacidad (MW)**, no stock. Si la demanda supera la oferta, **todo rinde
  proporcionalmente menos (brownout)**, torretas incluidas. Se ve: luces que
  parpadean y cinta «LOW POWER».
- **Calor = reloj de la noche** (8.1).

### 5.4 Cadenas

```
R1  Veta ─► Ore ─► Fundición ─► Plate ─┬─► Fáb. munición ─► Ammo ─┬─► Torretas
                                       │                          └─► Exportación ($$)
                                       ├─► Exportación ($) · reparar · construir
                                       └─► Taller de celdas (+ Coil) ─► Cell ─┬─► Torreta Shock
                                                                              └─► Exportación ($$)
    Veta de cobre ─► Copper ─► Bobinadora ─► Coil ─┬─► Taller de celdas
                                                   └─► Exportación ($) · construir
R2  Bichos ─► Biomass ─► Refinería ─► Fuel ─► Generador ─► Energía
R3  Élites ─► Chitin + Plate ─► Taller ─► Armor ─► Muros reforzados / Exportación ($$$)
```

**Regla de materiales** (decidida 16/10/2026, por ahora): cada región trae **un material
nuevo** y una o dos máquinas que lo combinan con los anteriores; ninguno se queda inútil al
cambiar de región. Cada material nuevo repite el bucle «primero a mano, luego un dron»
(pilar 1). Las recetas concretas de cada región se deciden al llegar a ella; R2 y R3
también usarán Copper y Coil para construir y en alguna receta.

**La decisión central:** cada Plate, Coil, Cell o caja de Ammo puede venderse (crecer),
quedarse (defender) o gastarse en construir (6.2). En la salida de la Fundición, la Fáb. de
munición y el Taller de celdas hay un
**interruptor de prioridad** para los drones: **DEFENSE / BALANCED / PROFIT**
(un solo ajuste, tres opciones, como en v0.1).

### 5.5 Plataforma de exportación
- Una nave de la flota aterriza cada 20 s (mejorable) y compra lo que haya.
- Paga con un **montón de billetes** junto a la plataforma, con tope (Caja fuerte,
  mejorable). Pisar el montón = los billetes vuelan al contador.
- Precios iniciales R1: Plate $3 · Coil $4 · Ammo $10 · Cell $12 · Armor $40 (R3). Los
  ajusta el simulador.
- Offline la nave sigue comprando: el montón crece hasta el tope de tiempo offline o hasta
  llenar la caja fuerte, lo que llegue antes (decidido 15/10/2026).

---

## 6. La región (el mapa)

### 6.1 Estructura
- Mapa vertical diseñado a mano, de 3-4 pantallas de alto; la cámara sigue al comandante.
- **Niebla:** el terreno sin comprar está cubierto. Cada **Expansión** levanta niebla
  y abre **un flanco nuevo** (más terreno = más superficie a defender).
- 25-45 **zonas de pago** por región. Sólo se ven 1-3 a la vez; las siguientes
  aparecen al comprar. Una **flecha guía** señala la más barata que puedes pagar.
- Pagos parciales: lo pagado se guarda aunque te vayas.

Esquema de R1 (orientativo):

```
            NORTE  (flanco 2: se abre con la Expansión 1)
   ░░░░░░░░░░░░░░░░ niebla ░░░░░░░░░░░░░░░░░░
   ═════[T]═══════════════════[T]═════════   muros + pads de torreta
   (cobre) (cobre)  [Bobinadora]  [Taller de celdas]  [Radar*]
      [Solar]        [Fáb. munición]
   (veta) (veta)       [Fundición]    [EXPORT] ◄ nave
        (veta)      [HQ / Torre de mando]
      [Dron pad]       [Arsenal*]     [$ zona]
   ═════[T]═══════════════════[T]═════════
            SUR  (flanco 1: desde la noche 1)
```

`*` = edificio avanzado: se construye con materiales (6.2). El cobre está al norte, cerca
del flanco que se abre con la Expansión: rinde más, pero está más expuesto.

### 6.2 Tipos de zona

| Tipo | Ejemplos | Al pagar |
|---|---|---|
| Máquina | Fundición, Fáb. munición, Solar, Disipador | Aparece y empieza a trabajar |
| Expansión | Perímetro norte | Se levanta la niebla: nuevo flanco y nuevas vetas |
| Pad de torreta | — | El jugador **elige** el tipo (2-3 opciones) |
| Muro | Segmento | Se levanta; canaliza a los bichos |
| Contratación | Dron minero, Dron de carga | Aparece un dron con su ruta fija |
| Mejora | Junto a cada máquina, pad o torreta | Sube un nivel (máx. 3; **todas las máquinas llegan al 3**, decidido 28/10/2026): velocidad · capacidad de las bandejas de entrada y salida · menos Calor. El cartel dice lo que da («+50 % almacén · +33 % velocidad») |
| Nido | Última zona | Abre la noche del jefe |

**Zonas con materiales** (decidido 16/10/2026): las zonas grandes (máquinas avanzadas,
torretas nuevas, Arsenal, Radar…) piden Créditos **y** materiales, por ejemplo $300 +
10 Plate. Se pagan igual, quedándose encima: los Créditos vuelan a la zona y los materiales
saltan de la pila. Lo pagado se guarda. El letrero enseña cuánto falta de cada cosa, y en
ámbar lo que no llevas encima.

Regla de diseño: **cada 3-4 zonas, una «grande»** (torreta nueva, dron, expansión) que
cambie algo visible en la base.

### 6.3 Ritmo: curva de precios
- Precio de la zona *n* en la región *r*: `P(n) = P0(r) × k^n`, con k ≈ 1,18-1,25 (simulador).
- Tiempo objetivo hasta poder pagar la siguiente zona:

| Tramo de la región | Tiempo hasta la siguiente zona |
|---|---|
| Zonas 1-5 | 15-40 s |
| Zonas 6-15 | 40-90 s |
| Zonas 16-30 | 1,5-3 min |
| Zonas 30+ | 3-6 min (aquí entran offline, turbos y ofertas) |

- **Arranque rápido** (decidido 15/10/2026): las 5 primeras zonas cuestan menos
  (×0,5 · ×0,55 · ×0,6 · ×0,6 · ×0,55 sobre la curva) para que la primera zona se pague en
  menos de 45 s y el primer dron llegue antes de 3 min (criterio de éxito 1, apartado 21).

### 6.4 Duración objetivo por región

| Región | Duración |
|---|---|
| R1 | ~25 min, por ahora (decidido 16/10/2026; se termina en la primera sesión) |
| R2 | 45-75 min |
| R3 | 2-3 h |
| R4-R6 | 4-12 h (con offline) |
| R7 en adelante | 1-2 días |

---

## 7. Automatización: drones

- **Dron minero:** mina una veta y lleva el mineral a su máquina (Ore → Fundición,
  Copper → Bobinadora).
- **Dron de carga:** ruta fija entre dos puntos marcados en su pad
  (p. ej. Fundición → Fáb. munición, o Fáb. munición → Exportación).
- **Dron artillero** (región 1, decidido 28/10/2026; antes, fase 3): se compra **en cada
  torreta**, en una zona de pago junto a ella. Su dron va y viene entre la fábrica y su
  torreta: Ammo desde la Fábrica de munición; Cells desde el Taller de celdas para la Shock.
  De noche se refugia si hay bichos cerca, como los demás: el comandante sigue contando cuando
  aprieta. Aparece después de la noche 2 (cuando ya se ha aprendido a rellenar a mano). El
  Arsenal cubre a la vez las torretas de su radio; el dron, una sola, esté donde esté.
- Valores iniciales: capacidad 4, velocidad 2,5 casillas/s.
- Mejoras en cada pad: capacidad · velocidad · +1 dron (máx. 3 por ruta).
- **Capacidad de paso = drones × capacidad × velocidad.** Si sobra producción, la pila
  de salida crece hasta «MAX»; si falta, la máquina muestra el icono ámbar «NO INPUT».
  El jugador lee el ratio sin ver un número.
- Investigación «Drones blindados»: dejan de refugiarse de noche.

---

## 8. Calor, amenaza y energía

### 8.1 Calor
- Cada máquina activa suma Calor/s: Fundición 1,0 · Bobinadora 1,0 · Fáb. munición 1,5 ·
  Taller de celdas 1,5 · Refinería 2,0 ·
  Generador de combustión 2,5 · Solar 0. El nivel 3 de una máquina emite −30 %.
- **Disipador:** −2 Calor/s; consume 3 MW.
- Tamaño de la barra en la noche *n* de la región *r*: `B(n) = B0(r) × (1 + 0,25·n)`.
- Offline el Calor se congela (no hay noches offline).
- **Dos caminos válidos** (de v0.1): producir limpio y poco (noches espaciadas, menos
  botín) o producir mucho y blindarse (noches seguidas, más botín). El simulador
  vigila que ninguno domine.

### 8.2 Amenaza
`Amenaza(n) = A0(r) × (1 + 0,15·n)`. La composición de cada oleada sale de los pesos
por región de la tabla `ENEMIES`. El coste de producir mucho no es una amenaza mayor
por noche, sino **más noches**.

### 8.3 Energía
- Fuentes: Solar (R1, 5 MW, 0 Calor) · Generador de combustión (R2, 15 MW, consume
  Fuel) · Geotérmica (R4, gratis) · Baterías (R5).
- Consumidores: máquinas, Disipadores, Radar y torretas de energía (Railgun, Tesla).
- Brownout proporcional a todo (5.3). Es el fallo más dramático: una noche con
  brownout duele.

---

## 9. Defensa y combate

### 9.1 Torretas

| Torreta (UI) | Rol | Consume | Fuerte contra | Desde |
|---|---|---|---|---|
| Gatling | Un objetivo, rápida | 1 Ammo / 25 disparos | Crusher, Leaper | R1 |
| Cannon | Daño en área | 1 Ammo / 6 disparos | Swarmers en masa | R1 |
| Shock | Descarga en área que **frena** (−50 % de velocidad durante 2 s), poco daño | 1 Cell / 8 descargas | Masas y Crusher: los sujeta delante de los Cañones | R1 |
| Flak | Golpea en el aire | Ammo | Leaper saltando | R2 |
| Flamer | Cono corto, quema | Fuel | Masas, interior de la base | R2 |
| Mortar | Largo alcance, área | Ammo | Spitter | R3 |
| Railgun | Perforante en línea | Energía | Crusher | R4 |
| Tesla | Rayo en cadena | Energía | Swarmer, Howler | R5 |

- Cada torreta tiene una **caja de munición** (5 cajas) con indicador. Vacía =
  icono «NO AMMO» y deja de disparar.
- Se rellena con el comandante, con drones artilleros o con el **Arsenal**: edificio de R1
  que se construye con Coils (6.2) y rellena solo las torretas de su radio con la munición
  que se le lleve. La investigación lo mejora.
- **Radar** (edificio de R1, se construye con Coils): avisa por qué flanco viene la
  oleada. La investigación le da más antelación.
- 3 niveles por pad: daño · cadencia · alcance.

### 9.2 Muros y rutas
Los bichos buscan el camino de menor resistencia (campo de flujo, reutilizable de
CORE). Los muros **canalizan, no encierran**: siempre queda una ruta; encerrar no es
victoria.

### 9.3 Daño a edificios
Los edificios dañados rinden menos. Uno destruido deja un **escombro** que se
reconstruye pisándolo (cuesta Placas). Si cae la **Torre de mando**, se pierde la
noche (no la partida).

### 9.4 Perder una noche
- Se pierde el botín de esa noche y quedan daños por reparar.
- **Nunca** se pierden Créditos ahorrados ni zonas compradas.
- Primero se ofrece **[SECOND CHANCE · AD]** (1 por noche). Si no, informe con un
  consejo concreto («Your Gatlings ran out of ammo»).
- Contra un jefe se muestra la vida que le quedaba («BROOD MOTHER 12% HP») y un consejo.

### 9.5 Bichos (renombrados)

| Especie (UI) | Rol | Obliga a... | Aparece | Botín |
|---|---|---|---|---|
| Swarmer | Marea barata | Daño en área, muros | R1 | $, Biomass (R2+) |
| Leaper | Salta muros | Torretas interiores, Flak | R1 (noche 4) | $ |
| Crusher | Muy resistente, lento | Daño concentrado, Railgun | R1 (noche 6) | $$, Chitin (R3+) |
| Spitter | Artillería a distancia | Alcance, Mortar, Radar | R2 | $$, Muestra rara |
| Tunneler | Excava y sale dentro | Reparación, sensores | R3 | $$ |
| Howler | Aura: enfurece a los cercanos | Priorizarlo con habilidades | R5 | Muestra rara |
| Gilded Swarmer | Raro (1 de cada 150), huye | Cazarlo a tiempo | Todas | $ ×20 y unas pocas Gemas |
| Brood Mother | Jefe de región, con fases | Preparación | Fin de región | Núcleo de nido, Gemas, cofre |
| Queen | Jefe final | Ver 11 | The Hive | — |

- Escalan con la Amenaza (región + noche), no sólo con el reloj.
- El botín **vuela solo al comandante** si está dentro de su radio de imán; el resto
  queda en el suelo hasta el amanecer y se recoge pisándolo. El combate alimenta la
  economía: defender mal es perder botín.

---

## 10. Progresión

### 10.1 Mapa del planeta

| # | Región (UI) | Bioma | Novedad de cadena | Bicho nuevo | Regla especial |
|---|---|---|---|---|---|
| R1 | Dust Flats | Llanura árida | Ore → Plate → Ammo; Copper → Coil → Cell; Exportación, Solar | Swarmer, Leaper, Crusher | Tutorial, Ore abundante |
| R2 | The Mire | Pantano | Biomass → Fuel → Generador | Spitter | Mucha Biomass, poco Ore, muchos Leapers |
| R3 | Red Canyon | Cañón | Chitin + Plate → Armor | Tunneler | Pasillos naturales: defender es fácil, pero salen por dentro |
| R4 | Cinder Peak | Volcán | Geotérmica gratis | Crusher élite | Calor ×2 |
| R5 | Rime Shelf | Glaciar | Baterías | Howler | El Calor baja solo; energía escasa |
| R6-R11 | Variantes II | Mezcla de biomas | Recetas avanzadas (Railgun, Tesla) | Élites y combinaciones | Dos reglas especiales a la vez |
| R12 | The Hive | Nido | — | Todos | La Reina |

Se puede volver a cualquier región conquistada (su base y su cartera se conservan).

### 10.2 Outposts
- Una región conquistada pasa a **Outpost** y produce **Muestras** de forma pasiva
  (también offline).
- **Contraataques** (suavizados respecto a v0.1): de vez en cuando un Outpost avisa
  «UNDER ATTACK». Si vas, juegas una noche con botín extra; si no, su producción se
  pausa hasta que lo limpies. **Nunca se pierde.**

### 10.3 Investigación (Laboratorio, permanente)
- **Laboratorio** (decidido 28/10/2026): un edificio que se construye en la región (una zona
  de pago, como las demás) y se abre **al pisarlo** (4.1). Lo investigado vale para siempre y
  en todas las regiones. Cuesta **Muestras** + **tiempo** (de 5 min a 8 h).
- 1 investigación a la vez; 2.ª ranura en R5.
- Acelerar: vídeo (−30 min, 5 al día) o Gemas.
- 4 ramas: **Producción · Energía · Armamento · Comandante.**
- Niveles: Muestra común (nivel I), rara (II), Núcleo de nido (III: tecnología
  avanzada y final).
- Reglas (de v0.1, ajustadas):
  - Los **nodos clave** desbloquean un edificio o cambian una regla.
  - Entre nodo clave y nodo clave, 2-3 nodos de porcentaje, para que el progreso se
    sienta continuo.
  - Una estadística se compra en un solo sitio.
- Ejemplos: Pila +5 · Velocidad +10 % · Imán +1 casilla · Drones blindados · Arsenal II
  (más radio) · Flak · Railgun · Disipador II · Radar II (avisa 10 s antes) · Reparación
  automática · Tope offline +1 h · Gilded Swarmer ×2 de frecuencia · Provocar noche +25 % ·
  Orbital II (2 cargas).

### 10.4 Rango del Comandante (nivel de cuenta)
- Experiencia por zonas, noches y jefes. Cada rango sube con fanfarria y un cofre.
- Las funciones se abren poco a poco para no saturar: rango 2 misiones diarias ·
  rango 3 cofre gratis · rango 4 pase · rango 6 eventos.

### 10.5 Colecciones
- **Bestiario:** hitos por especie (10 / 100 / 1.000 / 10.000 bajas) con pequeñas
  recompensas (nunca Gemas: decisión 4) y un retrato que se va completando.
- **Skins** de comandante, torretas, drones y base.

### 10.6 Prestigio
Tras la Reina: **«New Planet»**. Se reinician las regiones; se conservan investigación
y cosmética; se gana un bono permanente (Medallas de veterano) y aparecen variantes
de bichos.

---

## 11. La Reina (final)

Sala del Hive, tres fases:
1. **Guardia:** oleadas continuas mientras el comandante rompe los huevos (pisándolos
   unos segundos: misma mecánica de proximidad).
2. **Reina expuesta:** ataca la base con ácido y artillería; hay que sostener la
   producción para sostener la munición.
3. **Muerte:** exige la rama de Núcleos de nido completa; sin ella, el daño se
   regenera. Impide saltarse la fábrica con puro dedo **o con dinero**.

---

## 12. Los primeros 20 minutos (FTUE)

Lo que más decide la retención del día 1. Cada paso es un evento de analítica (17).

| Minuto | Qué pasa | Qué aprende |
|---|---|---|
| 0:00 | La nave aterriza (5 s, se puede saltar); el comandante salta al suelo. Mano animada: «DRAG TO MOVE» | Moverse |
| 0:05 | Llega a la veta: el Ore salta a la pila | Minar = estar cerca |
| 0:15 | Fundición ya construida: deposita, salen Plates | Depositar y recoger |
| 0:25 | Plataforma: la nave compra, cae un montón de billetes, los recoge | Cobrar |
| 0:35 | Primera zona de pago ($15): segunda veta | Pagar = pisar |
| 1:00-2:30 | 3-4 zonas rápidas: Expansión, Fáb. munición, primer Gatling (sin elección) | Ritmo de compra |
| 2:30 | Contrata el primer Dron minero | «Funciona sin mí» |
| 3:30 | Aparece la barra de Calor. Noche 1 guionizada: 8 Swarmers por un flanco; **no se puede perder** | La noche existe |
| 4:30 | Informe: lluvia de botín y **primer vídeo gratis** («THIS ONE'S ON US»: x2 sin anuncio) | Lo que vale un vídeo |
| 5:00-7:00 | Primer cofre (con 50 Gemas) y primera mejora de máquina. Aparecen los botones de Tienda y Misiones | Gemas y mejoras |
| 7:00-8:30 | Noche 2: una torreta se queda sin munición a propósito y hay que rellenarla | La fábrica es el arma |
| 8:30-10:30 | **Vetas de cobre** y **Bobinadora**: Copper → Coil, primero a mano y luego con dron. Primera zona que pide materiales | Un material nuevo, el mismo bucle; construir cuesta materiales |
| 10:30-12:00 | Paneles solares; demasiadas máquinas → brownout guionizado | Energía |
| 12:00-14:00 | **Taller de celdas** (Coil + Plate → Cell) y primera **torreta Shock** | Combinar dos materiales; frenar en lugar de matar |
| 14:00-16:00 | Primer pad con elección (Gatling / Cannon / Shock); los Leapers saltan el muro | Elegir defensa |
| 16:00-18:00 | Se desbloquea el Orbital Strike en la noche 5 | Habilidades |
| 18:00-20:00 | **Arsenal** y **Radar** (se construyen con Coils) | Edificios avanzados |
| 20:00-25:00 | Nido: Brood Mother. Victoria → «REGION CLEARED» → mapa con R2 iluminada → explicación del offline y petición de permiso de notificaciones | Motivo para volver |

Reglas del tutorial:
- Sin menús durante los primeros 5 minutos. Sin textos largos: mano animada + flecha.
- Un concepto nuevo cada vez.
- **Sin intersticiales ni ofertas emergentes en la primera sesión.**
- La primera noche no se puede perder.
- El permiso de notificaciones se pide cuando tiene sentido (al explicar el offline),
  nunca al abrir el juego.

**Guía: el Sargento Brass** (decidido 15/10/2026; el nombre, el 16/10/2026). Un sargento
veterano de la flota que habla por radio: retrato de busto con el mismo casco que el
comandante (gafas turquesa subidas), cascos de radio, bigote, galones y condecoraciones.
Tres caras: normal, alarmado y contento.
- Asoma al lado de los avisos del tutorial y en los **momentos fuertes**: la primera noche
  («¡Ahí vienen!»), la primera noche ganada, la llegada del jefe y la región conquistada.
- **Nunca para el juego ni pide tocar «siguiente»**: dice su frase y se va solo (un toque lo
  quita antes). Frases de unas 8 palabras como mucho. Las flechas y la mano siguen enseñando
  lo demás.

---

## 13. Jugosidad (feedback)

### 13.1 Reglas
1. **Ningún número cambia sin animación:** cuenta rodando 0,3-0,5 s y golpe de escala.
2. **Todo lo que se gana vuela** a su contador (arco + estela) y el contador «late» al
   recibirlo.
3. **Escala de tono:** recogidas seguidas suben un semitono cada una hasta +12 y vuelven
   a empezar. Es la base de la sensación de «racha».
4. **Anticipación → explosión:** cofres, desbloqueos y jefes tienen 0,5-1 s de
   anticipación (tiembla, brilla) antes del premio.
5. **Rareza = color + sonido + duración:** común blanco, raro azul, épico violeta,
   legendario dorado. Cuanto más raro, más larga la celebración (siempre se salta tocando).
6. **Los golpes grandes congelan:** pausa de 60-120 ms (hitstop) en muertes de élite y jefe.
7. **Cámara viva pero suave:** sacudidas cortas (≤ 6 px), nunca en el movimiento normal.
8. **Vibración corta y escasa:** sólo en momentos clave; interruptor en ajustes.
9. **Máximo 4 cosas parpadeando a la vez** (regla de v0.1).
10. **Después de cada compra grande, una ocasión de lucirla:** la noche siguiente a
    comprar una torreta nueva trae una oleada a su medida.

### 13.2 Catálogo (valores iniciales en la tabla `FX`)

| Momento | Visual | Sonido | Vibración |
|---|---|---|---|
| Minar | Chispa en la veta; el Ore salta en arco (0,25 s, rebote) a la pila | «tic» con escala de tono | — |
| Pila en movimiento | Muelle por objeto (retardo 15 ms por altura) | — | — |
| Pila llena | «MAX» rebota en ámbar; la pila tiembla | «clunk» grave | Ligera |
| Depositar | Los objetos vuelan uno a uno (40 ms) a la máquina; la máquina «traga» (se aplasta y recupera) | «tic» descendente | — |
| Máquina produce | Pistón y vapor; el objeto sale con rebote | «chunk» | — |
| Nave compra | Rayo tractor; despega; los billetes caen en montón rebotando | «cha-ching» | — |
| Recoger billetes | Vuelan al contador (curva de 0,5 s, escalonados 25 ms, máx. 15 visibles); el contador crece al 115 % y vuelve | Cascada de «cling» con escala | Ligera cada 5 |
| Pagar zona | Los billetes salen del comandante a la zona, cada vez más rápido (×1 → ×5 en 1,5 s); anillo de progreso | Tono que sube con el anillo | — |
| Desbloqueo | Destello blanco 80 ms; el edificio sube del suelo (60 % → 115 % → 100 %, 350 ms); anillo de polvo; 40 confetis; sacudida 4 px 150 ms; la flecha salta a la zona siguiente | «ta-da» + golpe metálico | Media |
| Mejora de nivel | Rayos dorados y «+25%» grande que sube y se desvanece | Arpegio ascendente | Ligera |
| Contratar dron | El dron baja en paracaídas, saluda y empieza su ruta | «bip-bop» | Ligera |
| Empieza la noche | Sirena, viñeta roja que late, flechas en los flancos, cambio de música | Sirena + tambor | Media |
| Impacto | Destello blanco 60 ms y número de daño | «thwip» | — |
| Muerte de bicho | Revienta en 8-12 gotas de baba de color; el botín se esparce y a los 0,4 s vuela al imán | «splat» | — |
| Crítico | Número grande amarillo con «!» | «crack» | — |
| Gilded Swarmer | Estela dorada; al morir, fuente de 30 monedas | Campanillas | Media |
| Muerte de jefe | Hitstop 120 ms, cámara lenta (30 %) 0,8 s, rayos, fuente de 40-60 objetos, cartel «REGION CLEARED» | Coro + explosión | Fuerte |
| Cofre | Tiembla 0,8 s cada vez más; al tocar estalla; premios en fila por rareza, los raros con rayos extra | Redoble + premio | Media |
| Brownout | Luces que parpadean, cadencia visiblemente más lenta, chispas, cinta «LOW POWER» | Zumbido eléctrico | — |
| Torreta sin munición | Icono de caja vacía ámbar; la torreta «tose» | Clic vacío | — |
| Subida de rango | Medalla que gira y cae con brillo | Fanfarria corta | Media |

### 13.3 Técnica (compatible con el pilar 9)
- Brillos = sprites pre-renderizados con mezcla aditiva (`'lighter'`), nunca `shadowBlur`.
- Pools fijos: 400 partículas, 60 objetos voladores, 30 números de daño. Al superarlos,
  se **agrupan** (un billete grande «×20» en vez de veinte pequeños).
- Capa estática (suelo y edificios quietos) en un canvas aparte; se redibuja sólo al
  desbloquear algo.
- Todos los tiempos y curvas en la tabla `FX`: se ajusta la sensación sin tocar código.
- **Modo ahorro automático** si los FPS bajan de 50 durante 3 s (mitad de partículas,
  sin estelas). Opción manual «Reduce effects» en ajustes.

### 13.4 Audio
- Música de día: industrial con ritmo, relajada. De noche: percusión tensa. Cambio con
  transición de 1 s. Golpes musicales para desbloqueo, jefe y victoria.
- Variación aleatoria de tono ±5 % en efectos repetidos para que no cansen.
- Volúmenes separados (música / efectos) y vibración on/off.

---

## 14. Retención

### 14.1 Diario
- **3 misiones diarias** de juego («Kill 200 Swarmers», «Unlock 5 zones»…). Nunca
  «ver anuncios».
- **Cofre gratis** cada 4 h (máx. 2 en espera).
- **Calendario de 7 días acumulativo**: no se pierde si saltas un día. Día 7 = skin
  épica o torreta. Ciclo de 28 días con premio mayor.

### 14.2 Semanal y mensual
- **Pase de Comandante:** temporada de 28 días, 30 niveles, pista gratis + premium.
- **Swarm Weekend:** botín nocturno ×2 sábado y domingo.

### 14.3 Eventos (fase 5)
Región de evento cada 2-3 semanas, de 3-5 días: mapa corto con reglas especiales,
fichas propias, skins exclusivas y clasificación.

### 14.4 Regreso
- Pantalla **«WHILE YOU WERE AWAY»** con lo producido (cifra rodando) y
  **[x2 · AD]**.
- **Notificaciones locales** (sin servidor): caja fuerte llena, cofre listo,
  investigación terminada, evento. Máximo 2 al día, nunca de 22:00 a 9:00.
- **Tope offline:** 2 h base → 6 h con investigación (decidido). Un tope corto
  provoca más regresos al día, que es donde se generan los ingresos por anuncio.
  Además, lo ganado fuera no supera lo que cabe en la **caja fuerte** de la Exportación
  (decidido 15/10/2026): sin ese tope, 2 h fuera daban más que la región 1 entera.

---

## 15. Monetización

### 15.1 Modelo
Híbrido: anuncios + compras. Referencia del género (hybrid-casual, según Game Growth
Advisor): ingresos diarios por usuario activo de 0,15-0,50 $, con un 40-60 %
procedente de compras. Objetivo a
12 meses: mitad y mitad.

### 15.2 Principios
1. El vídeo recompensado es **siempre opcional**, va ligado a un momento de deseo y
   tiene tope diario.
2. Intersticiales sólo en pausas naturales; nunca en la primera sesión ni en combate;
   frecuencia ajustable en remoto.
3. **Quien paga deja de ver intersticiales durante 30 días** desde su última compra
   (con No Ads, para siempre). Sube la conversión del primer pago y cuida al cliente.
4. Se vende **tiempo, comodidad, potencia moderada y estética**. La Reina no se compra
   (exige Núcleos de nido, que sólo dan los jefes).
5. Precios claros en euros; los temporizadores de ofertas son **reales** (nunca se
   reinician).
6. Sin cajas aleatorias de pago en el lanzamiento (16).

### 15.3 Vídeos recompensados

| # | Dónde | Momento | Recompensa | Tope/día | Fase |
|---|---|---|---|---|---|
| 1 | Informe nocturno | Tras ganar una noche | Botín ×2 | 15 | MVP (simulado) |
| 2 | Regreso | Al abrir tras estar fuera | Producción offline ×2 | 3 | MVP (simulado) |
| 3 | Segunda oportunidad | Cae la Torre de mando | Revive: muros al 50 %, torretas llenas | 1 por noche | MVP (simulado) |
| 4 | Suministro aéreo | Cae una caja en el mapa cada 4-5 min (al azar), solo de día y desde la primera noche ganada; dura 60 s (decidido 15/10/2026) | Créditos = 90 s de producción | 8 | MVP (simulado) |
| 5 | Turbo | Botón en el HUD | Producción ×2 durante 10 min, acumulable hasta 2 h | 12 | F3 |
| 6 | Pago al instante | En una zona, si te falta ≤ 25 % | Completa la zona | 5 | F3 |
| 7 | Orbital extra | Sin cargas durante la noche | +1 carga | 1 por noche | F3 |
| 8 | Laboratorio | Investigación en curso | −30 min | 5 | F3 |
| 9 | Cofre | Cofre gratis en espera | Abrir otro ya | 2 | F3 |
| 10 | Comandante caído | Al morir | Reaparece al instante | 5 | F3 |

- Topes y enfriamientos en ajuste remoto.
- El **primer vídeo de la vida del jugador es gratis** (12, minuto 4:30).
- El botón de vídeo lleva siempre icono de claqueta y la palabra «AD»: nada ambiguo.

### 15.4 Intersticiales
- **Dónde:** al cerrar el informe nocturno y al volver del mapa del planeta.
- **Cuándo:** desde la segunda sesión y con R1 completada. Enfriamiento base 120 s (ajustable 60-240 s);
  máximo 1 cada 2 noches hasta el rango 6.
- Un vídeo recompensado visto reinicia el enfriamiento.
- **Nunca:** de noche, mientras se paga una zona, en los primeros 60 s de sesión ni a
  quien haya pagado en los últimos 30 días.
- **Banners:** no en el lanzamiento. Más adelante, prueba A/B sólo en pantallas de menú.

### 15.5 Compras (precios orientativos)

| Producto | Contenido | Precio | Cuándo aparece |
|---|---|---|---|
| No Ads | Sin intersticiales ni banners para siempre + 200 Gemas | 4,99 € | Tienda; aviso suave tras el 5.º intersticial |
| Starter Pack | 300 Gemas + skin de comandante + Turbo 2 h + 5 Muestras raras | 1,99 € | Una sola vez, al empezar la segunda sesión (con R1 completada), durante 72 h reales |
| Gemas | 6 packs | 0,99 – 99,99 € | Tienda; el primer pago de cada pack da ×2 |
| Pase de Comandante | Pista premium de la temporada | 7,99 € | Desde el rango 4 |
| Hucha de Gemas | Se llena con las noches ganadas (contenido siempre visible); se rompe pagando | 2,99 € | Visible desde R2 |
| Contrato de flota | Precio de exportación ×2 para siempre | 9,99 € | Tienda, desde R2 |
| Ofertas por momento | Kit de asalto (tras perder contra un jefe), Pack de región (al entrar en una nueva), Oferta de regreso (tras 3 días sin jugar) | 2,99 – 9,99 € | Máx. 1 emergente por sesión; nunca en la primera |
| Cosméticos | Skins de comandante, torretas, drones y base | 0,99 – 4,99 € o Gemas | Tienda |

### 15.6 En qué se gastan las Gemas
Salto temporal (2 h / 8 h de producción al instante) · terminar investigación ·
revivir sin vídeo · niveles del pase · cosméticos · cofres de **contenido fijo**.

### 15.7 Mapa de momentos de deseo

| El jugador... | Oferta natural |
|---|---|
| Vuelve tras horas fuera | Vídeo: offline ×2 |
| Está a punto de pagar una zona | Vídeo: pago al instante |
| Pierde contra el jefe | Segunda oportunidad / Kit de asalto |
| Termina una región | Starter Pack / Pack de región |
| Ve su 5.º intersticial | No Ads |
| Espera una investigación de 4 h | Vídeo −30 min / Gemas |
| Ve el Gilded Swarmer escapar | Nada: no todo se vende (deja con ganas de la próxima noche) |

### 15.8 Lo que NO hacemos
- Cuentas atrás falsas en ofertas (ver 16).
- Botones de cierre ocultos, diminutos o retrasados en ofertas y anuncios.
- Cajas aleatorias de pago (en el lanzamiento).
- Misiones que obliguen a ver anuncios.
- Pedir valoración tras una derrota: sólo tras ganar a un jefe, con la valoración
  integrada de Play.

### 15.9 Aplazado: suscripción VIP
- **Qué es:** el jugador paga una cuota fija (semanal o mensual) que Google Play le
  cobra automáticamente hasta que la cancela desde Play. Mientras está activa, recibe
  ventajas. Google gestiona cobros, renovaciones, cancelaciones y reembolsos; el juego
  sólo activa o retira las ventajas según el estado que le comunica Play.
- **Por qué se aplaza (decisión de Luis):** una suscripción sólo se vende a jugadores
  que vuelven cada día. Sin descargas ni retención demostradas, no tiene a quién
  venderse. Primero se mide.
- **Cuándo se reconsidera:** tras el soft launch, si se cumplen D7 ≥ 12 % y D30 ≥ 4 %
  (apartado 22) y hay jugadores que repiten compra.
- **Diseño reservado** (de v0.2, precios a decidir entonces): sin intersticiales,
  offline +4 h, ×3 al volver, suministros aéreos sin vídeo, Gemas diarias y 2.ª ranura
  de laboratorio.
- **Técnica:** el guardado reserva desde el inicio un campo de ventajas activas
  (`perks`) para poder añadirla sin tocar el formato.

---

## 16. Cumplimiento (UE, España, Google Play)

> Notas de diseño para construir cumpliendo desde el principio, no un dictamen:
> la revisión jurídica la hace Luis. Comprobar el estado de cada norma antes del lanzamiento.

- **Monedas virtuales: principios de la red CPC (Comisión + autoridades de consumo, 2025).**
  Siete principios: precio en dinero real visible, no ocultar el coste, no forzar a
  comprar más moneda de la necesaria, información precontractual clara, desistimiento
  en 14 días (la red CPC lo extiende a la moneda no usada), condiciones claras y no
  explotar vulnerabilidades, menores incluidos (con control parental). En el diseño:
  - Precio aproximado en euros junto al precio en Gemas en la tienda.
  - Una sola moneda premium; packs y precios alineados para no dejar sobrantes forzados.
  - Revisar la renuncia al desistimiento (art. 103.m TRLGDCU) frente a ese principio.
- **Cajas botín en España.** El anteproyecto de ley orgánica de protección de menores
  en entornos digitales (Consejo de Ministros, junio de 2024) incluía prohibir a los
  menores el acceso a mecanismos aleatorios de recompensa. En septiembre de 2025 el
  proyecto superó el debate de totalidad en el Congreso; verificar si se ha aprobado
  y si conserva esa prohibición. **Decisión de diseño:**
  lo aleatorio sólo gratis (tiempo, juego o vídeo); lo que se paga, contenido fijo y visible.
- **Digital Fairness Act (UE).** A principios de 2026 la Comisión preveía presentar la
  propuesta a finales de año. La consulta
  apuntó a transparencia de monedas virtuales, probabilidades de cajas, patrones
  oscuros y menores. Diseñar ya así evita rehacer.
- **Ofertas con cuenta atrás:** una urgencia falsa es práctica desleal en todo caso
  (Directiva 2005/29/CE, anexo I, punto 7). Los temporizadores del juego son reales.
- **Google Play:**
  - Si algún día hay objetos aleatorios de pago: probabilidades publicadas antes de la compra.
  - Público objetivo 16+ y arte no infantil: evita la política de Familias y sus
    restricciones de anuncios.
  - Consentimiento de anuncios con plataforma certificada por Google (UMP) en el EEE y Reino Unido.
  - Si en el futuro hay suscripción (15.9): condiciones claras y cancelación sencilla.
  - Formulario de seguridad de datos (AdMob, Firebase).
  - API objetivo: la que exija Play al publicar (desde finales de agosto de 2026,
    Android 16 / API 36) y biblioteca de facturación de Play 8 o superior.
    Confirmar ambas en Play Console.
- **Clasificación:** PEGI 7-12 según el tono final (cuestionario IARC en Play), con el
  aviso «compras dentro del juego».
- **Propiedad intelectual:** Warrior, Hopper, Tanker, Plasma Bug y Brain Bug son
  reconocibles de Starship Troopers; renombrados (9.5). Comprobar «Hive Breaker»
  en EUIPO, USPTO y Play antes de publicar la ficha.

---

## 17. Analítica y ajuste en vivo

- **Firebase:** Analytics (eventos), Remote Config (ajuste remoto) y Crashlytics (cierres).
- Eventos mínimos:

| Evento | Datos |
|---|---|
| `ftue_step` | paso, segundos desde instalación |
| `zone_unlocked` | región, zona, precio, minutos en la región |
| `night_end` | región, noche, resultado, amenaza, provocada sí/no |
| `boss_attempt` | región, resultado, % de vida restante |
| `rv_offer` / `rv_watched` | lugar, recompensa |
| `is_shown` | lugar, segundos desde el anterior |
| `iap_offer` / `iap_purchase` | producto, precio, momento |
| `offline_return` | horas fuera, recompensa |
| `research_start` | nodo, duración |
| `session_start` / `session_end` | duración, rango |

- Embudos: tutorial paso a paso, zonas de R1, noches, cada lugar de anuncio, compras.
- **Remote Config sobre `CONFIG`:** curva de precios (k), ritmo de Calor, topes de
  vídeo, enfriamiento de intersticiales, precios y contenido de ofertas, variantes de
  tutorial. Permite pruebas A/B sin publicar versión.
- Analítica y anuncios sólo con el consentimiento recogido en la ventana de privacidad (UMP).

---

## 18. UX móvil

```
+----------------------------------+
| $ 12.4K    Gemas 35   Muestras 8 |  ← monedas
| CALOR [##########----] [PROVOKE] |  ← barra-reloj + provocar
| [Missions]           [Shop]      |
| [Pass]               [Offer 23h] |  ← sólo si hay oferta
| [Map]                [! 2]       |  ← alertas: centran la cámara
|                                  |
|            ( juego )             |
|              8/10                |  ← pila del comandante
|                                  |
| [TURBO x2 · AD]       [ORB][REP] |  ← habilidades (sólo de noche)
+----------------------------------+
```

- Portrait. El juego ocupa toda la pantalla; el joystick aparece donde toques.
- **Bandejas**: al acercarse a la entrada o la salida de una máquina, cuánto lleva y cuánto
  cabe («12/30»); si se llena, «MAX» (decidido 28/10/2026).
- **Cuellos de botella a un toque:** icono ámbar sobre la máquina parada («NO INPUT»,
  «NO POWER», «OUTPUT FULL»). El botón de alertas del HUD centra la cámara en cada uno.
- Botón atrás de Android: estilo `HDBack()`, cierra ventanas de dentro afuera; de
  noche **pausa**, nunca cierra.
- Ajustes: Music · Sound · Vibration · Reduce effects · Language · Privacy ·
  Restore purchases · Support.
- Accesibilidad: forma + color para cada objeto; zonas táctiles ≥ 48 dp.

---

## 19. Arte

- **Dirección: «militar de juguete».** Vista cenital 3/4, colores saturados, siluetas
  gruesas y contorno oscuro. Lectura instantánea amigo/enemigo:
  - Humanos: verde oliva y turquesa con naranja de seguridad.
  - Bichos: violeta y rosa ácido con puntos débiles brillantes.
- Bichos amenazantes pero no repulsivos: baba de colores, nada de vísceras (público
  amplio y clasificación baja).
- UI: lenguaje `.chapa` de Hyper Drill (franjas, tornillos) en versión limpia y
  brillante. Tipografía Teko.
- Pipeline: Gemini + extracción. **Ojo:** bichos violeta y rosa → generar sobre
  **fondo verde puro**, no magenta (mismo caso que el neón de MFP).
- Sprites mínimos del MVP: comandante (4 direcciones, andar y disparar), 6 objetos de R1
  (más los de R2), billete, 10 edificios, 2 drones, 3 torretas, muro, 3 bichos + jefe, 2
  vetas (mineral y cobre), nave, zona de pago, cofre y el retrato del Sargento Brass (3
  caras, apartado 12). Lo que añada R2, con su bioma.

---

## 20. Arquitectura técnica

- **Repositorio:** `Hive` (GitHub).
- **Idiomas:** todos los textos en la tabla `STRINGS` con el sistema de CORE; inglés y
  español desde el MVP.
- **Un único HTML5 + Canvas** autocontenido, empaquetado con **Capacitor** (Android).
  Plugins propios de Billing y Play Games reutilizados de CORE / Hyper Drill; AdMob con
  consentimiento UMP; Haptics; Local Notifications; Preferences; Firebase
  (Analytics, Remote Config, Crashlytics).
- **Tablas:** `CONFIG`, `ITEMS`, `MACHINES`, `TURRETS`, `ENEMIES`, `TECH`, `REGIONS`
  (con su lista de zonas: id, tipo, precio, requisitos, posición, ruta), `AD_PLACEMENTS`,
  `OFFERS`, `FX`. Añadir un edificio = una fila y una función de dibujo; añadir una
  región = una tabla de zonas y un fondo.
- **Simulación:** economía a 10 Hz determinista; movimiento y combate a paso fijo de
  30 Hz, interpolado a 60 FPS en el dibujo.
- **Offline analítico:** producción = ritmo × tiempo, con topes; no se simulan ticks
  (no hay noches offline y el Calor está congelado). Si la hora del móvil retrocede,
  se ignora; el tope se aplica siempre.
- **Guardado:** JSON versionado con migración desde el inicio; clave `lmc_hb_save_v1`
  (**nunca se renombra**). En Preferences con copia en `localStorage`. Se guarda al
  pagar una zona, al acabar la noche y al pasar a segundo plano. Nube (Play Games) en F3.
  Compras permanentes y suscripciones se restauran desde Play.
- **Simulador en Node** (`tools/sim_balance.js`) desde el día 1: un bot con 3
  estrategias (PROFIT, DEFENSE, BALANCED) juega cada región y devuelve tiempo hasta
  cada zona, resultado de cada noche, curva de Calor, cuellos de botella, duración de
  la región y efecto de ver 0 / 3 / 8 vídeos al día.
- **Presupuesto de rendimiento:** 60 FPS en Galaxy A34 con 100 bichos, 30 edificios,
  20 drones, 400 partículas y 60 objetos voladores. Probar también en un móvil de gama
  baja (~100 €).
- **Números:** 1.2K · 3.4M · 5.6B · 7.8T, luego aa, ab…

---

## 21. FASE 2 — Prototipo jugable (MVP)

**Objetivo:** demostrar que el bucle «cargar → automatizar → defender» es divertido y
provoca **«una más»**. Contenido, el justo.

**Dentro** (ampliado el 16/10/2026: con sólo la R1 de tres objetos, la fábrica dejaba de
crecer a los 7 minutos):
- R1 completa: ~30 zonas, 2 flancos, 1 Expansión, Nido. Unos 25 minutos (6.4).
- **Mapa del planeta** y **R2 (The Mire)** completa, con su jefe.
- **Investigación**, primera versión: el **Laboratorio** de la región 1, pocos nodos de las 4
  ramas, con Muestras (10.3); esperas cortas (1-5 min) para poder probarlo.
- Comandante: joystick, pila, minado, auto-disparo, reaparición.
- Objetos: Ore, Plate, Ammo, Copper, Coil, Cell (R1) y Biomass, Fuel (R2). Monedas:
  Créditos y Muestras (Gemas sólo para probar el cofre).
- Máquinas: Fundición, Fáb. munición, Bobinadora, Taller de celdas, Exportación, Solar,
  Disipador, Arsenal, Radar + Torre de mando (R1); Refinería y Generador (R2).
- Zonas con materiales (6.2).
- Drones: minero, de carga y **artillero** (7).
- Mejoras: nivel 3 en todas las máquinas, con lo que da cada una a la vista (6.2).
- Defensa: Gatling, Cannon, Shock, muros (R1); Flak y Flamer (R2).
- Bichos: Swarmer, Leaper, Crusher + Brood Mother (R1); Spitter (R2).
- Calor-reloj con «provocar», energía con brownout, prioridad DEFENSE / BALANCED /
  PROFIT, iconos de cuello de botella.
- 1 habilidad (Orbital Strike).
- Jugosidad completa de 6 momentos: minar, cobrar, pagar/desbloquear, muerte de bicho,
  jefe y cofre.
- Tutorial guiado (12).
- Idiomas: inglés y español, con el sistema de idiomas de CORE.
- Guardado + offline analítico.
- 4 vídeos **simulados** (botón «AD» que da la recompensa sin SDK) para medir cuántos
  se usarían (registro local en un panel de depuración).
- Arte: formas sencillas + un primer pase de sprites de comandante, pila y billetes
  (la sensación depende de ellos).

**Fuera (después):** R3+, Chitin/Armor, investigación completa, Outposts, resto de
torretas y bichos, misiones, pase, tienda real, anuncios reales, Firebase, Reina.

**Criterios de éxito (medibles).** Sin prueba con 5 personas (decidido 16/10/2026): los
criterios de jugadores se miden en la **prueba cerrada de Play Console**, con la analítica
(17); los demás, con el simulador y en un móvil real.
1. El 80 % de los probadores paga su primera zona en < 45 s y contrata el primer dron
   antes de 3 min, sin ayuda.
2. El 60 % sigue jugando por su cuenta más de 15 min y termina R1.
3. Entienden un cuello de botella («MAX» o «NO INPUT») en < 2 min desde que aparece.
4. Dos estrategias distintas llegan al jefe; en el simulador ninguna de las tres
   gana más del 60 % de las partidas.
5. 60 FPS en Galaxy A34 con el presupuesto del apartado 20.
6. R1 dura unos 25 min en el simulador y en la prueba cerrada.

**Hitos:**
1. Simulador económico + tablas en Node (zonas de R1 y curva de ritmo).
2. Comandante + joystick + pila + minado + Fundición + Exportación + zonas de pago
   (sin noche). Primera prueba: *¿apetece mover y apilar?*
3. Jugosidad de recoger, cobrar y desbloquear, **antes** de añadir sistemas.
4. Drones + torretas + munición + bichos + campo de flujo + noche.
5. Calor-reloj + energía + brownout + jefe.
6. Tutorial + guardado/offline + vídeos simulados.
7. R1 con dos metales: Copper, Bobinadora, Taller de celdas, Shock, Arsenal, Radar y
   zonas con materiales; R1 de unos 25 min en el simulador.
8. Mejoras (decidido 28/10/2026: antes que la región 2): nivel 3 en todas las máquinas con
   lo que da cada una a la vista, vida del comandante visible y curación de día, dron
   artillero y **Laboratorio** con la investigación, primera versión (Muestras).
9. Mapa del planeta + R2 (The Mire): Biomass → Refinería → Fuel → Generador, Spitter,
   Flak y Flamer.
10. Balance con simulador, vídeos de 15-30 s y prueba cerrada en Play Console (antes:
    comprobar la marca y fijar el identificador de la app, 16) → decisión go/no-go.

**Test de mercado (decidido: sí; es lo último del proyecto, 17/10/2026):** al subir el juego
a producción en Google Play, 2-3 vídeos de 15-30 s en una campaña pequeña (Meta o TikTok,
~150-300 €) hacia la ficha de Play. Se mide cuánta gente toca el anuncio e instala,
comparado con vídeos del género.

---

## 22. Hoja de ruta posterior

| Fase | Contenido | Salida |
|---|---|---|
| F3 Producción | R3, Chitin/Armor, Tunneler, Mortar, investigación completa (~30 nodos), rango, bestiario, Outposts, misiones, cofre gratis, calendario, notificaciones, AdMob + UMP, facturación, tienda (No Ads, Starter, Gemas, ofertas), Firebase, nube, pase v1 | Build de soft launch |
| F4 Soft launch | 2 países de prueba durante 4-6 semanas; ajuste remoto de tutorial y economía | Go/no-go con los KPIs de abajo |
| F5 Global + LiveOps | R4-R12, Reina, prestigio, eventos, temporadas, más idiomas; VIP si los KPIs lo justifican (15.9) | Lanzamiento mundial |

**KPIs objetivo del soft launch** (objetivos propios, ambiciosos; no son garantía):

| Métrica | Objetivo | Referencia de mercado |
|---|---|---|
| Retención D1 | ≥ 35 % | Mediana de todos los juegos ≈ 22 % (GameAnalytics 2025); casual Android con tráfico pagado 28-32 % (AppsFlyer 2022-23) |
| Retención D7 | ≥ 12 % | Mediana 3,4-3,9 %; casual Android 9-12 % |
| Retención D30 | ≥ 4 % | Mediana 0,7-0,8 %; casual Android 3,5-5 % |
| Tiempo de juego el día 0 | ≥ 25 min | — |
| Sesiones al día | ≥ 4 | — |
| Vídeos por usuario activo al día | ≥ 4 | — |
| Conversión a pagador | ≥ 1,5 % | — |
| Ingreso diario por usuario activo | ≥ 0,15 $ | Hybrid-casual 0,15-0,50 $ |

Por debajo de D1 30 % o D7 8 %, se revisa el tutorial y el primer día **antes** de
invertir en captación.

---

## 23. Riesgos conocidos

1. **Complejidad que aleja al móvil.** Mitigación: R1 empieza con 3 objetos y suma los
   otros 3 de uno en uno (12); cada sistema entra guionizado y lo presenta el Sargento
   Brass; máximo 4 cosas parpadeando.
2. **Dos juegos pegados** (tycoon + defensa). Los puentes son Calor, munición y botín:
   si alguno falta, la tesis se rompe.
3. **Idle puro.** Si el jugador sólo espera, no es arcade. Medir el % de noches ganadas
   con el comandante muerto: si es casi igual, la capa activa no importa.
4. **Economía a ojo.** Medir con simulador antes de poner precios (lección de Hyper
   Drill: un sesgo del robot no se corrige a mano).
5. **Género saturado.** El diferenciador (noche + vender o defender) tiene que verse en
   5 minutos y en los vídeos. Validarlo con el test de mercado.
6. **Monetización que quema la retención.** Intersticiales tardíos y ajustables en
   remoto; comparar D1/D7 con y sin ellos (A/B).
7. **Regulación cambiante.** Cumplir desde el diseño (16).
8. **Coste de contenido.** Las regiones a mano son caras: editor de zonas basado en
   tablas, piezas de mapa reutilizables por bioma.
9. **Rendimiento con mucho efecto.** Presupuesto (20), modo ahorro, pruebas tempranas
   en gama media y baja.

---

## 24. Decisiones

### 24.1 Tomadas

| # | Tema | Decisión | Dónde |
|---|---|---|---|
| — | Género | Arcade Idle con comandante, joystick, pila y zonas de pago (13/10/2026) | 3-7 |
| — | De v0.1 | Noche **activa ligera** (auto-disparo + posición + habilidades); **mapa diseñado** en lugar de cuadrícula libre | 3.2, 6 |
| 1 | Nombre | **Hive Breaker**; en tienda «Hive Breaker: Idle Base Defense». Pendiente: comprobar la marca | 16 |
| 2 | Estética | **Militar de juguete**: brillante, saturada, bichos de colores sin vísceras | 19 |
| 3 | Cofres de pago aleatorios | **No** en el lanzamiento: lo aleatorio sólo gratis; lo de pago, contenido fijo | 15.2, 16 |
| 4 | Logros y Gemas | Los logros **no dan Gemas** (regla de Hyper Drill) | 5.2 |
| 5 | Tope offline | **2 h** base → 6 h con investigación | 14.4 |
| 6 | Suscripción VIP | **Aplazada** hasta después del soft launch, si la retención lo justifica | 15.9 |
| 7 | Test de mercado | **Sí**, al subir a producción: lo último del proyecto (17/10/2026) | 21 |
| 8 | Idiomas | Sistema de idiomas de CORE desde el inicio; **inglés + español** en el MVP; portugués (Brasil), alemán, francés, japonés y coreano para el lanzamiento | 20, 21 |
| 9 | Repositorio | `Hive` (GitHub) | 20 |
| 10 | Comandante | **Fijo con skins** | 4 |
| 11 | Tope offline (2) | También lo limita la **caja fuerte** de la Exportación (15/10/2026) | 5.5, 14.4 |
| 12 | Guía con personaje | **Sargento Brass** en el tutorial y los momentos fuertes (15/10/2026; el nombre, el 16/10/2026) | 12, 19 |
| 13 | Arranque | Las **5 primeras zonas, más baratas** (15/10/2026) | 6.3, 21 |
| 14 | Suministro aéreo | **Prudente**: cada 4-5 min, solo de día, desde la primera noche ganada, 60 s en el suelo (15/10/2026) | 15.3 |
| 15 | Más materiales | **Un material nuevo por región** que se combina con los anteriores (por ahora; las recetas, región a región). R1 con Copper → Coil → Cell y la torreta Shock (16/10/2026) | 5, 9.1 |
| 16 | Construir | Las zonas grandes piden **Créditos y materiales**; Arsenal y Radar, edificios de R1 (16/10/2026) | 6.2, 9.1 |
| 17 | Duración de R1 | **~25 min**, por ahora (16/10/2026) | 6.4 |
| 18 | Pruebas | **Sin prueba con 5 personas**: se prueba en la prueba cerrada de Play Console. El prototipo suma R2 e investigación (16/10/2026) | 21 |
| 19 | Balance | Los ajustes (curva de precios y duración de R1) se **posponen** para equilibrar varias facetas a la vez (27/10/2026) | 6.3, 6.4 |
| 20 | Mejoras de máquinas | **Nivel 3 en todas**, y el cartel dice lo que da; las bandejas enseñan «12/30» (28/10/2026) | 6.2, 18 |
| 21 | Laboratorio | **Edificio** que se construye y se abre al pisarlo; se paga con **Muestras** (28/10/2026) | 10.3 |
| 22 | Dron artillero | En **R1**, comprado **en cada torreta**; de noche se refugia (28/10/2026) | 7 |
| 23 | Vida del comandante | Barra **visible de noche**; **se cura de día** (28/10/2026) | 4.3 |
| 24 | Orden del prototipo | Mejoras y Laboratorio **antes** que la región 2 (28/10/2026) | 21 |

### 24.2 Abiertas
Ninguna por ahora. Las próximas saldrán del simulador (hito 1) y de la primera prueba
en el móvil (hito 2).

---

## 25. Glosario

| Término | Significado |
|---|---|
| Arcade Idle | Juego en el que mueves un personaje que carga y entrega recursos, desbloquea zonas pagando y contrata ayudantes que automatizan |
| FTUE | Primera experiencia del jugador (los primeros minutos) |
| RV | Vídeo recompensado: anuncio opcional a cambio de un premio |
| IS | Intersticial: anuncio a pantalla completa entre pantallas |
| IAP | Compra dentro de la app |
| D1 / D7 / D30 | % de jugadores que vuelven el día 1, 7 o 30 tras instalar |
| ARPDAU | Ingreso medio diario por usuario activo |
| LiveOps | Contenido y eventos que se lanzan con el juego ya publicado |
| Remote Config | Ajustar valores del juego desde un servidor de Google sin publicar versión |
| A/B | Probar dos versiones con dos grupos de jugadores y comparar |
| Soft launch | Lanzamiento limitado a pocos países para medir y ajustar |
| Brownout | Caída de rendimiento general por falta de energía |
| Hitstop | Pausa de milisegundos en un golpe para que se sienta |
| Pool | Reserva de objetos reutilizables para no crear y destruir en cada frame |
| UMP / CMP | Ventana de consentimiento de privacidad para anuncios, exigida en la UE |
| Prueba cerrada | Prueba de Google Play con un grupo de probadores invitados, antes de publicar el juego para todos |

---

## Fuentes (apartados 16 y 22)

- Principios CPC sobre monedas virtuales: [Bird & Bird](https://cm.twobirds.com/en/insights/2025/european-move-towards-protecting-users-from-harmful-practices-in-video-games-eu-consumer-protection) · [Linklaters](https://techinsights.linklaters.com/post/102k6t4/game-changer-eu-introduces-consumer-protection-guidance-for-in-game-virtual-curr)
- Cajas botín y menores (España): [Ministerio de Consumo, 04/06/2024](https://www.dsca.gob.es/es/comunicacion/notas-prensa/ministerio-consumo-prohibe-acceso-menores-cajas-botin-videojuegos-evitar) · [Ministerio de Justicia, tramitación 10/09/2025](https://www.mjusticia.gob.es/es/institucional/gabinete-comunicacion/noticias-ministerio/100925-tramitacion-lo-proteccion-menores-entornos)
- Digital Fairness Act: [Lewis Silkin, 14/01/2026](https://www.lewissilkin.com/insights/2026/01/14/european-commission-issues-responses-to-digital-fairness-consultation-102m1s7)
- Google Play 2026: [AppsOps](https://appsops.store/news/google-play-h2-2026-compliance-api-large-screen) · [Foresight Mobile (Billing Library 8)](https://foresightmobile.com/blog/google-play-billing-library-8-migration)
- KPIs de referencia: [Game Growth Advisor, 2026](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/) · [GameAnalytics 2025](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
