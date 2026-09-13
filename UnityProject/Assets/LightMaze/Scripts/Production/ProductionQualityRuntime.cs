using UnityEngine;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace LightMaze.Production
{
    public sealed class ProductionQualityRuntime : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Inject()
        {
            if (SceneManager.GetActiveScene().name != "SampleScene") return;
            if (Object.FindFirstObjectByType<ProductionQualityRuntime>() != null) return;
            new GameObject("LIGHT MAZE // Production Quality Runtime").AddComponent<ProductionQualityRuntime>();
        }

        void Start()
        {
            bool mobileTier = Application.isMobilePlatform || Application.platform == RuntimePlatform.WebGLPlayer;
            int qualityCount = QualitySettings.names.Length;
            if (qualityCount > 0)
            {
                int qualityIndex = mobileTier ? Mathf.Max(0, qualityCount - 2) : qualityCount - 1;
                QualitySettings.SetQualityLevel(qualityIndex, true);
            }

            QualitySettings.vSyncCount = 0;
            Application.targetFrameRate = 60;
            QualitySettings.shadowDistance = mobileTier ? 22f : 48f;
            QualitySettings.lodBias = mobileTier ? 1.25f : 2f;
            QualitySettings.maximumLODLevel = 0;
            QualitySettings.realtimeReflectionProbes = !mobileTier;

            var camera = Camera.main;
            if (camera != null && camera.TryGetComponent<UniversalAdditionalCameraData>(out var data))
            {
                data.renderPostProcessing = true;
                data.antialiasing = mobileTier
                    ? AntialiasingMode.FastApproximateAntialiasing
                    : AntialiasingMode.SubpixelMorphologicalAntiAliasing;
            }
        }
    }
}
