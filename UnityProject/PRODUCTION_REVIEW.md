# LIGHT MAZE — local production review, 2026-09-14

Canonical project: C:/UnityProjects/light-maze/UnityProject
Branch: unity-vertical-slice. Unity 6000.5.11f1 / URP 17.5.

## Implemented and exercised in Play Mode
- Explorer, Shadow Soldier and Guardian: GanzSe 1.12 rigged modular base; selected armor, authored skeletal clips, production sockets, white hair, split cloth, blade and chest ornaments. Guardian adds a crown, halo and broad shoulder silhouette.
- Rift Wolf: Quaternius CC0 quadruped with original idle/gallop/bite/stagger/death animations, dark hide and red mane/eyes.
- All 11 production VFX prefabs, including staged Ice Nova and separate Light Bolt projectile/cast/impact.
- Combined gothic masonry, nested portals, inlays, depth haze, ACES grade and restrained bloom.
- Fixed prototype-decoration ordering so the model injector hides those meshes after the old art pass finishes.
- Disabled the old player core light when production art is present; combat previously restored its brightness every frame and washed out the face.
- Guardian damage follows the 0.5 second warning and tests the original marked area, allowing escape and freeze interruption.

## Verified
- LIGHT MAZE > Production > 3. Validate Production Assets: PASSED.
- Play Mode model audit: all four models, sockets, controllers, supported materials, no built-in primitive meshes inside visible production models. 0 errors.
- Explorer 7,290 triangles before tailored-body submesh split; Shadow Soldier 7,044; Wolf 2,088; Guardian 7,032. Latest counts are in Logs/ProductionModelAudit.txt.
- Guardian timing test: no damage during warning; 15 on impact; escaping or freezing prevents damage.
- Multiple Play reviews of Explorer, Guardian, room and actual Ice Nova combat cast. Latest observed Console: 0 red errors.
- Review screenshot: Logs/Production-IceNova.png.

## Limits and publication status
- This is a functional, stylized low-poly art pass. It does not yet match the supplied premium JRPG reference's character detail or material richness; the screenshot shows the actual current result.
- iPad particle/secondary-layer reductions remain implemented, but iPad hardware performance was not measured.
- The GitHub repository is public. GanzSe is Standard Asset Store EULA content; its source files and derived mesh copies must not be published as standalone downloadable source without suitable rights. The owner approved keeping the repository public and excluding these licensed sources and derivatives.
- Existing browser game and main branch remain untouched.

## Fresh checkout setup
Import GanzSe FREE Modular Character (tested version 1.12) from your own Unity My Assets. On completion, the Editor automatically generates Explorer, Shadow Soldier and Guardian locally. The source package, derived humanoid prefabs, tailored body meshes and skeletal animation files are ignored by Git. No download or license acceptance is automated. Without the package the existing prototype fallback remains available, but Production Assets Validation will report missing characters. Manual rebuild: LIGHT MAZE > Production > 6. Build Characters. On this PC the package is already imported, so Pull and Play uses the local generated models.


Local regeneration verification: removed the generated Explorer prefab while keeping the owned source import; the Editor automatically rebuilt all three humanoids successfully. Public Unity assets were scanned for references to GanzSe source GUIDs: none found. Production validation and Play model audit were repeated after regeneration.
