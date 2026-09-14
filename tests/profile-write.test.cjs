const path=require('node:path');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../public/js/profile.js'),'utf8');
const fn=vm.runInNewContext('('+source.slice(source.indexOf('async function createOrUpdateProfile'),source.indexOf('\n  async function loadProfile')).trim()+')');
(async()=>{for(const mode of ['existing','missing','race','denied']){
 let updates=0,inserts=0;
 const sb={from:()=>({update(p){assert(!('id' in p));updates++;return {eq(k,id){assert.equal(k,'id');assert.equal(id,'u1');return {select:()=>({maybeSingle:async()=>mode==='denied'?{error:{message:'denied'}}:{data:mode==='existing'||updates>1?{id:'u1'}:null}})}}};},insert(p){assert.equal(p.id,'u1');inserts++;return {select:()=>({single:async()=>mode==='race'?{error:{code:'23505'}}:{data:{id:'u1'}}})};}})};
 try{const r=await fn(sb,'profiles',{id:'u1',email:'test@aou.edu.sa'},{firstName:'Test',lastName:'User'});assert.notEqual(mode,'denied');assert.equal(r.id,'u1');}catch(e){if(mode!=='denied')throw e;}
 assert.equal(inserts,['missing','race'].includes(mode)?1:0);
 if(mode==='race')assert.equal(updates,2);
 console.log('PASS profile save '+mode);
}})().catch(e=>{console.error(e);process.exitCode=1});
