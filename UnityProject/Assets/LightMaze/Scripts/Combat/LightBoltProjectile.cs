using UnityEngine;
using LightMaze.Enemies;
using LightMaze.Production;

namespace LightMaze.Combat
{
    [RequireComponent(typeof(SphereCollider))]
    [RequireComponent(typeof(Rigidbody))]
    public sealed class LightBoltProjectile : MonoBehaviour
    {
        float speed = 26f;
        float damage = 18f;
        float life = 2.2f;
        Vector3 direction;
        Transform owner;

        public void Configure(Vector3 travelDirection, Transform projectileOwner, float projectileDamage = 18f)
        {
            direction = travelDirection.sqrMagnitude > .001f ? travelDirection.normalized : transform.forward;
            owner = projectileOwner;
            damage = projectileDamage;
        }

        void Awake()
        {
            var col = GetComponent<SphereCollider>();
            col.isTrigger = true;
            col.radius = .5f;

            var rb = GetComponent<Rigidbody>();
            rb.isKinematic = true;
            rb.useGravity = false;
            rb.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
        }

        void Update()
        {
            transform.position += direction * speed * Time.deltaTime;
            transform.rotation = Quaternion.LookRotation(direction, Vector3.up);
            life -= Time.deltaTime;
            if (life <= 0f) Destroy(gameObject);
        }

        void OnTriggerEnter(Collider other)
        {
            if (owner != null && (other.transform == owner || other.transform.IsChildOf(owner)))
                return;

            var enemy = other.GetComponentInParent<PrototypeEnemy>();
            if (enemy != null)
            {
                enemy.TakeDamage(damage);
                ProductionFx.SpawnBoltImpact(transform.position, true);
                Destroy(gameObject);
                return;
            }

            if (!other.isTrigger)
            {
                ProductionFx.SpawnBoltImpact(transform.position, false);
                Destroy(gameObject);
            }
        }
    }
}
