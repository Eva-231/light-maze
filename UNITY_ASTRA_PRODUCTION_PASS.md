# LIGHT MAZE — Astra Production Visual Pass

## Goal
Replace the current primitive/procedural prototype look with a production-quality vertical slice that matches the approved art direction: white-haired explorer, black/silver armor, blue-white LIGHT core, blue-black abyss, red/purple/blue/gold enemy identities, and flashy but readable combat effects.

## Keep
- Existing gameplay logic: movement, dodge, HP/MP/LIGHT, Light Bolt, Ice Nova, Heal, enemy behaviors.
- URP project and the `unity-vertical-slice` branch.
- Runtime prototype only as fallback/reference.

## Replace
- Primitive character/enemy geometry.
- Runtime-generated flat materials.
- Basic LineRenderer/primitive VFX as the main presentation layer.
- Sparse blockout environment.

## Production asset slots
Create these prefab slots under `Assets/LightMaze/Production/Prefabs/`:
- `Player_Explorer.prefab`
- `Enemy_ShadowSoldier.prefab`
- `Enemy_RiftWolf.prefab`
- `Enemy_AbyssGuardian.prefab`
- `Arena_AbyssChamber.prefab`

All character prefabs must expose these child sockets:
- `Root`
- `Model`
- `WeaponSocket_R`
- `WeaponSocket_L`
- `ChestLightSocket`
- `CastSocket`
- `HitVfxSocket`

## Animator targets
Player state machine:
- Idle
- Walk/Run blend tree
- Sprint
- Dodge
- Light Attack 1/2/3
- Heavy Attack
- Cast Bolt
- Cast Ice Nova
- Heal
- Hit React
- Death

Enemy state machines:
- Idle
- Chase
- Windup
- Attack
- Hit React
- Freeze
- Death

## Materials / Shader Graph
Create URP Shader Graph materials for:
- Black/silver armor with controlled metallic response
- Pale cloth/hair with soft rim light
- LIGHT emissive core with Fresnel pulse
- Weapon emissive edge
- Enemy red/purple/blue/gold cores
- Hit flash
- Freeze overlay
- Dissolve death
- Abyss rune floor emission

## VFX Graph targets
Build real VFX Graph versions of:
1. Light Bolt
   - charge flare at cast socket
   - projectile core + trail + secondary sparks
   - impact flash + radial shards
2. Ice Nova
   - expanding magic circle
   - radial ice pillars/shards
   - ground frost decal/ring
   - white-blue flash
   - lingering glitter/fog
3. Heal
   - vertical light strands
   - upward motes
   - soft concentric sigils
4. Enemy hit/death
   - colored hit sparks by enemy identity
   - dissolve fragments on death
5. Guardian attack
   - gold sword arc
   - expanding floor telegraph
   - impact shockwave

## Camera and feel
- Third-person camera distance that shows the full character silhouette.
- Lock-on-ready composition.
- Small FOV kick on dodge/strong attacks.
- Hit stop on important impacts.
- Camera impulse/shake by attack weight.
- Never let VFX completely hide telegraphs or enemies.

## Lighting / post
Stay on URP for PC + iPad compatibility.
- ACES tonemapping
- Bloom tuned for highlights only
- Contrast-rich blue-black base grade
- Vignette kept subtle
- Fog for depth separation
- Reflection probes / baked or mixed lighting where useful
- PC High and iPad Medium quality profiles

## Environment
Replace the blockout room with a modular dark-fantasy chamber:
- PBR stone floor/walls
- large vertical architecture for scale
- broken pillars / altar / abyss shafts
- emissive runes as navigation language
- a few high-value set pieces instead of many low-value props

## Astra / Work responsibilities
Use Astra for editor-heavy work only:
- import selected 3D/VFX/environment packages
- fix URP materials and render pipeline compatibility
- configure Humanoid rigs and Avatar mappings
- build Animator Controllers and blend trees
- create prefabs and sockets
- set up Shader Graph and VFX Graph assets
- tune lighting, volumes, camera, prefabs and scene hierarchy
- run the scene and visually iterate
- create PC High / iPad Medium quality tiers

Do not spend Astra time rewriting game design or prose specs. Chat/Sol handles code architecture, gameplay code, GitHub diffs and review.

## Acceptance criteria for the next vertical slice
The next playtest is not accepted unless:
- no primitive body parts are visible in the player model
- player reads as a stylish white-haired black/silver hero at gameplay distance
- each enemy is identifiable by silhouette before reading its color
- Ice Nova looks like a signature skill, not a debug effect
- enemy attacks have readable telegraphs and strong impact feedback
- the room looks like a deliberate dark-fantasy space rather than a blockout
- the frame remains readable under multiple simultaneous effects
- PC version has a visibly higher quality tier than iPad without changing gameplay
