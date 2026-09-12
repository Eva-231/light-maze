# LIGHT MAZE asset manifest

The independent project contains every asset referenced by the current game. No asset is fetched from ChatGPT Sites at runtime.

| Asset group | Files | Referenced by |
| --- | --- | --- |
| 3D runtime | `public/vendor/three.module.js` and `THREE-LICENSE.txt` | `world.js`, `avatar.js` |
| 3D characters, enemies, dungeon, shaders | Procedurally generated meshes/materials and embedded GLSL in `world.js`, `avatar.js` | `game.js` |
| UI, icons, particles | `index.html`, `style.css`, `icon.svg` | Browser entry point |
| Music | `public/audio/home.mp3`, `stage-1.mp3` … `stage-8.mp3`, `boss.mp3`, `escape.mp3`, `forge.mp3`, `dungeon.mp3` | `audio.js` |
| Sound effects | Synthesized Web Audio voices | `audio.js` |
| Maze/stages | Deterministic procedural data | `generation.js`, `journey.js`, `expedition.js` |
| Enemies/combat | Runtime parameters and AI | `enemies.js`, `game.js` |
| Items/equipment/gacha | Runtime parameters and saved item schema | `relics.js`, `camp.js`, `save.js` |
| Cloud save/rankings (Sites) | R2/D1 adapter | `src/worker.js`, `drizzle/0000_public_rankings.sql` |
| Independent save/rankings | Filesystem adapter | `standalone/server.mjs` |

Fonts use the device system font stack; there is no missing external font file. Character and enemy visuals are procedural 3D, so there are no external model or texture downloads to recover.
