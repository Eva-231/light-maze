using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace LightMaze.Visuals
{
    public sealed class VerticalSliceVisualPass : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Inject()
        {
            if (SceneManager.GetActiveScene().name != "SampleScene") return;
            if (Object.FindFirstObjectByType<VerticalSliceVisualPass>() != null) return;
            new GameObject("LIGHT MAZE // Visual Direction Pass").AddComponent<VerticalSliceVisualPass>();
        }

        IEnumerator Start()
        {
            GameObject player = null;
            for (int i = 0; i < 30 && player == null; i++)
            {
                player = GameObject.Find("Explorer // Player");
                if (player == null) yield return null;
            }

            if (player == null) yield break;
            yield return null;

            ApplyLightingAndGrade();
            PolishExplorer(player.transform);
            PolishShadowSoldier(GameObject.Find("Shadow Soldier"));
            PolishRiftWolf(GameObject.Find("Rift Wolf"));
            PolishGuardian(GameObject.Find("Abyss Guardian"));
            AddEnvironmentSilhouette();
        }

        void ApplyLightingAndGrade()
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = .017f;
            RenderSettings.fogColor = new Color(.006f, .011f, .024f);
            RenderSettings.ambientSkyColor = new Color(.025f, .04f, .08f);
            RenderSettings.ambientEquatorColor = new Color(.012f, .02f, .04f);
            RenderSettings.ambientGroundColor = new Color(.003f, .005f, .012f);

            foreach (var light in Object.FindObjectsByType<Light>(FindObjectsSortMode.None))
            {
                if (light.type == LightType.Point)
                {
                    light.shadows = LightShadows.None;
                    light.intensity *= .55f;
                }
                else if (light.type == LightType.Directional)
                {
                    light.intensity = Mathf.Min(light.intensity, .42f);
                    light.shadows = LightShadows.Soft;
                }
            }

            var volumeObject = new GameObject("LIGHT MAZE Global Grade");
            var volume = volumeObject.AddComponent<Volume>();
            volume.isGlobal = true;
            volume.priority = 100f;
            volume.profile = ScriptableObject.CreateInstance<VolumeProfile>();

            var bloom = volume.profile.Add<Bloom>(true);
            bloom.intensity.Override(.58f);
            bloom.threshold.Override(.72f);
            bloom.scatter.Override(.62f);

            var color = volume.profile.Add<ColorAdjustments>(true);
            color.postExposure.Override(-.55f);
            color.contrast.Override(18f);
            color.saturation.Override(-8f);
            color.colorFilter.Override(new Color(.88f, .94f, 1f));

            var vignette = volume.profile.Add<Vignette>(true);
            vignette.intensity.Override(.28f);
            vignette.smoothness.Override(.7f);

            var tonemapping = volume.profile.Add<Tonemapping>(true);
            tonemapping.mode.Override(TonemappingMode.ACES);
        }

        void PolishExplorer(Transform player)
        {
            var model = FindDeep(player, "Explorer Visual");
            if (model == null) return;

            var black = MaterialOf(model, "Black Silver Armor");
            var silver = MaterialOf(model, "Silver Shoulder L");
            var pale = MaterialOf(model, "White Hair");
            var blue = MaterialOf(model, "LIGHT Core");
            if (black == null || silver == null || pale == null || blue == null) return;

            AddPart(model, PrimitiveType.Capsule, "Arm L", new Vector3(-.38f, 1.05f, 0f), new Vector3(.18f, .58f, .18f), black, Quaternion.Euler(0f, 0f, -8f));
            AddPart(model, PrimitiveType.Capsule, "Arm R", new Vector3(.38f, 1.05f, 0f), new Vector3(.18f, .58f, .18f), black, Quaternion.Euler(0f, 0f, 8f));
            AddPart(model, PrimitiveType.Capsule, "Leg L", new Vector3(-.18f, .38f, 0f), new Vector3(.2f, .6f, .2f), black);
            AddPart(model, PrimitiveType.Capsule, "Leg R", new Vector3(.18f, .38f, 0f), new Vector3(.2f, .6f, .2f), black);
            AddPart(model, PrimitiveType.Cube, "Shin Silver L", new Vector3(-.18f, .22f, .11f), new Vector3(.23f, .42f, .16f), silver, Quaternion.Euler(-5f, 0f, 0f));
            AddPart(model, PrimitiveType.Cube, "Shin Silver R", new Vector3(.18f, .22f, .11f), new Vector3(.23f, .42f, .16f), silver, Quaternion.Euler(-5f, 0f, 0f));
            AddPart(model, PrimitiveType.Cube, "Chest Silver Slash", new Vector3(.03f, 1.37f, .34f), new Vector3(.5f, .055f, .12f), silver, Quaternion.Euler(0f, 0f, -33f));
            AddPart(model, PrimitiveType.Cube, "Cloak Tail L", new Vector3(-.22f, .45f, -.34f), new Vector3(.26f, .95f, .04f), pale, Quaternion.Euler(11f, 0f, 7f));
            AddPart(model, PrimitiveType.Cube, "Cloak Tail R", new Vector3(.22f, .45f, -.34f), new Vector3(.26f, .95f, .04f), pale, Quaternion.Euler(11f, 0f, -7f));
            AddPart(model, PrimitiveType.Cube, "Sword Guard", new Vector3(.58f, 1.28f, .12f), new Vector3(.42f, .055f, .08f), silver, Quaternion.Euler(0f, 0f, -18f));

            for (int i = 0; i < 7; i++)
            {
                float x = (i - 3) * .1f;
                float z = -.04f - Mathf.Abs(i - 3) * .015f;
                AddPart(model, PrimitiveType.Capsule, $"Hair Spike {i}", new Vector3(x, 2.03f, z), new Vector3(.09f, .28f + (i % 2) * .07f, .09f), pale, Quaternion.Euler(14f + (i % 3) * 8f, 0f, (i - 3) * 10f));
            }

            AddPart(model, PrimitiveType.Cube, "LIGHT Chest Mark", new Vector3(0f, 1.35f, .48f), new Vector3(.04f, .38f, .04f), blue);
            AddPart(model, PrimitiveType.Cube, "LIGHT Chest Mark Cross", new Vector3(0f, 1.35f, .48f), new Vector3(.34f, .04f, .04f), blue);
        }

        void PolishShadowSoldier(GameObject root)
        {
            if (root == null) return;
            var black = MaterialOf(root.transform, "Shadow Armor");
            var red = MaterialOf(root.transform, "Red Core");
            if (black == null || red == null) return;

            AddPart(root.transform, PrimitiveType.Capsule, "Shadow Arm L", new Vector3(-.48f, 1.08f, 0f), new Vector3(.2f, .66f, .2f), black, Quaternion.Euler(0f, 0f, -14f));
            AddPart(root.transform, PrimitiveType.Capsule, "Shadow Arm R", new Vector3(.48f, 1.08f, 0f), new Vector3(.2f, .66f, .2f), black, Quaternion.Euler(0f, 0f, 14f));
            AddPart(root.transform, PrimitiveType.Capsule, "Shadow Leg L", new Vector3(-.2f, .34f, 0f), new Vector3(.22f, .62f, .22f), black);
            AddPart(root.transform, PrimitiveType.Capsule, "Shadow Leg R", new Vector3(.2f, .34f, 0f), new Vector3(.22f, .62f, .22f), black);
            AddPart(root.transform, PrimitiveType.Cube, "Red Visor", new Vector3(0f, 1.97f, .43f), new Vector3(.46f, .045f, .04f), red);
            AddPart(root.transform, PrimitiveType.Cube, "Shadow Horn L", new Vector3(-.22f, 2.25f, 0f), new Vector3(.08f, .48f, .08f), black, Quaternion.Euler(0f, 0f, -24f));
            AddPart(root.transform, PrimitiveType.Cube, "Shadow Horn R", new Vector3(.22f, 2.25f, 0f), new Vector3(.08f, .48f, .08f), black, Quaternion.Euler(0f, 0f, 24f));
            AddPart(root.transform, PrimitiveType.Cube, "Red Blade Edge", new Vector3(.55f, .85f, .18f), new Vector3(.16f, 1.34f, .035f), red, Quaternion.Euler(0f, 0f, -25f));
        }

        void PolishRiftWolf(GameObject root)
        {
            if (root == null) return;
            var black = MaterialOf(root.transform, "Wolf Body");
            var red = MaterialOf(root.transform, "Rift Core");
            if (black == null || red == null) return;

            AddPart(root.transform, PrimitiveType.Cube, "Wolf Snout", new Vector3(0f, .72f, 1.16f), new Vector3(.45f, .3f, .62f), black, Quaternion.Euler(-8f, 0f, 0f));
            AddPart(root.transform, PrimitiveType.Cube, "Wolf Ear L", new Vector3(-.24f, 1.18f, .83f), new Vector3(.16f, .42f, .12f), black, Quaternion.Euler(-12f, 0f, -24f));
            AddPart(root.transform, PrimitiveType.Cube, "Wolf Ear R", new Vector3(.24f, 1.18f, .83f), new Vector3(.16f, .42f, .12f), black, Quaternion.Euler(-12f, 0f, 24f));
            AddPart(root.transform, PrimitiveType.Cube, "Wolf Eye L", new Vector3(-.19f, .9f, 1.16f), new Vector3(.14f, .045f, .035f), red);
            AddPart(root.transform, PrimitiveType.Cube, "Wolf Eye R", new Vector3(.19f, .9f, 1.16f), new Vector3(.14f, .045f, .035f), red);

            for (int i = 0; i < 5; i++)
                AddPart(root.transform, PrimitiveType.Cube, $"Rift Spine {i}", new Vector3(0f, 1.18f, .46f - i * .32f), new Vector3(.08f, .42f, .12f), red, Quaternion.Euler(25f, 0f, 0f));

            for (int x = -1; x <= 1; x += 2)
                for (int z = -1; z <= 1; z += 2)
                    AddPart(root.transform, PrimitiveType.Cube, "Wolf Claw", new Vector3(x * .58f, .06f, z * .5f + .12f), new Vector3(.08f, .08f, .34f), red, Quaternion.Euler(0f, 0f, 0f));
        }

        void PolishGuardian(GameObject root)
        {
            if (root == null) return;
            var black = MaterialOf(root.transform, "Guardian Armor");
            var gold = MaterialOf(root.transform, "Guardian Gold Core");
            if (black == null || gold == null) return;

            AddPart(root.transform, PrimitiveType.Capsule, "Guardian Arm L", new Vector3(-.95f, 1.45f, 0f), new Vector3(.38f, 1.05f, .38f), black, Quaternion.Euler(0f, 0f, -9f));
            AddPart(root.transform, PrimitiveType.Capsule, "Guardian Arm R", new Vector3(.95f, 1.45f, 0f), new Vector3(.38f, 1.05f, .38f), black, Quaternion.Euler(0f, 0f, 9f));
            AddPart(root.transform, PrimitiveType.Capsule, "Guardian Leg L", new Vector3(-.38f, .55f, 0f), new Vector3(.42f, .95f, .42f), black);
            AddPart(root.transform, PrimitiveType.Capsule, "Guardian Leg R", new Vector3(.38f, .55f, 0f), new Vector3(.42f, .95f, .42f), black);
            AddPart(root.transform, PrimitiveType.Cube, "Guardian Face Slit", new Vector3(0f, 3.2f, .42f), new Vector3(.5f, .055f, .04f), gold);
            AddPart(root.transform, PrimitiveType.Cube, "Guardian Crown", new Vector3(0f, 3.66f, -.02f), new Vector3(.14f, .85f, .14f), gold, Quaternion.Euler(0f, 0f, 0f));
            AddPart(root.transform, PrimitiveType.Cube, "Guardian Wing L 1", new Vector3(-1.28f, 2.05f, -.52f), new Vector3(.22f, 2.1f, .08f), gold, Quaternion.Euler(18f, 0f, -35f));
            AddPart(root.transform, PrimitiveType.Cube, "Guardian Wing L 2", new Vector3(-1.62f, 1.75f, -.62f), new Vector3(.16f, 1.7f, .07f), gold, Quaternion.Euler(20f, 0f, -48f));
            AddPart(root.transform, PrimitiveType.Cube, "Guardian Wing R 1", new Vector3(1.28f, 2.05f, -.52f), new Vector3(.22f, 2.1f, .08f), gold, Quaternion.Euler(18f, 0f, 35f));
            AddPart(root.transform, PrimitiveType.Cube, "Guardian Wing R 2", new Vector3(1.62f, 1.75f, -.62f), new Vector3(.16f, 1.7f, .07f), gold, Quaternion.Euler(20f, 0f, 48f));
            AddPart(root.transform, PrimitiveType.Cube, "Guardian Blade Guard", new Vector3(1.22f, 2.42f, .15f), new Vector3(.82f, .12f, .18f), gold, Quaternion.Euler(0f, 0f, -14f));
            CreateVerticalHalo(root.transform, new Vector3(0f, 2.05f, -.72f), 1.25f, gold);
        }

        void AddEnvironmentSilhouette()
        {
            var floor = GameObject.Find("Floor");
            var path = GameObject.Find("Path Rune 0");
            if (floor == null || path == null) return;

            var stone = floor.GetComponent<Renderer>()?.sharedMaterial;
            var glow = path.GetComponent<Renderer>()?.sharedMaterial;
            if (stone == null || glow == null) return;

            var root = new GameObject("Abyss Silhouette Pass").transform;
            for (int side = -1; side <= 1; side += 2)
            {
                for (int i = 0; i < 5; i++)
                {
                    float z = -12f + i * 7f;
                    AddWorldPart(root, PrimitiveType.Cube, $"Rib {side} {i}", new Vector3(side * 15.7f, 4.6f, z), new Vector3(.48f, 8.8f, .48f), stone, Quaternion.Euler(0f, 0f, side * 7f));
                    AddWorldPart(root, PrimitiveType.Cube, $"Crystal {side} {i}", new Vector3(side * 14.9f, .62f, z + 1.4f), new Vector3(.16f, 1.25f, .16f), glow, Quaternion.Euler(0f, 0f, side * 16f));
                }
            }

            for (int i = -3; i <= 3; i++)
                AddWorldPart(root, PrimitiveType.Cube, $"Broken Spire {i}", new Vector3(i * 4.1f, 1.35f, 18.7f), new Vector3(.6f, 2.7f + Mathf.Abs(i) * .35f, .6f), stone, Quaternion.Euler(0f, i * 9f, i * 2.5f));
        }

        static Material MaterialOf(Transform root, string childName)
        {
            var child = FindDeep(root, childName);
            return child != null ? child.GetComponent<Renderer>()?.sharedMaterial : null;
        }

        static Transform FindDeep(Transform root, string childName)
        {
            if (root == null) return null;
            if (root.name == childName) return root;
            for (int i = 0; i < root.childCount; i++)
            {
                var found = FindDeep(root.GetChild(i), childName);
                if (found != null) return found;
            }
            return null;
        }

        static GameObject AddPart(Transform parent, PrimitiveType primitive, string name, Vector3 localPosition, Vector3 localScale, Material material, Quaternion? localRotation = null)
        {
            var go = GameObject.CreatePrimitive(primitive);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPosition;
            go.transform.localScale = localScale;
            go.transform.localRotation = localRotation ?? Quaternion.identity;
            PrototypeVfx.RemoveCollider(go);
            var renderer = go.GetComponent<Renderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
            return go;
        }

        static GameObject AddWorldPart(Transform parent, PrimitiveType primitive, string name, Vector3 position, Vector3 scale, Material material, Quaternion rotation)
        {
            var go = GameObject.CreatePrimitive(primitive);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.position = position;
            go.transform.rotation = rotation;
            go.transform.localScale = scale;
            PrototypeVfx.RemoveCollider(go);
            var renderer = go.GetComponent<Renderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
            return go;
        }

        static void CreateVerticalHalo(Transform parent, Vector3 localPosition, float radius, Material material)
        {
            var root = new GameObject("Guardian Halo");
            root.transform.SetParent(parent, false);
            root.transform.localPosition = localPosition;
            root.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            var lr = root.AddComponent<LineRenderer>();
            lr.useWorldSpace = false;
            lr.loop = true;
            lr.positionCount = 64;
            lr.widthMultiplier = .045f;
            lr.material = material;
            for (int i = 0; i < lr.positionCount; i++)
            {
                float a = i / (float)lr.positionCount * Mathf.PI * 2f;
                lr.SetPosition(i, new Vector3(Mathf.Cos(a) * radius, 0f, Mathf.Sin(a) * radius));
            }
        }
    }
}
