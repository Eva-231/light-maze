#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using LightMaze.Production;

namespace LightMaze.EditorTools
{
    public sealed class HighFidelityCharacterFinishingWindow : EditorWindow
    {
        ProductionRole role = ProductionRole.PlayerExplorer;
        GameObject rightWeaponPrefab;
        GameObject leftWeaponPrefab;
        GameObject chestCorePrefab;

        Vector3 rightWeaponPosition;
        Vector3 rightWeaponEuler;
        Vector3 rightWeaponScale = Vector3.one;
        Vector3 leftWeaponPosition;
        Vector3 leftWeaponEuler;
        Vector3 leftWeaponScale = Vector3.one;
        Vector3 corePosition;
        Vector3 coreEuler;
        Vector3 coreScale = Vector3.one;

        bool replaceManagedAccessories = true;
        Vector2 scroll;

        [MenuItem("LIGHT MAZE/Production/High Fidelity Character Finishing")]
        static void Open()
        {
            GetWindow<HighFidelityCharacterFinishingWindow>("HF Character Finishing");
        }

        void OnGUI()
        {
            scroll = EditorGUILayout.BeginScrollView(scroll);
            EditorGUILayout.Space(8);
            EditorGUILayout.LabelField("LIGHT MAZE // High Fidelity Character Finishing", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "Run this after the High Fidelity Character Pipeline has built the production prefab. It binds premium weapon/LIGHT-core prefabs to the runtime socket contract and validates the exact Animator parameters consumed by ProductionAnimatorBridge.",
                MessageType.Info);

            role = (ProductionRole)EditorGUILayout.EnumPopup("Production role", role);
            EditorGUILayout.LabelField("Target prefab", GetOutputPath(role), EditorStyles.wordWrappedMiniLabel);

            EditorGUILayout.Space(8);
            EditorGUILayout.LabelField("Right-hand weapon", EditorStyles.boldLabel);
            rightWeaponPrefab = (GameObject)EditorGUILayout.ObjectField("Prefab", rightWeaponPrefab, typeof(GameObject), false);
            rightWeaponPosition = EditorGUILayout.Vector3Field("Local Position", rightWeaponPosition);
            rightWeaponEuler = EditorGUILayout.Vector3Field("Local Rotation", rightWeaponEuler);
            rightWeaponScale = EditorGUILayout.Vector3Field("Local Scale", rightWeaponScale);

            EditorGUILayout.Space(6);
            EditorGUILayout.LabelField("Left-hand weapon / off-hand", EditorStyles.boldLabel);
            leftWeaponPrefab = (GameObject)EditorGUILayout.ObjectField("Prefab", leftWeaponPrefab, typeof(GameObject), false);
            leftWeaponPosition = EditorGUILayout.Vector3Field("Local Position", leftWeaponPosition);
            leftWeaponEuler = EditorGUILayout.Vector3Field("Local Rotation", leftWeaponEuler);
            leftWeaponScale = EditorGUILayout.Vector3Field("Local Scale", leftWeaponScale);

            EditorGUILayout.Space(6);
            EditorGUILayout.LabelField("Chest LIGHT core", EditorStyles.boldLabel);
            chestCorePrefab = (GameObject)EditorGUILayout.ObjectField("Prefab", chestCorePrefab, typeof(GameObject), false);
            corePosition = EditorGUILayout.Vector3Field("Local Position", corePosition);
            coreEuler = EditorGUILayout.Vector3Field("Local Rotation", coreEuler);
            coreScale = EditorGUILayout.Vector3Field("Local Scale", coreScale);

            replaceManagedAccessories = EditorGUILayout.Toggle("Replace managed accessories", replaceManagedAccessories);

            EditorGUILayout.Space(10);
            using (new EditorGUI.DisabledScope(AssetDatabase.LoadAssetAtPath<GameObject>(GetOutputPath(role)) == null))
            {
                if (GUILayout.Button("Apply Accessories + Validate", GUILayout.Height(34)))
                {
                    ApplyAccessories();
                    ValidateRole(role, true);
                }
            }

            if (GUILayout.Button("Validate Animator Contracts For All Characters", GUILayout.Height(28)))
                ValidateAllAnimatorContracts();

            EditorGUILayout.Space(10);
            EditorGUILayout.HelpBox(
                "This is integration tooling, not a mesh generator. Premium appearance still comes from the source model, textures, hair, armor and animation quality. The goal here is to make a high-end source asset swappable without touching gameplay code.",
                MessageType.Warning);
            EditorGUILayout.EndScrollView();
        }

        void ApplyAccessories()
        {
            string path = GetOutputPath(role);
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (prefab == null)
            {
                EditorUtility.DisplayDialog("LIGHT MAZE", $"Production prefab not found:\n{path}", "OK");
                return;
            }

            var root = PrefabUtility.LoadPrefabContents(path);
            try
            {
                AttachAccessory(root.transform, "WeaponSocket_R", rightWeaponPrefab, "__LM_Weapon_R",
                    rightWeaponPosition, rightWeaponEuler, rightWeaponScale);
                AttachAccessory(root.transform, "WeaponSocket_L", leftWeaponPrefab, "__LM_Weapon_L",
                    leftWeaponPosition, leftWeaponEuler, leftWeaponScale);
                AttachAccessory(root.transform, "ChestLightSocket", chestCorePrefab, "__LM_ChestLightCore",
                    corePosition, coreEuler, coreScale);

                var profile = root.GetComponent<HighFidelityCharacterProfile>();
                if (profile != null) profile.ResolveReferences();

                PrefabUtility.SaveAsPrefabAsset(root, path);
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();
                Debug.Log($"LIGHT MAZE: finishing accessories applied to {role} at {path}.");
            }
            catch (Exception ex)
            {
                Debug.LogException(ex);
                EditorUtility.DisplayDialog("LIGHT MAZE // Finishing failed", ex.Message, "OK");
            }
            finally
            {
                PrefabUtility.UnloadPrefabContents(root);
            }
        }

        void AttachAccessory(Transform root, string socketName, GameObject sourcePrefab, string managedName,
            Vector3 localPosition, Vector3 localEuler, Vector3 localScale)
        {
            if (sourcePrefab == null) return;

            var socket = ProductionAssetContract.FindDeep(root, socketName);
            if (socket == null)
                throw new InvalidOperationException($"Required socket '{socketName}' was not found.");

            var existing = socket.Find(managedName);
            if (existing != null)
            {
                if (!replaceManagedAccessories) return;
                DestroyImmediate(existing.gameObject);
            }

            GameObject instance = PrefabUtility.InstantiatePrefab(sourcePrefab) as GameObject;
            if (instance == null) instance = Instantiate(sourcePrefab);
            instance.name = managedName;
            instance.transform.SetParent(socket, false);
            instance.transform.localPosition = localPosition;
            instance.transform.localRotation = Quaternion.Euler(localEuler);
            instance.transform.localScale = SanitizeScale(localScale);
        }

        static Vector3 SanitizeScale(Vector3 value)
        {
            const float min = .0001f;
            return new Vector3(
                Mathf.Abs(value.x) < min ? min : value.x,
                Mathf.Abs(value.y) < min ? min : value.y,
                Mathf.Abs(value.z) < min ? min : value.z);
        }

        [MenuItem("LIGHT MAZE/Production/Validate High Fidelity Animator Contracts")]
        static void ValidateAllAnimatorContractsMenu() => ValidateAllAnimatorContracts();

        static void ValidateAllAnimatorContracts()
        {
            int pass = 0;
            int fail = 0;
            foreach (ProductionRole currentRole in Enum.GetValues(typeof(ProductionRole)))
            {
                if (ValidateRole(currentRole, false)) pass++; else fail++;
            }

            string summary = $"LIGHT MAZE: Animator contract validation complete. PASS {pass} / FAIL {fail}.";
            if (fail == 0) Debug.Log(summary); else Debug.LogWarning(summary);
            EditorUtility.DisplayDialog("LIGHT MAZE // Animator Contract", summary + "\nSee Console for details.", "OK");
        }

        static bool ValidateRole(ProductionRole role, bool showDialog)
        {
            string path = GetOutputPath(role);
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (prefab == null)
            {
                Debug.LogError($"LIGHT MAZE // {role}: FAIL - production prefab missing at {path}.");
                return false;
            }

            var messages = new List<string>();
            bool ok = true;
            var animator = prefab.GetComponentInChildren<Animator>(true);
            if (animator == null)
            {
                ok = false;
                messages.Add("ERROR Animator missing");
            }
            else
            {
                if (animator.runtimeAnimatorController == null)
                {
                    ok = false;
                    messages.Add("ERROR RuntimeAnimatorController missing");
                }
                else
                {
                    foreach (var requirement in GetAnimatorRequirements(role))
                    {
                        if (!HasParameter(animator, requirement.name, requirement.type))
                        {
                            ok = false;
                            messages.Add($"ERROR Animator parameter missing/wrong type: {requirement.name} ({requirement.type})");
                        }
                    }
                }

                if (role != ProductionRole.RiftWolf)
                {
                    if (animator.avatar == null)
                    {
                        ok = false;
                        messages.Add("ERROR Avatar missing for biped role");
                    }
                    else if (!animator.avatar.isHuman)
                    {
                        ok = false;
                        messages.Add("ERROR biped role is not configured as Humanoid");
                    }
                }
            }

            foreach (var socket in ProductionAssetContract.RequiredSockets)
            {
                if (ProductionAssetContract.FindDeep(prefab.transform, socket) == null)
                {
                    ok = false;
                    messages.Add($"ERROR required socket missing: {socket}");
                }
            }

            var profile = prefab.GetComponent<HighFidelityCharacterProfile>();
            if (profile == null)
            {
                ok = false;
                messages.Add("ERROR HighFidelityCharacterProfile missing");
            }

            string report = $"LIGHT MAZE // {role}: {(ok ? "PASS" : "FAIL")}";
            if (messages.Count > 0) report += "\n" + string.Join("\n", messages);
            if (ok) Debug.Log(report, prefab); else Debug.LogError(report, prefab);

            if (showDialog)
                EditorUtility.DisplayDialog("LIGHT MAZE // Character Finishing", report, "OK");
            return ok;
        }

        static bool HasParameter(Animator animator, string name, AnimatorControllerParameterType type)
        {
            foreach (var parameter in animator.parameters)
                if (parameter.name == name && parameter.type == type)
                    return true;
            return false;
        }

        static AnimatorRequirement[] GetAnimatorRequirements(ProductionRole role)
        {
            if (role == ProductionRole.PlayerExplorer)
            {
                return new[]
                {
                    new AnimatorRequirement("Speed", AnimatorControllerParameterType.Float),
                    new AnimatorRequirement("MoveSpeed01", AnimatorControllerParameterType.Float),
                    new AnimatorRequirement("Sprint", AnimatorControllerParameterType.Bool),
                    new AnimatorRequirement("Grounded", AnimatorControllerParameterType.Bool),
                    new AnimatorRequirement("Dead", AnimatorControllerParameterType.Bool),
                    new AnimatorRequirement("Dodge", AnimatorControllerParameterType.Trigger),
                    new AnimatorRequirement("CastBolt", AnimatorControllerParameterType.Trigger),
                    new AnimatorRequirement("CastIceNova", AnimatorControllerParameterType.Trigger),
                    new AnimatorRequirement("Heal", AnimatorControllerParameterType.Trigger)
                };
            }

            return new[]
            {
                new AnimatorRequirement("Speed", AnimatorControllerParameterType.Float),
                new AnimatorRequirement("Frozen", AnimatorControllerParameterType.Bool),
                new AnimatorRequirement("Dead", AnimatorControllerParameterType.Bool),
                new AnimatorRequirement("Attack", AnimatorControllerParameterType.Trigger),
                new AnimatorRequirement("HitReact", AnimatorControllerParameterType.Trigger),
                new AnimatorRequirement("Freeze", AnimatorControllerParameterType.Trigger),
                new AnimatorRequirement("Death", AnimatorControllerParameterType.Trigger)
            };
        }

        readonly struct AnimatorRequirement
        {
            public readonly string name;
            public readonly AnimatorControllerParameterType type;

            public AnimatorRequirement(string name, AnimatorControllerParameterType type)
            {
                this.name = name;
                this.type = type;
            }
        }

        static string GetOutputPath(ProductionRole role)
        {
            const string root = "Assets/LightMaze/Production/Resources/LightMazeProduction/Models";
            return $"{root}/{GetPrefabName(role)}.prefab";
        }

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
