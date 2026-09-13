using UnityEngine;
using UnityEngine.InputSystem;

namespace LightMaze.Player
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class PrototypeThirdPersonMotor : MonoBehaviour
    {
        [SerializeField] float walkSpeed = 5.2f;
        [SerializeField] float sprintSpeed = 8.2f;
        [SerializeField] float rotationSharpness = 14f;
        [SerializeField] float gravity = -24f;
        [SerializeField] float dodgeSpeed = 13f;
        [SerializeField] float dodgeDuration = .18f;
        [SerializeField] float dodgeCooldown = .65f;

        CharacterController controller;
        Transform cameraTransform;
        float verticalVelocity;
        float dodgeTimer;
        float dodgeCooldownTimer;
        Vector3 dodgeDirection;

        public bool IsDodging => dodgeTimer > 0f;
        public Vector3 PlanarVelocity { get; private set; }

        void Awake() => controller = GetComponent<CharacterController>();

        public void SetCamera(Transform value) => cameraTransform = value;

        void Update()
        {
            if (cameraTransform == null && Camera.main != null)
                cameraTransform = Camera.main.transform;

            dodgeCooldownTimer -= Time.deltaTime;
            dodgeTimer -= Time.deltaTime;

            Vector2 input = Vector2.zero;
            var keyboard = Keyboard.current;
            if (keyboard != null)
            {
                input.x = (keyboard.dKey.isPressed ? 1f : 0f) - (keyboard.aKey.isPressed ? 1f : 0f);
                input.y = (keyboard.wKey.isPressed ? 1f : 0f) - (keyboard.sKey.isPressed ? 1f : 0f);
            }
            input = Vector2.ClampMagnitude(input, 1f);

            Vector3 forward = cameraTransform != null ? cameraTransform.forward : Vector3.forward;
            Vector3 right = cameraTransform != null ? cameraTransform.right : Vector3.right;
            forward.y = 0f;
            right.y = 0f;
            forward.Normalize();
            right.Normalize();

            Vector3 desired = forward * input.y + right * input.x;
            if (desired.sqrMagnitude > 1f) desired.Normalize();

            if (keyboard != null && keyboard.spaceKey.wasPressedThisFrame && dodgeCooldownTimer <= 0f)
            {
                dodgeDirection = desired.sqrMagnitude > .01f ? desired.normalized : transform.forward;
                dodgeTimer = dodgeDuration;
                dodgeCooldownTimer = dodgeCooldown;
            }

            bool sprinting = keyboard != null && keyboard.leftShiftKey.isPressed;
            float speed = sprinting ? sprintSpeed : walkSpeed;
            Vector3 planar = IsDodging ? dodgeDirection * dodgeSpeed : desired * speed;
            PlanarVelocity = planar;

            if (planar.sqrMagnitude > .03f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(planar.normalized, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, 1f - Mathf.Exp(-rotationSharpness * Time.deltaTime));
            }

            if (controller.isGrounded && verticalVelocity < 0f)
                verticalVelocity = -2f;
            else
                verticalVelocity += gravity * Time.deltaTime;

            Vector3 motion = planar + Vector3.up * verticalVelocity;
            controller.Move(motion * Time.deltaTime);
        }
    }
}
