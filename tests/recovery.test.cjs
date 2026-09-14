const path=require('node:path');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
async function test(fail=false){
 const elements={}; const el=id=>elements[id] ||= {value:'',style:{},hidden:false,disabled:false,addEventListener(e,fn){this[e]=fn},reportValidity:()=>true};
 let calls=0,handler,clean=false;
 const session={user:{id:'test'}};
 const context={URLSearchParams,history:{replaceState(){clean=true}},setTimeout,document:{getElementById:el,addEventListener(){}},window:{location:{hash:'#token_hash=test-hash&type=recovery',search:'',pathname:'/reset-password.html'},supabaseClient:{auth:{onAuthStateChange(fn){handler=fn},verifyOtp:async args=>{calls++;assert.equal(args.type,'recovery');return fail?{error:{status:403}}:{data:{session}}},getSession(){throw Error('Must not use unrelated session')}}}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/js/reset-password.js'),'utf8'),context);
 assert.equal(calls,0);assert(clean);assert(el('reset-form').hidden);handler('INITIAL_SESSION',session);assert(el('reset-form').hidden);
 await el('activate-recovery').click();assert.equal(calls,1);assert.equal(el('reset-form').hidden,fail);assert.equal(el('activate-recovery').disabled,false);
}
(async()=>{await test();await test(true);console.log('PASS: no automatic redemption; unrelated session blocked; activation success; invalid token stays blocked');})().catch(e=>{console.error(e);process.exit(1)});
