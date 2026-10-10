#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using LightMaze.Production;

namespace LightMaze.EditorTools
{
    public static class WindowsDevelopmentBuild
    {
        // Batch entry: -executeMethod LightMaze.EditorTools.WindowsDevelopmentBuild.Build
        // This produces a development build only; visual acceptance is a separate gate.
        [MenuItem("LIGHT MAZE/Build/Windows Development Build")]
        public static void Build()
        {
            if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Standalone, BuildTarget.StandaloneWindows64))
                throw new BuildFailedException("Windows x64 build support is not installed.");

            foreach (ProductionRole role in Enum.GetValues(typeof(ProductionRole)))
            {
                string resource = ProductionAssetContract.ModelPathFor(role);
                var model = Resources.Load<GameObject>(resource);
                if (model == null)
                    throw new BuildFailedException($"Missing production model: {resource}. Restore licensed local assets before building.");
                var animator = model.GetComponentInChildren<Animator>(true);
                if (animator == null || animator.runtimeAnimatorController == null)
                    throw new BuildFailedException($"Model has no working animation controller: {model.name}");
            }

            string output = Environment.GetEnvironmentVariable("LIGHT_MAZE_BUILD_OUTPUT");
            if (string.IsNullOrWhiteSpace(output)) output = "Builds/Windows/LightMaze.exe";
            output = Path.GetFullPath(output);
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { "Assets/Scenes/SampleScene.unity" },
                target = BuildTarget.StandaloneWindows64,
                locationPathName = output,
                options = BuildOptions.Development
            });
            if (report.summary.result != BuildResult.Succeeded)
                throw new BuildFailedException($"Windows build failed: {report.summary.result}; errors: {report.summary.totalErrors}");
            Debug.Log($"Windows development build: {output}; size: {report.summary.totalSize} bytes. Visual and gameplay acceptance still required.");
        }
    }
}
#endif
