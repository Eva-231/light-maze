using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using LightMaze.CameraSystem;
using LightMaze.Enemies;
using LightMaze.Visuals;

namespace LightMaze.Combat
{
    public sealed class LightMazePlayerCombat : MonoBehaviour
    {
        PlayerVitals vitals;
        Transform castOrigin;
        Camera aimCamera;
        Light coreLight;
        PrototypeOrbitCamera orbitCamera;

        float lightValue = 100f;
        const float MaxLight = 100f;
        const float LightDrainPerSecond = .28f;
        const float BoltCost = 6f;
        const float IceCost = 16f;
        const float HealCost = 20f;
        const float IceRadius = 14f;
        const float IceDamage = 26f;
        const float IceFreeze = 3.2f;
        float nextBoltTime;
        bool subscribed;

        public float LightValue => lightValue;

        public void Configure(PlayerVitals playerVitals, Transform origin, Camera camera, Light light, PrototypeOrbitCamera orbit)
        {
            vitals = playerVitals;
            castOrigin = origin;
            aimCamera = camera;
            coreLight = light;
            orbitCamera = orbit;
            EnsureSubscribed();
        }

        void Awake()
        {
            if (vitals == null) vitals = GetComponent<PlayerVitals>();
            lightValue = MaxLight;
        }

        void Start() => EnsureSubscribed();

        void OnDestroy()
        {
            if (subscribed && vitals != null)
                vitals.Damaged -= OnDamaged;
        }

        void EnsureSubscribed()
        {
            if (subscribed || vitals == null) return;
            vitals.Damaged += OnDamaged;
            subscribed = true;
        }

        void Update()
        {
            if (vitals == null) return;

            if (vitals.IsDead)
            {
                if (Keyboard.current != null && Keyboard.current.rKey.wasPressedThisFrame)
                    SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
                return;
            }

            lightValue = Mathf.Max(0f, lightValue - LightDrainPerSecond * Time.deltaTime);
            UpdateCoreLight();

            var keyboard = Keyboard.current;
            var mouse = Mouse.current;

            bool boltPressed = (mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState == CursorLockMode.Locked)
                || (keyboard != null && keyboard.jKey.wasPressedThisFrame);

            if (boltPressed) CastLightBolt();
            if (keyboard != null && keyboard.qKey.wasPressedThisFrame) CastIceNova();
            if (keyboard != null && keyboard.eKey.wasPressedThisFrame) CastHeal();
        }

        void UpdateCoreLight()
        {
            if (coreLight == null) return;
            float t = lightValue / MaxLight;
            coreLight.intensity = Mathf.Lerp(1.1f, 7.2f, t);
            coreLight.range = Mathf.Lerp(3.5f, 10f, t);
        }

        void CastLightBolt()
        {
            if (Time.time < nextBoltTime || vitals == null || !vitals.SpendMp(BoltCost)) return;
            nextBoltTime = Time.time + .22f;

            Vector3 origin = castOrigin != null ? castOrigin.position : transform.position + Vector3.up * 1.2f;
            Vector3 direction = aimCamera != null ? aimCamera.transform.forward : transform.forward;

            var bolt = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            bolt.name = "Light Bolt";
            bolt.transform.position = origin;
            bolt.transform.localScale = Vector3.one * .24f;
            bolt.GetComponent<Renderer>().material = PrototypeVfx.CreateLitMaterial(
                new Color(.35f, .72f, 1f),
                new Color(.35f, .82f, 1f) * 7f,
                .85f);

            var light = bolt.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = new Color(.35f, .75f, 1f);
            light.intensity = 5f;
            light.range = 4.5f;

            var trail = bolt.AddComponent<TrailRenderer>();
            trail.time = .18f;
            trail.startWidth = .18f;
            trail.endWidth = 0f;
            trail.minVertexDistance = .03f;
            trail.material = PrototypeVfx.CreateUnlitMaterial(new Color(.45f, .85f, 1f) * 2.8f);

            var projectile = bolt.AddComponent<LightBoltProjectile>();
            projectile.Configure(direction, transform, 18f);
            PrototypeVfx.SpawnRing(origin, new Color(.45f, .85f, 1f) * 2f, .65f, .16f, .035f);
        }

        void CastIceNova()
        {
            if (vitals == null || !vitals.SpendMp(IceCost)) return;

            var hitEnemies = new HashSet<PrototypeEnemy>();
            foreach (var hit in Physics.OverlapSphere(transform.position, IceRadius, ~0, QueryTriggerInteraction.Ignore))
            {
                var enemy = hit.GetComponentInParent<PrototypeEnemy>();
                if (enemy == null || !hitEnemies.Add(enemy)) continue;
                enemy.TakeDamage(IceDamage);
                enemy.Freeze(IceFreeze);
            }

            PrototypeVfx.SpawnIceNova(transform.position, IceRadius);
            orbitCamera?.Shake(.22f, .18f);
        }

        void CastHeal()
        {
            if (vitals == null || !vitals.SpendMp(HealCost)) return;
            vitals.Heal(30f);
            PrototypeVfx.SpawnHealAura(transform.position);
        }

        void OnDamaged(float amount)
        {
            orbitCamera?.Shake(Mathf.Lerp(.08f, .22f, Mathf.Clamp01(amount / 25f)), .13f);
        }

        void OnGUI()
        {
            if (vitals == null) return;

            const float x = 24f;
            const float y = 24f;
            const float w = 260f;
            const float h = 18f;

            var titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 24,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(.82f, .9f, 1f) }
            };
            GUI.Label(new Rect(x, y - 4f, 380f, 36f), "LIGHT MAZE  //  VERTICAL SLICE", titleStyle);

            DrawBar(new Rect(x, y + 40f, w, h), vitals.Hp / vitals.MaxHp, new Color(.8f, .12f, .14f), $"HP  {Mathf.CeilToInt(vitals.Hp)} / {Mathf.CeilToInt(vitals.MaxHp)}");
            DrawBar(new Rect(x, y + 64f, w, h), vitals.Mp / vitals.MaxMp, new Color(.18f, .48f, 1f), $"MP  {Mathf.CeilToInt(vitals.Mp)} / {Mathf.CeilToInt(vitals.MaxMp)}");
            DrawBar(new Rect(x, y + 88f, w, h), lightValue / MaxLight, new Color(.52f, .86f, 1f), $"LIGHT  {Mathf.CeilToInt(lightValue)} / 100");

            var helpStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 15,
                normal = { textColor = new Color(.78f, .82f, .9f) }
            };
            GUI.Label(new Rect(x, y + 118f, 520f, 90f), "WASD Move  |  Shift Sprint  |  Space Dodge\nLMB / J Light Bolt  |  Q Ice Nova  |  E Heal  |  Esc Cursor", helpStyle);

            if (vitals.IsDead)
            {
                var deadStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 34,
                    alignment = TextAnchor.MiddleCenter,
                    fontStyle = FontStyle.Bold,
                    normal = { textColor = new Color(1f, .35f, .35f) }
                };
                GUI.Label(new Rect(Screen.width * .5f - 260f, Screen.height * .5f - 60f, 520f, 120f), "LIGHT LOST\nPress R to restart", deadStyle);
            }
        }

        static void DrawBar(Rect rect, float value, Color fill, string label)
        {
            value = Mathf.Clamp01(value);
            Color previous = GUI.color;
            GUI.color = new Color(.035f, .045f, .065f, .92f);
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = fill;
            GUI.DrawTexture(new Rect(rect.x + 2f, rect.y + 2f, (rect.width - 4f) * value, rect.height - 4f), Texture2D.whiteTexture);
            GUI.color = Color.white;
            GUI.Label(new Rect(rect.x + 7f, rect.y - 1f, rect.width, rect.height + 4f), label);
            GUI.color = previous;
        }
    }
}
