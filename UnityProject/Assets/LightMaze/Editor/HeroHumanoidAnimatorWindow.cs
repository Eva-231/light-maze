using System;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;
using LightMaze.Combat;

namespace LightMaze.EditorTools
{
    // Import real, licensed Humanoid motion; do not reuse GanzSe transform curves.
    public sealed class HeroHumanoidAnimatorWindow : EditorWindow
    {
        static readonly string[] Names = { "Idle", "Walk", "Run", "Dodge", "Sword1", "Sword2", "Sword3", "CastBolt", "CastIceNova", "Heal", "Death" };
        [SerializeField] AnimationClip[] clips = new AnimationClip[11];
        Vector2 scroll;

        [MenuItem("LIGHT MAZE/Production/Build Hero Humanoid Animator")]
        static void Open() => GetWindow<HeroHumanoidAnimatorWindow>("Hero Animation");

        void OnGUI()
        {
            EditorGUILayout.HelpBox("Assign Humanoid clips from your licensed motion assets. This preserves the existing CharacterController and Xbox input. It does not create a model or motion capture.", MessageType.Info);
            scroll = EditorGUILayout.BeginScrollView(scroll);
            for (int i = 0; i < Names.Length; i++)
                clips[i] = (AnimationClip)EditorGUILayout.ObjectField(Names[i], clips[i], typeof(AnimationClip), false);
            if (GUILayout.Button("Build new retargetable controller"))
            {
                try
                {
                    ValidateClips();
                    string path = EditorUtility.SaveFilePanelInProject("Hero controller", "HeroHumanoid", "controller", "Save a new controller; existing assets are preserved.");
                    if (!string.IsNullOrEmpty(path)) Build(AssetDatabase.GenerateUniqueAssetPath(path));
                }
                catch (Exception e) { Debug.LogError(e.Message); }
            }
            EditorGUILayout.EndScrollView();
        }

        void ValidateClips()
        {
            for (int i = 0; i < clips.Length; i++)
                if (clips[i] == null || clips[i].legacy || !clips[i].isHumanMotion || clips[i].length <= 0)
                    throw new InvalidOperationException(Names[i] + ": assign a non-empty Humanoid animation clip.");
            for (int i = 0; i < 3; i++)
                if (!clips[i].isLooping) throw new InvalidOperationException(Names[i] + ": enable Loop Time in the source import settings.");
            for (int i = 3; i < clips.Length; i++)
                if (clips[i].isLooping) throw new InvalidOperationException(Names[i] + ": disable Loop Time for this action clip.");
        }

        void Build(string path)
        {
            var controller = AnimatorController.CreateAnimatorControllerAtPath(path);
            foreach (string p in new[] { "Speed", "MoveSpeed01" }) controller.AddParameter(p, AnimatorControllerParameterType.Float);
            foreach (string p in new[] { "Sprint", "Grounded", "Dead" }) controller.AddParameter(p, AnimatorControllerParameterType.Bool);
            foreach (string p in new[] { "Dodge", "CastBolt", "CastIceNova", "Heal" }) controller.AddParameter(p, AnimatorControllerParameterType.Trigger);
            var machine = controller.layers[0].stateMachine;
            var idle = machine.AddState("Idle");
            var blend = new BlendTree { name = "Locomotion", blendParameter = "Speed", blendType = BlendTreeType.Simple1D, useAutomaticThresholds = false };
            AssetDatabase.AddObjectToAsset(blend, controller);
            blend.AddChild(clips[0], 0);
            blend.AddChild(clips[1], 5.2f);
            blend.AddChild(clips[2], 8.2f);
            idle.motion = blend;
            machine.defaultState = idle;

            // Death has priority and never returns to locomotion.
            var death = machine.AddState("Death");
            death.motion = clips[10];
            var die = machine.AddAnyStateTransition(death);
            die.hasExitTime = false; die.duration = .08f; die.canTransitionToSelf = false;
            die.AddCondition(AnimatorConditionMode.If, 0, "Dead");

            for (int i = 3; i < 10; i++)
            {
                var state = machine.AddState(Names[i]);
                state.motion = clips[i];
                if (i >= 4 && i <= 6) state.speed = clips[i].length / PlayerSwordCombat.Durations[i - 4];
                else
                {
                    var enter = machine.AddAnyStateTransition(state);
                    enter.hasExitTime = false; enter.duration = .06f; enter.canTransitionToSelf = false;
                    enter.AddCondition(AnimatorConditionMode.If, 0, Names[i]);
                    enter.AddCondition(AnimatorConditionMode.IfNot, 0, "Dead");
                    if (i == 3) state.speed = clips[i].length / .18f;
                }
                var back = state.AddTransition(idle);
                back.hasExitTime = true; back.exitTime = 1; back.duration = .06f;
            }
            EditorUtility.SetDirty(controller);
            AssetDatabase.SaveAssets();
            Selection.activeObject = controller;
            Debug.Log("Hero Humanoid controller created. Assign it in High Fidelity Character Pipeline, then verify foot contact, sword impact timing and face/full-body screenshots in Play Mode. No visual acceptance is implied.");
        }
    }
}
