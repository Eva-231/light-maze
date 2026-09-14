# LIGHT MAZE — High Fidelity Character Pipeline

This pipeline exists so a premium licensed/owned character can replace the current low-poly production character without rewriting gameplay code.

## Target

For the player, preserve the locked art direction:

- white/silver hair
- black + silver layered armor
- pale/white cloth accents
- blue-white LIGHT core at the chest
- elegant luminous sword
- readable silhouette against a dark blue/black Abyss environment

The high-fidelity source asset is expected to provide the geometric detail. This pipeline does **not** claim that a low-poly mesh can become AAA simply by changing shaders.

## What Sol-side tooling now automates

Open:

`LIGHT MAZE > Production > High Fidelity Character Pipeline`

The window can:

1. take a project GameObject/model/prefab as the source character,
2. wrap it in the exact production prefab name used by `ProductionModelInjector`,
3. preserve the source as a nested prefab instead of destructively editing it,
4. create the full LIGHT MAZE socket contract,
5. place weapon/cast sockets on Humanoid hand bones when available,
6. place chest LIGHT/hit sockets on UpperChest/Chest when available,
7. assign an Animator Controller,
8. optionally override skin/hair/armor/cloth materials by name heuristics,
9. build an LODGroup automatically when renderers are named LOD0/LOD1/LOD2,
10. attach `HighFidelityCharacterProfile`,
11. save to the exact Resources path already consumed at runtime,
12. validate Animator, sockets, renderers, missing materials, triangle density, controller and LOD presence.

A second finishing tool is available at:

`LIGHT MAZE > Production > High Fidelity Character Finishing`

It can:

- bind a premium right-hand weapon to `WeaponSocket_R`,
- bind an optional off-hand asset to `WeaponSocket_L`,
- bind a dedicated LIGHT-core prefab to `ChestLightSocket`,
- preserve per-accessory local position/rotation/scale alignment,
- replace only tool-managed accessories without deleting unrelated child content,
- validate the exact Animator parameters consumed by `ProductionAnimatorBridge` for both player and enemies.

The Animator validator requires these contracts:

Player:

- Float `Speed`
- Float `MoveSpeed01`
- Bool `Sprint`
- Bool `Grounded`
- Bool `Dead`
- Trigger `Dodge`
- Trigger `CastBolt`
- Trigger `CastIceNova`
- Trigger `Heal`

Enemies:

- Float `Speed`
- Bool `Frozen`
- Bool `Dead`
- Trigger `Attack`
- Trigger `HitReact`
- Trigger `Freeze`
- Trigger `Death`

## Exact output paths

- `Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Player_Explorer.prefab`
- `Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Enemy_ShadowSoldier.prefab`
- `Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Enemy_RiftWolf.prefab`
- `Assets/LightMaze/Production/Resources/LightMazeProduction/Models/Enemy_AbyssGuardian.prefab`

These are the same paths used by `ProductionAssetContract` / `ProductionModelInjector`, so no gameplay rewrite is required.

## Recommended workflow for an FF-like player character

1. Import a high-density, legally licensed game character into the Unity project.
2. Configure its rig as Humanoid in the Model Importer when it is a biped.
3. Keep the asset's high-quality native PBR textures/materials unless a deliberate replacement is better.
4. Open the High Fidelity Character Pipeline.
5. Set Role = `PlayerExplorer`.
6. Select the imported source prefab/model.
7. Assign the existing LIGHT MAZE player Animator Controller if available.
8. Use material overrides only where they improve the visual identity (white hair, black/silver armor, pale cloth). Do not flatten a sophisticated source material setup unnecessarily.
9. Adjust local scale/rotation until the source matches the gameplay capsule.
10. Build / Refresh Production Character.
11. Open High Fidelity Character Finishing and optionally bind the final sword/off-hand/LIGHT-core prefabs.
12. Run `LIGHT MAZE > Production > Validate High Fidelity Characters`.
13. Run `LIGHT MAZE > Production > Validate High Fidelity Animator Contracts`.
14. Play `SampleScene` and verify locomotion, dodge, Bolt, Ice Nova, Heal, sockets, clipping and camera readability.

## Quality gates

A character should not be considered the final premium replacement merely because validation passes. Validation checks integration safety, not artistic quality.

For the player, target:

- a strong face/hair silhouette at normal gameplay camera distance,
- physically believable metal/cloth separation,
- no obvious faceting on exposed hero surfaces,
- convincing hair transparency/cards or groom-like presentation,
- animation deformation that does not collapse shoulders/hips,
- weapon alignment that survives attacks and dodges,
- chest LIGHT core aligned to anatomy rather than floating,
- material response that reads under both neutral and Ice Nova lighting,
- sensible LODs before shipping.

The validator emits a warning when the player is under roughly 50k triangles. This is only a heuristic, not a hard requirement; topology quality and normal/detail maps matter more than raw count.

## Licensing / Git rule

Do not commit third-party Asset Store source packages or generated derivatives when the license does not permit redistribution. The current repository already ignores the local licensed character outputs used by the GanzSe workflow. A new machine may therefore need the source asset imported and the production prefab rebuilt locally.

## Division of labor

Use Sol/Codex for:

- integration code,
- import/build tooling,
- sockets,
- Animator contracts,
- validation,
- runtime wiring,
- material assignment automation,
- Git changes.

Reserve Astra/editor-heavy visual work for the final tasks that benefit from seeing the actual character in motion: facial/hair/armor presentation, material tuning, clipping fixes, pose/animation polish, lighting and final Game View judgement.
