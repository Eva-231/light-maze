using System;
using UnityEngine;

namespace LightMaze.Combat
{
    public sealed class PlayerVitals : MonoBehaviour
    {
        [SerializeField] float maxHp = 100f;
        [SerializeField] float maxMp = 60f;
        [SerializeField] float mpRegenPerSecond = 1.2f;
        [SerializeField] float hpRegenDelay = 5f;
        [SerializeField] float hpRegenFractionPerSecond = .005f;

        public float Hp { get; private set; }
        public float Mp { get; private set; }
        public float MaxHp => maxHp;
        public float MaxMp => maxMp;
        public bool IsDead => Hp <= 0f;

        public event Action<float> Damaged;
        public event Action<float> Healed;
        public event Action Died;

        float lastDamageTime = -999f;

        void Awake() => ResetVitals();

        void Update()
        {
            if (IsDead) return;

            Mp = Mathf.Min(maxMp, Mp + mpRegenPerSecond * Time.deltaTime);
            if (Time.time - lastDamageTime >= hpRegenDelay)
                Hp = Mathf.Min(maxHp, Hp + maxHp * hpRegenFractionPerSecond * Time.deltaTime);
        }

        public void ResetVitals()
        {
            Hp = maxHp;
            Mp = maxMp;
            lastDamageTime = -999f;
        }

        public bool SpendMp(float amount)
        {
            if (IsDead || amount < 0f || Mp < amount) return false;
            Mp -= amount;
            return true;
        }

        public void Heal(float amount)
        {
            if (IsDead || amount <= 0f) return;
            float before = Hp;
            Hp = Mathf.Min(maxHp, Hp + amount);
            float healed = Hp - before;
            if (healed > 0f) Healed?.Invoke(healed);
        }

        public void Damage(float amount)
        {
            if (IsDead || amount <= 0f) return;

            float applied = Mathf.Min(Hp, amount);
            Hp = Mathf.Max(0f, Hp - amount);
            lastDamageTime = Time.time;
            Damaged?.Invoke(applied);

            if (IsDead) Died?.Invoke();
        }
    }
}
