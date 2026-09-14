#if UNITY_EDITOR
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;
namespace LightMaze.EditorTools
{
 public static class ProductionWolfBuilder
 {
 const string Art="Assets/LightMaze/Production";
 const string Source=Art+"/ThirdParty/Quaternius/Wolf.fbx";
 [MenuItem("LIGHT MAZE/Production/7. Build Rift Wolf _F11")]
 public static void Build()
 {
 var importer=(ModelImporter)AssetImporter.GetAtPath(Source);
 var clips=importer.defaultClipAnimations;
 foreach(var c in clips){c.loopTime=c.name.Contains("Idle")||c.name.Contains("Gallop")||c.name.EndsWith("Walk");c.lockRootPositionXZ=true;c.lockRootHeightY=true;c.lockRootRotation=true;}
 importer.clipAnimations=clips;importer.SaveAndReimport();
 var previous=GameObject.Find("Enemy_RiftWolf");if(previous)Object.DestroyImmediate(previous);var root=new GameObject("Enemy_RiftWolf");var model=Object.Instantiate(AssetDatabase.LoadAssetAtPath<GameObject>(Source),root.transform);model.name="Model";
 var skin=new Material(Shader.Find("Universal Render Pipeline/Lit")){name="Rift obsidian hide"};skin.SetColor("_BaseColor",new Color(.07f,.035f,.055f));skin.SetFloat("_Metallic",.25f);skin.SetFloat("_Smoothness",.38f);
 string matPath=Art+"/Materials/Rift obsidian hide.mat";var old=AssetDatabase.LoadAssetAtPath<Material>(matPath);if(old){EditorUtility.CopySerialized(skin,old);Object.DestroyImmediate(skin);skin=old;}else AssetDatabase.CreateAsset(skin,matPath);
 foreach(var r in model.GetComponentsInChildren<Renderer>())r.sharedMaterials=r.sharedMaterials.Select(_=>skin).ToArray();
 var bones=model.GetComponentsInChildren<Transform>();var head=bones.First(t=>t.name=="Head");var back=bones.First(t=>t.name=="Torso2");
 var blade=AssetDatabase.LoadAssetAtPath<Mesh>(Art+"/Meshes/ForgedBlade.asset");var ember=AssetDatabase.LoadAssetAtPath<Material>(Art+"/Materials/Shadow ember.mat");
 for(int i=0;i<7;i++)Add(back,"Rift mane "+i,new Vector3(0,2.25f,.65f-i*.2f),new Vector3(.045f,.32f+(i%2)*.15f,.065f),Quaternion.Euler(-30,0,0),blade,ember);
 for(int s=-1;s<=1;s+=2)Add(head,"Ember eye",new Vector3(s*.21f,2.18f,2.07f),new Vector3(.065f,.035f,.045f),Quaternion.Euler(0,0,90),blade,ember);
 foreach(string n in new[]{"Root","WeaponSocket_R","WeaponSocket_L","ChestLightSocket","CastSocket","HitVfxSocket"}){var t=new GameObject(n).transform;t.SetParent(model.transform,false);t.localPosition=n=="Root"?Vector3.zero:n=="CastSocket"?new Vector3(0,1.9f,2.3f):new Vector3(0,1.8f,.5f);}
 string path=Art+"/Animations/Enemy_RiftWolf.controller";var ac=AssetDatabase.LoadAssetAtPath<AnimatorController>(path);if(!ac)ac=AnimatorController.CreateAnimatorControllerAtPath(path);
 var sm=ac.layers[0].stateMachine;foreach(var s in sm.states)sm.RemoveState(s.state);ac.parameters=System.Array.Empty<AnimatorControllerParameter>();
 ac.AddParameter("Speed",AnimatorControllerParameterType.Float);foreach(var p in new[]{"Dead","Frozen"})ac.AddParameter(p,AnimatorControllerParameterType.Bool);foreach(var p in new[]{"Attack","Death","HitReact","Freeze"})ac.AddParameter(p,AnimatorControllerParameterType.Trigger);
 var motions=AssetDatabase.LoadAllAssetsAtPath(Source).OfType<AnimationClip>().Where(c=>!c.name.StartsWith("__preview__")).ToArray();
 AnimationClip Clip(string n)=>motions.First(c=>c.name=="AnimalArmature|"+n);
 var idle=sm.AddState("Idle");idle.motion=Clip("Idle_2_HeadLow");sm.defaultState=idle;var run=sm.AddState("Gallop");run.motion=Clip("Gallop");
 var tr=idle.AddTransition(run);tr.hasExitTime=false;tr.duration=.15f;tr.AddCondition(AnimatorConditionMode.Greater,.2f,"Speed");tr=run.AddTransition(idle);tr.hasExitTime=false;tr.duration=.15f;tr.AddCondition(AnimatorConditionMode.Less,.2f,"Speed");
 foreach(string n in new[]{"Attack","HitReact","Death","Freeze"}){var st=sm.AddState(n);st.motion=Clip(n=="HitReact"?"Idle_HitReact_Left":n=="Freeze"?"Idle":n);if(n=="Freeze")st.speed=0;tr=sm.AddAnyStateTransition(st);tr.hasExitTime=false;tr.canTransitionToSelf=false;tr.duration=.08f;tr.AddCondition(AnimatorConditionMode.If,0,n=="Death"?"Dead":n);if(n!="Death"){var bk=st.AddTransition(idle);bk.hasExitTime=n!="Freeze";bk.exitTime=.9f;bk.duration=.12f;if(n=="Freeze")bk.AddCondition(AnimatorConditionMode.IfNot,0,"Frozen");}}
 var animator=model.GetComponent<Animator>();if(!animator)animator=model.AddComponent<Animator>();animator.runtimeAnimatorController=ac;animator.applyRootMotion=false;
 model.transform.localScale=Vector3.one*.52f;
 PrefabUtility.SaveAsPrefabAsset(root,Art+"/Resources/LightMazeProduction/Models/Enemy_RiftWolf.prefab");Object.DestroyImmediate(root);EditorUtility.SetDirty(ac);AssetDatabase.SaveAssets();Debug.Log("Production Rift Wolf saved: original quadruped rig, gallop, bite, stagger, freeze and death.");
 }
 static void Add(Transform parent,string n,Vector3 pos,Vector3 scale,Quaternion rot,Mesh mesh,Material mat){var g=new GameObject(n);g.transform.SetParent(parent,false);g.transform.position=pos;g.transform.rotation=rot;var p=parent.lossyScale;g.transform.localScale=new Vector3(scale.x/p.x,scale.y/p.y,scale.z/p.z);g.AddComponent<MeshFilter>().sharedMesh=mesh;g.AddComponent<MeshRenderer>().sharedMaterial=mat;}
 }
}
#endif
