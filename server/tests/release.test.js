'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {evaluate,courses}=require('../src/services/assessment');
const {renderCertificateSvg,courseTitleFor}=require('../src/services/certificate.service');
const {pool}=require('../src/db/pool');
const passed=[];
async function test(name,fn){await fn();passed.push(name);console.log('PASS '+name)}
(async()=>{
await test('All 8 bilingual courses and 72 lessons have worked examples, expected results and diagrams',()=>{
 assert.equal(Object.keys(courses).length,8);for(const c of Object.values(courses)){assert.equal(c.modules.flatMap(m=>m.lessons).length,9);for(const l of c.modules.flatMap(m=>m.lessons)){for(const lang of ['ar','en']){assert(l.body[lang].length>100);assert(l.expected[lang]);assert(l.steps[lang].length>=3);assert.equal(l.quiz[lang].questions.length,5)}assert(fs.existsSync(path.join(__dirname,'../public',l.diagram)))}}
});
await test('Server assessment rejects forged progress, unknown lesson, malformed arrays and failed answers',()=>{
 assert.equal(evaluate('unknown',0,[]),null);assert.equal(evaluate('cyber-basics',-1,[]),null);assert.equal(evaluate('cyber-basics','0',[]),null);assert.equal(evaluate('cyber-basics',0,[true]),null);
 assert.equal(evaluate('cyber-basics',0,[-1,-1,[],[],-1]).passed,false);
 for(const [slug,c] of Object.entries(courses)){for(const [i,l] of c.modules.flatMap(m=>m.lessons).entries()){const answers=JSON.parse(JSON.stringify(l.quiz.en.questions.map(q=>q.correct)));assert.equal(evaluate(slug,i,answers).passed,true);answers[0]=-1;assert.equal(evaluate(slug,i,answers).passed,true);answers[1]=-1;assert.equal(evaluate(slug,i,answers).passed,false)}}
});
await test('Certificate SVG Arabic/English escaping and localized course names',async()=>{
 for(const lang of ['ar','en']){const name=courseTitleFor('network-defense',lang);const svg=await renderCertificateSvg({studentName:'سارة <script>alert(1)</script> & Sara',courseName:name,language:lang,certificateCode:'TEST-ONLY',issuedAt:'2026-09-11',verificationUrl:'https://example.test/verify'});assert(svg.includes(`lang="${lang}"`));assert(svg.includes('&lt;script&gt;'));assert(!svg.includes('<script>'));assert(svg.includes(name));fs.writeFileSync(path.join(__dirname,`../../certificate-sample-${lang}.svg`),svg);}
});
await test('Supabase auth callback never calls getSession under event lock',async()=>{
 const callbacks=[],timers=[];let locked=false,getCalls=0;
 const doc={readyState:'complete',querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},dispatchEvent(){},body:{classList:{add(){},remove(){}}}};
 const sb={auth:{getSession:async()=>{assert.equal(locked,false);getCalls++;return {data:{session:{user:{id:'a',email:'student@aou.edu.sa'}}}}},onAuthStateChange:cb=>{callbacks.push(cb);return {data:{subscription:{}}}}},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{first_name:'Sara'}})})})})};
 const win={supabaseClient:sb,location:{pathname:'/profile.html',replace(){}},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/js/profile.js'),'utf8'),{window:win,document:doc,location:win.location,Event:class{},setTimeout:fn=>timers.push(fn),console});
 locked=true;callbacks[0]('SIGNED_IN',{user:{id:'b'}});locked=false;assert.equal(getCalls,1);
 // Timers include timeout guards; ensure callback itself did not reenter auth.
});
await test('Supabase API rejects missing token, invalid token and unverified email',async()=>{
 const middleware=require('../src/middleware/supabaseAuth');const oldFetch=global.fetch,oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_ANON_KEY;
 process.env.SUPABASE_URL='https://example.test';process.env.SUPABASE_ANON_KEY='test';
 try{for(const [token,response,status] of [[null,null,401],['invalid',{ok:false,status:401},401],['unverified',{ok:true,json:async()=>({id:'a',email:'student@aou.edu.sa'})},403]]){global.fetch=async()=>response;let actual;const res={status:s=>{actual=s;return res},json:()=>{}};await middleware({headers:token?{authorization:'Bearer '+token}:{}},res,e=>{throw e||Error('unexpected next')});assert.equal(actual,status)}}finally{global.fetch=oldFetch;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_ANON_KEY;else process.env.SUPABASE_ANON_KEY=oldKey}
});
await test('i18n tolerates unavailable localStorage and follows browser language',()=>{
 let ready;const document={documentElement:{},querySelectorAll:()=>[],addEventListener:(e,f)=>{ready=f},dispatchEvent(){}};
 const window={LOCALES:{en:{},ar:{}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/js/i18n.js'),'utf8'),{window,document,navigator:{language:'en-US'},localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}},CustomEvent:class{}});ready();assert.equal(window.i18n.lang,'en');window.i18n.setLanguage('ar');assert.equal(document.documentElement.dir,'rtl');
});
await pool.end();console.log(JSON.stringify({passed},null,2));
})().catch(async e=>{console.error(e);await pool.end();process.exitCode=1});
