// Start the application on localhost:3000. Install playwright separately or set PLAYWRIGHT_MODULE.
// CHROME_PATH may select a local Chrome executable. Tests mock Supabase; no real user is modified.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs');const assert=require('node:assert/strict');
const path=require('node:path');process.chdir(path.resolve(__dirname,'../..'));fs.mkdirSync('qa-artifacts',{recursive:true});
const report={passed:[],errors:[]};
const user={id:'11111111-1111-4111-8111-111111111111',email:'student@aou.edu.sa',created_at:'2026-01-01',user_metadata:{firstName:'Metadata',lastName:'Fallback'}};
const mock=`window.testUser=${JSON.stringify(user)};window.testSession={user:window.testUser,access_token:'test-token'};window.authCallbacks=[];window.authLocked=false;
window.emitAuth=(event,session)=>{window.authLocked=true;for(const cb of window.authCallbacks)cb(event,session);window.authLocked=false;};
window.supabase={createClient:()=>({auth:{getSession:async()=>{if(window.authLocked)throw Error('AUTH DEADLOCK');return {data:{session:window.testSession}}},onAuthStateChange:cb=>{window.authCallbacks.push(cb);return {data:{subscription:{unsubscribe(){}}}}},signInWithPassword:async()=>{window.testSession={user:window.testUser,access_token:'test-token'};window.emitAuth('SIGNED_IN',window.testSession);return {data:{session:window.testSession}}},signUp:async()=>({data:{session:null}}),resetPasswordForEmail:async()=>({data:{}}),updateUser:async()=>({data:{user:window.testUser}}),signOut:async()=>{window.testSession=null;window.emitAuth('SIGNED_OUT',null);return {}}},from:()=>{const result={data:{id:window.testUser.id,first_name:'سارة',last_name:'العتيبي',major:'علوم الحاسب',email:'student@aou.edu.sa',created_at:'2026-01-01'}};const q={select:()=>q,eq:()=>q,maybeSingle:()=>window.hangProfile?new Promise(()=>{}):Promise.resolve(result),upsert:()=>q,single:()=>Promise.resolve(result)};return q;}})};`;
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {channel:'chrome'}),headless:true});
 const context=await browser.newContext({locale:'en-US'});
 await context.route('**/js/supabase-config.js',r=>r.fulfill({contentType:'application/javascript',body:"window.SUPABASE_URL='https://test.supabase.co';window.SUPABASE_ANON_KEY='test-public';"}));
 await context.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',r=>r.fulfill({contentType:'application/javascript',body:mock}));
 await context.route('**/api/learning/progress',r=>r.fulfill({json:{progress:[],certificates:[]}}));
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/profile.html');
 await page.waitForFunction(()=>document.querySelector('#profile-first-name').value==='سارة');
 assert.equal(await page.locator('#profile-email').inputValue(),user.email); report.passed.push('Profile loads database fields over metadata');
 await page.locator('#profile-first-name').fill('Unsaved');
 await page.getByRole('button',{name:'English',exact:true}).click();assert.equal(await page.locator('#profile-first-name').inputValue(),'Unsaved');
 await page.getByRole('button',{name:'العربية',exact:true}).click();assert.equal(await page.locator('#profile-first-name').inputValue(),'Unsaved');
 assert.equal(await page.evaluate(()=>window.testSession.access_token),'test-token');report.passed.push('AR/EN switching preserves session and unsaved profile');
 await page.evaluate(()=>window.emitAuth('TOKEN_REFRESHED',window.testSession));assert.equal(await page.locator('#profile-first-name').inputValue(),'Unsaved'); report.passed.push('Token refresh preserves draft without auth lock reentry');
 await page.screenshot({path:'qa-artifacts/profile-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa-artifacts/profile-mobile.png',fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));report.passed.push('Profile mobile no horizontal overflow');
 await page.goto('http://127.0.0.1:3000/reset-password.html');
 await page.locator('#new-password').fill('StrongPass1234');await page.locator('#confirm-password').fill('StrongPass1234');await page.locator('#reset-submit').click();await page.waitForURL('**/profile.html');report.passed.push('Password reset redirects to profile');
 await page.goto('http://127.0.0.1:3000/index.html');
 await page.evaluate(()=>{window.testSession=null;window.emitAuth('SIGNED_OUT',null)});
 await page.locator('#login-form input[name=email]').fill('student@aou.edu.sa');await page.locator('#login-form input[name=password]').fill('StrongPass1234');await page.locator('#login-form button[type=submit]').click();await page.waitForURL('**/profile.html');report.passed.push('Password login redirects to profile');
 await page.evaluate(()=>window.emitAuth('PASSWORD_RECOVERY',window.testSession));await page.waitForURL('**/reset-password.html');report.passed.push('Recovery event opens password form');
 await page.goto('http://127.0.0.1:3000/course.html?course=network-defense');await page.getByRole('button',{name:'English',exact:true}).first().click();
 assert((await page.locator('#lesson-content').innerText()).includes('Network segmentation'));assert.equal(await page.locator('.lesson-diagram').count(),1);
 await page.screenshot({path:'qa-artifacts/course-mobile.png',fullPage:true});report.passed.push('Course English content and diagram render on mobile');
 for(const route of ['/server/src/app.js','/supabase/profile-setup.sql','/server/package.json','/missing.js']){const r=await context.request.get('http://127.0.0.1:3000'+route);assert.equal(r.status(),404)}report.passed.push('Server source SQL and missing assets return 404');
 await page.goto('http://127.0.0.1:3000/profile.html');await page.evaluate(()=>window.emitAuth('SIGNED_OUT',null));await page.waitForURL('**/index.html#tab-auth');report.passed.push('Signed out profile redirects to login');
 // Empty sessions and timed-out profile queries must settle visibly.
 const anonymous=await context.newPage();
 await anonymous.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',r=>r.fulfill({contentType:'application/javascript',body:mock+'window.testSession=null;'}));
 await anonymous.goto('http://127.0.0.1:3000/profile.html');await anonymous.waitForURL('**/index.html#tab-auth');
 await anonymous.goto('http://127.0.0.1:3000/reset-password.html');await anonymous.waitForFunction(()=>document.querySelector('#reset-form').hidden);
 report.passed.push('Anonymous profile blocked and invalid reset link shows error');await anonymous.close();
 const hanging=await context.newPage();await hanging.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',r=>r.fulfill({contentType:'application/javascript',body:mock+'window.hangProfile=true;'}));
 await hanging.goto('http://127.0.0.1:3000/profile.html');await hanging.waitForFunction(()=>document.querySelector('#profile-message').classList.contains('error'),{},{timeout:15000});report.passed.push('Hanging profile query exits loading with error within deadline');await hanging.close();
 const cert={certificateCode:'TEST-ONLY',studentName:'سارة العتيبي',courseName:'أساسيات الأمن السيبراني',issuedAt:'2026-09-11',status:'valid'};
 await context.route('**/api/learning/verify/TEST-ONLY',r=>r.fulfill({json:{valid:true,certificate:cert}}));
 await context.route('**/api/learning/verify/INVALID',r=>r.fulfill({status:404,json:{valid:false}}));
 await context.route('**/api/learning/certificates/TEST-ONLY/image',r=>r.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('certificate-sample-ar.svg','utf8')}));
 await page.goto('http://127.0.0.1:3000/certificate-verify.html?code=TEST-ONLY');await page.locator('.verify-certificate-image').waitFor();await page.getByRole('button',{name:'English',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Print / Save as PDF'}).count(),1);await page.pdf({path:'qa-artifacts/certificate-print-sample.pdf',preferCSSPageSize:true});report.passed.push('Certificate verification supports SVG download and PDF print');
 await page.locator('#certificate-code').fill('INVALID');await page.locator('#verify-form button').click();await page.locator('.verify-error').waitFor();await page.getByRole('button',{name:'العربية',exact:true}).click();assert.equal(await page.locator('.verify-certificate-image').count(),0);report.passed.push('Failed verification never resurrects previous certificate on language change');
 for(const route of ['join.html','suggestions.html','verify-email.html','maintenance.html']){
   await page.goto('http://127.0.0.1:3000/'+route);await page.evaluate(()=>window.i18n.setLanguage('en'));assert.equal(await page.locator('html').getAttribute('dir'),'ltr');await page.evaluate(()=>window.i18n.setLanguage('ar'));assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 }report.passed.push('Additional public pages switch document language and direction');
 fs.writeFileSync('qa-artifacts/QA-browser.json',JSON.stringify(report,null,2));await browser.close();assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
})().catch(e=>{fs.writeFileSync('qa-artifacts/QA-browser.json',JSON.stringify({...report,failure:e.stack},null,2));console.error(e);process.exit(1)});
