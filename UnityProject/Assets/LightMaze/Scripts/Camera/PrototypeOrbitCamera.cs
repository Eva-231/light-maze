using UnityEngine;
using UnityEngine.InputSystem;

namespace LightMaze.CameraSystem
{
    public sealed class PrototypeOrbitCamera : MonoBehaviour
    {
        [SerializeField] float distance = 7.4f;
        [SerializeField] float height = 1.55f;
        [SerializeField] float sensitivity = .11f;
        [SerializeField] float pitchMin = -10f;
        [SerializeField] float pitchMax = 52f;
        [SerializeField] float smoothTime = .05f;

        Transform target;
        float yaw;
        float pitch = 14f;
        Vector3 velocity;
        float shakeTimer;
        float shakeAmount;

        public void SetTarget(Transform value)
        {
            target = value;
            if (target != null)
            {
                yaw = target.eulerAngles.y;
                SnapToTarget();
            }
        }

        void Start()
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            SnapToTarget();
        }

        void SnapToTarget()
        {
            if (target == null) return;
            Quaternion rotation = Quaternion.Euler(pitch, yaw, 0f);
            Vector3 focus = target.position + Vector3.up * height;
            transform.position = focus - rotation * Vector3.forward * distance;
            transform.rotation = rotation;
            velocity = Vector3.zero;
        }

        public void Shake(float amount = .16f, float duration = .12f)
        {
            shakeAmount = Mathf.Max(shakeAmount, amount);
            shakeTimer = Mathf.Max(shakeTimer, duration);
        }

        void LateUpdate()
        {
            if (target == null) return;

            var keyboard = Keyboard.current;
            var mouse = Mouse.current;

            if (keyboard != null && keyboard.escapeKey.wasPressedThisFrame)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
            else if (mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState != CursorLockMode.Locked)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }

            if (mouse != null && Cursor.lockState == CursorLockMode.Locked)
            {
                Vector2 delta = mouse.delta.ReadValue();
                yaw += delta.x * sensitivity;
                pitch = Mathf.Clamp(pitch - delta.y * sensitivity, pitchMin, pitchMax);
            }

            Quaternion rotation = Quaternion.Euler(pitch, yaw, 0f);
            Vector3 focus = target.position + Vector3.up * height;
            Vector3 desired = focus - rotation * Vector3.forward * distance;
            transform.position = Vector3.SmoothDamp(transform.position, desired, ref velocity, smoothTime);

            if (shakeTimer > 0f)
            {
                shakeTimer -= Time.deltaTime;
                transform.position += Random.insideUnitSphere * shakeAmount;
                if (shakeTimer <= 0f) shakeAmount = 0f;
            }

            transform.rotation = rotation;
        }
    }
}