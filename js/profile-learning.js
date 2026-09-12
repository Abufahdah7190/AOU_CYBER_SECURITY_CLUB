(() => {
  let records = { progress: [], certificates: [] };
  const en = () => window.i18n?.lang === 'en';
  const node = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
  function render() {
    document.getElementById('stat-enrolled').textContent = records.progress.length;
    document.getElementById('stat-completed').textContent = records.progress.filter(p => Number(p.percent) === 100).length;
    document.getElementById('stat-certificates').textContent = records.certificates.length;
    document.getElementById('profile-certificates-summary').textContent = en() ? `${records.certificates.length} certificates` : `${records.certificates.length} شهادة`;
    const list = document.getElementById('profile-certificates-list'); list.replaceChildren();
    for (const cert of records.certificates) {
      const card = node('article', ''); card.className = 'card';
      card.append(node('h3', cert.courseName), node('p', cert.certificateCode));
      const link = node('a', en() ? 'Download SVG / open certificate' : 'تنزيل SVG / فتح الشهادة');
      link.href = `/api/learning/certificates/${encodeURIComponent(cert.certificateCode)}/image`; link.target = '_blank'; link.rel = 'noopener';
      card.append(link);
      const verify=node('a',en()?' Verify / Print PDF ':' تحقق / طباعة PDF ');verify.href='/certificate-verify.html?code='+encodeURIComponent(cert.certificateCode);card.append(verify);
      const select = document.createElement('select'); select.setAttribute('aria-label', en() ? 'Certificate language' : 'لغة الشهادة');
      for (const [value,label] of [['ar','العربية'],['en','English']]) { const option = node('option',label); option.value=value; select.append(option); }
      select.value = window.i18n.lang;
      const button = node('button', en() ? 'Reissue in selected language' : 'إعادة الإصدار باللغة المختارة'); button.type='button'; button.className='btn';
      const status = node('p',''); status.setAttribute('role','status');
      button.addEventListener('click',async()=>{
        button.disabled=true;
        try {
          const response = await window.clubFetch(`/api/learning/certificates/${encodeURIComponent(cert.courseSlug)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseName:cert.courseName,language:select.value})});
          const data=await response.json(); if(!response.ok)throw Error(data.error);
          Object.assign(cert,data.certificate); render();
        } catch(error){status.textContent=error.message;} finally{button.disabled=false;}
      });
      card.append(select,button,status); list.append(card);
    }
  }
  async function load(){
    try{
      const response=await window.clubFetch('/api/learning/progress');
      const data=await response.json();if(!response.ok)throw Error(data.error);
      records=data;render();
    }catch(error){document.getElementById('profile-certificates-summary').textContent=(en()?'Certificate history unavailable: ':'تعذر تحميل سجل الشهادات: ')+error.message;}
  }
  document.addEventListener('profile:loaded',load);
  document.addEventListener('languagechange',render);
})();
