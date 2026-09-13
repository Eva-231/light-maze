using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using LightMaze.Combat;
using LightMaze.Player;

namespace LightMaze.Production
{
    public sealed class ProductionCameraFeel : MonoBehaviour
    {
        Camera targetCamera;
        PrototypeThirdPersonMotor motor;
        LightMazePlayerCombat combat;
        float baseFov;
        float fovImpulse;
        bool wasDodging;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Inject()
        {
            if (SceneManager.GetActiveScene().name != "SampleScene") return;
            if (Object.FindFirstObjectByType<ProductionCameraFeel>() != null) return;
            new GameObject("LIGHT MAZE // Production Camera Feel").AddComponent<ProductionCameraFeel>();
        }

        IEnumerator Start()
        {
            GameObject player = null;
            for (int i = 0; i < 60 && player == null; i++)
            {
                player = GameObject.Find("Explorer // Player");
                if (player == null) yield return null;
            }
            if (player == null) yield break;

            for (int i = 0; i < 60 && Camera.main == null; i++) yield return null;
            targetCamera = Camera.main;
            if (targetCamera == null) yield break;

            baseFov = targetCamera.fieldOfView;
            motor = player.GetComponent<PrototypeThirdPersonMotor>();
            combat = player.GetComponent<LightMazePlayerCombat>();
            if (combat != null)
            {
                combat.BoltCast += OnBolt;
                combat.IceNovaCast += OnNova;
                combat.HealCast += OnHeal;
            }
        }

        void OnDestroy()
        {
            if (combat == null) return;
            combat.BoltCast -= OnBolt;
            combat.IceNovaCast -= OnNova;
            combat.HealCast -= OnHeal;
        }

        void Update()
        {
            if (targetCamera == null) return;

            bool dodging = motor != null && motor.IsDodging;
            if (dodging && !wasDodging) AddImpulse(3.6f);
            wasDodging = dodging;

            fovImpulse = Mathf.MoveTowards(fovImpulse, 0f, Time.deltaTime * 13f);
            float target = baseFov + fovImpulse;
            targetCamera.fieldOfView = Mathf.Lerp(targetCamera.fieldOfView, target, 1f - Mathf.Exp(-12f * Time.deltaTime));
        }

        void OnBolt() => AddImpulse(.8f);
        void OnNova() => AddImpulse(4.2f);
        void OnHeal() => AddImpulse(1.2f);

        void AddImpulse(float amount)
        {
            fovImpulse = Mathf.Clamp(fovImpulse + amount, 0f, 7f);
        }
    }
}
