# AGENTS.md

## Qué es

Clon de Asteroids en HTML5 Canvas, JS vanilla (ES6+, clases), **sin dependencias, sin bundler, sin build**. Todo el juego vive en `game.js` (~420 líneas) cargado por `index.html`. README e interfaz en español; comentarios del código en español.

## Cómo correr / verificar

No hay tests, lint, typecheck ni CI. La única verificación es abrir el juego:

- Doble clic en `index.html`, o `npx serve .` → `http://localhost:3000`
- Tras tocar `game.js`, al menos comprobar que no hay errores de sintaxis (`node --check game.js`) y, si el cambio es de gameplay, probarlo en el navegador.

## Arquitectura (game.js)

- Un solo archivo con estado global (`ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`, `deadTimer`). No hay módulos ni exports.
- Loop: `loop(ts)` con `requestAnimationFrame` → `update(dt)` (dt en segundos) → `draw()`. `dt` se acota para evitar túneles tras pestañas en background.
- Máquina de estados: `'playing'`, `'dead'` (respawn con `deadTimer`), `'gameover'`. No hay pantalla de título ni pausa.
- Colisiones y wrapping toroidal (bordes opuestos) implementados a mano en `update()`.
- Clases `Asteroid` y `Ship`. El tamaño de asteroide es 3/2/1 (grande→mediano→pequeño); al morir `split()` crea dos del tamaño-1. Los arrays `SPEEDS` y `POINTS` se indexan por ese tamaño (`POINTS[3]` = 20, etc.).
- Canvas fijo 800×600 (constantes `W`/`H` al inicio de `game.js`); no hay resize.

## Gotchas

- El README menciona power-ups y "estrella fugaz" que **no existen** en el código actual: confía en `game.js`, no en la sección "Características" del README.
- Nada de `package.json`: no inventes scripts npm ni añadas tooling salvo que se pida.
- Al añadir teclas, mirar el patrón `keys[e.code]` + `pressed(code)` (por `event.code`, no `keyCode`).
