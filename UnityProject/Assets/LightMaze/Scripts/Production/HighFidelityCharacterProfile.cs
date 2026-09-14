using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace LightMaze.Production
{
    /// <summary>
    /// Metadata carried by locally-authored high fidelity character prefabs.
    /// The gameplay layer does not depend on this component; it exists so editor
    /// tooling can validate, rebuild and swap premium character assets safely.
    /// </summary>
    public sealed class HighFidelityCharacterProfile : MonoBehaviour
    {
        [Header("Identity")]
        public ProductionRole role = ProductionRole.PlayerExplorer;
        public Animator animator;
        public LODGroup lodGroup;

        [Header("Surface groups")]
        public Renderer[] skinRenderers = Array.Empty<Renderer>();
        public Renderer[] hairRenderers = Array.Empty<Renderer>();
        public Renderer[] armorRenderers = Array.Empty<Renderer>();
        public Renderer[] clothRenderers = Array.Empty<Renderer>();
        public Renderer[] otherRenderers = Array.Empty<Renderer>();

        [Header("Contract sockets")]
        public Transform rootSocket;
        public Transform modelRoot;
        public Transform weaponSocketR;
        public Transform weaponSocketL;
        public Transform chestLightSocket;
        public Transform castSocket;
        public Transform hitVfxSocket;

        public IEnumerable<Renderer> AllRenderers()
        {
            return GetComponentsInChildren<Renderer>(true);
        }

        [ContextMenu("Resolve Character References")]
        public void ResolveReferences()
        {
            animator = GetComponentInChildren<Animator>(true);
            lodGroup = GetComponentInChildren<LODGroup>(true);

            rootSocket = ProductionAssetContract.FindDeep(transform, "Root");
            modelRoot = ProductionAssetContract.FindDeep(transform, "Model");
            weaponSocketR = ProductionAssetContract.FindDeep(transform, "WeaponSocket_R");
            weaponSocketL = ProductionAssetContract.FindDeep(transform, "WeaponSocket_L");
            chestLightSocket = ProductionAssetContract.FindDeep(transform, "ChestLightSocket");
            castSocket = ProductionAssetContract.FindDeep(transform, "CastSocket");
            hitVfxSocket = ProductionAssetContract.FindDeep(transform, "HitVfxSocket");

            var skin = new List<Renderer>();
            var hair = new List<Renderer>();
            var armor = new List<Renderer>();
            var cloth = new List<Renderer>();
            var other = new List<Renderer>();

            foreach (var renderer in GetComponentsInChildren<Renderer>(true))
            {
                string signature = BuildSignature(renderer);
                if (ContainsAny(signature, "hair", "brow", "lash")) hair.Add(renderer);
                else if (ContainsAny(signature, "skin", "face", "head", "body", "eye")) skin.Add(renderer);
                else if (ContainsAny(signature, "armor", "armour", "metal", "plate", "gauntlet", "greave", "helmet")) armor.Add(renderer);
                else if (ContainsAny(signature, "cloth", "fabric", "cape", "cloak", "coat", "robe", "scarf", "skirt")) cloth.Add(renderer);
                else other.Add(renderer);
            }

            skinRenderers = skin.ToArray();
            hairRenderers = hair.ToArray();
            armorRenderers = armor.ToArray();
            clothRenderers = cloth.ToArray();
            otherRenderers = other.ToArray();
        }

        public bool ValidateRuntimeContract(out string report)
        {
            var sb = new StringBuilder();
            bool ok = true;

            if (animator == null)
            {
                ok = false;
                sb.AppendLine("ERROR: Animator is missing.");
            }

            foreach (var socket in ProductionAssetContract.RequiredSockets)
            {
                if (ProductionAssetContract.FindDeep(transform, socket) == null)
                {
                    ok = false;
                    sb.AppendLine($"ERROR: required socket '{socket}' is missing.");
                }
            }

            int rendererCount = 0;
            foreach (var renderer in AllRenderers())
            {
                rendererCount++;
                var materials = renderer.sharedMaterials;
                for (int i = 0; i < materials.Length; i++)
                {
                    if (materials[i] == null)
                    {
                        ok = false;
                        sb.AppendLine($"ERROR: {renderer.name} has a missing material at slot {i}.");
                    }
                }
            }

            if (rendererCount == 0)
            {
                ok = false;
                sb.AppendLine("ERROR: no renderers were found.");
            }

            if (ok) sb.AppendLine($"PASS: {role} runtime character contract is valid ({rendererCount} renderers).");
            report = sb.ToString();
            return ok;
        }

        static string BuildSignature(Renderer renderer)
        {
            var sb = new StringBuilder(renderer.name.ToLowerInvariant());
            foreach (var material in renderer.sharedMaterials)
            {
                if (material != null) sb.Append(' ').Append(material.name.ToLowerInvariant());
            }
            return sb.ToString();
        }

        static bool ContainsAny(string value, params string[] tokens)
        {
            foreach (var token in tokens)
                if (value.Contains(token)) return true;
            return false;
        }
    }
}
