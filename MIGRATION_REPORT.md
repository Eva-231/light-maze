# LIGHT MAZE migration report

## Outcome

LIGHT MAZE is now a self-contained Web game. The original ChatGPT Site remains intact. The same client can run on ChatGPT Sites, a normal Node server, Docker, or a static host (browser-local saves only on a static host).

## Migrated without replacement

- All HTML, CSS and JavaScript sources.
- Procedural Three.js dungeon, humanoid avatar, enemies, effects, shaders and vendored Three.js runtime/license.
- All 12 original scene/stage music tracks and synthesized sound effects.
- Random maze/stage generation, enemies, weapons, magic, traps, treasure, gacha and equipment parameters.
- Anonymous save/recovery-key schema, ranking rules, tests, build script and Sites Worker.
- Cloudflare D1 schema and Sites R2/D1 binding declaration.

See `ASSET_MANIFEST.md` for the code-to-asset map.

## Rebuilt for independence

`standalone/server.mjs` replaces the Sites-only hosting layer when running elsewhere. It serves the client and provides anonymous saves, recovery archives and rankings using ordinary JSON files under `data/`. `Dockerfile` provides a portable deployment. No email address, login or secret is required.

## Not transferable

Existing live R2 save objects and D1 leaderboard rows are managed service data and cannot be bulk-exported through the project source repository. They remain untouched in the live Site. New independent deployments begin with an empty server-side database. Version 9 adds **進行データを書き出す / バックアップを復元** on the home screen, so each player can download portable JSON from the live Site and import it into another deployment. The recovery key continues to move saves between browsers connected to the same backend. The game itself and all bundled media are included.

## Post-migration gameplay update (v9)

- Directional player-hit overlay, damage/cause labels, HUD/camera impact and graded hit-stop.
- Boss rift telegraph is drawn at the real impact point with its radius and countdown; pursuit remains active beyond the old room leash.
- Mandatory tutorials pause the simulation and only close with the explicit OK button.
- Frost Ring became the aimed, two-target piercing Frost Lance; it stops charges and deals bonus damage/freeze to wolves and Silver Wisps.
- Equipped staves now grant enemy-type affinities.
- Traps are smaller and offset from corridor centers; spike, slow, 2–3 enemy ambush and LIGHT/MP eclipse variants unlock progressively.
- Existing multi-scene 12-track BGM, double-tap/pinch prevention, simultaneous two-thumb input, anonymous save, 300-slot inventory, favorites and rankings are retained.

## Run locally

Requirements: Node.js 20 or later.

```bash
npm start
```

Open `http://localhost:4173`. Data is written to `./data` and is excluded from Git.

## Verify and build

```bash
npm run verify
npm run build
```

The production client and Sites Worker are written to `dist/`. The verification command runs gameplay/unit tests, builds the project, starts the independent server, checks the home page and BGM, then performs an anonymous save round-trip and leaderboard request.

## Publish without Sites

- Node/VPS/Render/Railway/Fly.io: run `npm start`, expose `PORT`, and mount persistent storage at `LIGHT_MAZE_DATA_DIR`.
- Docker: `docker build -t light-maze .` then `docker run -p 4173:4173 -v light-maze-data:/data light-maze`.
- Static hosting/GitHub Pages: publish `public/`. Gameplay works, but global ranking/cloud sync require the Node API; browser-local progress remains the fallback.

Environment names (no secret values):

- `PORT`: independent HTTP listen port (default `4173`).
- `LIGHT_MAZE_DATA_DIR`: persistent save/ranking directory (default `./data`).
- Sites bindings `DB` and `BUCKET`: D1 rankings and R2 saves respectively; these are resource binding names, not secret values.

## Main files for future edits

- `public/game.js`: game loop, UI coordination and encounters.
- `public/world.js`: 3D renderer, enemies, telegraphs and effects.
- `public/enemies.js`: enemy AI and combat.
- `public/expedition.js`: traps, resources and dungeon events.
- `public/journey.js`: stage difficulty and tutorial progression.
- `public/relics.js`: equipment, affixes, gacha and loadout stats.
- `public/audio.js`: BGM routing, synthesized SE and volume.
- `public/style.css` / `public/index.html`: presentation and mobile UI.
- `public/save.js` / `public/rankings.js`: anonymous client persistence and rankings.
- `standalone/server.mjs`: independent hosting/save/ranking adapter.
- `src/worker.js`: ChatGPT Sites/Cloudflare adapter.

## Safety

The existing Site project and public deployment are not deleted, reset or replaced during migration. The independent source is additive and the original live URL remains available.
