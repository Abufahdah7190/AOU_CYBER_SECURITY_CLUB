const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
for(const base of ['', 'public', 'server/public']) {
 if(!fs.existsSync(path.join(root,base,'index.html')))continue;
 const html=fs.readFileSync(path.join(root,base,'index.html'),'utf8');
 assert(!html.includes('id="forgot-form"'));assert(!html.includes('data-auth-forgot'));
 assert(html.includes('href="/suggestions.html"'));
 assert(fs.readFileSync(path.join(root,base,'reset-password.html'),'utf8').includes('url=/suggestions.html'));
 assert(!fs.readFileSync(path.join(root,base,'js/auth.js'),'utf8').includes('resetPasswordForEmail'));
}
console.log('PASS retired recovery UI routes users to public support');
