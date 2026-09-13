#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEngine;

namespace LightMaze.EditorTools
{
    public static class ProductionSetupWindow
    {
        const string Root = "Assets/LightMaze/Production";
        const string ResourcesRoot = Root + "/Resources/LightMazeProduction";

        static readonly string[] Folders =
        {
            Root,
            Root + "/Animations",
            Root + "/Materials",
            Root + "/ShaderGraphs",
            Root + "/VFXGraphs",
            Root + "/Environment",
            ResourcesRoot,
            ResourcesRoot + "/Models",
            ResourcesRoot + "/VFX",
            ResourcesRoot + "/Environment"
        };

        static readonly string[] RequiredPrefabs =
        {
            ResourcesRoot + "/Models/Player_Explorer.prefab",
            ResourcesRoot + "/Models/Enemy_ShadowSoldier.prefab",
            ResourcesRoot + "/Models/Enemy_RiftWolf.prefab",
            ResourcesRoot + "/Models/Enemy_AbyssGuardian.prefab"
        };

        static readonly string[] SignatureVfxPrefabs =
        {
            ResourcesRoot + "/VFX/VFX_LightBolt_Projectile.prefab",
            ResourcesRoot + "/VFX/VFX_LightBolt_Cast.prefab",
            ResourcesRoot + "/VFX/VFX_LightBolt_Impact.prefab",
            ResourcesRoot + "/VFX/VFX_IceNova.prefab",
            ResourcesRoot + "/VFX/VFX_Heal.prefab",
            ResourcesRoot + "/VFX/VFX_Guardian_Attack.prefab"
        };

        [MenuItem("LIGHT MAZE/Production/1. Prepare Astra Drop Zone")]
        public static void PrepareDropZone()
        {
            foreach (var folder in Folders)
                Directory.CreateDirectory(folder);

            string readme = Root + "/ASTRA_DROPZONE.txt";
            if (!File.Exists(readme))
            {
                File.WriteAllText(readme,
                    "LIGHT MAZE production assets live here.\n" +
                    "Models that replace prototype geometry MUST be prefabs in Resources/LightMazeProduction/Models using the exact required names.\n" +
                    "Signature VFX prefabs MUST be placed in Resources/LightMazeProduction/VFX using the exact names from UNITY_ASTRA_PRODUCTION_PASS.md.\n" +
                    "Do not delete gameplay roots/colliders/scripts. ProductionModelInjector swaps visuals at runtime.\n");
            }

            AssetDatabase.Refresh();
            Debug.Log("LIGHT MAZE production drop zone prepared.");
        }

        [MenuItem("LIGHT MAZE/Production/2. Install VFX Graph 17.5")]
        public static void InstallVfxGraph()
        {
            Client.Add("com.unity.visualeffectgraph@17.5.0");
            Debug.Log("Requested Visual Effect Graph 17.5.0. Watch Package Manager/Console until resolution completes.");
        }

        [MenuItem("LIGHT MAZE/Production/3. Validate Production Assets")]
        public static void ValidateAssets()
        {
            int missing = 0;
            foreach (var path in RequiredPrefabs)
            {
                if (AssetDatabase.LoadAssetAtPath<GameObject>(path) == null)
                {
                    Debug.LogWarning("MISSING REQUIRED MODEL: " + path);
                    missing++;
                }
                else
                {
                    Debug.Log("OK MODEL: " + path);
                }
            }

            foreach (var path in SignatureVfxPrefabs)
            {
                if (AssetDatabase.LoadAssetAtPath<GameObject>(path) == null)
                {
                    Debug.LogWarning("MISSING SIGNATURE VFX: " + path);
                    missing++;
                }
                else
                {
                    Debug.Log("OK VFX: " + path);
                }
            }

            if (missing == 0)
                Debug.Log("LIGHT MAZE production validation PASSED.");
            else
                Debug.LogWarning($"LIGHT MAZE production validation incomplete: {missing} required/signature assets missing.");
        }
    }
}
#endif
