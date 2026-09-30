---
description: Crea un git worktree en .worktrees/<nombre>
agent: build
---

!`name=$(printf '%s' "$ARGUMENTS" | tr -s '[:space:]' '-'); if [ -z "$name" ]; then echo "ERROR: indica un nombre para el worktree"; else git worktree add ".worktrees/$name"; fi`

El worktree ya se creó con el bloque anterior. No ejecutes ninguna otra acción, no cambies de directorio y no modifiques archivos.
