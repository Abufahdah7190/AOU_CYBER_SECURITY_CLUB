'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
process.env.SUPABASE_URL='https://auth.example.test';process.env.SUPABASE_ANON_KEY='test-only';
const {pool}=require('../src/db/pool');
const realFetch=global.fetch;
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',LEGACY='33333333-3333-4333-8333-333333333333';
const queries=[];let profileFailure=false,disabled=false,legacy=false;
pool.query=async(sql,params=[])=>{
 queries.push({sql,params});
 if(sql.includes('FROM public.supabase_identity_links'))return {rows:legacy?[{student_id:LEGACY}]:[]};
 if(sql.includes('INSERT INTO users'))return {rows:[{id:params[0],is_active:!disabled}]};
 if(sql.includes('FROM student_course_certificates WHERE student_id'))return {rows:[{certificateCode:'CERT-'+params[0],courseName:'Own certificate'}]};
 if(sql.includes('FROM student_course_progress'))return {rows:[]};
 if(sql.includes('FROM verified_lesson_results'))return {rows:[]};
 return {rows:[]};
};
global.fetch=async(url,options)=>{
 if(new URL(url).hostname!=='auth.example.test')return realFetch(url,options);
 assert.equal(options.redirect,'error');
 if(String(url).includes('/rest/v1/')){if(profileFailure)throw Error('profile unavailable');return {ok:true,json:async()=>[{first_name:'Test',last_name:'Student'}]};}
 const token=options.headers.Authorization;
 if(!['Bearer user-a','Bearer user-b'].includes(token))return {ok:false,status:401};
 return {ok:true,json:async()=>({id:token.endsWith('a')?A:B,email:(token.endsWith('a')?'a':'b')+'@aou.edu.sa',email_confirmed_at:new Date().toISOString(),user_metadata:{role:'admin'}})};
};
const app=require('../src/app');
const server=app.listen(0,'127.0.0.1');
async function test(name,fn){await fn();console.log('PASS '+name)}
(async()=>{
 await new Promise(resolve=>server.once('listening',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const request=(path,token,options={})=>realFetch(base+path,{...options,headers:{...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
 await test('Anonymous and forged tokens cannot read or issue certificates',async()=>{
  for(const token of [null,'forged.jwt.token'])for(const [url,method] of [['/api/learning/progress','GET'],['/api/learning/certificates/cyber-basics','POST'],['/api/user/profile','GET']])assert.equal((await request(url,token,{method})).status,401);
 });
 await test('Course content requires authentication and static lesson data cannot bypass it', async()=>{
  for (const token of [null,'forged.jwt.token']) assert.equal((await request('/api/learning/courses/cyber-basics',token)).status,401);
  const r=await request('/api/learning/courses/cyber-basics','user-a'); assert.equal(r.status,200); assert.ok((await r.json()).course.modules.length); assert.match(r.headers.get('cache-control'),/no-store/);
  for(const path of ['/js/lms-data.js','/js/LMS-DATA.JS','/js/%6cms-data.js','/public/js/lms-data.js','/server/public/js/lms-data.js']) assert.equal((await request(path)).status,404,path);
 });
 await test('Certificate history is isolated by verified identity, ignoring query IDs and old cookies',async()=>{
  for(const [token,id] of [['user-a',A],['user-b',B]]){
   const r=await request('/api/learning/progress?student_id='+B,token,{headers:{Cookie:'cc_access_session=forged'}});assert.equal(r.status,200);
   assert.equal((await r.json()).certificates[0].certificateCode,'CERT-'+id);assert.match(r.headers.get('cache-control'),/no-store/);
  }
 });
 await test('Profile service outage does not hide stored certificates',async()=>{
  profileFailure=true;const r=await request('/api/learning/progress','user-a');assert.equal(r.status,200);assert.equal((await r.json()).certificates.length,1);profileFailure=false;
 });
 await test('Reviewed legacy mapping retains existing student UUID and certificates',async()=>{
  legacy=true;const r=await request('/api/learning/progress','user-a');assert.equal((await r.json()).certificates[0].certificateCode,'CERT-'+LEGACY);legacy=false;
 });
 await test('Disabled student is rejected even with a valid Supabase token',async()=>{
  disabled=true;assert.equal((await request('/api/learning/progress','user-a')).status,403);disabled=false;
 });
 await test('Forged completion percentage cannot issue a certificate',async()=>{
  const r=await request('/api/learning/progress/cyber-basics','user-a',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({percent:100,student_id:B,quizScores:{0:true},lessonIndex:0,answers:[-1,-1,[],[],-1]})});assert.equal(r.status,422);
 });
 await test('Retired local login/register/reset endpoints do not create sessions or send email',async()=>{
  for(const route of ['register','login','refresh','forgot-password','reset-password','change-password']){const r=await request('/api/auth/'+route,null,{method:'POST'});assert.equal(r.status,410);assert.equal(r.headers.get('set-cookie'),null);}
 });
 await test('Private source, SQL, dependency files and traversal are not served',async()=>{
  for(const route of ['/src/app.js','/package.json','/supabase/profile-setup.sql','/server/package.json','/js/%2e%2e/src/app.js','/.env','/src/../db/migrations/001_init.sql'])assert.equal((await request(route)).status,404,route);
 });
 await test('Unbounded certificate codes and oversized or malformed JSON are rejected',async()=>{
  assert.equal((await request('/api/learning/verify/'+'a'.repeat(61))).status,400);
  assert.equal((await request('/api/auth/login',null,{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'})).status,400);
  assert.equal((await request('/api/auth/login',null,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:'x'.repeat(270000)})})).status,413);
 });
 await test('SQL injection in certificate code remains a bound parameter',async()=>{
  const code="abc' OR 1=1--";await request('/api/learning/verify/'+encodeURIComponent(code));
  assert(queries.some(q=>q.params.includes(code)));assert(!queries.some(q=>q.sql.includes(code)));
 });
 await test('Browser API helper never sends credentials off-site',async()=>{
  let sent=0;const context={URL,AbortSignal,location:{origin:base},window:{supabaseClient:{auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}}},fetch:async(_url,options)=>{sent++;assert.equal(options.redirect,'error');}};
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../public/js/api-client.js'),'utf8'),context);
  await assert.rejects(context.window.clubFetch('https://evil.example/api/test'),/Invalid API/);assert.equal(sent,0);
  await context.window.clubFetch('/api/learning/progress');assert.equal(sent,1);
 });
 await test('Public support validates input, binds submitted text and limits repeated posts',async()=>{
  const send=body=>request('/api/public/suggestions',null,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await send({name:'x'})).status,400);
  const message="Please help with my account <script>alert(1)</script> ' OR 1=1--";
  assert.equal((await send({name:'Student',email:'contact@example.com',phone:'+966500000000',message,role:'admin'})).status,201);
  const q=queries.find(q=>q.sql.includes('INSERT INTO public.suggestions'));assert(q);assert(q.params.includes(message));assert(!q.sql.includes(message));assert.equal(q.params.length,4);
  for(let i=0;i<6;i++)await send({name:'x'});
  assert.equal((await send({name:'x'})).status,429);
 });
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{global.fetch=realFetch;server.close();await pool.end();});
