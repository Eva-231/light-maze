import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import worker,{competitiveScore,validPlayerName} from './src/worker.js';
import {dailyChallenge} from './public/relics.js';
import {skillRating} from './public/journey.js';

const database=new DatabaseSync(':memory:');
const migration=(await readFile('drizzle/0000_public_rankings.sql','utf8')).replaceAll('--> statement-breakpoint','');database.exec(migration);
class Query{
 constructor(sql){this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 all(){return{results:database.prepare(this.sql).all(...this.args)};}
 first(){return database.prepare(this.sql).get(...this.args)||null;}
 run(){return database.prepare(this.sql).run(...this.args);}
}
const DB={prepare:sql=>new Query(sql),batch:queries=>queries.map(query=>query.run())},env={DB,ASSETS:{fetch:()=>new Response('asset')}};
const tokenA='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',tokenB='BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
async function api(path,{token='',method='GET',body}={}){const headers={};if(token)headers['x-light-maze-player']=token;if(body!==undefined)headers['Content-Type']='application/json';return worker.fetch(new Request('https://example.test'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),env);}
const normal=(overrides={})=>({rules:8,cleared:true,success:true,mode:'normal',seed:723,floor:7,trialLevel:0,time:210,parTime:240,kills:8,shots:22,hits:18,weakHits:6,dodges:4,counterHits:3,maxHuntChain:5,interrupts:2,damageTaken:16,...overrides});

assert(validPlayerName('月影の騎士'));assert(validPlayerName('Player_01'));assert(!validPlayerName('a@example.com'));assert(!validPlayerName('A'));
const sample=normal(),clientScore=skillRating({...sample,elapsed:sample.time,runMode:sample.mode},true).score;assert.equal(competitiveScore(sample),clientScore,'Displayed and server-ranked skill scores must match');

let response=await api('/api/leaderboard/submit',{token:tokenA,method:'POST',body:{playerName:'月影の騎士',run:sample}});assert.equal(response.status,200);let result=await response.json();assert.equal(result.ranks[0].board,'skill');assert.equal(result.ranks[0].rank,1);
response=await api('/api/leaderboard/submit',{token:tokenB,method:'POST',body:{playerName:'蒼い旅人',run:normal({time:170,damageTaken:0,counterHits:5})}});assert.equal(response.status,200);result=await response.json();assert.equal(result.ranks[0].rank,1);
response=await api('/api/leaderboard?board=skill',{token:tokenA});let board=await response.json();assert.equal(board.entries.length,2);assert.equal(board.own.rank,2);assert(board.own.gap.endsWith('点'));assert(!JSON.stringify(board).includes('anonymous-'),'Private participant ids must never leave the Worker');

// A slower result cannot replace the best, but a chosen name can still change.
await api('/api/leaderboard/submit',{token:tokenA,method:'POST',body:{playerName:'月影改',run:normal({time:499,damageTaken:100,hits:2,weakHits:0,dodges:0,counterHits:0,maxHuntChain:1,interrupts:0})}});
await api('/api/leaderboard/name',{token:tokenA,method:'POST',body:{playerName:'月影改'}});board=await (await api('/api/leaderboard?board=skill',{token:tokenA})).json();assert.equal(board.own.playerName,'月影改');assert.equal(board.own.score,clientScore);

response=await api('/api/leaderboard/submit',{token:tokenA,method:'POST',body:{playerName:'月影改',run:normal({mode:'abyss',floor:18,abyssFloor:12,mutators:[],time:340,parTime:360,kills:10})}});assert.equal(response.status,200);result=await response.json();assert.deepEqual(result.ranks.map(item=>item.board),['abyss']);board=await (await api('/api/leaderboard?board=abyss',{token:tokenA})).json();assert.equal(board.own.trialLevel,12);assert.equal(board.own.rank,1);

const daily=dailyChallenge(),dailyRun=normal({mode:'daily',day:daily.day,seed:daily.seed,floor:7,trialLevel:0,time:199.25,parTime:240});response=await api('/api/leaderboard/submit',{token:tokenA,method:'POST',body:{playerName:'月影改',run:dailyRun}});assert.equal(response.status,200);board=await (await api('/api/leaderboard?board=daily',{token:tokenA})).json();assert.equal(board.period,daily.day);assert.equal(board.own.elapsedMs,199250);

response=await api('/api/leaderboard/submit',{token:tokenA,method:'POST',body:{playerName:'mail@example.com',run:sample}});assert.equal(response.status,400);response=await api('/api/leaderboard/submit',{token:tokenA,method:'POST',body:{playerName:'月影改',run:normal({shots:1,hits:99})}});assert.equal(response.status,400);response=await api('/api/leaderboard?board=skill');assert.equal(response.status,200);
const plan=database.prepare("EXPLAIN QUERY PLAN SELECT * FROM leaderboard_entries WHERE board = 'skill' AND period = 'all' ORDER BY rank_value DESC, submitted_at ASC LIMIT 50").all().map(row=>String(row.detail)).join(' ');assert(plan.includes('idx_leaderboard_board_period_rank'));
console.log('PASS Anonymous player names, authoritative score calculation, three public rankings, best-only upserts, privacy, and indexed queries.');
