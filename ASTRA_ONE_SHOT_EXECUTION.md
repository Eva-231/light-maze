# LIGHT MAZE — ASTRA ONE-SHOT EXECUTION

This is the single high-value Astra/Work pass. Do not spend this run on redesign, prose, speculative refactors, or repeating work already implemented in code.

## Starting state
- Repository: `Eva-231/light-maze`
- Branch: `unity-vertical-slice`
- Canonical Unity project: `C:\UnityProjects\light-maze\UnityProject`
- Unity: 6000.5.11f1 / URP 17.5
- VFX Graph dependency is already declared.
- Gameplay, production model injection, animation hooks, VFX fallback hooks, camera feel, and PC/iPad runtime quality selection are already implemented by Sol.

## Non-negotiable visual target
A premium dark-fantasy action RPG vertical slice:
- white-haired male explorer
- black/silver layered armor with pale cloth
- blue-white LIGHT core on chest
- elegant luminous sword
- dark blue-black abyss architecture
- enemies instantly identifiable by silhouette
- Shadow Soldier = black/red
- Rift Wolf = quadruped black/red beast
- Abyss Guardian = huge black/gold knight
- Ice Nova is the showcase skill: expanding sigils + floor light + large radial ice eruption + shards + mist + lingering glitter
- lighting stays dark enough that blue/red/purple/gold effects read clearly
- no visible debug primitives in the accepted result

Do not copy protected Final Fantasy / Dragon Quest characters or assets. The target is comparable polish and readability, not replication.

## Before editing
1. Pull the latest `unity-vertical-slice`.
2. Open `C:\UnityProjects\light-maze\UnityProject`.
3. Wait for package resolution and compilation to finish.
4. Run menu `LIGHT MAZE > Production > 1. Prepare Astra Drop Zone`.
5. Confirm Visual Effect Graph is installed. Only use menu item 2 if package resolution did not already install it.

## Exact production prefab destinations
Place final runtime prefabs at these exact paths so the Sol runtime injector automatically swaps them in:

`Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Player_Explorer.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Enemy_ShadowSoldier.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Enemy_RiftWolf.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Enemy_AbyssGuardian.prefab`

Each model prefab must contain or allow runtime creation of:
- Root
- Model
- WeaponSocket_R
- WeaponSocket_L
- ChestLightSocket
- CastSocket
- HitVfxSocket

Do not put gameplay CharacterController / enemy gameplay collider logic inside these visual prefabs. Gameplay stays on the existing runtime roots.

## Exact signature VFX prefab destinations
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_LightBolt_Projectile.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_LightBolt_Cast.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_LightBolt_Impact.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_IceNova.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_Heal.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_Hit_Red.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_Hit_Gold.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_Death_Shadow.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_Death_Wolf.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_Death_Guardian.prefab`
`Assets/LightMaze/Production/Resources/LightMazeProduction/VFX/VFX_Guardian_Attack.prefab`

The runtime automatically prefers these prefabs and falls back to the current procedural effects if a slot is missing.

## Animator parameter contract
Player Animator parameters:
- Float `Speed`
- Float `MoveSpeed01`
- Bool `Sprint`
- Bool `Grounded`
- Bool `Dead`
- Trigger `Dodge`
- Trigger `CastBolt`
- Trigger `CastIceNova`
- Trigger `Heal`

Enemy Animator parameters:
- Float `Speed`
- Bool `Frozen`
- Bool `Dead`
- Trigger `Attack`
- Trigger `HitReact`
- Trigger `Freeze`
- Trigger `Death`

The runtime bridge already drives these parameters. Astra should build controllers around this contract rather than changing code.

## Required work order
### Phase A — hero first
Import/select the strongest legally usable stylized-realistic male humanoid available in the environment. Configure Humanoid rig. Build the explorer look with white hair, black/silver armor, pale cloth, blue-white chest core, and luminous sword. Make sure silhouette reads at normal gameplay distance. Build Player_Explorer.prefab at the exact path above.

### Phase B — three enemy silhouettes
Create/import and configure:
- Shadow Soldier: human-sized, sharp armored silhouette, red core/blade accents.
- Rift Wolf: unmistakably quadrupedal, low fast posture, red-black fracture accents.
- Abyss Guardian: 1.8–2.3x hero visual mass, broad shoulders/wings or mantle, black/gold armor, giant weapon, crown/halo language.

Create exact production prefabs and Animator Controllers.

### Phase C — signature effects
Use VFX Graph / Shader Graph where valuable. Prioritize quality over quantity.

Ice Nova sequence must read as:
1. 80–150 ms white-blue preflash at player / magic sigil
2. thin expanding floor sigil/rune ring
3. fast radial ground light sweep
4. major ice pillars erupting around the radius with height variation
5. smaller shards and debris crossing the camera plane
6. short mist/frost volume
7. lingering glitter and frozen ground light for ~0.5–1.2 s

Light Bolt:
- bright compact core
- directional ribbon/trail
- small secondary sparks
- distinct impact burst and shards
- fast enough to feel aggressive, never a slow glowing ball

Guardian Attack:
- readable gold floor telegraph BEFORE damage feel
- giant gold sword arc / shockwave AFTER windup
- strong but brief camera-readable flash

### Phase D — environment
Replace the visual impression of the primitive chamber with a coherent PBR dark-fantasy room. Keep gameplay collision roots if needed, but visually cover them. Use large architecture, broken pillars, altar, vertical abyss shafts, selective emissive runes, depth fog. Avoid cluttering every square meter.

### Phase E — lighting and post
- ACES
- dark blue-black base exposure
- controlled bloom, not full-screen white clipping
- cold moon/key light for hero separation
- localized red/gold/purple enemy accents
- subtle vignette
- fog for depth layering
- reflection/baked/mixed lighting if useful
- eliminate remaining shadow-atlas spam by sensible light/shadow budgets

### Phase F — play and iterate
Play SampleScene repeatedly. Tune until:
- hero remains readable against effects
- Ice Nova looks like a signature/marketing skill
- Guardian never clips to white/yellow
- Rift Wolf reads as a wolf at a glance
- enemy attacks are readable before impact
- no production model floats, sinks, or rotates incorrectly
- camera framing shows full hero silhouette most of the time

## Quality tiers
PC High:
- strongest material/VFX quality
- SMAA/post processing
- denser secondary particles
- longer effect trails where readable
- farther shadows / environment detail

iPad Medium:
- same gameplay and core silhouettes
- fewer secondary particles
- cheaper transparency/overdraw
- shorter trails
- limited realtime shadows/lights
- preserve Ice Nova shape and visual identity even when effects are reduced

Do not solve mobile performance by making the game visually bland.

## Validation before finishing the Astra run
Run `LIGHT MAZE > Production > 3. Validate Production Assets`.
Then play SampleScene and verify all production models replace primitives automatically.

The pass is NOT accepted if any of these are true:
- player body still visibly uses capsules/cubes
- enemy identity depends only on color
- Rift Wolf does not read as a quadruped beast
- Ice Nova still resembles debug cubes/LineRenderers
- Guardian is overexposed into a white/yellow blob
- arena still reads as an empty prototype box
- VFX obscure all telegraphs
- scene is visually worse when several effects happen together

## Finish
Commit all Unity asset/meta changes to `unity-vertical-slice` and push. Do not merge to main. Leave the branch in a state where the user only needs Pull + Play to review the result.
