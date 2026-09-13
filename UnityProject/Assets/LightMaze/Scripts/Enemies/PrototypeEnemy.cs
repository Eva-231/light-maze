using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using LightMaze.Combat;
using LightMaze.Player;
using LightMaze.Visuals;

namespace LightMaze.Enemies
{
    public enum PrototypeEnemyKind
    {
        ShadowSoldier,
        RiftWolf,
        AbyssGuardian
    }

    public sealed class PrototypeEnemy : MonoBehaviour, IDamageable, IFreezable
    {
        PrototypeEnemyKind kind;
        Transform player;
        PlayerVitals playerVitals;
        PrototypeThirdPersonMotor playerMotor;
        readonly List<Renderer> renderers = new();

        float maxHp;
        float hp;
        float moveSpeed;
        float touchDamage;
        float attackRange;
        float attackCooldown;
        float nextAttackTime;
        float frozenUntil;
        Color baseEmission;
        bool dead;

        public float Hp01 => maxHp <= 0f ? 0f : hp / maxHp;
        public PrototypeEnemyKind Kind => kind;

        public void Configure(
            PrototypeEnemyKind enemyKind,
            Transform playerTransform,
            PlayerVitals targetVitals,
            PrototypeThirdPersonMotor targetMotor,
            IEnumerable<Renderer> visualRenderers)
        {
            kind = enemyKind;
            player = playerTransform;
            playerVitals = targetVitals;
            playerMotor = targetMotor;
            renderers.Clear();
            renderers.AddRange(visualRenderers);

            switch (kind)
            {
                case PrototypeEnemyKind.ShadowSoldier:
                    maxHp = 72f;
                    moveSpeed = 3.2f;
                    touchDamage = 10f;
                    attackRange = 1.7f;
                    attackCooldown = 1.15f;
                    baseEmission = new Color(1f, .05f, .08f) * 2.5f;
                    break;
                case PrototypeEnemyKind.RiftWolf:
                    maxHp = 58f;
                    moveSpeed = 5.4f;
                    touchDamage = 8f;
                    attackRange = 1.5f;
                    attackCooldown = .85f;
                    baseEmission = new Color(1f, .08f, .18f) * 3.2f;
                    break;
                default:
                    maxHp = 240f;
                    moveSpeed = 2.25f;
                    touchDamage = 22f;
                    attackRange = 2.5f;
                    attackCooldown = 1.65f;
                    baseEmission = new Color(1f, .65f, .16f) * 3f;
                    break;
            }

            hp = maxHp;
            ApplyEmission(baseEmission);
        }

        void Update()
        {
            if (dead || player == null || playerVitals == null || playerVitals.IsDead) return;

            if (Time.time < frozenUntil)
            {
                ApplyEmission(new Color(.3f, .85f, 1f) * 4.5f);
                return;
            }
            ApplyEmission(baseEmission);

            Vector3 toPlayer = player.position - transform.position;
            toPlayer.y = 0f;
            float distance = toPlayer.magnitude;
            if (distance <= .01f) return;

            Quaternion targetRotation = Quaternion.LookRotation(toPlayer.normalized, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, 1f - Mathf.Exp(-10f * Time.deltaTime));

            if (distance > attackRange)
            {
                float speed = moveSpeed;
                if (kind == PrototypeEnemyKind.RiftWolf && distance > 5f)
                    speed *= 1.22f;
                transform.position += toPlayer.normalized * speed * Time.deltaTime;
            }
            else if (Time.time >= nextAttackTime)
            {
                nextAttackTime = Time.time + attackCooldown;
                Attack();
            }
        }

        void Attack()
        {
            if (playerMotor != null && playerMotor.IsDodging)
            {
                PrototypeVfx.SpawnRing(player.position, new Color(.4f, .8f, 1f), 1f, .18f, .025f);
                return;
            }

            playerVitals.Damage(touchDamage);
            Color c = kind == PrototypeEnemyKind.AbyssGuardian
                ? new Color(1f, .72f, .2f) * 2f
                : new Color(1f, .08f, .12f) * 2f;
            PrototypeVfx.SpawnBurst(player.position + Vector3.up, c, .8f, 9);
        }

        public void TakeDamage(float damage)
        {
            if (dead || damage <= 0f) return;
            hp = Mathf.Max(0f, hp - damage);
            StopAllCoroutines();
            StartCoroutine(HitFlash());
            if (hp <= 0f) Die();
        }

        public void Freeze(float seconds)
        {
            if (dead) return;
            frozenUntil = Mathf.Max(frozenUntil, Time.time + Mathf.Max(0f, seconds));
            PrototypeVfx.SpawnBurst(transform.position + Vector3.up, new Color(.3f, .85f, 1f) * 2.5f, 1.1f, 12);
        }

        IEnumerator HitFlash()
        {
            ApplyEmission(Color.white * 6f);
            yield return new WaitForSeconds(.065f);
            if (!dead && Time.time >= frozenUntil) ApplyEmission(baseEmission);
        }

        void ApplyEmission(Color emission)
        {
            foreach (var r in renderers)
            {
                if (r == null || r.material == null || !r.material.HasProperty("_EmissionColor")) continue;
                r.material.EnableKeyword("_EMISSION");
                r.material.SetColor("_EmissionColor", emission);
            }
        }

        void Die()
        {
            if (dead) return;
            dead = true;
            Color c = kind == PrototypeEnemyKind.AbyssGuardian
                ? new Color(1f, .7f, .2f) * 3f
                : new Color(.55f, .3f, 1f) * 2.8f;
            PrototypeVfx.SpawnBurst(transform.position + Vector3.up, c, kind == PrototypeEnemyKind.AbyssGuardian ? 2f : 1.2f, kind == PrototypeEnemyKind.AbyssGuardian ? 30 : 18);
            PrototypeVfx.SpawnRing(transform.position, c, kind == PrototypeEnemyKind.AbyssGuardian ? 3f : 1.6f, .5f, .08f);
            Destroy(gameObject, .04f);
        }
    }
}
