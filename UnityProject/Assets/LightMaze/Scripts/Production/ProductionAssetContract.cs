using UnityEngine;

namespace LightMaze.Production
{
    public enum ProductionRole
    {
        PlayerExplorer,
        ShadowSoldier,
        RiftWolf,
        AbyssGuardian
    }

    public static class ProductionAssetContract
    {
        public const string PlayerModel = "LightMazeProduction/Models/Player_Explorer";
        public const string ShadowSoldierModel = "LightMazeProduction/Models/Enemy_ShadowSoldier";
        public const string RiftWolfModel = "LightMazeProduction/Models/Enemy_RiftWolf";
        public const string AbyssGuardianModel = "LightMazeProduction/Models/Enemy_AbyssGuardian";

        public const string VfxLightBoltProjectile = "LightMazeProduction/VFX/VFX_LightBolt_Projectile";
        public const string VfxLightBoltCast = "LightMazeProduction/VFX/VFX_LightBolt_Cast";
        public const string VfxLightBoltImpact = "LightMazeProduction/VFX/VFX_LightBolt_Impact";
        public const string VfxIceNova = "LightMazeProduction/VFX/VFX_IceNova";
        public const string VfxHeal = "LightMazeProduction/VFX/VFX_Heal";
        public const string VfxHitRed = "LightMazeProduction/VFX/VFX_Hit_Red";
        public const string VfxHitGold = "LightMazeProduction/VFX/VFX_Hit_Gold";
        public const string VfxDeathShadow = "LightMazeProduction/VFX/VFX_Death_Shadow";
        public const string VfxDeathWolf = "LightMazeProduction/VFX/VFX_Death_Wolf";
        public const string VfxDeathGuardian = "LightMazeProduction/VFX/VFX_Death_Guardian";
        public const string VfxGuardianAttack = "LightMazeProduction/VFX/VFX_Guardian_Attack";

        public static readonly string[] RequiredSockets =
        {
            "Root",
            "Model",
            "WeaponSocket_R",
            "WeaponSocket_L",
            "ChestLightSocket",
            "CastSocket",
            "HitVfxSocket"
        };

        public static string ModelPathFor(ProductionRole role)
        {
            return role switch
            {
                ProductionRole.PlayerExplorer => PlayerModel,
                ProductionRole.ShadowSoldier => ShadowSoldierModel,
                ProductionRole.RiftWolf => RiftWolfModel,
                ProductionRole.AbyssGuardian => AbyssGuardianModel,
                _ => string.Empty
            };
        }

        public static Transform FindDeep(Transform root, string childName)
        {
            if (root == null) return null;
            if (root.name == childName) return root;
            for (int i = 0; i < root.childCount; i++)
            {
                var found = FindDeep(root.GetChild(i), childName);
                if (found != null) return found;
            }
            return null;
        }

        public static Transform EnsureSocket(Transform root, string socketName)
        {
            var existing = FindDeep(root, socketName);
            if (existing != null) return existing;

            var socket = new GameObject(socketName).transform;
            socket.SetParent(root, false);
            return socket;
        }
    }
}
