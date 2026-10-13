# Hive — Funcional (documento vivo)

> **Fuente única de verdad del diseño.** Si el código y este documento se contradicen, manda
> el documento: es el código el que está desalineado, y hay que decirlo, no adaptar el
> documento al código.
>
> Los nombres de los elementos van en **inglés** (texto que ve el jugador); las explicaciones,
> en **español**.

**Estado: vacío.** Esto es el esqueleto que hay que llenar con el autor. Cada apartado dice qué
tiene que acabar poniendo. Mientras un apartado siga diciendo *(pendiente)*, **no se da por
decidido** y no se programa encima.

---

## 1. Qué es el juego *(pendiente)*

Una frase que lo diga entero: género, qué hace el jugador y en qué se diferencia. Y, debajo,
el **bucle principal**: la cadena de acciones que el jugador repite una y otra vez, y por qué
engancha.

## 2. Plataforma y alcance *(pendiente)*

- Android (Google Play), que es lo que el autor publica.
- ¿Vertical u horizontal? ¿Se juega con una mano?
- ¿Hace falta internet? ¿Hay cuentas de usuario? (En sus otros juegos, todo el progreso vive
  en el propio móvil.)

## 3. Nombre e identificador *(pendiente)*

El nombre decide el identificador de la app en Play (`com.lmcadvisors.algo`), que **no se puede
cambiar nunca una vez publicado**. Hasta que no esté decidido, no se crea el proyecto de
Android.

## 4. Pantallas *(pendiente)*

Qué ve el jugador, en orden: arranque, pantalla principal, menús. Para cada una, qué se puede
hacer y qué información se enseña.

## 5. Economía y progresión *(pendiente)*

Qué recursos hay, de dónde salen y en qué se gastan. Cómo sube el jugador y qué le frena.
Conviene que todo salga de **pocas fórmulas con pocas constantes**: así reequilibrar el juego
entero es cambiar un puñado de números, no reescribir tablas a mano.

## 6. Monetización *(pendiente)*

Cómo gana dinero el juego: anuncios, compras, o las dos. Qué se vende exactamente y qué límite
tiene el jugador que paga por encima del que no paga.

## 7. Arte *(pendiente)*

Paleta, estilo y **cómo se produce cada cosa**: lo que se dibuja con código y lo que se genera
con IA. Si se genera con IA, aquí van las reglas de los prompts (fondo magenta `#FF00FF` para
recortar, "SIN NINGUNA PALABRA", adjuntar siempre la paleta y una referencia aprobada, y
nombres de archivo sin puntos internos).

## 8. Sonido *(pendiente)*

Si lo hay: música y efectos. En Hyper Drill salió mucho más barato **sintetizarlo** con Web
Audio (~9 KB) que empaquetar audio (~1,9 MB).

## 9. Decisiones cerradas

| Fecha | Decisión | Por qué |
|---|---|---|
| — | — | — |

Cada vez que el autor cierre algo, se apunta aquí con la fecha. Lo que no esté en esta tabla no
está decidido.

## 10. Decisiones pendientes

1. Todo lo de arriba.
