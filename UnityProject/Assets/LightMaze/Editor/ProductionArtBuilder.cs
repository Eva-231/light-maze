#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using LightMaze.Production;

namespace LightMaze.EditorTools
{
    public static class ProductionArtBuilder
    {
        const string Root = "Assets/LightMaze/Production";
        const string Res = Root + "/Resources/LightMazeProduction";
        static Material ice, sigil, sweep, mist, spark, gold;
        static Mesh plane, crystal;
        static readonly Color Blue = new Color(.24f, .66f, 1f);

        [MenuItem("LIGHT MAZE/Production/4. Build Signature Effects _F6")]
        public static void BuildEffects()
        {
            Directory.CreateDirectory(Root + "/Meshes");
            Directory.CreateDirectory(Root + "/Materials");
            Directory.CreateDirectory(Res + "/VFX");
            AssetDatabase.Refresh();
            plane = Store(Plane(), Root + "/Meshes/EffectPlane.asset");
            crystal = Store(Crystal(), Root + "/Meshes/FacetedIce.asset");
            ice = Lit("Glacial obsidian", new Color(.075f,.28f,.43f), .68f, .5f, Blue*.45f);
            ice.shader=Shader.Find("LightMaze/Production/Glacial Crystal");
            ice.SetColor("_EmissionColor",new Color(.12f,.62f,1.15f));
            sigil = Fx("Glacial calligraphy", Blue*2.5f, 0);
            sweep = Fx("Radial frost light", Blue*2.2f, 1);
            mist = Fx("Cold vapor", new Color(.22f,.44f,.62f,.32f), 2);
            spark = Fx("Ice sparks", Blue*3f, 3);
            gold = Fx("Guardian gold", new Color(1.4f,.64f,.12f), 0);
            BuildNova();
            BuildBurst("VFX_LightBolt_Cast", Blue, .75f);
            BuildBurst("VFX_LightBolt_Impact", Blue, 1.6f);
            BuildBurst("VFX_Hit_Red", new Color(1f,.06f,.12f), .75f);
            BuildBurst("VFX_Hit_Gold", new Color(1f,.54f,.12f), .75f);
            BuildBurst("VFX_Death_Shadow", new Color(.6f,.09f,.32f), 1.5f);
            BuildBurst("VFX_Death_Wolf", new Color(.8f,.055f,.12f), 1.5f);
            BuildBurst("VFX_Death_Guardian", new Color(1f,.55f,.16f), 2.5f);
            BuildHeal(); BuildGuardian(); BuildProjectile();
            AssetDatabase.SaveAssets();
            Debug.Log("LIGHT MAZE: authored signature VFX saved. Play SampleScene, Q for Ice Nova, J for Light Bolt.");
        }

        static void BuildNova()
        {
            var root = new GameObject("VFX_IceNova");
            var layers = new List<ProductionEffectSequence.Layer>();
            Layer(root, layers, "01 Preflash 110ms", plane, spark, new Vector3(0,.055f,0), 0,.025f,.035f,.05f, .4f, 3f);
            Layer(root, layers, "02 Sixfold ice scripture", plane, sigil, new Vector3(0,.04f,0), .065f,.17f,.38f,.95f, 1.4f, 12f);
            Layer(root, layers, "03 Supersonic floor sweep", plane, sweep, new Vector3(0,.065f,0), .11f,.32f,0,.3f, .8f, 33f);
            Layer(root, layers, "Frozen floor afterimage", plane, sweep, new Vector3(0,.045f,0), .3f,.1f,.45f,.85f, 17f, 21f);
            // Two offset crowns leave a clear central corridor and vary height without solid walls of ice.
            var random = new System.Random(231);
            for (int i=0;i<32;i++)
            {
                float angle = i * Mathf.PI * 2 / 32;
                float radius = i%2==0 ? 5.1f : 8.6f;
                float height = 1.4f + (float)random.NextDouble()*2.9f;
                Vector3 p = new Vector3(Mathf.Cos(angle)*radius,0,Mathf.Sin(angle)*radius);
                var l=Layer(root,layers,"Ice crown " + i,crystal,ice,p,.15f+radius*.012f,.15f,.27f,.8f,1,1);
                l.initialScale=new Vector3(.45f,.015f,.5f);
                l.finalScale=new Vector3(.5f+(float)random.NextDouble()*.4f,height,.5f);
                l.target.localRotation=Quaternion.Euler(Mathf.Sin(angle)*17,i*43,Mathf.Cos(angle)*-17);
                var ray=Layer(root,layers,"Fissure " + i,plane,spark,p+Vector3.up*.055f,.14f,.15f,.18f,.75f,1,1);
                ray.finalScale=new Vector3(.16f,1,2.6f); ray.initialScale=ray.finalScale*.1f;
                ray.target.localRotation=Quaternion.Euler(0,-angle*Mathf.Rad2Deg,0);
            }
            for(int i=0;i<10;i++)
            {
                float a=i*2.39996f;
                var l=Layer(root,layers,"Low drifting frost " + i,plane,mist,new Vector3(Mathf.Cos(a)*4,.15f,Mathf.Sin(a)*4),.28f,.25f,.12f,.9f,1.5f,5f);
                l.velocity=new Vector3(Mathf.Cos(a),.18f,Mathf.Sin(a)); l.secondary=i%2==1;
            }
            AddParticles(root, "05 Ejected ice fragments", Blue*1.8f, .22f, 96, 5f, .6f, .09f, crystal);
            AddParticles(root, "07 Lingering diamond dust", Blue*2f, .3f, 130, .65f, 1.2f, .035f, null, 7f);
            root.AddComponent<ProductionEffectSequence>().layers=layers.ToArray();
            Save(root,"VFX_IceNova");
        }
        static void BuildBurst(string name, Color color, float scale)
        {
            var root=new GameObject(name); var layers=new List<ProductionEffectSequence.Layer>();
            var mat=Fx(name+" light",color*2f,3);
            var l=Layer(root,layers,"Compact impact flash",plane,mat,Vector3.zero,0,.035f,.025f,.16f,.1f,scale);
            l.target.localRotation=Quaternion.Euler(90,0,0);
            AddParticles(root,"Directional splinters",color*1.8f,0,28,3.2f*scale,.36f,.05f,crystal);
            root.AddComponent<ProductionEffectSequence>().layers=layers.ToArray(); Save(root,name);
        }
        static void BuildHeal()
        {
            var root=new GameObject("VFX_Heal"); var layers=new List<ProductionEffectSequence.Layer>();
            Layer(root,layers,"Restoration scripture",plane,Fx("Restoration",new Color(.2f,1.25f,.85f),0),new Vector3(0,.055f,0),0,.2f,.45f,.8f,.2f,3f);
            AddParticles(root,"Rising light",new Color(.3f,1f,.8f),.1f,40,.9f,1f,.05f,null,1.2f);
            root.AddComponent<ProductionEffectSequence>().layers=layers.ToArray(); Save(root,"VFX_Heal");
        }
        static void BuildGuardian()
        {
            var root=new GameObject("VFX_Guardian_Attack"); var layers=new List<ProductionEffectSequence.Layer>();
            Layer(root,layers,"Gold warning scripture",plane,gold,new Vector3(0,.06f,0),0,.07f,.4f,.12f,4.8f,4.8f);
            var arc=Store(Arc(),Root+"/Meshes/GuardianCrescent.asset");
            var slash=Layer(root,layers,"Execution crescent",arc,Fx("Gold blade",new Color(2f,.85f,.18f),3),new Vector3(0,.9f,0),.48f,.045f,.045f,.22f,.7f,1.5f);
            slash.rotation=-180;
            Layer(root,layers,"Impact shockwave",plane,Fx("Gold shockwave",new Color(1.5f,.6f,.13f),1),new Vector3(0,.07f,0),.51f,.22f,0,.25f,.5f,8f);
            AddParticles(root,"Gold impact sparks",new Color(1.4f,.64f,.1f),.5f,30,5f,.45f,.065f,null);
            root.AddComponent<ProductionEffectSequence>().layers=layers.ToArray(); Save(root,"VFX_Guardian_Attack");
        }
        static void BuildProjectile()
        {
            var root=new GameObject("VFX_LightBolt_Projectile");
            // The existing gameplay root is scaled to .21; compensate only in this visual child.
            root.AddComponent<ProductionBoltVisual>();
            var core=MeshObject(root,"Needle of light",crystal,ice,Vector3.zero);
            core.transform.localScale=new Vector3(.09f,.65f,.09f);
            core.transform.localRotation=Quaternion.Euler(90,0,0);
            var trail=root.AddComponent<TrailRenderer>(); trail.sharedMaterial=spark;
            trail.time=.16f; trail.minVertexDistance=.08f; trail.startWidth=.16f; trail.endWidth=.005f;
            trail.colorGradient=Gradient(Blue*2f);
            trail.shadowCastingMode=ShadowCastingMode.Off; trail.receiveShadows=false;
            AddParticles(root,"Ribbon sparks",Blue*2f,0,0,.3f,.16f,.045f,null);
            var ps=root.GetComponentInChildren<ParticleSystem>(); var main=ps.main; main.loop=true; main.duration=1;
            var em=ps.emission; em.rateOverTime=55;
            Save(root,"VFX_LightBolt_Projectile");
        }
        static ProductionEffectSequence.Layer Layer(GameObject root,List<ProductionEffectSequence.Layer> layers,string name,Mesh mesh,Material mat,Vector3 p,float delay,float attack,float hold,float release,float from,float to)
        {
            if(mesh==plane && p.y>=0 && p.y<.1f) p.y=.1f;
            var go=MeshObject(root,name,mesh,mat,p);
            var l=new ProductionEffectSequence.Layer{target=go.transform,delay=delay,attack=attack,hold=hold,release=release,initialScale=Vector3.one*from,finalScale=Vector3.one*to};
            layers.Add(l); return l;
        }
        static void AddParticles(GameObject root,string name,Color color,float delay,int count,float speed,float life,float size,Mesh mesh,float radius=.3f)
        {
            var go=new GameObject(name); go.transform.SetParent(root.transform,false); go.transform.localPosition=Vector3.up*.3f;
            go.transform.localRotation=Quaternion.Euler(-90,0,0);
            var ps=go.AddComponent<ParticleSystem>(); ps.Stop(true,ParticleSystemStopBehavior.StopEmittingAndClear);
            var main=ps.main; main.loop=false; main.duration=2; main.startDelay=delay; main.startLifetime=new ParticleSystem.MinMaxCurve(life*.65f,life);
            main.startSpeed=new ParticleSystem.MinMaxCurve(speed*.4f,speed); main.startSize=new ParticleSystem.MinMaxCurve(size*.4f,size);
            main.startColor=color; main.maxParticles=Mathf.Max(count,64); main.simulationSpace=ParticleSystemSimulationSpace.World;
            main.gravityModifier=mesh!=null?.65f:-.025f;
            var shape=ps.shape; shape.shapeType=ParticleSystemShapeType.Cone; shape.angle=70; shape.radius=radius;
            var em=ps.emission; em.rateOverTime=0; if(count>0) em.SetBursts(new[]{new ParticleSystem.Burst(0,(short)count)});
            var col=ps.colorOverLifetime; col.enabled=true; col.color=Gradient(color);
            var sz=ps.sizeOverLifetime; sz.enabled=true; sz.size=new ParticleSystem.MinMaxCurve(1,new AnimationCurve(new Keyframe(0,.35f),new Keyframe(.15f,1),new Keyframe(1,0)));
            var r=go.GetComponent<ParticleSystemRenderer>(); r.sharedMaterial=mesh?ice:spark; r.shadowCastingMode=ShadowCastingMode.Off; r.receiveShadows=false;
            if(mesh){r.renderMode=ParticleSystemRenderMode.Mesh;r.mesh=mesh;} else r.renderMode=ParticleSystemRenderMode.Billboard;
        }
        static Gradient Gradient(Color c) {var g=new Gradient();g.SetKeys(new[]{new GradientColorKey(c,0),new GradientColorKey(c*.5f,1)},new[]{new GradientAlphaKey(0,0),new GradientAlphaKey(1,.08f),new GradientAlphaKey(0,1)});return g;}
        internal static GameObject MeshObject(GameObject root,string name,Mesh mesh,Material mat,Vector3 p)
        {var go=new GameObject(name);go.transform.SetParent(root.transform,false);go.transform.localPosition=p;go.AddComponent<MeshFilter>().sharedMesh=mesh;var r=go.AddComponent<MeshRenderer>();r.sharedMaterial=mat;r.shadowCastingMode=mat.shader.name.Contains("Sigil")?ShadowCastingMode.Off:ShadowCastingMode.On;return go;}
        static void Save(GameObject root,string name) {PrefabUtility.SaveAsPrefabAsset(root,Res+"/VFX/"+name+".prefab");Object.DestroyImmediate(root);}
        internal static Material Lit(string name,Color color,float metal,float smooth,Color emission)
        {var m=new Material(Shader.Find("Universal Render Pipeline/Lit")){name=name};m.SetColor("_BaseColor",color);m.SetFloat("_Metallic",metal);m.SetFloat("_Smoothness",smooth);m.EnableKeyword("_EMISSION");m.SetColor("_EmissionColor",emission);return Store(m,Root+"/Materials/"+name+".mat");}
        public static Material Fx(string name,Color color,float mode)
        {var m=new Material(Shader.Find("LightMaze/Production/Sigil")){name=name};m.SetColor("_Tint",color);m.SetFloat("_Mode",mode);return Store(m,Root+"/Materials/"+name+".mat");}
        internal static T Store<T>(T asset,string path) where T:Object
        {var old=AssetDatabase.LoadAssetAtPath<T>(path);if(old){EditorUtility.CopySerialized(asset,old);Object.DestroyImmediate(asset);return old;}AssetDatabase.CreateAsset(asset,path);return asset;}
        static Mesh Plane()
        {var m=new Mesh{name="Calligraphy plane"};m.vertices=new[]{new Vector3(-.5f,0,-.5f),new Vector3(.5f,0,-.5f),new Vector3(.5f,0,.5f),new Vector3(-.5f,0,.5f)};m.uv=new[]{Vector2.zero,Vector2.right,Vector2.one,Vector2.up};m.colors=new[]{Color.white,Color.white,Color.white,Color.white};m.triangles=new[]{0,2,1,0,3,2};m.RecalculateNormals();m.RecalculateBounds();return m;}
        static Mesh Crystal()
        {
            var v=new List<Vector3>();var tris=new List<int>();var uv=new List<Vector2>();
            for(int i=0;i<6;i++)
            {
                float a=i*Mathf.PI/3,b=(i+1)*Mathf.PI/3;
                Vector3 p=new Vector3(Mathf.Cos(a)*.5f,0,Mathf.Sin(a)*.5f),q=new Vector3(Mathf.Cos(b)*.5f,0,Mathf.Sin(b)*.5f);
                Vector3 hi=new Vector3(p.x*.62f,.7f,p.z*.62f),hj=new Vector3(q.x*.62f,.7f,q.z*.62f),tip=new Vector3(.12f,1,-.08f);
                Tri(p,hi,q);Tri(q,hi,hj);Tri(hi,tip,hj);Tri(Vector3.zero,p,q);
            }
            void Tri(Vector3 a,Vector3 b,Vector3 c){int n=v.Count;v.Add(a);v.Add(b);v.Add(c);uv.Add(Vector2.zero);uv.Add(Vector2.up);uv.Add(Vector2.one);tris.Add(n);tris.Add(n+1);tris.Add(n+2);}
            var m=new Mesh{name="Six-sided cut ice"};m.SetVertices(v);m.SetUVs(0,uv);m.SetTriangles(tris,0);m.RecalculateNormals();m.RecalculateBounds();return m;
        }
        static Mesh Arc()
        {
            var v=new List<Vector3>();var uv=new List<Vector2>();var t=new List<int>();
            for(int i=0;i<=48;i++){float a=Mathf.Lerp(-1.3f,1.3f,i/48f);float width=Mathf.Sin(i/48f*Mathf.PI)*.5f;v.Add(new Vector3(Mathf.Sin(a)*(2.5f-width),0,Mathf.Cos(a)*(2.5f-width)));v.Add(new Vector3(Mathf.Sin(a)*2.5f,.05f,Mathf.Cos(a)*2.5f));uv.Add(new Vector2(.5f,.5f));uv.Add(new Vector2(.5f,.7f));if(i<48){int n=i*2;t.AddRange(new[]{n,n+1,n+2,n+1,n+3,n+2});}}
            var m=new Mesh{name="Execution crescent"};m.SetVertices(v);m.SetUVs(0,uv);m.SetColors(new List<Color>(System.Array.ConvertAll(v.ToArray(),_=>Color.white)));m.SetTriangles(t,0);m.RecalculateNormals();return m;
        }
    }
}
#endif
