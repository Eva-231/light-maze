using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace LightMaze.Production
{
    public sealed class ProductionEnvironment : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Inject()
        {
            if(SceneManager.GetActiveScene().name!="SampleScene") return;
            var prefab=Resources.Load<GameObject>("LightMazeProduction/Environment/Abyss_Cathedral");
            if(prefab) Instantiate(prefab);
        }
        IEnumerator Start()
        {
            // The established bootstrap and presentation passes finish before the art override.
            for(int i=0;i<6;i++) yield return null;
            var chamber=GameObject.Find("Abyss Chamber");
            if(chamber)
                foreach(var r in chamber.GetComponentsInChildren<Renderer>()) r.enabled=false;
            foreach(var go in SceneManager.GetActiveScene().GetRootGameObjects())
                if(go.name=="Abyss Silhouette Pass") foreach(var r in go.GetComponentsInChildren<Renderer>()) r.enabled=false;
            RenderSettings.fogDensity=.018f;
            RenderSettings.fogColor=new Color(.012f,.024f,.045f);
            RenderSettings.ambientSkyColor=new Color(.3f,.36f,.46f);
            RenderSettings.ambientEquatorColor=new Color(.18f,.22f,.3f);
            RenderSettings.ambientMode=AmbientMode.Trilight;
            RenderSettings.ambientGroundColor=new Color(.08f,.1f,.14f);
            var fill=new GameObject("Cathedral silver fill").AddComponent<Light>();
            fill.transform.SetParent(transform,false);
            fill.type=LightType.Directional;fill.shadows=LightShadows.None;
            fill.color=new Color(.82f,.87f,1f);fill.intensity=1.25f;
            fill.transform.rotation=Quaternion.Euler(25,155,0);
            DynamicGI.UpdateEnvironment();
            if(Camera.main)
            {
                var data=Camera.main.GetUniversalAdditionalCameraData();
                data.renderPostProcessing=true;
                data.antialiasing=Application.isMobilePlatform?AntialiasingMode.FastApproximateAntialiasing:AntialiasingMode.SubpixelMorphologicalAntiAliasing;
                Camera.main.backgroundColor=RenderSettings.fogColor;
                Camera.main.clearFlags=CameraClearFlags.SolidColor;
            }
            foreach(var light in FindObjectsByType<Light>(FindObjectsSortMode.None))
                if(light.type==LightType.Directional && light.isActiveAndEnabled && light!=fill)
                { light.intensity=.95f; light.color=new Color(.64f,.78f,1f); }
            foreach(var volume in GetComponentsInChildren<Volume>())
            {
                volume.profile=Instantiate(volume.sharedProfile);
                if(volume.profile.TryGet<ColorAdjustments>(out var c)) c.postExposure.Override(.15f);
                if(volume.profile.TryGet<Bloom>(out var b)) {b.threshold.Override(1.15f);b.intensity.Override(.28f);}
            }
            if(Application.isMobilePlatform)
                foreach(var light in GetComponentsInChildren<Light>()) {light.shadows=LightShadows.None;light.enabled=false;}
        }
    }
}
