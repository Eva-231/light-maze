#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using LightMaze.Production;
using LightMaze.Combat;
using LightMaze.Enemies;

namespace LightMaze.EditorTools
{
    public static class ProductionVisualReview
    {
        [MenuItem("LIGHT MAZE/Production/Review/Audit live production models #F9")]
        static void AuditModels()
        {
            if(!EditorApplication.isPlaying)return;
            int errors=0;var report=new System.Text.StringBuilder();
            foreach(var name in new[]{"Production Explorer Visual","Production ShadowSoldier","Production RiftWolf","Production AbyssGuardian"})
            {
                var go=GameObject.Find(name);
                if(!go){Debug.LogError("Missing runtime model: "+name);errors++;continue;}
                foreach(string socket in ProductionAssetContract.RequiredSockets)
                    if(!ProductionAssetContract.FindDeep(go.transform,socket)){Debug.LogError(name+" missing "+socket);errors++;}
                var a=go.GetComponentInChildren<Animator>();
                if(!a||!a.runtimeAnimatorController){Debug.LogError(name+" has no controller");errors++;}
                int triangles=0,renderers=0;
                foreach(var r in go.GetComponentsInChildren<Renderer>())
                {
                    if(!r.enabled)continue;renderers++;
                    foreach(var mat in r.sharedMaterials)if(!mat||!mat.shader||!mat.shader.isSupported){Debug.LogError(name+" has an invalid material");errors++;}
                    Mesh mesh=r is SkinnedMeshRenderer skin?skin.sharedMesh:r.GetComponent<MeshFilter>()?.sharedMesh;
                    if(mesh){for(int sub=0;sub<mesh.subMeshCount;sub++)triangles+=(int)mesh.GetIndexCount(sub)/3;if(AssetDatabase.GetAssetPath(mesh)=="Library/unity default resources"){Debug.LogError(name+" still has a primitive mesh");errors++;}}
                }
                report.AppendLine(name+": "+renderers+" renderers, "+triangles+" triangles");
            }
            report.AppendLine("Errors: "+errors);System.IO.File.WriteAllText("Logs/ProductionModelAudit.txt",report.ToString());
            if(errors==0)Debug.Log("Production model integration audit PASSED: four models, sockets, controllers and supported materials; no built-in primitives.");
        }
        [MenuItem("LIGHT MAZE/Production/Review/Guardian portrait #F12")]
        static void GuardianPortrait()
        {
            if(!EditorApplication.isPlaying)return;
            var target=GameObject.Find("Abyss Guardian");EditorApplication.isPaused=true;
            Camera.main.transform.position=target.transform.position+new Vector3(3.5f,2.7f,4.8f);
            Camera.main.transform.LookAt(target.transform.position+Vector3.up*1.55f);Camera.main.fieldOfView=40;
            Cursor.lockState=CursorLockMode.None;Cursor.visible=true;
        }
        [MenuItem("LIGHT MAZE/Production/Review/Explorer portrait _F12")]
        static void Portrait()
        {
            if(!EditorApplication.isPlaying)return;
            var player=GameObject.Find("Explorer // Player");
            EditorApplication.isPaused=true;
            Camera.main.transform.position=player.transform.position+new Vector3(2.6f,1.9f,3.4f);
            Camera.main.transform.LookAt(player.transform.position+Vector3.up*.95f);
            Camera.main.fieldOfView=37;
            Cursor.lockState=CursorLockMode.None;Cursor.visible=true;
        }
        static float stopAt;
        static GameObject[] fixtures;
        static PlayerVitals[] testVitals;
        static float checkStarted;
        static bool checkedWindup;
        [MenuItem("LIGHT MAZE/Production/Review/Verify Guardian telegraph _F9")]
        static void VerifyGuardian()
        {
            if(!EditorApplication.isPlaying){Debug.LogWarning("Enter Play Mode before the Guardian check.");return;}
            EditorApplication.isPaused=false;
            fixtures=new GameObject[6];testVitals=new PlayerVitals[3];
            for(int i=0;i<3;i++)
            {
                var target=new GameObject("Guardian check target "+i);fixtures[i*2]=target;
                target.transform.position=new Vector3(1000+i*20,0,0);
                var vitals=target.AddComponent<PlayerVitals>();vitals.enabled=false;testVitals[i]=vitals;
                var attacker=new GameObject("Guardian check attacker "+i);fixtures[i*2+1]=attacker;
                attacker.transform.position=target.transform.position+Vector3.forward;
                var enemy=attacker.AddComponent<PrototypeEnemy>();enemy.enabled=false;
                enemy.Configure(PrototypeEnemyKind.AbyssGuardian,target.transform,vitals,null,System.Array.Empty<Renderer>());
                enemy.SendMessage("Attack",SendMessageOptions.RequireReceiver);
                if(i==1)target.transform.position+=Vector3.right*6; // Escaping the marked area avoids the strike.
                if(i==2)enemy.Freeze(2); // Freezing the attacker interrupts its strike.
            }
            checkStarted=Time.time;checkedWindup=false;
            EditorApplication.update-=CheckGuardian;EditorApplication.update+=CheckGuardian;
        }
        static void CheckGuardian()
        {
            if(!EditorApplication.isPlaying){EditorApplication.update-=CheckGuardian;return;}
            float elapsed=Time.time-checkStarted;
            if(!checkedWindup && elapsed>=.2f)
            {
                checkedWindup=true;
                foreach(var v in testVitals)if(v.Hp!=100)Debug.LogError("Guardian check FAILED: damage occurred during the warning.");
            }
            if(elapsed<.7f)return;
            EditorApplication.update-=CheckGuardian;
            bool pass=testVitals[0].Hp==85 && testVitals[1].Hp==100 && testVitals[2].Hp==100;
            if(pass)Debug.Log("Guardian timing PASSED: warning deals no damage; impact deals 15; escape and freeze prevent damage.");
            else Debug.LogError("Guardian timing FAILED: impact/escape/freeze behavior disagrees with the warning.");
            foreach(var go in fixtures)Object.Destroy(go);
        }
        [MenuItem("LIGHT MAZE/Production/Review/Ice Nova at 0.40 seconds _F8")]
        static void Nova()
        {
            if(!EditorApplication.isPlaying) {Debug.LogWarning("Enter Play Mode before reviewing the Ice Nova.");return;}
            var player=GameObject.Find("Explorer // Player");if(!player)return;
            EditorApplication.isPaused=false;
            var combat=player.GetComponent<LightMazePlayerCombat>();
            combat.SendMessage("CastIceNova",SendMessageOptions.RequireReceiver);
            stopAt=Time.time+.4f;
            EditorApplication.update-=Pause;EditorApplication.update+=Pause;
        }
        static void Pause()
        {
            if(!EditorApplication.isPlaying){EditorApplication.update-=Pause;return;}
            if(Time.time<stopAt)return;
            EditorApplication.update-=Pause;
            EditorApplication.isPaused=true;
            Cursor.lockState=CursorLockMode.None;Cursor.visible=true;
            Debug.Log("LIGHT MAZE: Ice Nova review paused after actual combat cast; unpause to inspect decay.");
        }
        [MenuItem("LIGHT MAZE/Production/Review/Resume")]
        static void Resume(){EditorApplication.isPaused=false;}
    }
}
#endif
