using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using LightMaze.CameraSystem;
using LightMaze.Enemies;
using LightMaze.Visuals;
using LightMaze.Production;

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
        float helpVisibleUntil;
        bool helpPinned;
        bool subscribed;

        public float LightValue => lightValue;
        public event Action BoltCast;
        public event Action IceNovaCast;
        public event Action HealCast;

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
            helpVisibleUntil = Time.time + 7f;
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

            var keyboard = Keyboard.current;
            if (keyboard != null && keyboard.hKey.wasPressedThisFrame)
                helpPinned = !helpPinned;

            if (vitals.IsDead)
            {
                if (keyboard != null && keyboard.rKey.wasPressedThisFrame)
                    SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
                return;
            }

            lightValue = Mathf.Max(0f, lightValue - LightDrainPerSecond * Time.deltaTime);
            UpdateCoreLight();

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
            coreLight.intensity = Mathf.Lerp(.65f, 3.4f, t);
            coreLight.range = Mathf.Lerp(3f, 7.5f, t);
            coreLight.shadows = LightShadows.None;
        }

        void CastLightBolt()
        {
            if (Time.time < nextBoltTime || vitals == null || !vitals.SpendMp(BoltCost)) return;
            nextBoltTime = Time.time + .22f;

            Vector3 origin = castOrigin != null ? castOrigin.position : transform.position + Vector3.up * 1.2f;
            Vector3 direction = aimCamera != null ? aimCamera.transform.forward : transform.forward;

            BoltCast?.Invoke();

            var bolt = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            bolt.name = "Light Bolt";
            bolt.transform.position = origin;
            bolt.transform.localScale = Vector3.one * .21f;
            bolt.GetComponent<Renderer>().material = PrototypeVfx.CreateLitMaterial(
                new Color(.25f, .58f, .9f),
                new Color(.28f, .72f, 1f) * 4f,
                .85f);

            var light = bolt.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = new Color(.32f, .7f, 1f);
            light.intensity = 2.4f;
            light.range = 3.4f;
            light.shadows = LightShadows.None;

            var trail = bolt.AddComponent<TrailRenderer>();
            trail.time = .18f;
            trail.startWidth = .15f;
            trail.endWidth = 0f;
            trail.minVertexDistance = .03f;
            trail.material = PrototypeVfx.CreateUnlitMaterial(new Color(.4f, .8f, 1f) * 2f);

            var projectile = bolt.AddComponent<LightBoltProjectile>();
            projectile.Configure(direction, transform, 18f);
            ProductionFx.AttachBoltProjectile(bolt);
            ProductionFx.SpawnBoltCast(origin);
        }

        void CastIceNova()
        {
            if (vitals == null || !vitals.SpendMp(IceCost)) return;

            IceNovaCast?.Invoke();

            var hitEnemies = new HashSet<PrototypeEnemy>();
            foreach (var hit in Physics.OverlapSphere(transform.position, IceRadius, ~0, QueryTriggerInteraction.Ignore))
            {
                var enemy = hit.GetComponentInParent<PrototypeEnemy>();
                if (enemy == null || !hitEnemies.Add(enemy)) continue;
                enemy.TakeDamage(IceDamage);
                enemy.Freeze(IceFreeze);
            }

            ProductionFx.SpawnIceNova(transform.position, IceRadius);
            orbitCamera?.Shake(.18f, .16f);
        }

        void CastHeal()
        {
            if (vitals == null || !vitals.SpendMp(HealCost)) return;
            HealCast?.Invoke();
            vitals.Heal(30f);
            ProductionFx.SpawnHeal(transform.position);
        }

        void OnDamaged(float amount)
        {
            orbitCamera?.Shake(Mathf.Lerp(.07f, .18f, Mathf.Clamp01(amount / 25f)), .12f);
        }

        void OnGUI()
        {
            if (vitals == null) return;

            const float x = 18f;
            const float y = 14f;
            const float w = 210f;
            const float h = 14f;

            var titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 17,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(.8f, .88f, 1f) }
            };
            GUI.Label(new Rect(x, y, 300f, 28f), "L I G H T  M A Z E", titleStyle);

            DrawBar(new Rect(x, y + 30f, w, h), vitals.Hp / vitals.MaxHp, new Color(.53f, .12f, .18f), $"HP  {Mathf.CeilToInt(vitals.Hp)} / {Mathf.CeilToInt(vitals.MaxHp)}");
            DrawBar(new Rect(x, y + 49f, w, h), vitals.Mp / vitals.MaxMp, new Color(.16f, .42f, .6f), $"MP  {Mathf.CeilToInt(vitals.Mp)} / {Mathf.CeilToInt(vitals.MaxMp)}");
            DrawBar(new Rect(x, y + 68f, w, h), lightValue / MaxLight, new Color(.55f, .77f, .88f), $"LIGHT  {Mathf.CeilToInt(lightValue)}");

            var hintStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 11,
                normal = { textColor = new Color(.66f, .72f, .82f) }
            };
            GUI.Label(new Rect(x, y + 88f, 230f, 20f), "H : controls", hintStyle);

            if (helpPinned || Time.time <= helpVisibleUntil)
            {
                var helpStyle = new GUIStyle(GUI.skin.box)
                {
                    fontSize = 12,
                    alignment = TextAnchor.UpperLeft,
                    normal = { textColor = new Color(.82f, .86f, .93f) }
                };
                GUI.Box(new Rect(x, y + 108f, 275f, 60f), "WASD Move   Shift Sprint   Space Dodge\nLMB/J Bolt   Q Ice Nova   E Heal\nEsc Cursor   H Hide/Show", helpStyle);
            }

            if (vitals.IsDead)
            {
                var deadStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 30,
                    alignment = TextAnchor.MiddleCenter,
                    fontStyle = FontStyle.Bold,
                    normal = { textColor = new Color(1f, .3f, .3f) }
                };
                GUI.Label(new Rect(Screen.width * .5f - 240f, Screen.height * .5f - 55f, 480f, 110f), "LIGHT LOST\nPress R to restart", deadStyle);
            }
        }

        static void DrawBar(Rect rect, float value, Color fill, string label)
        {
            value = Mathf.Clamp01(value);
            Color previous = GUI.color;
            GUI.color = new Color(.018f, .026f, .045f, .92f);
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = fill;
            GUI.DrawTexture(new Rect(rect.x + 2f, rect.y + 2f, (rect.width - 4f) * value, rect.height - 4f), Texture2D.whiteTexture);
            GUI.color = Color.white;
            var barStyle = new GUIStyle(GUI.skin.label) { fontSize = 10, normal = { textColor = Color.white } };
            GUI.Label(new Rect(rect.x + 6f, rect.y - 2f, rect.width, rect.height + 5f), label, barStyle);
            GUI.color = previous;
        }
    }
}
