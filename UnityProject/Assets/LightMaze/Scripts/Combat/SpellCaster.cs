using System.Collections.Generic;
using UnityEngine;

namespace LightMaze.Combat
{
    public interface IDamageable { void TakeDamage(float damage); }
    public interface IFreezable { void Freeze(float seconds); }

    public sealed class SpellCaster : MonoBehaviour
    {
        [SerializeField] PlayerVitals vitals;
        [SerializeField] Transform castOrigin;
        [SerializeField] GameObject lightBoltPrefab;
        [SerializeField] GameObject iceNovaVfxPrefab;
        [SerializeField] LayerMask enemyMask;
        [SerializeField] float boltCost = 6f;
        [SerializeField] float iceCost = 16f;
        [SerializeField] float healCost = 20f;
        [SerializeField] float iceRoomRadius = 14f;
        [SerializeField] float iceDamage = 26f;
        [SerializeField] float iceFreezeSeconds = 3.2f;

        public void CastLightBolt()
        {
            if (!vitals.SpendMp(boltCost) || !lightBoltPrefab) return;
            Instantiate(lightBoltPrefab, castOrigin.position, castOrigin.rotation);
        }
        public void CastIceNova()
        {
            if (!vitals.SpendMp(iceCost)) return;
            if (iceNovaVfxPrefab) Instantiate(iceNovaVfxPrefab, transform.position, Quaternion.identity);
            var seen = new HashSet<Component>();
            foreach (var hit in Physics.OverlapSphere(transform.position, iceRoomRadius, enemyMask, QueryTriggerInteraction.Ignore))
            {
                var damageable = hit.GetComponentInParent<IDamageable>() as Component;
                if (damageable && seen.Add(damageable)) ((IDamageable)damageable).TakeDamage(iceDamage);
                var freezable = hit.GetComponentInParent<IFreezable>();
                freezable?.Freeze(iceFreezeSeconds);
            }
        }
        public void CastHeal()
        {
            if (vitals.SpendMp(healCost)) vitals.Heal(30f);
        }
    }
}
