# LIGHT MAZE — Astra asset acquisition shortlist

Use this only after `ASTRA_ONE_SHOT_EXECUTION.md`. Goal: avoid wasting the one Astra run browsing aimlessly.

## Decision order
1. Inspect assets already owned in the connected Unity account. Prefer an owned asset if it is clearly higher quality, compatible with URP/Unity 6, legally usable, and fits the approved art direction.
2. Prefer current free assets that can be imported immediately and legally used under the Unity Asset Store EULA.
3. Do NOT purchase, subscribe, or spend money without explicit user approval.
4. If a perfect production model is unavailable, prioritize one excellent hero + one excellent Guardian + signature Ice Nova + arena lighting over spreading effort across many mediocre assets.
5. Do not lower the accepted visual bar just to fill every slot. A missing secondary enemy is preferable to a visibly cheap model in the hero shot.

## Current free candidates researched by Sol
These are fallbacks, not mandatory choices. Re-check compatibility in Unity before importing.

### Hero / humanoid base
- GanzSe FREE Modular Character - Fantasy Low Poly Pack
  - Free
  - Unity 6000.3.10f1
  - URP compatible
  - Useful as a modular fallback if nothing better is already owned.

- FREE Starter Pack - Sidekick Modular Characters by Synty
  - Free
  - URP compatible
  - Useful for modular parts / fallback silhouettes, but may be too stylized/low-poly for final hero quality.

### Sword animation
- Free Sword Animation by EEJANAI,TEAM
  - Free
  - Humanoid sword animation pack
  - Use only if animation quality and retargeting are acceptable.

### Environment fallback
- Dark Fantasy Kit
  - URP compatible in listed supported Unity versions
  - Use only if already owned or available under the account; do not purchase without approval.

## Paid examples — reference only, DO NOT BUY automatically
These illustrate the quality level to look for in owned assets:
- Dark Fantasy Environment (Souls-Like) — strong high-value architecture reference.
- SCI FI: HUMAN MERCENARY MALE — current URP/Unity 6-compatible PBR human example, though art direction would require fantasy conversion.

## Asset selection criteria
Hero:
- humanoid rig
- clean face/hair silhouette
- normal gameplay distance still reads as premium
- materials can be recolored to black/silver/pale cloth
- supports sword hand socket
- no exaggerated chibi proportions

Rift Wolf:
- clearly quadrupedal
- aggressive low silhouette
- readable legs/head/tail in motion
- animation set includes idle/run/attack/hit/death if possible

Guardian:
- visually 1.8–2.3x hero mass
- broad readable armor silhouette
- giant weapon compatible
- enough material separation to create black/gold identity without full re-authoring

Environment:
- modular dark stone / gothic / abyss architecture
- PBR materials
- large shapes that read from gameplay camera
- not visually noisy

## Time-saving rules for Astra
- Spend at most ~15% of the run on asset discovery/import troubleshooting.
- If an import becomes a rabbit hole, abandon it and use the best viable fallback.
- Do not convert an incompatible Built-in-only pack unless conversion is trivial.
- Do not spend the run manually sculpting detailed characters from primitives.
- Reuse the Sol runtime injection paths exactly; do not refactor gameplay roots.
- After the hero, Guardian, Ice Nova, and arena reach the visual target, then improve Shadow Soldier and Rift Wolf.

## One-shot visual priority
P0: Hero silhouette + materials + sword + camera readability
P0: Ice Nova signature VFX
P0: Guardian silhouette + gold telegraph/attack
P0: Arena lighting/environment composition
P1: Light Bolt cast/projectile/impact polish
P1: Shadow Soldier
P1: Rift Wolf
P2: secondary polish and minor props

The accepted result should look like a premium vertical slice screenshot, not a content-complete prototype.
