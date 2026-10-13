#!/bin/bash
# Se ejecuta al terminar cada respuesta de Claude. Solo abre la boca si hay trabajo
# comprometido que todavia NO esta en GitHub.
#
# Esta aqui porque la regla del proyecto es "terminar siempre subiendo", y lo que rompio
# los otros juegos del autor fue justamente una sesion que acabo sin subir: la siguiente
# empezo sobre una copia vieja.
#
# No sube nada por su cuenta a proposito: subir es una accion con consecuencias y la decide
# Claude al cerrar el encargo. Esto es solo un recordatorio.
#
# Sin acentos a proposito: esta salida se lee en terminales de todo tipo.

set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

rama="$(git branch --show-current 2>/dev/null)"
[ -z "$rama" ] && exit 0

# Si la rama no tiene todavia su pareja en GitHub, lo normal es que sea la primera subida.
if ! git rev-parse --abbrev-ref "$rama@{upstream}" >/dev/null 2>&1; then
  if [ -n "$(git log --oneline -1 2>/dev/null)" ]; then
    echo "[git] '$rama' todavia no esta en GitHub: git push -u origin $rama"
  fi
  exit 0
fi

sin_subir="$(git log --oneline "@{upstream}..HEAD" 2>/dev/null | wc -l | tr -d ' ')"
sin_comprometer="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

if [ "$sin_subir" != "0" ]; then
  echo "[git] Hay $sin_subir cambio(s) comprometido(s) sin subir. Antes de cerrar: git push"
elif [ "$sin_comprometer" != "0" ]; then
  echo "[git] Hay trabajo sin comprometer. Si ya esta terminado: git add -A && git commit && git push"
fi

exit 0
