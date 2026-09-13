using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace LightMaze.Visuals
{
    public sealed class PresentationLimiter : MonoBehaviour
    {
        float nextLightTune;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Inject()
        {
            if (SceneManager.GetActiveScene().name != "SampleScene") return;
            if (Object.FindFirstObjectByType<PresentationLimiter>() != null) return;
            new GameObject("LIGHT MAZE // Presentation Limiter").AddComponent<PresentationLimiter>();
        }

        IEnumerator Start()
        {
            yield return null;
            yield return null;
            yield return null;

            foreach (var camera in Object.FindObjectsByType<Camera>(FindObjectsSortMode.None))
            {
                if (!camera.gameObject.activeInHierarchy) continue;
                camera.fieldOfView = 53f;
            }

            foreach (var volume in Object.FindObjectsByType<Volume>(FindObjectsSortMode.None))
            {
                if (volume.profile == null) continue;

                if (volume.profile.TryGet<Bloom>(out var bloom))
                {
                    bloom.intensity.Override(.28f);
                    bloom.threshold.Override(1.05f);
                    bloom.scatter.Override(.5f);
                }

                if (volume.profile.TryGet<ColorAdjustments>(out var color))
                {
                    color.postExposure.Override(-.72f);
                    color.contrast.Override(22f);
                    color.saturation.Override(-10f);
                    color.colorFilter.Override(new Color(.9f, .95f, 1f));
                }

                if (volume.profile.TryGet<Vignette>(out var vignette))
                {
                    vignette.intensity.Override(.22f);
                    vignette.smoothness.Override(.68f);
                }

                if (volume.profile.TryGet<Tonemapping>(out var tonemapping))
                    tonemapping.mode.Override(TonemappingMode.ACES);
            }

            TuneLights();
        }

        void LateUpdate()
        {
            if (Time.unscaledTime < nextLightTune) return;
            nextLightTune = Time.unscaledTime + .25f;
            TuneLights();
        }

        static void TuneLights()
        {
            foreach (var light in Object.FindObjectsByType<Light>(FindObjectsSortMode.None))
            {
                if (light.type != LightType.Point) continue;
                light.shadows = LightShadows.None;

                string n = light.gameObject.name;
                float cap = n.Contains("Light Bolt") ? 2.4f
                    : n.Contains("LIGHT Core") ? 3.4f
                    : 1.65f;
                light.intensity = Mathf.Min(light.intensity, cap);
            }
        }
    }
}
