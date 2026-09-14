#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using LightMaze.Production;

namespace LightMaze.EditorTools
{
    public static class ProductionEnvironmentBuilder
    {
        const string Root="Assets/LightMaze/Production";
        static Mesh block,arch;
        static Material stone,trim,metal,glow;
        [MenuItem("LIGHT MAZE/Production/5. Build Abyss Cathedral _F7")]
        public static void Build()
        {
            Directory.CreateDirectory(Root+"/Meshes");Directory.CreateDirectory(Root+"/Resources/LightMazeProduction/Environment");AssetDatabase.Refresh();
            var primitive=GameObject.CreatePrimitive(PrimitiveType.Cube);
            block=Object.Instantiate(primitive.GetComponent<MeshFilter>().sharedMesh);Object.DestroyImmediate(primitive);
            block=ProductionArtBuilder.Store(block,Root+"/Meshes/AshlarBlock.asset");
            arch=ProductionArtBuilder.Store(Arch(),Root+"/Meshes/PointedVault.asset");
            stone=ProductionArtBuilder.Lit("Blue slate",new Color(.14f,.19f,.25f),.22f,.38f,Color.black);
            trim=ProductionArtBuilder.Lit("Worn limestone edges",new Color(.23f,.28f,.34f),.28f,.5f,Color.black);
            metal=ProductionArtBuilder.Lit("Ancient black bronze",new Color(.095f,.085f,.064f),.7f,.52f,Color.black);
            glow=ProductionArtBuilder.Lit("Abyss inlay light",new Color(.05f,.2f,.3f),.5f,.5f,new Color(.12f,.62f,1f)*1.8f);
            AddStoneTexture();
            var root=new GameObject("Abyss Cathedral // Production");root.AddComponent<ProductionEnvironment>();
            var floor=new GameObject("Cut slate pavement");floor.transform.SetParent(root.transform,false);
            for(int x=-8;x<=8;x++)for(int z=-7;z<=9;z++)
            {
                var p=new Vector3(x*2,.015f,z*2+2);
                var tile=Part(floor,"Slate tile",p,new Vector3(1.965f,.075f,1.965f),stone);
                tile.transform.localRotation=Quaternion.Euler(0,((x+z)&3)*90,0);
            }
            // Monumental open colonnades rise beyond the retained invisible collision walls.
            for(int side=-1;side<=1;side+=2)
            for(int i=0;i<6;i++)
            {
                float z=-14+i*6;
                var pier=new GameObject("Fluted pier " + side+" "+i);pier.transform.SetParent(root.transform,false);
                for(int f=0;f<4;f++)
                {
                    float a=f*Mathf.PI/2;
                    Part(pier,"Stone flute",new Vector3(side*17+Mathf.Cos(a)*.43f,5.9f,z+Mathf.Sin(a)*.43f),new Vector3(.55f,11.8f,.55f),stone);
                }
                Part(pier,"Pedestal",new Vector3(side*17,.45f,z),new Vector3(2,.9f,2),trim);
                Part(pier,"Capital",new Vector3(side*17,11.7f,z),new Vector3(1.8f,.45f,1.8f),trim);
                Part(pier,"Luminous incision",new Vector3(side*16.65f,4,z-.47f),new Vector3(.055f,5,.065f),glow);
                Part(root,"Recessed ambulatory wall",new Vector3(side*20,7,z),new Vector3(.65f,14,5.8f),stone);
                Part(root,"Blind window sill",new Vector3(side*19.6f,2.3f,z),new Vector3(.45f,.2f,4.2f),trim);
                for(int flute=-1;flute<=1;flute++)Part(root,"Window tracery",new Vector3(side*19.4f,6.5f,z+flute*1.1f),new Vector3(.22f,8,.14f),trim);
                if(i<5)
                {
                    var vault=ProductionArtBuilder.MeshObject(root,"Pointed side arcade",arch,trim,new Vector3(side*17,6,z+3));
                    vault.transform.localRotation=Quaternion.Euler(0,90,0);vault.transform.localScale=new Vector3(3,4.5f,1);
                }
                var rib=ProductionArtBuilder.MeshObject(root,"Transverse high vault",arch,stone,new Vector3(0,11,z));
                rib.transform.localScale=new Vector3(17,9,.65f);
            }
            // Hero vista: nested portals into the abyss, a recessed altar, and hanging bronze blades.
            for(int i=0;i<4;i++)
            {
                float z=20+i*5;
                for(int s=-1;s<=1;s+=2) Part(root,"Portal upright",new Vector3(s*6,5.5f,z),new Vector3(1,11,1.3f),trim);
                var portal=ProductionArtBuilder.MeshObject(root,"Receding gate " + i,arch,trim,new Vector3(0,11,z));portal.transform.localScale=new Vector3(6,7,1.3f);
            }
            for(int i=0;i<3;i++) Part(root,"Altar plinth",new Vector3(0,.15f+i*.22f,18),new Vector3(9-i*.6f,.25f,3-i*.4f),stone);
            Part(root,"Reliquary",new Vector3(0,1.4f,19),new Vector3(2.8f,1.6f,1.4f),metal);
            Part(root,"Reliquary light",new Vector3(0,2.24f,19),new Vector3(2.6f,.05f,1.2f),glow);
            for(int i=0;i<9;i++)
            {
                float x=(i-4)*1.35f;
                Part(root,"Suspended bronze blade",new Vector3(x,10+Mathf.Abs(i-4)*.45f,20),new Vector3(.18f,4.2f,.28f),metal);
                Part(root,"Suspended cold thread",new Vector3(x,12,20),new Vector3(.018f,12,.018f),glow);
            }
            var effectPlane=AssetDatabase.LoadAssetAtPath<Mesh>(Root+"/Meshes/EffectPlane.asset");
            var haze=ProductionArtBuilder.Fx("Distant abyss haze",new Color(.12f,.24f,.4f,.35f),2);
            for(int i=0;i<3;i++)
            {
                var veil=ProductionArtBuilder.MeshObject(root,"Portal depth veil",effectPlane,haze,new Vector3(0,8,25+i*5));
                veil.transform.localRotation=Quaternion.Euler(90,0,0);veil.transform.localScale=new Vector3(20,1,22);
            }
            for(int side=-1;side<=1;side+=2)
            {
                var lantern=new GameObject("Amber architectural wash");lantern.transform.SetParent(root.transform,false);
                lantern.transform.position=new Vector3(side*13,7,14);lantern.transform.LookAt(new Vector3(side*17,3,18));
                var light=lantern.AddComponent<Light>();light.type=LightType.Spot;light.color=new Color(1,.62f,.27f);light.intensity=18;light.range=22;light.spotAngle=80;light.innerSpotAngle=35;light.shadows=LightShadows.None;
            }
            // Narrow inlays guide the eye without drawing a grid across the fighting space.
            for(int s=-1;s<=1;s+=2)
            {
                Part(root,"Processional silver border",new Vector3(s*5,.065f,2),new Vector3(.055f,.01f,33),trim);
                for(int z=-12;z<=14;z+=4) Part(root,"Pilgrim rune",new Vector3(s*5,.075f,z),new Vector3(.22f,.012f,.7f),glow);
            }
            var volume=root.AddComponent<Volume>();volume.isGlobal=true;volume.priority=200;
            var profile=ScriptableObject.CreateInstance<VolumeProfile>();
            var tonemap=profile.Add<Tonemapping>(true);tonemap.mode.Override(TonemappingMode.ACES);
            var bloom=profile.Add<Bloom>(true);bloom.intensity.Override(.28f);bloom.threshold.Override(1.15f);bloom.scatter.Override(.6f);
            var grade=profile.Add<ColorAdjustments>(true);grade.postExposure.Override(.15f);grade.contrast.Override(14);grade.saturation.Override(-8);
            var vignette=profile.Add<Vignette>(true);vignette.intensity.Override(.2f);vignette.smoothness.Override(.72f);
            volume.sharedProfile=ProductionArtBuilder.Store(profile,Root+"/Environment/AbyssGrade.asset");
            foreach(var component in volume.sharedProfile.components)
                if(!AssetDatabase.Contains(component)) AssetDatabase.AddObjectToAsset(component,volume.sharedProfile);
            // Collapse static masonry per material to keep CPU submission cost bounded on tablets.
            Combine(root);
            PrefabUtility.SaveAsPrefabAsset(root,Root+"/Resources/LightMazeProduction/Environment/Abyss_Cathedral.prefab");
            Object.DestroyImmediate(root);AssetDatabase.SaveAssets();
            Debug.Log("LIGHT MAZE: Abyss Cathedral saved with combined masonry and ACES grade.");
        }
        static GameObject Part(GameObject parent,string name,Vector3 p,Vector3 scale,Material mat)
        {var go=ProductionArtBuilder.MeshObject(parent,name,block,mat,p);go.transform.localScale=scale;return go;}
        static void Combine(GameObject root)
        {
            foreach(var mat in new[]{stone,trim,metal,glow})
            {
                var list=new List<CombineInstance>();var sources=new List<GameObject>();
                foreach(var mf in root.GetComponentsInChildren<MeshFilter>())
                    if(mf.GetComponent<MeshRenderer>().sharedMaterial==mat)
                    {list.Add(new CombineInstance{mesh=mf.sharedMesh,transform=mf.transform.localToWorldMatrix});sources.Add(mf.gameObject);}
                var m=new Mesh{name=mat.name+" masonry",indexFormat=IndexFormat.UInt32};m.CombineMeshes(list.ToArray());
                m=ProductionArtBuilder.Store(m,Root+"/Meshes/Architecture_"+mat.name+".asset");
                foreach(var source in sources) Object.DestroyImmediate(source);
                ProductionArtBuilder.MeshObject(root,"Batched "+mat.name,m,mat,Vector3.zero);
            }
        }
        static Mesh Arch()
        {
            var v=new List<Vector3>();var t=new List<int>();var uv=new List<Vector2>();
            // Gothic ogive with a crisp apex and a thick extruded stone profile.
            for(int i=0;i<32;i++)
            {
                float x0=-1+i/16f,x1=-1+(i+1)/16f;
                float y0=Mathf.Pow(1-Mathf.Abs(x0),.62f),y1=Mathf.Pow(1-Mathf.Abs(x1),.62f);
                Vector3[] p={new Vector3(x0,y0,-.5f),new Vector3(x1,y1,-.5f),new Vector3(x1,y1+.11f,-.5f),new Vector3(x0,y0+.11f,-.5f),new Vector3(x0,y0,.5f),new Vector3(x1,y1,.5f),new Vector3(x1,y1+.11f,.5f),new Vector3(x0,y0+.11f,.5f)};
                Face(0,3,2,1);Face(4,5,6,7);Face(0,1,5,4);Face(3,7,6,2);
                void Face(int a,int b,int c,int d){int n=v.Count;v.Add(p[a]);v.Add(p[b]);v.Add(p[c]);v.Add(p[d]);uv.Add(Vector2.zero);uv.Add(Vector2.up);uv.Add(Vector2.one);uv.Add(Vector2.right);t.AddRange(new[]{n,n+1,n+2,n,n+2,n+3});}
            }
            var m=new Mesh{name="Gothic ogive"};m.SetVertices(v);m.SetUVs(0,uv);m.SetTriangles(t,0);m.RecalculateNormals();m.RecalculateBounds();return m;
        }
        static void AddStoneTexture()
        {
            const int size=512;var tex=new Texture2D(size,size,TextureFormat.RGBA32,true);var px=new Color[size*size];
            for(int y=0;y<size;y++)for(int x=0;x<size;x++)
            {
                float n=Mathf.PerlinNoise(x*.036f,y*.036f)*.45f+Mathf.PerlinNoise(x*.15f,y*.15f)*.15f;
                float vein=Mathf.Pow(Mathf.Abs(Mathf.Sin(x*.045f+y*.018f+n*8)),18)*.12f;
                float edge=Mathf.Min(Mathf.Min(x,size-1-x),Mathf.Min(y,size-1-y));
                float c=(.5f+n+vein)*Mathf.Lerp(.52f,1,Mathf.Clamp01(edge/8));px[y*size+x]=new Color(c,c,c,1);
            }
            tex.SetPixels(px);tex.Apply();string path=Root+"/Materials/SlateGrain.png";File.WriteAllBytes(path,tex.EncodeToPNG());Object.DestroyImmediate(tex);AssetDatabase.ImportAsset(path);
            stone.SetTexture("_BaseMap",AssetDatabase.LoadAssetAtPath<Texture2D>(path));
        }
    }
}
#endif
