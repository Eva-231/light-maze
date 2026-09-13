using UnityEngine;
using LightMaze.Combat;
using LightMaze.Enemies;
using LightMaze.Player;

namespace LightMaze.Production
{
    public sealed class ProductionAnimatorBridge : MonoBehaviour
    {
        Animator animator;
        PrototypeThirdPersonMotor motor;
        LightMazePlayerCombat combat;
        PlayerVitals vitals;
        PrototypeEnemy enemy;
        Vector3 previousPosition;
        bool wasDodging;

        public void ConfigurePlayer(Animator targetAnimator, PrototypeThirdPersonMotor targetMotor, LightMazePlayerCombat targetCombat, PlayerVitals targetVitals)
        {
            animator = targetAnimator;
            motor = targetMotor;
            combat = targetCombat;
            vitals = targetVitals;
            previousPosition = transform.position;

            if (combat != null)
            {
                combat.BoltCast += OnBoltCast;
                combat.IceNovaCast += OnIceNovaCast;
                combat.HealCast += OnHealCast;
            }
        }

        public void ConfigureEnemy(Animator targetAnimator, PrototypeEnemy targetEnemy)
        {
            animator = targetAnimator;
            enemy = targetEnemy;
            previousPosition = transform.position;

            if (enemy != null)
            {
                enemy.Attacked += OnEnemyAttack;
                enemy.Hit += OnEnemyHit;
                enemy.Frozen += OnEnemyFreeze;
                enemy.Died += OnEnemyDeath;
            }
        }

        void OnDestroy()
        {
            if (combat != null)
            {
                combat.BoltCast -= OnBoltCast;
                combat.IceNovaCast -= OnIceNovaCast;
                combat.HealCast -= OnHealCast;
            }

            if (enemy != null)
            {
                enemy.Attacked -= OnEnemyAttack;
                enemy.Hit -= OnEnemyHit;
                enemy.Frozen -= OnEnemyFreeze;
                enemy.Died -= OnEnemyDeath;
            }
        }

        void Update()
        {
            if (animator == null) return;

            if (motor != null)
            {
                float speed = motor.PlanarVelocity.magnitude;
                SetFloat("Speed", speed, .12f);
                SetFloat("MoveSpeed01", Mathf.Clamp01(speed / 8.2f), .12f);
                SetBool("Sprint", speed > 6f && !motor.IsDodging);
                SetBool("Grounded", GetComponent<CharacterController>()?.isGrounded ?? true);
                SetBool("Dead", vitals != null && vitals.IsDead);

                if (motor.IsDodging && !wasDodging)
                    SetTrigger("Dodge");
                wasDodging = motor.IsDodging;
            }
            else if (enemy != null)
            {
                float speed = (transform.position - previousPosition).magnitude / Mathf.Max(Time.deltaTime, .0001f);
                previousPosition = transform.position;
                SetFloat("Speed", speed, .12f);
                SetBool("Frozen", enemy.IsFrozen);
                SetBool("Dead", enemy.IsDead);
            }
        }

        void OnBoltCast() => SetTrigger("CastBolt");
        void OnIceNovaCast() => SetTrigger("CastIceNova");
        void OnHealCast() => SetTrigger("Heal");
        void OnEnemyAttack() => SetTrigger("Attack");
        void OnEnemyHit() => SetTrigger("HitReact");
        void OnEnemyFreeze() => SetTrigger("Freeze");
        void OnEnemyDeath() => SetTrigger("Death");

        void SetTrigger(string parameter)
        {
            if (HasParameter(parameter, AnimatorControllerParameterType.Trigger))
                animator.SetTrigger(parameter);
        }

        void SetBool(string parameter, bool value)
        {
            if (HasParameter(parameter, AnimatorControllerParameterType.Bool))
                animator.SetBool(parameter, value);
        }

        void SetFloat(string parameter, float value, float damp)
        {
            if (HasParameter(parameter, AnimatorControllerParameterType.Float))
                animator.SetFloat(parameter, value, damp, Time.deltaTime);
        }

        bool HasParameter(string name, AnimatorControllerParameterType type)
        {
            if (animator == null || animator.runtimeAnimatorController == null) return false;
            foreach (var parameter in animator.parameters)
                if (parameter.name == name && parameter.type == type)
                    return true;
            return false;
        }
    }
}
