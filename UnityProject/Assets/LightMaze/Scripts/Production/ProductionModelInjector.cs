using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using LightMaze.Combat;
using LightMaze.Enemies;
using LightMaze.Player;

namespace LightMaze.Production
{
    public sealed class ProductionModelInjector : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Inject()
        {
            if (SceneManager.GetActiveScene().name != "SampleScene") return;
            if (Object.FindFirstObjectByType<ProductionModelInjector>() != null) return;
            new GameObject("LIGHT MAZE // Production Model Injector").AddComponent<ProductionModelInjector>();
        }

        IEnumerator Start()
        {
            GameObject player = null;
            for (int i = 0; i < 60 && player == null; i++)
            {
                player = GameObject.Find("Explorer // Player");
                if (player == null) yield return null;
            }

            if (player == null) yield break;
            for (int frame = 0; frame < 5; frame++) yield return null;

            TrySwapPlayer(player);
            TrySwapEnemy(GameObject.Find("Shadow Soldier"), ProductionRole.ShadowSoldier, "Red Core");
            TrySwapEnemy(GameObject.Find("Rift Wolf"), ProductionRole.RiftWolf, "Rift Core");
            TrySwapEnemy(GameObject.Find("Abyss Guardian"), ProductionRole.AbyssGuardian, "Guardian Gold Core");
        }

        void TrySwapPlayer(GameObject root)
        {
            var prefab = Resources.Load<GameObject>(ProductionAssetContract.PlayerModel);
            if (prefab == null) return;

            var prototype = ProductionAssetContract.FindDeep(root.transform, "Explorer Visual");
            HideRenderers(prototype);

            var instance = Instantiate(prefab, root.transform);
            instance.name = "Production Explorer Visual";
            ResetLocal(instance.transform);
            RemovePhysics(instance);
            EnsureSockets(instance.transform);

            var castOrigin = ProductionAssetContract.FindDeep(root.transform, "Cast Origin");
            var castSocket = ProductionAssetContract.FindDeep(instance.transform, "CastSocket");
            if (castOrigin != null && castSocket != null)
            {
                castOrigin.SetParent(castSocket, false);
                castOrigin.localPosition = Vector3.zero;
                castOrigin.localRotation = Quaternion.identity;
            }

            var core = ProductionAssetContract.FindDeep(root.transform, "LIGHT Core");
            var chestSocket = ProductionAssetContract.FindDeep(instance.transform, "ChestLightSocket");
            if (core != null && chestSocket != null)
            {
                core.SetParent(chestSocket, false);
                core.localPosition = Vector3.zero;
                core.localRotation = Quaternion.identity;
                foreach (var light in core.GetComponentsInChildren<Light>()) { light.enabled = false; }
            }

            var animator = instance.GetComponentInChildren<Animator>(true);
            if (animator != null)
            {
                var bridge = root.GetComponent<ProductionAnimatorBridge>() ?? root.AddComponent<ProductionAnimatorBridge>();
                bridge.ConfigurePlayer(
                    animator,
                    root.GetComponent<PrototypeThirdPersonMotor>(),
                    root.GetComponent<LightMazePlayerCombat>(),
                    root.GetComponent<PlayerVitals>());
            }
        }

        void TrySwapEnemy(GameObject root, ProductionRole role, string prototypeCoreName)
        {
            if (root == null) return;
            var prefab = Resources.Load<GameObject>(ProductionAssetContract.ModelPathFor(role));
            if (prefab == null) return;

            HideRenderers(root.transform);

            var instance = Instantiate(prefab, root.transform);
            instance.name = $"Production {role}";
            ResetLocal(instance.transform);
            RemovePhysics(instance);
            EnsureSockets(instance.transform);

            var oldCore = ProductionAssetContract.FindDeep(root.transform, prototypeCoreName);
            var chestSocket = ProductionAssetContract.FindDeep(instance.transform, "ChestLightSocket");
            if (oldCore != null && chestSocket != null)
            {
                oldCore.SetParent(chestSocket, false);
                oldCore.localPosition = Vector3.zero;
                oldCore.localRotation = Quaternion.identity;
                foreach (var light in oldCore.GetComponentsInChildren<Light>()) { light.intensity = .04f; light.range = 1.5f; }
            }

            var animator = instance.GetComponentInChildren<Animator>(true);
            var enemy = root.GetComponent<PrototypeEnemy>();
            if (animator != null && enemy != null)
            {
                var bridge = root.GetComponent<ProductionAnimatorBridge>() ?? root.AddComponent<ProductionAnimatorBridge>();
                bridge.ConfigureEnemy(animator, enemy);
            }
        }

        static void HideRenderers(Transform root)
        {
            if (root == null) return;
            foreach (var renderer in root.GetComponentsInChildren<Renderer>(true))
                renderer.enabled = false;
        }

        static void RemovePhysics(GameObject root)
        {
            foreach (var collider in root.GetComponentsInChildren<Collider>(true))
                Destroy(collider);
            foreach (var body in root.GetComponentsInChildren<Rigidbody>(true))
                Destroy(body);
        }

        static void EnsureSockets(Transform root)
        {
            foreach (var socketName in ProductionAssetContract.RequiredSockets)
                ProductionAssetContract.EnsureSocket(root, socketName);
        }

        static void ResetLocal(Transform t)
        {
            t.localPosition = Vector3.zero;
            t.localRotation = Quaternion.identity;
            t.localScale = Vector3.one;
        }
    }
}
