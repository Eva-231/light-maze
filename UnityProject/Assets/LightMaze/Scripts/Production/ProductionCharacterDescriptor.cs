using UnityEngine;

namespace LightMaze.Production
{
    [DisallowMultipleComponent]
    public sealed class ProductionCharacterDescriptor : MonoBehaviour
    {
        [Header("Identity")]
        public ProductionRole role = ProductionRole.PlayerExplorer;

        [Header("Core References")]
        public Animator animator;
        public Transform modelRoot;
        public Transform weaponSocketR;
        public Transform weaponSocketL;
        public Transform chestLightSocket;
        public Transform castSocket;
        public Transform hitVfxSocket;
        public LODGroup lodGroup;

        [Header("Appearance Groups (classification only; materials are preserved)")]
        public Renderer[] skinRenderers;
        public Renderer[] hairRenderers;
        public Renderer[] armorRenderers;
        public Renderer[] clothRenderers;
        public Renderer[] otherRenderers;

        public bool IsHumanoid => animator != null && animator.avatar != null && animator.avatar.isHuman;

        public void RefreshFromHierarchy()
        {
            animator = GetComponentInChildren<Animator>(true);
            modelRoot = ProductionAssetContract.FindDeep(transform, "Model");
            weaponSocketR = ProductionAssetContract.FindDeep(transform, "WeaponSocket_R");
            weaponSocketL = ProductionAssetContract.FindDeep(transform, "WeaponSocket_L");
            chestLightSocket = ProductionAssetContract.FindDeep(transform, "ChestLightSocket");
            castSocket = ProductionAssetContract.FindDeep(transform, "CastSocket");
            hitVfxSocket = ProductionAssetContract.FindDeep(transform, "HitVfxSocket");
            lodGroup = GetComponentInChildren<LODGroup>(true);
        }
    }
}
