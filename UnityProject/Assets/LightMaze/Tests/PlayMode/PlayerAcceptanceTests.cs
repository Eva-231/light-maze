using System;
using System.Collections;
using System.Reflection;
using NUnit.Framework;
#if UNITY_EDITOR
using UnityEditor.SceneManagement;
#endif
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.LowLevel;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace LightMaze.Tests
{
    // Reflection keeps the test assembly independent of the existing predefined
    // Assembly-CSharp assembly; no production assembly reorganization is needed.
    public sealed class PlayerAcceptanceTests
    {
        GameObject player;
        Gamepad pad;
        Component vitals;
        Component motor;
        Component combat;

        static Type RuntimeType(string name) => Type.GetType(name + ", Assembly-CSharp", true);
        static object Value(Component component, string name) => component.GetType().GetProperty(name).GetValue(component);
        static void Invoke(Component component, string name, params object[] arguments) =>
            component.GetType().GetMethod(name, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic).Invoke(component, arguments);

        [UnitySetUp]
        public IEnumerator LoadRealScene()
        {
            Time.timeScale = 1;
#if UNITY_EDITOR
            yield return EditorSceneManager.LoadSceneAsyncInPlayMode("Assets/Scenes/SampleScene.unity", new LoadSceneParameters(LoadSceneMode.Single));
#else
            yield return SceneManager.LoadSceneAsync("SampleScene", LoadSceneMode.Single);
#endif
            for (int frame = 0; frame < 15; frame++) yield return null;
            player = GameObject.Find("Explorer // Player");
            Assert.That(player, Is.Not.Null, "The actual game scene must create its player.");
            vitals = player.GetComponent(RuntimeType("LightMaze.Combat.PlayerVitals"));
            motor = player.GetComponent(RuntimeType("LightMaze.Player.PrototypeThirdPersonMotor"));
            combat = player.GetComponent(RuntimeType("LightMaze.Combat.LightMazePlayerCombat"));
            Assert.That(vitals, Is.Not.Null);
            Assert.That(motor, Is.Not.Null);
            Assert.That(combat, Is.Not.Null);
            pad = InputSystem.AddDevice<Gamepad>();
            pad.MakeCurrent();
        }

        [UnityTearDown]
        public IEnumerator Cleanup()
        {
            if (pad != null && pad.added) InputSystem.RemoveDevice(pad);
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
            Time.timeScale = 1;
            yield return null;
        }

        [UnityTest]
        public IEnumerator MovementCameraDodgeAndDeath()
        {
            Vector3 start = player.transform.position;
            Quaternion cameraStart = Camera.main.transform.rotation;
            InputSystem.QueueStateEvent(pad, new GamepadState { leftStick = Vector2.up, rightStick = new Vector2(.6f, 0) });
            yield return new WaitForSeconds(.35f);
            Assert.That(Vector3.Distance(start, player.transform.position), Is.GreaterThan(.5f), "Left stick must move the actual CharacterController.");
            Assert.That(Quaternion.Angle(cameraStart, Camera.main.transform.rotation), Is.GreaterThan(5f), "Right stick must rotate the camera.");
            InputSystem.QueueStateEvent(pad, new GamepadState().WithButton(GamepadButton.East));
            yield return null;
            yield return null;
            Assert.That((bool)Value(motor, "IsDodging"), Is.True, "B must initiate a dodge.");
            Invoke(vitals, "Damage", 1000f);
            yield return null;
            Vector3 deathPosition = player.transform.position;
            InputSystem.QueueStateEvent(pad, new GamepadState { leftStick = Vector2.up });
            yield return new WaitForSeconds(.25f);
            Assert.That((bool)Value(vitals, "IsDead"), Is.True);
            Assert.That(Vector3.Distance(deathPosition, player.transform.position), Is.LessThan(.001f), "Dead players must not keep moving.");
            Assert.That((bool)Value(motor, "IsDodging"), Is.False);
        }

        [UnityTest]
        public IEnumerator SpellsSpendManaFreezeAndKillEnemies()
        {
            var enemy = GameObject.Find("Shadow Soldier").GetComponent(RuntimeType("LightMaze.Enemies.PrototypeEnemy"));
            enemy.transform.position = player.transform.position + player.transform.forward * 3;
            float before = (float)Value(vitals, "Mp");
            InputSystem.QueueStateEvent(pad, new GamepadState().WithButton(GamepadButton.LeftShoulder));
            yield return null;
            yield return null;
            Assert.That((float)Value(vitals, "Mp"), Is.LessThan(before - 10f), "LB must cast Ice Nova and spend mana.");
            Assert.That((bool)Value(enemy, "IsFrozen"), Is.True, "Ice Nova must freeze a nearby real enemy.");
            Invoke(enemy, "TakeDamage", 1000f);
            Assert.That((bool)Value(enemy, "IsDead"), Is.True);
            Invoke(vitals, "Damage", 40f);
            float hurt = (float)Value(vitals, "Hp");
            InputSystem.QueueStateEvent(pad, new GamepadState().WithButton(GamepadButton.North));
            yield return null;
            yield return null;
            Assert.That((float)Value(vitals, "Hp"), Is.GreaterThan(hurt + 20f), "Y must heal the actual player.");
        }

        [UnityTest]
        public IEnumerator SwordHitsOnceAndRejectsTargetsBehindPlayer()
        {
            var enemy = GameObject.Find("Abyss Guardian").GetComponent(RuntimeType("LightMaze.Enemies.PrototypeEnemy"));
            enemy.transform.position = player.transform.position + player.transform.forward * 1.8f;
            enemy.GetType().GetProperty("enabled").SetValue(enemy, false);
            float before = (float)Value(enemy, "Hp01");
            InputSystem.QueueStateEvent(pad, new GamepadState().WithButton(GamepadButton.West));
            yield return new WaitForSeconds(.35f);
            float after = (float)Value(enemy, "Hp01");
            Assert.That(before - after, Is.EqualTo(22f / 240f).Within(.001f), "Multiple colliders must not multiply a sword hit.");
            yield return new WaitForSeconds(.25f);
            Assert.That((float)Value(enemy, "Hp01"), Is.EqualTo(after).Within(.001f), "Holding X must not repeat attacks.");
            InputSystem.QueueStateEvent(pad, new GamepadState());
            yield return null;
            enemy.transform.position = player.transform.position - player.transform.forward * 1.8f;
            InputSystem.QueueStateEvent(pad, new GamepadState().WithButton(GamepadButton.West));
            yield return new WaitForSeconds(.35f);
            Assert.That((float)Value(enemy, "Hp01"), Is.EqualTo(after).Within(.001f), "A sword strike must not hit behind the player.");
        }

        [UnityTest]
        public IEnumerator DeathRetryRecreatesWorldAndPlayer()
        {
            var previousPlayer = player;
            Invoke(vitals, "Damage", 1000f);
            InputSystem.QueueStateEvent(pad, new GamepadState().WithButton(GamepadButton.Start));
            for (int frame = 0; frame < 30; frame++) yield return null;
            var restored = GameObject.Find("Explorer // Player");
            Assert.That(restored, Is.Not.Null, "Retry must rebuild the runtime scene, not load an empty template.");
            Assert.That(restored, Is.Not.SameAs(previousPlayer));
            Assert.That((bool)Value(restored.GetComponent(RuntimeType("LightMaze.Combat.PlayerVitals")), "IsDead"), Is.False);
            Assert.That(GameObject.Find("Abyss Guardian"), Is.Not.Null);
            Assert.That(Camera.main, Is.Not.Null);
            Assert.That(restored.transform.Find("Production Explorer Visual"), Is.Not.Null);
        }

        [UnityTest]
        public IEnumerator ProductionCharacterIsAnimatedAndRenderable()
        {
            var visual = player.transform.Find("Production Explorer Visual");
            Assert.That(visual, Is.Not.Null, "Missing licensed assets must not silently pass as a production character.");
            var animator = visual.GetComponentInChildren<Animator>();
            Assert.That(animator, Is.Not.Null);
            Assert.That(animator.runtimeAnimatorController, Is.Not.Null);
            var renderers = visual.GetComponentsInChildren<Renderer>();
            Assert.That(renderers.Length, Is.GreaterThan(0));
            foreach (var renderer in renderers)
                foreach (var material in renderer.sharedMaterials)
                {
                    Assert.That(material, Is.Not.Null, renderer.name);
                    Assert.That(material.shader.isSupported, Is.True, material.name);
                }
            InputSystem.QueueStateEvent(pad, new GamepadState { leftStick = Vector2.up });
            yield return new WaitForSeconds(.3f);
            Assert.That(animator.GetFloat("Speed"), Is.GreaterThan(.1f), "Movement must reach the production Animator.");
            // This is an integration gate. It does not certify artistic quality.
        }
    }
}
