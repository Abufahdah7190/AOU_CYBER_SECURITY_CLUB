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
      const previewLink = node('a', '');
      previewLink.href = '/certificate-verify.html?code=' + encodeURIComponent(cert.certificateCode);
      previewLink.setAttribute('aria-label', en() ? 'View certificate' : 'عرض الشهادة');
      const preview = document.createElement('img');
      preview.src = `/api/learning/certificates/${encodeURIComponent(cert.certificateCode)}/image`;
      preview.alt = (en() ? 'Certificate preview: ' : 'معاينة الشهادة: ') + cert.courseName;
      preview.loading = 'lazy'; preview.width = 1600; preview.height = 1131;
      preview.style.cssText = 'display:block;width:100%;height:auto;max-width:800px;margin:16px auto;border-radius:8px;background:white';
      previewLink.append(preview); card.append(previewLink);
      const link = node('a', en() ? 'Download SVG / open certificate' : 'تنزيل SVG / فتح الشهادة');
      link.href = `/api/learning/certificates/${encodeURIComponent(cert.certificateCode)}/image`; link.target = '_blank'; link.rel = 'noopener';
      card.append(link);
      const verify=node('a',en()?' Verify / Print PDF ':' تحقق / طباعة PDF ');verify.href='/certificate-verify.html?code='+encodeURIComponent(cert.certificateCode);card.append(verify);
      const select = document.createElement('select'); select.setAttribute('aria-label', en() ? 'Certificate language' : 'لغة الشهادة');
      for (const [value,label] of [['ar','العربية'],['en','English']]) { const option = node('option',label); option.value=value; select.append(option); }
      select.value = window.i18n.lang;
      const button = node('a', en() ? 'View / Print in selected language' : 'عرض / طباعة باللغة المختارة'); button.className='btn';
      const status = node('p',''); status.setAttribute('role','status');
      function switchCertificateLanguage(){
        const image=`/api/learning/certificates/${encodeURIComponent(cert.certificateCode)}/image?lang=${select.value}`;
        const page='/certificate-verify.html?code='+encodeURIComponent(cert.certificateCode)+'&lang='+select.value;
        preview.src=image;link.href=image;verify.href=page;previewLink.href=page;button.href=page;
      }
      select.addEventListener('change',switchCertificateLanguage);
      switchCertificateLanguage();
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
