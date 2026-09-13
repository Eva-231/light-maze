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
        float lastDamageTime = -999f;

        void Awake() { Hp = maxHp; Mp = maxMp; }
        void Update()
        {
            Mp = Mathf.Min(maxMp, Mp + mpRegenPerSecond * Time.deltaTime);
            if (Time.time - lastDamageTime >= hpRegenDelay)
                Hp = Mathf.Min(maxHp, Hp + maxHp * hpRegenFractionPerSecond * Time.deltaTime);
        }
        public bool SpendMp(float amount)
        {
            if (Mp < amount) return false;
            Mp -= amount; return true;
        }
        public void Heal(float amount) => Hp = Mathf.Min(maxHp, Hp + amount);
        public void Damage(float amount)
        {
            Hp = Mathf.Max(0, Hp - Mathf.Max(0, amount));
            lastDamageTime = Time.time;
        }
    }
}
