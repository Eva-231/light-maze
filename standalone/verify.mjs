import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as wait} from 'node:timers/promises';
const dataDir=await mkdtemp(join(tmpdir(),'light-maze-verify-'));
const port=20000+(process.pid%30000),child=spawn(process.execPath,['standalone/server.mjs'],{env:{...process.env,PORT:String(port),LIGHT_MAZE_DATA_DIR:dataDir},stdio:'ignore'}),base=`http://127.0.0.1:${port}`,key='A'.repeat(32),headers={'x-light-maze-player':key};
try{await wait(250);const home=await fetch(base),music=await fetch(base+'/audio/home.mp3'),first=await fetch(base+'/api/progress',{headers});if(!home.ok||!(await home.text()).includes('LIGHT MAZE')||!music.ok||first.headers.get('x-save-revision')!=='new')throw Error('static or API smoke test failed');const progress={format:7,totalBank:0,inventory:[]},put=await fetch(base+'/api/progress',{method:'PUT',headers:{...headers,'content-type':'application/json','x-save-revision':'new','x-save-mutation':'verify'},body:JSON.stringify(progress)}),loaded=await fetch(base+'/api/progress',{headers});if(!put.ok||!loaded.ok||(await loaded.json()).format!==7)throw Error('save round-trip failed');const board=await fetch(base+'/api/leaderboard?board=skill',{headers});if(!board.ok||!Array.isArray((await board.json()).entries))throw Error('leaderboard failed');console.log('Verified independent home, audio, anonymous save round-trip, and leaderboard API.');}finally{child.kill('SIGTERM');await rm(dataDir,{recursive:true,force:true});}
