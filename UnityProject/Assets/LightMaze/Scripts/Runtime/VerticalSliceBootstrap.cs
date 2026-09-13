using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using LightMaze.CameraSystem;
using LightMaze.Combat;
using LightMaze.Enemies;
using LightMaze.Player;
using LightMaze.Visuals;

namespace LightMaze.Runtime
{
    public sealed class VerticalSliceBootstrap : MonoBehaviour
    {
        Material darkStone;
        Material blackMetal;
        Material silver;
        Material paleCloth;
        Material blueGlow;
        Material redGlow;
        Material purpleGlow;
        Material goldGlow;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Inject()
        {
            if (SceneManager.GetActiveScene().name != "SampleScene") return;
            if (Object.FindFirstObjectByType<PrototypeThirdPersonMotor>() != null) return;

            var root = new GameObject("LIGHT MAZE // Vertical Slice Runtime");
            root.AddComponent<VerticalSliceBootstrap>();
        }

        void Start()
        {
            DisableTemplateObjects();
            CreateMaterials();
            SetupAtmosphere();
            BuildRoom();
            BuildPlayableCharacter(out var player, out var vitals, out var motor, out var camera, out var orbit);
            BuildEnemies(player.transform, vitals, motor);
            CreatePointLight(new Vector3(-10f, 3.2f, -4f), new Color(.18f, .42f, 1f), 3.5f, 11f);
            CreatePointLight(new Vector3(10f, 3.2f, 5f), new Color(.28f, .12f, .62f), 3.2f, 10f);
            CreatePointLight(new Vector3(0f, 4f, 13f), new Color(.7f, .34f, .08f), 2.8f, 12f);
        }

        void DisableTemplateObjects()
        {
            foreach (var cam in Object.FindObjectsByType<Camera>(FindObjectsSortMode.None))
                cam.gameObject.SetActive(false);

            foreach (var light in Object.FindObjectsByType<Light>(FindObjectsSortMode.None))
            {
                if (light.type == LightType.Directional)
                    light.gameObject.SetActive(false);
            }
        }

        void CreateMaterials()
        {
            darkStone = PrototypeVfx.CreateLitMaterial(new Color(.025f, .035f, .055f), new Color(.005f, .012f, .03f), .18f);
            blackMetal = PrototypeVfx.CreateLitMaterial(new Color(.018f, .022f, .03f), new Color(.01f, .02f, .035f), .72f);
            silver = PrototypeVfx.CreateLitMaterial(new Color(.5f, .56f, .66f), new Color(.06f, .09f, .14f), .86f);
            paleCloth = PrototypeVfx.CreateLitMaterial(new Color(.48f, .5f, .54f), new Color(.025f, .035f, .05f), .3f);
            blueGlow = PrototypeVfx.CreateLitMaterial(new Color(.08f, .25f, .42f), new Color(.22f, .72f, 1f) * 5f, .8f);
            redGlow = PrototypeVfx.CreateLitMaterial(new Color(.3f, .02f, .035f), new Color(1f, .04f, .08f) * 4f, .7f);
            purpleGlow = PrototypeVfx.CreateLitMaterial(new Color(.16f, .04f, .24f), new Color(.56f, .16f, 1f) * 4f, .72f);
            goldGlow = PrototypeVfx.CreateLitMaterial(new Color(.28f, .16f, .035f), new Color(1f, .62f, .14f) * 4f, .82f);
        }

        void SetupAtmosphere()
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = .012f;
            RenderSettings.fogColor = new Color(.012f, .018f, .035f);
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(.055f, .075f, .13f);
            RenderSettings.ambientEquatorColor = new Color(.025f, .032f, .055f);
            RenderSettings.ambientGroundColor = new Color(.008f, .01f, .018f);

            var moon = new GameObject("Cold Moon Key Light");
            var light = moon.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(.55f, .68f, 1f);
            light.intensity = .72f;
            light.shadows = LightShadows.Soft;
            moon.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
        }

        void BuildRoom()
        {
            var env = new GameObject("Abyss Chamber").transform;
            env.SetParent(transform);

            CreateSolidCube("Floor", new Vector3(0f, -.3f, 2f), new Vector3(36f, .6f, 38f), darkStone, env);
            CreateSolidCube("Wall North", new Vector3(0f, 3f, 21f), new Vector3(36f, 6.6f, 1f), darkStone, env);
            CreateSolidCube("Wall South", new Vector3(0f, 3f, -17f), new Vector3(36f, 6.6f, 1f), darkStone, env);
            CreateSolidCube("Wall West", new Vector3(-18f, 3f, 2f), new Vector3(1f, 6.6f, 38f), darkStone, env);
            CreateSolidCube("Wall East", new Vector3(18f, 3f, 2f), new Vector3(1f, 6.6f, 38f), darkStone, env);

            for (int i = 0; i < 4; i++)
            {
                float z = -10f + i * 8f;
                CreateSolidCube($"Pillar L {i}", new Vector3(-13.5f, 2.2f, z), new Vector3(1.4f, 4.4f, 1.4f), blackMetal, env);
                CreateSolidCube($"Pillar R {i}", new Vector3(13.5f, 2.2f, z), new Vector3(1.4f, 4.4f, 1.4f), blackMetal, env);
                CreateVisual(PrimitiveType.Cube, $"Rune L {i}", env, new Vector3(-13.5f, .04f, z), new Vector3(2.8f, .035f, .13f), blueGlow);
                CreateVisual(PrimitiveType.Cube, $"Rune R {i}", env, new Vector3(13.5f, .04f, z), new Vector3(2.8f, .035f, .13f), blueGlow);
            }

            for (int i = -4; i <= 4; i++)
            {
                CreateVisual(PrimitiveType.Cube, $"Path Rune {i}", env, new Vector3(i * 2.7f, .025f, -1f), new Vector3(1.4f, .03f, .08f), blueGlow, Quaternion.Euler(0f, i * 17f, 0f));
            }

            var altar = CreateSolidCube("Guardian Dais", new Vector3(0f, .12f, 13f), new Vector3(7f, .25f, 5f), blackMetal, env);
            var altarRenderer = altar.GetComponent<Renderer>();
            if (altarRenderer != null) altarRenderer.material = blackMetal;
            PrototypeVfx.SpawnRing(new Vector3(0f, .25f, 13f), new Color(1f, .58f, .12f) * 1.5f, 2.4f, 9999f, .035f);
        }

        void BuildPlayableCharacter(
            out GameObject player,
            out PlayerVitals vitals,
            out PrototypeThirdPersonMotor motor,
            out Camera camera,
            out PrototypeOrbitCamera orbit)
        {
            player = new GameObject("Explorer // Player");
            player.transform.position = new Vector3(0f, .05f, -9f);

            var controller = player.AddComponent<CharacterController>();
            controller.height = 1.9f;
            controller.radius = .38f;
            controller.center = new Vector3(0f, .95f, 0f);
            controller.stepOffset = .3f;

            vitals = player.AddComponent<PlayerVitals>();
            motor = player.AddComponent<PrototypeThirdPersonMotor>();

            var model = new GameObject("Explorer Visual").transform;
            model.SetParent(player.transform);
            model.localPosition = Vector3.zero;

            CreateVisual(PrimitiveType.Capsule, "Black Silver Armor", model, new Vector3(0f, 1f, 0f), new Vector3(.48f, .72f, .36f), blackMetal);
            CreateVisual(PrimitiveType.Sphere, "White Hair", model, new Vector3(0f, 1.88f, 0f), new Vector3(.5f, .38f, .46f), paleCloth);
            CreateVisual(PrimitiveType.Cube, "Silver Shoulder L", model, new Vector3(-.42f, 1.45f, 0f), new Vector3(.35f, .14f, .5f), silver, Quaternion.Euler(0f, 0f, 18f));
            CreateVisual(PrimitiveType.Cube, "Silver Shoulder R", model, new Vector3(.42f, 1.45f, 0f), new Vector3(.35f, .14f, .5f), silver, Quaternion.Euler(0f, 0f, -18f));
            CreateVisual(PrimitiveType.Cube, "Pale Cloak", model, new Vector3(0f, .95f, -.28f), new Vector3(.72f, 1.35f, .055f), paleCloth, Quaternion.Euler(8f, 0f, 0f));
            CreateVisual(PrimitiveType.Cube, "Light Blade", model, new Vector3(.58f, .75f, .12f), new Vector3(.07f, 1.25f, .07f), blueGlow, Quaternion.Euler(0f, 0f, -18f));

            var core = CreateVisual(PrimitiveType.Sphere, "LIGHT Core", model, new Vector3(0f, 1.35f, .36f), Vector3.one * .22f, blueGlow);
            var coreLight = core.AddComponent<Light>();
            coreLight.type = LightType.Point;
            coreLight.color = new Color(.32f, .72f, 1f);
            coreLight.intensity = 7.2f;
            coreLight.range = 10f;
            coreLight.shadows = LightShadows.Soft;

            var castOrigin = new GameObject("Cast Origin").transform;
            castOrigin.SetParent(player.transform);
            castOrigin.localPosition = new Vector3(0f, 1.32f, .65f);

            var cameraObject = new GameObject("LIGHT MAZE Camera");
            cameraObject.tag = "MainCamera";
            camera = cameraObject.AddComponent<Camera>();
            camera.fieldOfView = 58f;
            camera.nearClipPlane = .08f;
            camera.farClipPlane = 120f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(.006f, .009f, .018f);
            cameraObject.AddComponent<AudioListener>();
            orbit = cameraObject.AddComponent<PrototypeOrbitCamera>();
            orbit.SetTarget(player.transform);
            motor.SetCamera(camera.transform);

            var combat = player.AddComponent<LightMazePlayerCombat>();
            combat.Configure(vitals, castOrigin, camera, coreLight, orbit);
        }

        void BuildEnemies(Transform player, PlayerVitals vitals, PrototypeThirdPersonMotor motor)
        {
            BuildShadowSoldier(new Vector3(-6.5f, 0f, 3.5f), player, vitals, motor);
            BuildRiftWolf(new Vector3(6.5f, 0f, 2f), player, vitals, motor);
            BuildGuardian(new Vector3(0f, 0f, 13f), player, vitals, motor);
        }

        void BuildShadowSoldier(Vector3 position, Transform player, PlayerVitals vitals, PrototypeThirdPersonMotor motor)
        {
            var root = new GameObject("Shadow Soldier");
            root.transform.position = position;
            var col = root.AddComponent<CapsuleCollider>();
            col.center = new Vector3(0f, 1f, 0f);
            col.height = 2f;
            col.radius = .48f;

            var body = CreateVisual(PrimitiveType.Capsule, "Shadow Armor", root.transform, new Vector3(0f, 1f, 0f), new Vector3(.55f, .82f, .42f), blackMetal);
            CreateVisual(PrimitiveType.Sphere, "Helm", root.transform, new Vector3(0f, 1.92f, 0f), Vector3.one * .46f, blackMetal);
            CreateVisual(PrimitiveType.Cube, "Red Blade", root.transform, new Vector3(.55f, .85f, .18f), new Vector3(.08f, 1.25f, .08f), redGlow, Quaternion.Euler(0f, 0f, -25f));
            var core = CreateVisual(PrimitiveType.Sphere, "Red Core", root.transform, new Vector3(0f, 1.32f, .42f), Vector3.one * .2f, redGlow);
            AddAccentLight(core, new Color(1f, .05f, .08f), 3.2f, 5f);

            var enemy = root.AddComponent<PrototypeEnemy>();
            enemy.Configure(PrototypeEnemyKind.ShadowSoldier, player, vitals, motor, new[] { body.GetComponent<Renderer>(), core.GetComponent<Renderer>() });
        }

        void BuildRiftWolf(Vector3 position, Transform player, PlayerVitals vitals, PrototypeThirdPersonMotor motor)
        {
            var root = new GameObject("Rift Wolf");
            root.transform.position = position;
            var col = root.AddComponent<BoxCollider>();
            col.center = new Vector3(0f, .65f, 0f);
            col.size = new Vector3(1.8f, 1.1f, 1.1f);

            var body = CreateVisual(PrimitiveType.Cube, "Wolf Body", root.transform, new Vector3(0f, .72f, 0f), new Vector3(1.65f, .68f, .72f), blackMetal);
            CreateVisual(PrimitiveType.Cube, "Wolf Head", root.transform, new Vector3(0f, .82f, .78f), new Vector3(.72f, .58f, .72f), blackMetal, Quaternion.Euler(-8f, 0f, 0f));
            CreateVisual(PrimitiveType.Cube, "Wolf Tail", root.transform, new Vector3(0f, .85f, -.9f), new Vector3(.16f, .16f, .9f), redGlow, Quaternion.Euler(-22f, 0f, 0f));
            for (int x = -1; x <= 1; x += 2)
                for (int z = -1; z <= 1; z += 2)
                    CreateVisual(PrimitiveType.Cube, "Wolf Leg", root.transform, new Vector3(x * .58f, .32f, z * .42f), new Vector3(.2f, .68f, .2f), blackMetal);
            var core = CreateVisual(PrimitiveType.Sphere, "Rift Core", root.transform, new Vector3(0f, .8f, .48f), Vector3.one * .2f, redGlow);
            AddAccentLight(core, new Color(1f, .05f, .12f), 3f, 4.5f);

            var enemy = root.AddComponent<PrototypeEnemy>();
            enemy.Configure(PrototypeEnemyKind.RiftWolf, player, vitals, motor, new[] { body.GetComponent<Renderer>(), core.GetComponent<Renderer>() });
        }

        void BuildGuardian(Vector3 position, Transform player, PlayerVitals vitals, PrototypeThirdPersonMotor motor)
        {
            var root = new GameObject("Abyss Guardian");
            root.transform.position = position;
            var col = root.AddComponent<CapsuleCollider>();
            col.center = new Vector3(0f, 1.8f, 0f);
            col.height = 3.7f;
            col.radius = 1.05f;

            var body = CreateVisual(PrimitiveType.Capsule, "Guardian Armor", root.transform, new Vector3(0f, 1.65f, 0f), new Vector3(1.05f, 1.45f, .8f), blackMetal);
            CreateVisual(PrimitiveType.Cube, "Guardian Shoulder L", root.transform, new Vector3(-1.05f, 2.25f, 0f), new Vector3(.8f, .38f, 1.15f), goldGlow, Quaternion.Euler(0f, 0f, 14f));
            CreateVisual(PrimitiveType.Cube, "Guardian Shoulder R", root.transform, new Vector3(1.05f, 2.25f, 0f), new Vector3(.8f, .38f, 1.15f), goldGlow, Quaternion.Euler(0f, 0f, -14f));
            CreateVisual(PrimitiveType.Cube, "Guardian Helm", root.transform, new Vector3(0f, 3.18f, 0f), new Vector3(.78f, .62f, .78f), blackMetal);
            CreateVisual(PrimitiveType.Cube, "Guardian Greatblade", root.transform, new Vector3(1.22f, 1.25f, .15f), new Vector3(.14f, 2.65f, .22f), goldGlow, Quaternion.Euler(0f, 0f, -14f));
            var core = CreateVisual(PrimitiveType.Sphere, "Guardian Gold Core", root.transform, new Vector3(0f, 2f, .78f), Vector3.one * .32f, goldGlow);
            AddAccentLight(core, new Color(1f, .62f, .16f), 4f, 7f);

            var enemy = root.AddComponent<PrototypeEnemy>();
            enemy.Configure(PrototypeEnemyKind.AbyssGuardian, player, vitals, motor, new[] { body.GetComponent<Renderer>(), core.GetComponent<Renderer>() });
        }

        GameObject CreateSolidCube(string name, Vector3 position, Vector3 scale, Material material, Transform parent)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(parent);
            go.transform.position = position;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().material = material;
            return go;
        }

        GameObject CreateVisual(PrimitiveType type, string name, Transform parent, Vector3 localPosition, Vector3 localScale, Material material)
            => CreateVisual(type, name, parent, localPosition, localScale, material, Quaternion.identity);

        GameObject CreateVisual(PrimitiveType type, string name, Transform parent, Vector3 localPosition, Vector3 localScale, Material material, Quaternion localRotation)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent);
            go.transform.localPosition = localPosition;
            go.transform.localRotation = localRotation;
            go.transform.localScale = localScale;
            go.GetComponent<Renderer>().material = material;
            PrototypeVfx.RemoveCollider(go);
            return go;
        }

        void AddAccentLight(GameObject owner, Color color, float intensity, float range)
        {
            var light = owner.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = color;
            light.intensity = intensity;
            light.range = range;
        }

        void CreatePointLight(Vector3 position, Color color, float intensity, float range)
        {
            var go = new GameObject("Abyss Accent Light");
            go.transform.SetParent(transform);
            go.transform.position = position;
            var light = go.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = color;
            light.intensity = intensity;
            light.range = range;
        }
    }
}
