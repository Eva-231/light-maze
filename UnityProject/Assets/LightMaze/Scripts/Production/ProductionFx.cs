using UnityEngine;
using LightMaze.Enemies;
using LightMaze.Visuals;

namespace LightMaze.Production
{
    public static class ProductionFx
    {
        public static void AttachBoltProjectile(GameObject bolt)
        {
            if (bolt == null) return;
            var prefab = Resources.Load<GameObject>(ProductionAssetContract.VfxLightBoltProjectile);
            if (prefab == null) return;

            var renderer = bolt.GetComponent<Renderer>();
            if (renderer != null) renderer.enabled = false;
            var trail = bolt.GetComponent<TrailRenderer>();
            if (trail != null) trail.enabled = false;

            var fx = Object.Instantiate(prefab, bolt.transform);
            fx.name = "Production Light Bolt VFX";
            fx.transform.localPosition = Vector3.zero;
            fx.transform.localRotation = Quaternion.identity;
            fx.transform.localScale = Vector3.one;
            RemovePhysics(fx);
        }

        public static void SpawnBoltCast(Vector3 position)
        {
            if (Spawn(ProductionAssetContract.VfxLightBoltCast, position, Quaternion.identity, 4f)) return;
            PrototypeVfx.SpawnRing(position, new Color(.45f, .85f, 1f) * 2f, .65f, .16f, .035f);
        }

        public static void SpawnBoltImpact(Vector3 position, bool hitEnemy)
        {
            if (Spawn(ProductionAssetContract.VfxLightBoltImpact, position, Quaternion.identity, 5f)) return;
            PrototypeVfx.SpawnBurst(position, new Color(.35f, .82f, 1f) * (hitEnemy ? 2.5f : 1.5f), hitEnemy ? .55f : .35f, hitEnemy ? 10 : 5);
            if (hitEnemy) PrototypeVfx.SpawnRing(position, Color.white * 2f, .55f, .18f, .035f);
        }

        public static void SpawnIceNova(Vector3 position, float radius)
        {
            if (Spawn(ProductionAssetContract.VfxIceNova, position, Quaternion.identity, 8f)) return;
            PrototypeVfx.SpawnIceNova(position, radius);
        }

        public static void SpawnHeal(Vector3 position)
        {
            if (Spawn(ProductionAssetContract.VfxHeal, position, Quaternion.identity, 6f)) return;
            PrototypeVfx.SpawnHealAura(position);
        }

        public static void SpawnEnemyHit(Vector3 position, PrototypeEnemyKind kind)
        {
            string path = kind == PrototypeEnemyKind.AbyssGuardian
                ? ProductionAssetContract.VfxHitGold
                : ProductionAssetContract.VfxHitRed;
            if (Spawn(path, position, Quaternion.identity, 3f)) return;

            Color color = kind == PrototypeEnemyKind.AbyssGuardian
                ? new Color(1f, .72f, .2f) * 2f
                : new Color(1f, .08f, .12f) * 2f;
            PrototypeVfx.SpawnBurst(position, color, .8f, 9);
        }

        public static void SpawnEnemyDeath(Vector3 position, PrototypeEnemyKind kind)
        {
            string path = kind switch
            {
                PrototypeEnemyKind.ShadowSoldier => ProductionAssetContract.VfxDeathShadow,
                PrototypeEnemyKind.RiftWolf => ProductionAssetContract.VfxDeathWolf,
                _ => ProductionAssetContract.VfxDeathGuardian
            };
            if (Spawn(path, position, Quaternion.identity, 7f)) return;

            Color color = kind == PrototypeEnemyKind.AbyssGuardian
                ? new Color(1f, .7f, .2f) * 3f
                : new Color(.55f, .3f, 1f) * 2.8f;
            PrototypeVfx.SpawnBurst(position + Vector3.up, color, kind == PrototypeEnemyKind.AbyssGuardian ? 2f : 1.2f, kind == PrototypeEnemyKind.AbyssGuardian ? 30 : 18);
            PrototypeVfx.SpawnRing(position, color, kind == PrototypeEnemyKind.AbyssGuardian ? 3f : 1.6f, .5f, .08f);
        }

        public static void SpawnGuardianAttack(Vector3 position, Quaternion rotation)
        {
            if (Spawn(ProductionAssetContract.VfxGuardianAttack, position, rotation, 5f)) return;
            PrototypeVfx.SpawnRing(position, new Color(1f, .65f, .16f) * 2f, 2.4f, .3f, .08f);
        }

        static bool Spawn(string resourcePath, Vector3 position, Quaternion rotation, float lifetime)
        {
            var prefab = Resources.Load<GameObject>(resourcePath);
            if (prefab == null) return false;
            var instance = Object.Instantiate(prefab, position, rotation);
            instance.name = prefab.name + " (Runtime)";
            RemovePhysics(instance);
            Object.Destroy(instance, lifetime);
            return true;
        }

        static void RemovePhysics(GameObject root)
        {
            foreach (var collider in root.GetComponentsInChildren<Collider>(true))
                Object.Destroy(collider);
            foreach (var rigidbody in root.GetComponentsInChildren<Rigidbody>(true))
                Object.Destroy(rigidbody);
        }
    }
}
