#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using LightMaze.Production;

namespace LightMaze.EditorTools
{
    public sealed class HighFidelityCharacterPipelineWindow : EditorWindow
    {
        const string OutputRoot = "Assets/LightMaze/Production/Resources/LightMazeProduction/Models";

        GameObject sourceAsset;
        ProductionRole role = ProductionRole.PlayerExplorer;
        RuntimeAnimatorController animatorController;
        Material skinOverride;
        Material hairOverride;
        Material armorOverride;
        Material clothOverride;
        Vector3 modelLocalPosition = Vector3.zero;
        Vector3 modelLocalEuler = Vector3.zero;
        float modelScale = 1f;
        bool overwriteExisting = true;
        bool autoBuildLodGroup = true;
        Vector2 scroll;

        [MenuItem("LIGHT MAZE/Production/High Fidelity Character Pipeline")]
        static void Open()
        {
            GetWindow<HighFidelityCharacterPipelineWindow>("HF Character Pipeline");
        }

        void OnGUI()
        {
            scroll = EditorGUILayout.BeginScrollView(scroll);
            EditorGUILayout.Space(8);
            EditorGUILayout.LabelField("LIGHT MAZE // High Fidelity Character Pipeline", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "Use this for premium Humanoid/Fantasy character assets. It wraps the source as a nested prefab, creates the LIGHT MAZE socket contract, applies optional surface overrides, records a HighFidelityCharacterProfile and writes the exact Resources prefab consumed by ProductionModelInjector.",
                MessageType.Info);

            sourceAsset = (GameObject)EditorGUILayout.ObjectField("Source character asset", sourceAsset, typeof(GameObject), false);
            role = (ProductionRole)EditorGUILayout.EnumPopup("Production role", role);
            animatorController = (RuntimeAnimatorController)EditorGUILayout.ObjectField("Animator Controller", animatorController, typeof(RuntimeAnimatorController), false);

            EditorGUILayout.Space(6);
            EditorGUILayout.LabelField("Optional premium material overrides", EditorStyles.boldLabel);
            skinOverride = (Material)EditorGUILayout.ObjectField("Skin / face", skinOverride, typeof(Material), false);
            hairOverride = (Material)EditorGUILayout.ObjectField("Hair", hairOverride, typeof(Material), false);
            armorOverride = (Material)EditorGUILayout.ObjectField("Armor / metal", armorOverride, typeof(Material), false);
            clothOverride = (Material)EditorGUILayout.ObjectField("Cloth / cape", clothOverride, typeof(Material), false);

            EditorGUILayout.Space(6);
            EditorGUILayout.LabelField("Model alignment inside production wrapper", EditorStyles.boldLabel);
            modelLocalPosition = EditorGUILayout.Vector3Field("Local Position", modelLocalPosition);
            modelLocalEuler = EditorGUILayout.Vector3Field("Local Rotation", modelLocalEuler);
            modelScale = Mathf.Max(.0001f, EditorGUILayout.FloatField("Uniform Scale", modelScale));
            autoBuildLodGroup = EditorGUILayout.Toggle("Auto build named LODs", autoBuildLodGroup);
            overwriteExisting = EditorGUILayout.Toggle("Overwrite local prefab", overwriteExisting);

            EditorGUILayout.Space(8);
            string output = GetOutputPath(role);
            EditorGUILayout.LabelField("Output", output, EditorStyles.wordWrappedMiniLabel);

            using (new EditorGUI.DisabledScope(sourceAsset == null))
            {
                if (GUILayout.Button("Build / Refresh Production Character", GUILayout.Height(34)))
                    Build();
            }

            if (GUILayout.Button("Validate All Production Characters", GUILayout.Height(28)))
                ValidateAll();

            EditorGUILayout.Space(10);
            EditorGUILayout.HelpBox(
                "Recommended source: a licensed high-density game character with proper PBR textures and Humanoid rig. For FF-like quality, use a strong base asset; this tool deliberately does not pretend a low-poly mesh can become AAA merely through shaders.",
                MessageType.Warning);
            EditorGUILayout.EndScrollView();
        }

        void Build()
        {
            if (sourceAsset == null)
            {
                EditorUtility.DisplayDialog("LIGHT MAZE", "Choose a source character asset first.", "OK");
                return;
            }

            string sourcePath = AssetDatabase.GetAssetPath(sourceAsset);
            if (string.IsNullOrEmpty(sourcePath))
            {
                EditorUtility.DisplayDialog("LIGHT MAZE", "The source must be a project asset, not a scene-only object.", "OK");
                return;
            }

            EnsureOutputFolder();
            string outputPath = GetOutputPath(role);
            if (!overwriteExisting && AssetDatabase.LoadAssetAtPath<GameObject>(outputPath) != null)
            {
                EditorUtility.DisplayDialog("LIGHT MAZE", $"Output already exists:\n{outputPath}", "OK");
                return;
            }

            GameObject wrapper = null;
            try
            {
                wrapper = new GameObject(GetPrefabName(role));
                var rootSocket = new GameObject("Root").transform;
                rootSocket.SetParent(wrapper.transform, false);

                var modelNode = new GameObject("Model").transform;
                modelNode.SetParent(wrapper.transform, false);

                GameObject sourceInstance;
                if (PrefabUtility.IsPartOfPrefabAsset(sourceAsset))
                    sourceInstance = (GameObject)PrefabUtility.InstantiatePrefab(sourceAsset);
                else
                    sourceInstance = Instantiate(sourceAsset);

                sourceInstance.name = "Premium Model";
                sourceInstance.transform.SetParent(modelNode, false);
                sourceInstance.transform.localPosition = modelLocalPosition;
                sourceInstance.transform.localRotation = Quaternion.Euler(modelLocalEuler);
                sourceInstance.transform.localScale = Vector3.one * modelScale;

                var animator = sourceInstance.GetComponentInChildren<Animator>(true);
                if (animator == null)
                    animator = sourceInstance.AddComponent<Animator>();
                if (animatorController != null)
                    animator.runtimeAnimatorController = animatorController;

                ApplySurfaceOverrides(sourceInstance);
                CreateContractSockets(wrapper.transform, animator);

                if (autoBuildLodGroup)
                    TryBuildNamedLods(sourceInstance);

                var profile = wrapper.AddComponent<HighFidelityCharacterProfile>();
                profile.role = role;
                profile.ResolveReferences();

                PrefabUtility.SaveAsPrefabAsset(wrapper, outputPath, out bool success);
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();

                if (!success)
                    throw new InvalidOperationException($"PrefabUtility failed to save {outputPath}");

                var saved = AssetDatabase.LoadAssetAtPath<GameObject>(outputPath);
                ValidatePrefab(saved, true);
                Selection.activeObject = saved;
                EditorGUIUtility.PingObject(saved);
                Debug.Log($"LIGHT MAZE: high fidelity {role} built at {outputPath} from {sourcePath}.");
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                EditorUtility.DisplayDialog("LIGHT MAZE // Build failed", ex.Message, "OK");
            }
            finally
            {
                if (wrapper != null) DestroyImmediate(wrapper);
            }
        }

        void ApplySurfaceOverrides(GameObject root)
        {
            foreach (var renderer in root.GetComponentsInChildren<Renderer>(true))
            {
                var materials = renderer.sharedMaterials;
                bool changed = false;
                for (int i = 0; i < materials.Length; i++)
                {
                    var current = materials[i];
                    string signature = (renderer.name + " " + (current != null ? current.name : string.Empty)).ToLowerInvariant();
                    Material replacement = null;

                    if (ContainsAny(signature, "hair", "brow", "lash")) replacement = hairOverride;
                    else if (ContainsAny(signature, "skin", "face", "head", "body", "eye")) replacement = skinOverride;
                    else if (ContainsAny(signature, "armor", "armour", "metal", "plate", "gauntlet", "greave", "helmet")) replacement = armorOverride;
                    else if (ContainsAny(signature, "cloth", "fabric", "cape", "cloak", "coat", "robe", "scarf", "skirt")) replacement = clothOverride;

                    if (replacement != null && replacement != current)
                    {
                        materials[i] = replacement;
                        changed = true;
                    }
                }
                if (changed) renderer.sharedMaterials = materials;
            }
        }

        static void CreateContractSockets(Transform wrapper, Animator animator)
        {
            var root = ProductionAssetContract.FindDeep(wrapper, "Root") ?? NewSocket(wrapper, "Root");
            var model = ProductionAssetContract.FindDeep(wrapper, "Model") ?? NewSocket(wrapper, "Model");

            Transform rightHand = null;
            Transform leftHand = null;
            Transform chest = null;
            if (animator != null && animator.avatar != null && animator.avatar.isHuman)
            {
                rightHand = animator.GetBoneTransform(HumanBodyBones.RightHand);
                leftHand = animator.GetBoneTransform(HumanBodyBones.LeftHand);
                chest = animator.GetBoneTransform(HumanBodyBones.UpperChest) ?? animator.GetBoneTransform(HumanBodyBones.Chest);
            }

            NewSocket(rightHand != null ? rightHand : model, "WeaponSocket_R");
            NewSocket(leftHand != null ? leftHand : model, "WeaponSocket_L");
            NewSocket(chest != null ? chest : model, "ChestLightSocket");
            NewSocket(rightHand != null ? rightHand : model, "CastSocket");
            NewSocket(chest != null ? chest : model, "HitVfxSocket");

            root.SetSiblingIndex(0);
            model.SetSiblingIndex(Mathf.Min(1, wrapper.childCount - 1));
        }

        static Transform NewSocket(Transform parent, string name)
        {
            var existing = ProductionAssetContract.FindDeep(parent, name);
            if (existing != null) return existing;
            var go = new GameObject(name).transform;
            go.SetParent(parent, false);
            return go;
        }

        static void TryBuildNamedLods(GameObject sourceInstance)
        {
            var all = sourceInstance.GetComponentsInChildren<Renderer>(true);
            var lod0 = all.Where(r => NameHasLod(r.name, 0)).ToArray();
            var lod1 = all.Where(r => NameHasLod(r.name, 1)).ToArray();
            var lod2 = all.Where(r => NameHasLod(r.name, 2)).ToArray();
            if (lod0.Length == 0 || lod1.Length == 0) return;

            var target = sourceInstance.GetComponent<LODGroup>() ?? sourceInstance.AddComponent<LODGroup>();
            var lods = new List<LOD> { new LOD(.58f, lod0), new LOD(.25f, lod1) };
            if (lod2.Length > 0) lods.Add(new LOD(.08f, lod2));
            target.SetLODs(lods.ToArray());
            target.RecalculateBounds();
        }

        static bool NameHasLod(string name, int lod)
        {
            string lower = name.ToLowerInvariant();
            return lower.Contains($"lod{lod}") || lower.Contains($"lod_{lod}") || lower.Contains($"lod-{lod}");
        }

        [MenuItem("LIGHT MAZE/Production/Validate High Fidelity Characters")]
        static void ValidateAllMenu() => ValidateAll();

        static void ValidateAll()
        {
            int pass = 0;
            int fail = 0;
            foreach (ProductionRole role in Enum.GetValues(typeof(ProductionRole)))
            {
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(GetOutputPath(role));
                if (ValidatePrefab(prefab, false)) pass++; else fail++;
            }

            string summary = $"LIGHT MAZE: high fidelity character validation complete. PASS {pass} / FAIL {fail}.";
            if (fail == 0) Debug.Log(summary); else Debug.LogWarning(summary);
            EditorUtility.DisplayDialog("LIGHT MAZE // Character Validation", summary + "\nSee Console for details.", "OK");
        }

        static bool ValidatePrefab(GameObject prefab, bool showDialog)
        {
            if (prefab == null)
            {
                Debug.LogWarning("LIGHT MAZE: production character prefab missing.");
                return false;
            }

            bool ok = true;
            var messages = new List<string>();
            var profile = prefab.GetComponent<HighFidelityCharacterProfile>();
            if (profile == null)
            {
                ok = false;
                messages.Add("ERROR profile missing");
            }
            else if (!profile.ValidateRuntimeContract(out string runtimeReport))
            {
                ok = false;
                messages.Add(runtimeReport.Trim());
            }

            var animator = prefab.GetComponentInChildren<Animator>(true);
            if (animator == null)
            {
                ok = false;
                messages.Add("ERROR Animator missing");
            }
            else
            {
                if (animator.avatar == null) messages.Add("WARN Animator has no Avatar");
                else if (profile != null && profile.role != ProductionRole.RiftWolf && !animator.avatar.isHuman)
                    messages.Add("WARN biped role is not configured as Humanoid");
                if (animator.runtimeAnimatorController == null)
                    messages.Add("WARN Animator Controller is not assigned; ProductionAnimatorBridge will have no states to drive");
            }

            long triangles = CountTriangles(prefab);
            int renderers = prefab.GetComponentsInChildren<Renderer>(true).Length;
            int materials = prefab.GetComponentsInChildren<Renderer>(true)
                .SelectMany(r => r.sharedMaterials)
                .Where(m => m != null)
                .Distinct()
                .Count();

            if (triangles > 0 && triangles < 50000 && profile != null && profile.role == ProductionRole.PlayerExplorer)
                messages.Add($"WARN player is only ~{triangles:N0} triangles; likely still visually low-density for the target art bar");
            if (prefab.GetComponentInChildren<LODGroup>(true) == null)
                messages.Add("WARN no LODGroup found; acceptable for a vertical slice, but add LODs before shipping");

            string header = $"LIGHT MAZE // {prefab.name}: {(ok ? "PASS" : "FAIL")} | {triangles:N0} tris | {renderers} renderers | {materials} materials";
            string report = header + (messages.Count > 0 ? "\n" + string.Join("\n", messages) : string.Empty);
            if (ok) Debug.Log(report, prefab); else Debug.LogError(report, prefab);

            if (showDialog)
                EditorUtility.DisplayDialog("LIGHT MAZE // Character built", report, "OK");
            return ok;
        }

        static long CountTriangles(GameObject prefab)
        {
            long total = 0;
            foreach (var filter in prefab.GetComponentsInChildren<MeshFilter>(true))
                total += CountMesh(filter.sharedMesh);
            foreach (var skin in prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true))
                total += CountMesh(skin.sharedMesh);
            return total;
        }

        static long CountMesh(Mesh mesh)
        {
            if (mesh == null) return 0;
            long total = 0;
            for (int i = 0; i < mesh.subMeshCount; i++)
                total += (long)mesh.GetIndexCount(i) / 3L;
            return total;
        }

        static bool ContainsAny(string value, params string[] tokens)
        {
            foreach (var token in tokens)
                if (value.Contains(token)) return true;
            return false;
        }

        static void EnsureOutputFolder()
        {
            if (AssetDatabase.IsValidFolder(OutputRoot)) return;
            Directory.CreateDirectory(OutputRoot);
            AssetDatabase.Refresh();
        }

        static string GetOutputPath(ProductionRole role) => $"{OutputRoot}/{GetPrefabName(role)}.prefab";

        static string GetPrefabName(ProductionRole role)
        {
            return role switch
            {
                ProductionRole.PlayerExplorer => "Player_Explorer",
                ProductionRole.ShadowSoldier => "Enemy_ShadowSoldier",
                ProductionRole.RiftWolf => "Enemy_RiftWolf",
                ProductionRole.AbyssGuardian => "Enemy_AbyssGuardian",
                _ => role.ToString()
            };
        }
    }
}
#endif
