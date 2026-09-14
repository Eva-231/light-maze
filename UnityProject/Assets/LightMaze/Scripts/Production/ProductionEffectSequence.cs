using UnityEngine;

namespace LightMaze.Production
{
    // Presentation only: the combat runtime owns damage, resource costs and lifetime.
    public sealed class ProductionEffectSequence : MonoBehaviour
    {
        [System.Serializable]
        public class Layer
        {
            public Transform target;
            public float delay, attack = .12f, hold = .25f, release = .7f;
            public Vector3 initialScale = Vector3.one;
            public Vector3 finalScale = Vector3.one;
            public Vector3 velocity;
            public float rotation;
            public bool secondary;
        }
        public Layer[] layers;
        public bool looping;
        float clock;
        Vector3[] origins;
        Quaternion[] rotations;
        Renderer[][] renderers;
        MaterialPropertyBlock block;
        bool mobile;

        void Awake()
        {
            block = new MaterialPropertyBlock();
            mobile = Application.isMobilePlatform;
            int count = layers == null ? 0 : layers.Length;
            origins = new Vector3[count]; rotations = new Quaternion[count];
            renderers = new Renderer[count][];
            for (int i = 0; i < count; i++)
            {
                var l = layers[i];
                if (!l.target) continue;
                origins[i] = l.target.localPosition; rotations[i] = l.target.localRotation;
                renderers[i] = l.target.GetComponentsInChildren<Renderer>(true);
            }
            Evaluate(0f);
            if (mobile)
                foreach (var ps in GetComponentsInChildren<ParticleSystem>())
                {
                    var main = ps.main; main.maxParticles = Mathf.Max(8, main.maxParticles / 2);
                    var emission = ps.emission; emission.rateOverTimeMultiplier *= .45f;
                }
        }
        void Update() { clock += Time.deltaTime; Evaluate(clock); }
        void Evaluate(float time)
        {
            for (int i = 0; i < origins.Length; i++)
            {
                var l = layers[i]; if (!l.target) continue;
                float t = time - l.delay;
                float total = l.attack + l.hold + l.release;
                if (looping && t >= 0f) t %= Mathf.Max(.01f, total);
                bool visible = t >= 0f && t < total && !(mobile && l.secondary);
                l.target.gameObject.SetActive(visible);
                if (!visible) continue;
                float rise = Mathf.Clamp01(t / Mathf.Max(.001f, l.attack));
                float fade = 1f - Mathf.Clamp01((t - l.attack - l.hold) / Mathf.Max(.001f, l.release));
                l.target.localScale = Vector3.Lerp(l.initialScale, l.finalScale, 1f - Mathf.Pow(1f - rise, 3f));
                l.target.localPosition = origins[i] + l.velocity * t;
                l.target.localRotation = rotations[i] * Quaternion.Euler(0f, l.rotation * t, 0f);
                foreach (var r in renderers[i])
                {
                    r.GetPropertyBlock(block);
                    block.SetFloat("_Opacity", fade * Mathf.Min(1f, rise * 5f));
                    r.SetPropertyBlock(block);
                }
                // Opaque crystals retract into the floor instead of using expensive transparency.
                if (l.target.name.StartsWith("Ice crown"))
                    l.target.localScale = Vector3.Scale(l.target.localScale, new Vector3(1f, Mathf.SmoothStep(0f, 1f, fade), 1f));
            }
        }
    }
}
