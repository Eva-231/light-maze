using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;
using Object = UnityEngine.Object;

namespace LightMaze.EditorTools
{
    public static class ProductionCharacterBuilder
    {
        const string Source = "Assets/URP GanzSe Free Modular Character Pack/Prefabs/Modular Character/GanzSe Free Modular Character Update 1_1.prefab";
        const string Art = "Assets/LightMaze/Production";
        static Material ebony, silver, gold, cloth, hair, cyan, red;
        static Mesh blade;
        [MenuItem("LIGHT MAZE/Production/6. Build Characters _F10")]
        public static void Build()
        {
            if (AssetDatabase.LoadAssetAtPath<GameObject>(Source) == null)
                throw new InvalidOperationException("Import GanzSe FREE Modular Character from your Unity My Assets before building local characters.");
            Directory.CreateDirectory(Art+"/Animations");
            ebony=Mat("Tempered midnight",new Color(.11f,.14f,.19f),.55f,.57f);
            silver=Mat("Brushed moon silver",new Color(.38f,.46f,.55f),.85f,.65f);
            gold=Mat("Antique sovereign gold",new Color(.37f,.22f,.073f),.85f,.61f);
            cloth=Mat("Ivory woven silk",new Color(.58f,.64f,.7f),.04f,.28f);
            hair=Mat("Moon white hair",new Color(.77f,.82f,.91f),.05f,.4f);
            cyan=Mat("Bound LIGHT",new Color(.16f,.48f,.68f),.3f,.7f,new Color(.28f,.8f,1.5f));
            red=Mat("Shadow ember",new Color(.25f,.014f,.027f),.35f,.6f,new Color(1.1f,.018f,.035f));
            blade=Store(Blade(),Art+"/Meshes/ForgedBlade.asset");
            Human("Player_Explorer",0,6);
            Human("Enemy_AbyssGuardian",1,6);
            Human("Enemy_ShadowSoldier",2,2);
            AssetDatabase.SaveAssets();
            Debug.Log("Production: Explorer, Guardian and Shadow Soldier prefabs saved with authored skeletal clips and sockets.");
        }
        static void Human(string name,int role,int armorType)
        {
            var root=new GameObject(name); var model=Object.Instantiate(AssetDatabase.LoadAssetAtPath<GameObject>(Source),root.transform);model.name="Model";
            foreach(var s in model.GetComponentsInChildren<MonoBehaviour>(true))Object.DestroyImmediate(s);
            foreach(var a in model.GetComponentsInChildren<Animator>(true))Object.DestroyImmediate(a);
            var ts=model.GetComponentsInChildren<Transform>(true);
            Transform Find(string n)=>ts.First(t=>t!=null && t.name==n);
            foreach(var category in new[]{"HEADS","CHESTS","ARMS","BELTS","LEGS","FEET","NOSES","HAIRS","FACE HAIRS","EYES","EYEBROWS","EARS"})
            {
                var cat=Find(category);cat.gameObject.SetActive(true);
                string part=category switch {"HEADS"=>role==0?null:$"Head Armor Type {armorType} Color 1","CHESTS"=>$"Chest Armor Type {armorType} Color 1","ARMS"=>$"Arm Armor Type {armorType} Color 1","BELTS"=>$"Belt Armor Type {armorType} Color 1","LEGS"=>$"Legs Armor Type {armorType} Color 1","FEET"=>$"Feet Armor Type {armorType} Color 1","NOSES"=>"Nose Type 1","HAIRS"=>role==0?"Hair Type 3 Color 5":null,"EYES"=>"Eyes Type 2 Color 4","EYEBROWS"=>"Eyebrow Type 1 Color 5","EARS"=>"Ears Type 1",_=>null};
                foreach(Transform child in cat.Cast<Transform>().ToArray())if(child.name!=part)Object.DestroyImmediate(child.gameObject);
            }
            foreach(var r in model.GetComponentsInChildren<Renderer>(true))
            {
                if(r.name.Contains("Armor"))r.sharedMaterial=r.name.StartsWith("Arm ")||r.name.StartsWith("Feet ")?(role==1?gold:silver):ebony;
                else if(r.name.StartsWith("Hair")||r.name.StartsWith("Eyebrow"))r.sharedMaterial=hair;
                else if(role!=0)r.sharedMaterial=ebony;
                if(r is SkinnedMeshRenderer sk) {sk.updateWhenOffscreen=false;sk.quality=SkinQuality.Bone4;}
                if(r.name=="Base Character Mesh" && r is SkinnedMeshRenderer body)
                {
                    var mesh=Object.Instantiate(body.sharedMesh);var verts=mesh.vertices;var face=new List<int>();var underSuit=new List<int>();
                    var triangles=mesh.triangles;
                    for(int t=0;t<triangles.Length;t+=3)
                    {
                        var target=(verts[triangles[t]].y+verts[triangles[t+1]].y+verts[triangles[t+2]].y)/3f>1.44f?face:underSuit;
                        target.AddRange(new[]{triangles[t],triangles[t+1],triangles[t+2]});
                    }
                    mesh.subMeshCount=2;mesh.SetTriangles(face,0);mesh.SetTriangles(underSuit,1);
                    body.sharedMesh=Store(mesh,Art+"/Meshes/"+name+"_TailoredBody.asset");
                    body.sharedMaterials=new[]{role==0?Mat("Explorer skin",new Color(.52f,.38f,.32f),0,.3f):ebony,ebony};
                }
            }
            // Save bind rotations so every clip starts from the same skeleton, without root motion.
            var bones=model.GetComponentsInChildren<Transform>().Where(t=>t.name.Contains('_')&&!t.name.Contains(' ')).ToDictionary(t=>t.name);
            var bind=bones.ToDictionary(p=>p.Key,p=>p.Value.localRotation);
            var world=bones.ToDictionary(p=>p.Key,p=>p.Value.rotation);
            var parents=bones.ToDictionary(p=>p.Key,p=>p.Value.parent.rotation);
            Quaternion Pose(string b,Vector3 delta)=>Quaternion.Inverse(parents[b])*Quaternion.Euler(delta)*world[b];
            bones["upperarm_l"].localRotation=Pose("upperarm_l",new Vector3(0,0,70));
            bones["upperarm_r"].localRotation=Pose("upperarm_r",new Vector3(0,0,-70));
            // Accents follow bones. Coordinates are in the model's neutral standing space.
            var chest=Find("spine_04");var pelvis=Find("spine_01");var head=Find("head");
            Socket(root.transform,"Root",Vector3.zero);
            SocketWorld(chest,"ChestLightSocket",new Vector3(0,1.31f,.2f));
            SocketWorld(chest,"HitVfxSocket",new Vector3(0,1.18f,0));
            var handR=Find("hand_r");var handL=Find("hand_l");
            var weapon=SocketWorld(handR,"WeaponSocket_R",handR.position);
            SocketWorld(handL,"WeaponSocket_L",handL.position);
            SocketWorld(handL,"CastSocket",handL.position+Vector3.forward*.22f);
            MeshAt(chest,"LIGHT reliquary",blade,role==0?cyan:role==1?gold:red,new Vector3(0,1.26f,.22f),new Vector3(.1f,.19f,.055f));
            for(int i=0;i<4;i++)MeshAt(chest,"Core silver frame",blade,role==1?gold:silver,new Vector3((i%2==0?-.075f:.075f),1.23f+(i/2)*.09f,.215f),new Vector3(.017f,.1f,.016f),Quaternion.Euler(0,0,i%2==0?-18:18));
            var sword=MeshAt(weapon,"LIGHT edge",blade,role==0?cyan:role==1?gold:red,weapon.position,new Vector3(role==1?.16f:.045f,role==1?1.65f:1.15f,.027f),Quaternion.Euler(170,0,0));
            MeshAt(weapon,"Crossguard",blade,role==1?gold:silver,weapon.position,new Vector3(.05f,.35f,.055f),Quaternion.Euler(0,0,90));
            MeshAt(weapon,"Leather grip",blade,ebony,weapon.position+Vector3.up*.06f,new Vector3(.025f,.2f,.026f));
            // Cut cloth panels, layered in an open split coat so legs remain readable.
            for(int i=0;i<5;i++)
            {
                float x=(i-2)*.13f;
                var mesh=Store(Panel(x,role==1?1.05f:.77f,i),Art+$"/Meshes/{name}_Mantle{i}.asset");
                MeshAt(pelvis,"Split mantle "+i,mesh,role==0?(i%2==0?cloth:ebony):ebony,Vector3.zero,Vector3.one);
            }
            if(role==0)
            {
                for(int s=-1;s<=1;s+=2)for(int i=0;i<3;i++)MeshAt(chest,"Moon pauldrons",blade,silver,new Vector3(s*(.24f+i*.055f),1.4f-i*.035f,-.04f),new Vector3(.042f,.29f-i*.025f,.045f),Quaternion.Euler(-20,0,-s*(25+i*12)));
            }
            if(role==1)
            {
                MeshAt(head,"Sovereign halo",Store(Ring(.38f,.016f),Art+"/Meshes/SovereignHalo.asset"),gold,new Vector3(0,1.9f,-.13f),Vector3.one,Quaternion.Euler(18,0,0));
                for(int i=-3;i<=3;i++)MeshAt(head,"Crown lance",blade,gold,new Vector3(i*.065f,1.77f,-.07f),new Vector3(.028f,.32f-Mathf.Abs(i)*.035f,.026f),Quaternion.Euler(-8,0,-i*9));
                for(int s=-1;s<=1;s+=2)for(int i=0;i<4;i++)MeshAt(chest,"Winged pauldron",blade,i%2==0?gold:ebony,new Vector3(s*(.26f+i*.065f),1.38f-i*.035f,-.04f),new Vector3(.065f,.44f-i*.045f,.065f),Quaternion.Euler(-20,0,-s*(30+i*8)));
            }
            if(role==2)for(int s=-1;s<=1;s+=2)MeshAt(head,"Shadow horn",blade,ebony,new Vector3(s*.14f,1.73f,-.04f),new Vector3(.052f,.35f,.065f),Quaternion.Euler(-17,0,-s*23));
            var controller=Controller(name,role,model.transform,bones,bind,Pose);
            var animator=model.AddComponent<Animator>();animator.runtimeAnimatorController=controller;animator.applyRootMotion=false;animator.cullingMode=AnimatorCullingMode.CullUpdateTransforms;
            model.transform.localScale=role==1?new Vector3(1.7f,1.65f,1.7f):role==2?new Vector3(.95f,1.03f,.95f):Vector3.one;
            PrefabUtility.SaveAsPrefabAsset(root,Art+"/Resources/LightMazeProduction/Models/"+name+".prefab");
            Object.DestroyImmediate(root);
        }
        static AnimatorController Controller(string name,int role,Transform model,Dictionary<string,Transform> bones,Dictionary<string,Quaternion> bind,Func<string,Vector3,Quaternion> pose)
        {
            string path=Art+"/Animations/"+name+".controller";
            var ac=AssetDatabase.LoadAssetAtPath<AnimatorController>(path);
            if(ac==null)ac=AnimatorController.CreateAnimatorControllerAtPath(path);
            var sm=ac.layers[0].stateMachine;foreach(var s in sm.states)sm.RemoveState(s.state);ac.parameters=Array.Empty<AnimatorControllerParameter>();
            foreach(string p in new[]{"Speed","MoveSpeed01"})ac.AddParameter(p,AnimatorControllerParameterType.Float);
            foreach(string p in new[]{"Sprint","Grounded","Dead","Frozen"})ac.AddParameter(p,AnimatorControllerParameterType.Bool);
            foreach(string p in new[]{"Dodge","CastBolt","CastIceNova","Heal","Attack","HitReact","Freeze","Death"})ac.AddParameter(p,AnimatorControllerParameterType.Trigger);
            AnimationClip Clip(string type,float duration,bool loop)
            {
                var c=new AnimationClip {name=name+"_"+type,frameRate=30};
                foreach(var pair in bones)
                {
                    string b=pair.Key;var curves=new[]{new AnimationCurve(),new AnimationCurve(),new AnimationCurve(),new AnimationCurve()};
                    for(int k=0;k<=24;k++)
                    {
                        float t=k/24f, wave=Mathf.Sin(t*Mathf.PI*2),pulse=Mathf.Sin(t*Mathf.PI);Vector3 delta=Vector3.zero;
                        if(b=="upperarm_l")delta.z=70;if(b=="upperarm_r")delta.z=-70;
                        if(type=="Run")
                        {
                            if(b.StartsWith("upperleg"))delta.x=wave*(b.EndsWith("_l")?32:-32);
                            if(b.StartsWith("shin"))delta.x=-Mathf.Max(0,wave*(b.EndsWith("_l")?1:-1))*48;
                            if(b.StartsWith("upperarm"))delta.x=wave*(b.EndsWith("_l")?-25:25);
                            if(b=="spine_03")delta.x=8;
                        }
                        else if(type=="Idle"&&b=="spine_03")delta.x=wave*1.2f;
                        else if(type=="Attack"||type=="CastIceNova"||type=="CastBolt"||type=="Heal")
                        {
                            float a=type=="Attack"?Mathf.Sin(t*Mathf.PI):pulse;
                            if(b=="upperarm_r") {delta.x=-a*115;delta.z=-70+a*30;}
                            if(b=="upperarm_l") {delta.x=-a*(type=="CastBolt"?95:55);delta.z=70-a*28;}
                            if(b=="spine_03"){delta.y=(type=="Attack"?45:12)*Mathf.Sin(t*Mathf.PI*2);delta.x=a*8;}
                        }
                        else if(type=="Dodge"&&b=="spine_01")delta.x=pulse*65;
                        else if(type=="HitReact"&&b=="spine_03")delta.x=-pulse*15;
                        else if(type=="Death"&&b=="spine_01")delta.x=-Mathf.SmoothStep(0,1,t)*85;
                        Quaternion q=delta==Vector3.zero?bind[b]:pose(b,delta);
                        curves[0].AddKey(t*duration,q.x);curves[1].AddKey(t*duration,q.y);curves[2].AddKey(t*duration,q.z);curves[3].AddKey(t*duration,q.w);
                    }
                    string p=AnimationUtility.CalculateTransformPath(pair.Value,model);
                    for(int j=0;j<4;j++)c.SetCurve(p,typeof(Transform),"m_LocalRotation."+"xyzw"[j],curves[j]);
                }
                c.EnsureQuaternionContinuity();var settings=AnimationUtility.GetAnimationClipSettings(c);settings.loopTime=loop;AnimationUtility.SetAnimationClipSettings(c,settings);
                return Store(c,Art+"/Animations/"+name+"_"+type+".anim");
            }
            var idle=sm.AddState("Idle");idle.motion=Clip("Idle",2.4f,true);sm.defaultState=idle;
            var run=sm.AddState("Run");run.motion=Clip("Run",role==1?.9f:.65f,true);
            var tr=idle.AddTransition(run);tr.hasExitTime=false;tr.duration=.12f;tr.AddCondition(AnimatorConditionMode.Greater,.15f,"Speed");
            tr=run.AddTransition(idle);tr.hasExitTime=false;tr.duration=.12f;tr.AddCondition(AnimatorConditionMode.Less,.15f,"Speed");
            foreach(string type in role==0?new[]{"Dodge","CastBolt","CastIceNova","Heal","Death"}:new[]{"Attack","HitReact","Freeze","Death"})
            {
                var st=sm.AddState(type);st.motion=type=="Freeze"?idle.motion:Clip(type,type=="Attack"?.85f:type=="Dodge"?.45f:.7f,false);
                tr=sm.AddAnyStateTransition(st);tr.hasExitTime=false;tr.duration=.06f;tr.canTransitionToSelf=false;
                tr.AddCondition(type=="Death"?AnimatorConditionMode.If:AnimatorConditionMode.If,0,type=="Death"?"Dead":type);
                if(type!="Death"){var back=st.AddTransition(idle);back.hasExitTime=type!="Freeze";back.exitTime=.95f;back.duration=.12f;if(type=="Freeze")back.AddCondition(AnimatorConditionMode.IfNot,0,"Frozen");}
            }
            EditorUtility.SetDirty(ac);return ac;
        }
        static Transform Socket(Transform parent,string n,Vector3 pos){var g=new GameObject(n).transform;g.SetParent(parent,false);g.localPosition=pos;return g;}
        static Transform SocketWorld(Transform parent,string n,Vector3 pos){var g=Socket(parent,n,Vector3.zero);g.position=pos;g.rotation=Quaternion.identity;return g;}
        static Transform MeshAt(Transform parent,string n,Mesh mesh,Material mat,Vector3 pos,Vector3 scale,Quaternion? rot=null)
        {var g=SocketWorld(parent,n,pos);g.rotation=rot??Quaternion.identity;g.localScale=scale;g.gameObject.AddComponent<MeshFilter>().sharedMesh=mesh;g.gameObject.AddComponent<MeshRenderer>().sharedMaterial=mat;return g;}
        static Material Mat(string n,Color color,float metal,float gloss,Color emission=default)
        {var m=new Material(Shader.Find("Universal Render Pipeline/Lit")){name=n};m.SetColor("_BaseColor",color);m.SetFloat("_Metallic",metal);m.SetFloat("_Smoothness",gloss);m.SetFloat("_Cull",0);if(emission.maxColorComponent>0){m.EnableKeyword("_EMISSION");m.SetColor("_EmissionColor",emission);}return Store(m,Art+"/Materials/"+n+".mat");}
        static T Store<T>(T obj,string path)where T:Object {obj.name=Path.GetFileNameWithoutExtension(path);var old=AssetDatabase.LoadAssetAtPath<T>(path);if(old!=null){EditorUtility.CopySerialized(obj,old);Object.DestroyImmediate(obj);EditorUtility.SetDirty(old);return old;}AssetDatabase.CreateAsset(obj,path);return obj;}
        static Mesh Blade()
        {var m=new Mesh{name="Forged pointed lozenge"};m.vertices=new[]{new Vector3(-1,0,0),new Vector3(0,0,1),new Vector3(1,0,0),new Vector3(0,0,-1),new Vector3(-.65f,.8f,0),new Vector3(0,.8f,.65f),new Vector3(.65f,.8f,0),new Vector3(0,.8f,-.65f),new Vector3(0,1,0)};var tri=new List<int>();for(int i=0;i<4;i++){int j=(i+1)%4;tri.AddRange(new[]{i,j,i+4,j,j+4,i+4,i+4,j+4,8});}tri.AddRange(new[]{0,2,1,0,3,2});m.triangles=tri.ToArray();m.RecalculateNormals();m.RecalculateBounds();return m;}
        static Mesh Panel(float x,float length,int index)
        {var m=new Mesh{name="Tailored split cloth"};var v=new List<Vector3>();var tri=new List<int>();for(int j=0;j<=10;j++){float t=j/10f;float y=1.08f-t*length,z=-.19f-t*.15f+Mathf.Sin(t*5+index)*.025f;float w=.09f+t*.035f;v.Add(new Vector3(x-w-t*x*.5f,y,z));v.Add(new Vector3(x+w+t*x*.5f,y,z));if(j<10){int a=j*2;tri.AddRange(new[]{a,a+2,a+1,a+1,a+2,a+3});}}m.SetVertices(v);m.SetTriangles(tri,0);m.RecalculateNormals();m.RecalculateBounds();return m;}
        static Mesh Ring(float radius,float width)
        {var m=new Mesh();var v=new List<Vector3>();var tri=new List<int>();for(int i=0;i<=96;i++){float a=i*Mathf.PI*2/96;for(int j=0;j<2;j++)v.Add(new Vector3(Mathf.Cos(a)*(radius+j*width),0,Mathf.Sin(a)*(radius+j*width)));if(i<96){int p=i*2;tri.AddRange(new[]{p,p+1,p+2,p+1,p+3,p+2});}}m.SetVertices(v);m.SetTriangles(tri,0);m.RecalculateNormals();return m;}
    }
}
