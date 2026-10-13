#!/bin/bash
# Se ejecuta solo, al arrancar cada sesion de Claude Code (movil u ordenador).
# Trae lo ultimo de GitHub para que ninguna sesion empiece a trabajar sobre una
# copia vieja: eso es lo que rompio CORE.
#
# Regla de oro: NUNCA pisa trabajo del autor.
#   - Si hay cambios sin comprometer, no toca nada y avisa.
#   - Solo hace avance directo (--ff-only): no puede inventar mezclas ni dejar
#     marcas de conflicto dentro de los archivos.
#   - Pase lo que pase, termina bien y deja empezar la sesion.
#
# Sin acentos a proposito: esta salida se lee en terminales de todo tipo.

set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

rama="$(git branch --show-current 2>/dev/null)"
if [ -z "$rama" ]; then
  echo "[git] No hay una rama activa. No se trae nada."
  exit 0
fi

# Repositorio recien creado, sin ningun commit todavia: no hay nada que traer, y
# preguntarle a git por HEAD solo daria un error feo.
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "[git] Repositorio nuevo, sin commits todavia: no hay nada que traer."
  exit 0
fi

# Solo cuentan los archivos ya seguidos por git y modificados. Un archivo nuevo
# del todo no estorba: si al traer chocara con uno igual, git para el solo.
if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  echo "[git] Hay cambios sin comprometer en '$rama': NO se ha traido nada."
  echo "[git] Es a proposito: traer ahora podria pisarlos."
  echo "[git] Guardalos (git add -A && git commit) o descartalos, y luego: git pull --ff-only"
  exit 0
fi

# GitHub falla a veces por red. Tres intentos, esperando un poco mas cada vez.
conectado=0
for intento in 1 2 3; do
  if git fetch --prune origin >/dev/null 2>&1; then
    conectado=1
    break
  fi
  sleep $((intento * 2))
done

if [ "$conectado" != 1 ]; then
  echo "[git] No se ha podido conectar con GitHub. Sigo con la copia que hay en disco."
  echo "[git] Antes de subir nada, conviene reintentar: git pull --ff-only"
  exit 0
fi

# Si GitHub todavia no tiene esta rama, no hay nada que traer: lo que toca es subirla
# al terminar. Sin esta comprobacion, el pull falla y da una falsa alarma de conflicto.
if [ -z "$(git ls-remote --heads origin "$rama" 2>/dev/null)" ]; then
  echo "[git] GitHub todavia no tiene la rama '$rama'. Nada que traer."
  echo "[git] Al terminar la sesion: git push -u origin $rama"
  exit 0
fi

antes="$(git rev-parse HEAD)"

if salida="$(git pull --ff-only origin "$rama" 2>&1)"; then
  despues="$(git rev-parse HEAD)"
  if [ "$antes" = "$despues" ]; then
    echo "[git] '$rama' ya estaba al dia."
  else
    echo "[git] Traido lo ultimo de GitHub en '$rama':"
    git --no-pager log --oneline "$antes..$despues" | sed 's/^/[git]   /'
  fi
else
  echo "[git] NO se ha podido traer sin riesgo: el avance directo no es posible."
  echo "[git] Suele significar que hay trabajo distinto aqui y en GitHub a la vez."
  echo "[git] Hay que decidir a mano cual se queda. No lo resuelvas a medias."
  echo "$salida" | sed 's/^/[git]   /'
fi

exit 0
