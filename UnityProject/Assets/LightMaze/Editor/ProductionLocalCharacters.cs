using System;
using UnityEditor;
using UnityEngine;

namespace LightMaze.EditorTools
{
    // Asset Store data stays local. The public repository contains the recipe only.
    [InitializeOnLoad]
    public sealed class ProductionLocalCharacters : AssetPostprocessor
    {
        const string Source = "Assets/URP GanzSe Free Modular Character Pack/Prefabs/Modular Character/GanzSe Free Modular Character Update 1_1.prefab";
        const string Models = "Assets/LightMaze/Production/Resources/LightMazeProduction/Models/";
        static bool queued, building, failed;
        static ProductionLocalCharacters() { Schedule(); }
        static void OnPostprocessAllAssets(string[] imported, string[] deleted, string[] moved, string[] movedFrom)
        {
            if (!building) Schedule();
        }
        static void Schedule()
        {
            if (queued || building || failed) return;
            queued = true;
            EditorApplication.delayCall += GenerateMissing;
        }
        static void GenerateMissing()
        {
            queued = false;
            if (EditorApplication.isPlayingOrWillChangePlaymode || EditorApplication.isCompiling || EditorApplication.isUpdating)
            { Schedule(); return; }
            if (AssetDatabase.LoadAssetAtPath<GameObject>(Source) == null) return;
            if (AssetDatabase.LoadAssetAtPath<GameObject>(Models + "Player_Explorer.prefab") != null &&
                AssetDatabase.LoadAssetAtPath<GameObject>(Models + "Enemy_ShadowSoldier.prefab") != null &&
                AssetDatabase.LoadAssetAtPath<GameObject>(Models + "Enemy_AbyssGuardian.prefab") != null) return;
            building = true;
            try { ProductionCharacterBuilder.Build(); }
            catch (Exception ex)
            {
                failed = true;
                Debug.LogException(ex);
                Debug.LogWarning("Local character generation failed. Check the GanzSe import, then use LIGHT MAZE > Production > 6. Build Characters.");
            }
            finally { building = false; }
        }
    }
}
