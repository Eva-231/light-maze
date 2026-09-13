# LIGHT MAZE — Unity Vertical Slice

## Goal
Build a high-quality third-person 3D action-RPG vertical slice before migrating the full game. The current Three.js game remains the gameplay/specification reference and must not be deleted.

## Engine target
- Unity 6 LTS-compatible project
- Universal Render Pipeline (URP)
- PC high-quality preset + Web/mobile performance preset
- Web build must be part of the acceptance test so the owner can test from iPad/Safari when supported by the chosen Unity version/browser path.
- Keep architecture portable to Windows/Steam and native iOS.

## Art direction
Commercial JRPG-quality presentation rather than primitive low-poly geometry. Original LIGHT MAZE identity: dark fantasy + restrained sci-fi, black/silver armor, blue-white LIGHT energy; Abyss enemies black/red-violet; guardians black/gold. Do not copy copyrighted FF/DQ characters or assets; target their level of polish, readability, animation/VFX density and material quality with original designs.

### Hero
Third-person playable explorer. Elegant athletic silhouette, black/silver layered armor, pale cloth accents, blue-white LIGHT core, premium PBR materials. Equipment grades should eventually change visible LIGHT lines/aura; MYTHIC should be unmistakable.

### Vertical-slice enemies
1. Shadow Soldier — slender black knight, red luminous eyes/core.
2. Rift Wolf — unmistakably quadrupedal wolf silhouette, low stance, long limbs, luminous claws/fangs, readable crouch before charge.
3. Abyss Guardian — large black/gold knight, boss-scale silhouette, exposed luminous attack core and highly readable telegraphs.

## One-room slice
Create one polished dungeon chamber, not the full 99 floors. It must demonstrate the visual target and combat feel. Moody volumetric-looking fog where practical in URP, baked/mixed lighting where appropriate, reflections/PBR response, decals and restrained environmental particles. Maintain clear enemy/telegraph visibility.

## Combat
- Third-person movement + orbit camera.
- HP/MP/LIGHT HUD.
- Light Bolt: charge flash, luminous projectile, trail, impact cross-flash, sparks, brief local illumination, hit reaction.
- Ice Nova: room-wide ability. Casting sigil -> energy gather -> floor cracks -> 3D ice spikes -> blue-white expanding shockwave -> enemies freeze -> shards dissipate. Strong audiovisual hierarchy. MP cost 16; no cooldown; MP is the limiting resource.
- Heal: MP cost 20; no cooldown.
- Base MP regeneration target equivalent to current revised prototype: fast enough to use support magic frequently, approximately 1.2 MP/sec before bonuses.
- Player baseline HP regeneration: after 5 seconds without taking damage, recover 0.5% max HP/sec.
- Hit stop, camera impulse/shake, directional hit feedback and enemy hit reactions.

## Enemy readability
- Wolf crouches and claws brighten before charge.
- Guardian gold attack energy gathers before major attacks; dangerous floor regions must be obvious and dodgeable.
- Telegraphs must be gameplay information, not just decoration.

## VFX quality target
Use Unity Particle System/VFX solution appropriate to URP and Web/mobile constraints, Shader Graph where valuable, Bloom/post-processing, trails, decals/projected sigils, emissive materials, impact particles, shockwaves and selective dynamic lights. Build scalable quality tiers rather than simply disabling the art on mobile.

## Performance
Vertical slice should establish budgets. Reuse materials/meshes, pool projectiles/VFX, avoid allocations in Update, use LOD/culling where relevant, minimize transparent overdraw on mobile/Web. PC quality can be richer; mobile/Web reduces particle count, shadow distance, render scale and expensive lights while retaining the same art direction.

## Existing gameplay reference
Repository root/public contains the live Three.js prototype. Preserve it. Important existing systems for later migration include 18 main stages, Abyss 99F, enemy levels, bosses, bonus floors, equipment grades, enchant/fusion, appraisal/gacha/camp, traps, codex, events, route choices, curses/boons, save/progression and audio. Do NOT migrate all of these in phase 1.

## Phase 1 acceptance criteria
- Unity project opens without compile errors.
- One playable third-person room.
- Hero, Shadow Soldier, Rift Wolf, Abyss Guardian represented with proper production-ready asset slots/prefabs. Temporary assets are allowed only when clearly isolated/replacable; primitive geometry is not acceptable as the final visual target.
- Light Bolt, room-wide Ice Nova and Heal functional.
- Enemy attacks/telegraphs functional.
- Strong PBR lighting, Bloom and cinematic combat VFX.
- PC build path documented/working.
- Web/mobile quality profile and Web build path documented/working where platform support permits.
- No destructive changes to the existing browser game.
- README explains exactly how to open/run/build.

## Work/Astra execution rule
Do not spend the run re-designing the game. Treat this document and the existing repository as authoritative. Focus the Work run on Unity Editor/project operations that cannot efficiently be done in normal Chat: create/configure project, URP, scenes, prefabs, materials, imported/approved assets, animation controllers, VFX, build settings, run/build/test and commit results. If a paid/free third-party asset requires owner approval or license acceptance, stop only for that specific decision rather than redesigning the project.

## Later phases (only after owner approves the slice)
Migrate core run loop -> progression/camp/equipment -> 18 stages -> Abyss 99F -> content/balance -> Steam/iOS packaging. Keep gameplay data in ScriptableObjects/data-driven structures so expansion does not require scene duplication.
