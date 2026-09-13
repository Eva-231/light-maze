using UnityEngine;

namespace LightMaze.Visuals
{
    public static class PrototypeVfx
    {
        public static Material CreateLitMaterial(Color baseColor, Color emission, float smoothness = .45f)
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            var material = new Material(shader) { name = "LM_RuntimeLit" };

            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", baseColor);
            else if (material.HasProperty("_Color")) material.SetColor("_Color", baseColor);

            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            if (material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", emission);
            }
            return material;
        }

        public static Material CreateUnlitMaterial(Color color)
        {
            Shader shader = Shader.Find("Universal Render Pipeline/Unlit");
            if (shader == null) shader = Shader.Find("Unlit/Color");
            var material = new Material(shader) { name = "LM_RuntimeUnlit" };
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            else if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            return material;
        }

        public static void RemoveCollider(GameObject go)
        {
            var collider = go.GetComponent<Collider>();
            if (collider != null) Object.Destroy(collider);
        }

        public static void SpawnRing(Vector3 position, Color color, float radius, float life = .55f, float width = .07f)
        {
            var root = new GameObject("LIGHT Ring FX");
            root.transform.position = position + Vector3.up * .04f;
            var lr = root.AddComponent<LineRenderer>();
            lr.useWorldSpace = false;
            lr.loop = true;
            lr.positionCount = 64;
            lr.widthMultiplier = width;
            lr.numCornerVertices = 2;
            lr.material = CreateUnlitMaterial(color);

            for (int i = 0; i < lr.positionCount; i++)
            {
                float a = i / (float)lr.positionCount * Mathf.PI * 2f;
                lr.SetPosition(i, new Vector3(Mathf.Cos(a), 0f, Mathf.Sin(a)));
            }

            var fx = root.AddComponent<PrototypeRingFx>();
            fx.Configure(radius, life);
        }

        public static void SpawnBurst(Vector3 position, Color color, float radius = 1f, int count = 12)
        {
            for (int i = 0; i < count; i++)
            {
                var orb = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                orb.name = "LIGHT Burst";
                orb.transform.position = position;
                orb.transform.localScale = Vector3.one * Random.Range(.05f, .12f);
                RemoveCollider(orb);
                orb.GetComponent<Renderer>().material = CreateUnlitMaterial(color);

                Vector3 direction = (Random.onUnitSphere + Vector3.up * .65f).normalized;
                var mover = orb.AddComponent<PrototypeBurstParticle>();
                mover.Configure(direction * Random.Range(2.5f, 6f), Random.Range(.3f, .65f));
            }
        }

        public static void SpawnIceNova(Vector3 position, float radius)
        {
            Color ice = new Color(.35f, .82f, 1f, 1f);
            SpawnRing(position, ice * 2.2f, radius, .65f, .1f);
            SpawnRing(position, Color.white * 2f, radius * .72f, .48f, .045f);

            for (int i = 0; i < 18; i++)
            {
                float a = i / 18f * Mathf.PI * 2f;
                Vector3 dir = new Vector3(Mathf.Cos(a), 0f, Mathf.Sin(a));
                Vector3 p = position + dir * Random.Range(radius * .45f, radius * .88f);
                var shard = GameObject.CreatePrimitive(PrimitiveType.Cube);
                shard.name = "Ice Nova Shard";
                shard.transform.position = p + Vector3.up * .2f;
                shard.transform.rotation = Quaternion.Euler(Random.Range(-8f, 8f), -a * Mathf.Rad2Deg, Random.Range(-8f, 8f));
                shard.transform.localScale = new Vector3(.11f, Random.Range(.8f, 1.8f), .11f);
                RemoveCollider(shard);
                shard.GetComponent<Renderer>().material = CreateLitMaterial(new Color(.12f, .28f, .42f), ice * 4f, .8f);
                var fx = shard.AddComponent<PrototypeCrystalFx>();
                fx.Configure(Random.Range(.45f, .8f));
            }
        }

        public static void SpawnHealAura(Vector3 position)
        {
            Color heal = new Color(.35f, 1f, .88f, 1f);
            SpawnRing(position, heal * 2f, 2.2f, .8f, .08f);
            SpawnRing(position + Vector3.up * .02f, Color.white * 2f, 1.25f, .55f, .04f);
            SpawnBurst(position + Vector3.up, heal * 2.5f, 1f, 16);
        }
    }

    public sealed class PrototypeRingFx : MonoBehaviour
    {
        float radius;
        float life;
        float age;

        public void Configure(float targetRadius, float duration)
        {
            radius = targetRadius;
            life = Mathf.Max(.05f, duration);
            transform.localScale = Vector3.one * .05f;
        }

        void Update()
        {
            age += Time.deltaTime;
            float t = Mathf.Clamp01(age / life);
            float eased = 1f - Mathf.Pow(1f - t, 3f);
            transform.localScale = Vector3.one * Mathf.Lerp(.05f, radius, eased);
            if (age >= life) Destroy(gameObject);
        }
    }

    public sealed class PrototypeBurstParticle : MonoBehaviour
    {
        Vector3 velocity;
        float life;
        float age;
        Vector3 initialScale;

        public void Configure(Vector3 initialVelocity, float duration)
        {
            velocity = initialVelocity;
            life = duration;
            initialScale = transform.localScale;
        }

        void Update()
        {
            age += Time.deltaTime;
            transform.position += velocity * Time.deltaTime;
            velocity += Vector3.down * 3f * Time.deltaTime;
            float t = Mathf.Clamp01(age / Mathf.Max(.01f, life));
            transform.localScale = initialScale * (1f - t);
            if (age >= life) Destroy(gameObject);
        }
    }

    public sealed class PrototypeCrystalFx : MonoBehaviour
    {
        float life;
        float age;
        Vector3 initialScale;

        public void Configure(float duration)
        {
            life = duration;
            initialScale = transform.localScale;
            transform.localScale = new Vector3(initialScale.x, .02f, initialScale.z);
        }

        void Update()
        {
            age += Time.deltaTime;
            float t = Mathf.Clamp01(age / Mathf.Max(.01f, life));
            float grow = Mathf.Sin(t * Mathf.PI);
            transform.localScale = new Vector3(initialScale.x, initialScale.y * grow, initialScale.z);
            if (age >= life) Destroy(gameObject);
        }
    }
}
