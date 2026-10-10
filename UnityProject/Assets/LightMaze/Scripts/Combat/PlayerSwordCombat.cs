using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using LightMaze.Enemies;
using LightMaze.Player;

namespace LightMaze.Combat
{
    // Gameplay timing is authoritative; animation clips use the same stage durations.
    public sealed class PlayerSwordCombat : MonoBehaviour
    {
        public static readonly float[] Durations = { .48f, .52f, .68f };
        static readonly float[] ImpactTimes = { .18f, .20f, .29f };
        static readonly float[] Damages = { 22f, 26f, 38f };
        readonly HashSet<PrototypeEnemy> hitEnemies = new();
        PlayerVitals vitals;
        PrototypeThirdPersonMotor motor;
        float elapsed;
        bool buffered;
        bool impactResolved;
        public bool IsAttacking { get; private set; }
        public int ComboStage { get; private set; }
        public event Action<int> SwingStarted;
        public event Action SwingCancelled;

        void Awake()
        {
            vitals = GetComponent<PlayerVitals>();
            motor = GetComponent<PrototypeThirdPersonMotor>();
        }

        void Update()
        {
            if (vitals == null || vitals.IsDead || (motor != null && motor.IsDodging))
            {
                Cancel();
                return;
            }
            var mouse = Mouse.current;
            var keyboard = Keyboard.current;
            var pad = Gamepad.current;
            if ((mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState == CursorLockMode.Locked)
                || (keyboard != null && keyboard.jKey.wasPressedThisFrame)
                || (pad != null && pad.buttonWest.wasPressedThisFrame)) RequestAttack();
            if (!IsAttacking) return;
            elapsed += Time.deltaTime;
            if (!impactResolved && elapsed >= ImpactTimes[ComboStage])
            {
                impactResolved = true;
                ResolveImpact();
            }
            if (elapsed < Durations[ComboStage]) return;
            if (buffered && ComboStage < 2) Begin(ComboStage + 1);
            else { IsAttacking = false; ComboStage = 0; buffered = false; }
        }

        public void RequestAttack()
        {
            if (vitals == null || vitals.IsDead || (motor != null && motor.IsDodging)) return;
            if (!IsAttacking) Begin(0);
            // One buffered strike, accepted after the wind-up; holding a button never loops.
            else if (elapsed >= .10f && ComboStage < 2) buffered = true;
        }

        void Begin(int stage)
        {
            IsAttacking = true;
            ComboStage = stage;
            elapsed = 0;
            buffered = false;
            impactResolved = false;
            hitEnemies.Clear();
            SwingStarted?.Invoke(stage);
        }

        void Cancel()
        {
            if (IsAttacking) SwingCancelled?.Invoke();
            IsAttacking = false;
            ComboStage = 0;
            buffered = false;
        }

        void OnDisable() => Cancel();

        void ResolveImpact()
        {
            Vector3 origin = transform.position + Vector3.up;
            float reach = ComboStage == 2 ? 2.8f : 2.4f;
            foreach (var collider in Physics.OverlapSphere(origin, reach, ~0, QueryTriggerInteraction.Ignore))
            {
                var enemy = collider.GetComponentInParent<PrototypeEnemy>();
                if (enemy == null || enemy.IsDead || hitEnemies.Contains(enemy)) continue;
                Vector3 target = collider.bounds.center;
                Vector3 flat = target - origin;
                flat.y = 0;
                if (flat.sqrMagnitude > .01f && Vector3.Angle(transform.forward, flat) > 65f) continue;
                bool blocked = false;
                foreach (var hit in Physics.RaycastAll(origin, target - origin, Vector3.Distance(origin, target), ~0, QueryTriggerInteraction.Ignore))
                {
                    if (hit.transform.IsChildOf(transform) || hit.transform == transform) continue;
                    if (hit.collider.GetComponentInParent<PrototypeEnemy>() != null) continue;
                    blocked = true;
                    break;
                }
                if (blocked) continue;
                hitEnemies.Add(enemy);
                enemy.TakeDamage(Damages[ComboStage]);
            }
        }
    }
}
