(() => {
  const API = '/api/learning';
  const courses = {
    'cyber-basics': { name: 'أساسيات الأمن السيبراني', sections: ['مقدمة الأمن السيبراني', 'إدارة الحسابات وكلمات المرور', 'الهندسة الاجتماعية', 'التصفح والبريد الآمن', 'المراجعة النهائية'] },
    'network-defense': { name: 'الدفاع عن الشبكات', sections: ['مبادئ الشبكات', 'الجدران النارية', 'قراءة السجلات', 'كشف التهديدات', 'الاستجابة للحوادث'] },
    'ethical-hacking': { name: 'الاختبار الاختراقي الأخلاقي', sections: ['النطاق والتصريح', 'جمع المعلومات', 'فحص الثغرات', 'الاستغلال الآمن', 'كتابة التقرير'] },
  };
  const quizTemplates = [
    ['ما الهدف الأساسي من الأمن السيبراني؟', ['حماية البيانات والأنظمة', 'زيادة سرعة الإنترنت', 'إلغاء كلمات المرور'], 0],
    ['ما أفضل ممارسة لكلمة المرور؟', ['إعادة استخدامها في كل المواقع', 'استخدام كلمة طويلة وفريدة', 'كتابتها في مكان عام'], 1],
    ['ما التصرف الصحيح مع رسالة مشبوهة؟', ['فتح المرفق فورًا', 'إعادة إرسالها للجميع', 'التحقق من المصدر وعدم فتحها'], 2],
    ['ما العلامة المهمة للموقع الآمن؟', ['يبدأ بـ HTTPS', 'يطلب كلمة المرور في كل نقرة', 'لا يحتوي على عنوان'], 0],
    ['متى تُمنح شهادة الدورة؟', ['بعد مشاهدة العنوان فقط', 'عند إكمال 80% أو أكثر', 'قبل بدء الدورة'], 1],
  ];
  let state = { progress: [], certificates: [] };
  const byId = (id) => document.getElementById(id);
  const getCourse = (slug) => courses[slug] || { name: slug, sections: [] };
  const getSaved = (slug) => state.progress.find((item) => item.courseSlug === slug) || { percent: 0, lastSection: 0, quizScores: {}, language: 'ar' };

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'تعذر الاتصال بالخادم');
    return data;
  }

  async function loadState() {
    try { state = await request('/progress'); render(); }
    catch (error) { console.warn('Learning state unavailable:', error.message); render(); }
  }

  function render() {
    const cards = [...document.querySelectorAll('[data-course-id]')];
    const values = cards.map((card) => Number(getSaved(card.dataset.courseId).percent || 0));
    const completed = values.filter((value) => value >= 80).length;
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    if (byId('learning-completed-count')) byId('learning-completed-count').textContent = completed;
    if (byId('learning-progress-percent')) byId('learning-progress-percent').textContent = `${average}%`;
    if (byId('learning-certificates-count')) byId('learning-certificates-count').textContent = state.certificates.length;
    cards.forEach((card) => {
      const saved = getSaved(card.dataset.courseId);
      const value = Number(saved.percent || 0);
      const bar = card.querySelector('.course-progress-bar');
      const label = card.querySelector('.course-progress-label strong');
      const button = card.querySelector('.course-action');
      if (bar) bar.style.width = `${value}%`;
      if (label) label.textContent = `${value}%`;
      if (button) button.textContent = value >= 80 ? 'متابعة الدورة — الشهادة متاحة' : value ? 'متابعة الدورة' : 'ابدأ الدورة';
    });
    const list = byId('certificates-list');
    if (list) list.innerHTML = state.certificates.length ? state.certificates.map((certificate) => `<div class="certificate-item"><span class="certificate-icon">✓</span><div><strong>${certificate.courseName}</strong><small>${certificate.language === 'en' ? 'English certificate' : 'شهادة عربية'} · ${certificate.certificateCode}</small></div><button type="button" class="btn ghost certificate-share" data-course-slug="${certificate.courseSlug}">مشاركة LinkedIn</button></div>`).join('') : '<span class="empty-state">أكمل 80% من دورة على الأقل لتظهر شهادتك هنا.</span>';
    list?.querySelectorAll('.certificate-share').forEach((button) => button.addEventListener('click', () => shareCertificate(button.dataset.courseSlug)));
  }

  function openCourse(card) {
    const slug = card?.dataset.courseId;
    if (!slug) return;
    const target = new URL('course.html', document.baseURI);
    target.searchParams.set('course', slug);
    window.open(target.href, '_blank', 'noopener,noreferrer');
  }

  function bindCourseNavigation() {
    document.querySelectorAll('[data-course-id]').forEach((card) => {
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', (event) => {
        // Buttons remain available for their own actions; clicking anywhere
        // else on the course card opens the dedicated learning page.
        if (event.target.closest('button, a, input, select, textarea')) return;
        openCourse(card);
      });
      card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button, a, input, select, textarea')) {
          event.preventDefault();
          openCourse(card);
        }
      });
    });
    document.querySelectorAll('.course-action').forEach((action) => {
      // Course actions are real anchors with target="_blank". Do not call
      // preventDefault here, otherwise the browser cannot open the new tab.
      if (action.tagName === 'A') return;
      action.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCourse(action.closest('[data-course-id]'));
      });
    });
  }

  function showQuiz(detail, slug, index) {
    const section = detail.querySelectorAll('.course-section')[index];
    const box = section.querySelector('.quiz-box');
    const quiz = quizTemplates[index % quizTemplates.length];
    box.hidden = false;
    box.innerHTML = `<p>${quiz[0]}</p>${quiz[1].map((option, optionIndex) => `<label><input type="radio" name="quiz-${slug}-${index}" value="${optionIndex}"> ${option}</label>`).join('')}<button type="button" class="btn primary submit-quiz">تصحيح الإجابة</button><span class="quiz-result"></span>`;
    box.querySelector('.submit-quiz').addEventListener('click', async () => {
      const selected = box.querySelector('input:checked');
      const result = box.querySelector('.quiz-result');
      if (!selected) { result.textContent = 'اختر إجابة أولًا.'; return; }
      const passed = Number(selected.value) === quiz[2];
      result.textContent = passed ? 'إجابة صحيحة، تم احتساب القسم.' : 'الإجابة غير صحيحة، حاول مرة أخرى.';
      if (!passed) return;
      const saved = getSaved(slug);
      const quizScores = { ...(saved.quizScores || {}), [index]: true };
      const percent = Math.round((Object.values(quizScores).filter(Boolean).length / getCourse(slug).sections.length) * 100);
     try {
        const data = await request(`/progress/${slug}`, { method: 'PUT', body: JSON.stringify({ percent, lastSection: index + 1, quizScores, language: saved.language || 'ar' }) });
        state.progress = [...state.progress.filter((item) => item.courseSlug !== slug), data.progress];
        render(); openCourse(document.querySelector(`[data-course-id="${slug}"]`));
      } catch (error) { 
        console.warn('Network save failed, saving locally:', error);
        // حفظ احتياطي محلياً كي لا تضيع إجابات وتقدم المستخدم
        localStorage.setItem(`offline_progress_${slug}`, JSON.stringify({ percent, lastSection: index + 1, quizScores }));
        result.textContent = 'تم الحفظ محلياً (سيتم المزامنة لاحقاً)'; 
      }
    });
  }

  function updateCertificateActions(detail, percent) { const actions = detail.querySelector('.certificate-actions'); if (actions) actions.hidden = percent < 80; }
  async function issueCertificate(detail, slug, courseName) {
    const language = detail.querySelector('.certificate-language').value;
    try {
      const data = await request(`/certificates/${slug}`, { method: 'POST', body: JSON.stringify({ courseName, language }) });
      state.certificates = [...state.certificates.filter((item) => item.courseSlug !== slug), data.certificate];
      renderCertificate(data.certificate, language, data.email);
      render();
    } catch (error) { alert(error.message); }
  }
  function renderCertificate(certificate, language, email = {}) {
    const arabic = language !== 'en';
    const title = arabic ? 'شهادة إتمام ومشاركة' : 'Certificate of Completion and Participation';
    const body = arabic ? `يشهد نادي الأمن السيبراني بالجامعة العربية المفتوحة بأن الطالب/ـة:` : 'This is to certify that the student:';
    const courseLine = arabic ? 'قد أتمـ/ـت بنجاح الدورة التدريبية بعنوان:' : 'has successfully completed the training course:';
    const disclaimer = arabic ? 'هذه الشهادة صُدرت إلكترونياً من موقع نادي الأمن السيبراني بالجامعة العربية المفتوحة ولا تحتاج إلى توقيع أو ختم. للتحقق من صحة البيانات يرجى مسح رمز QR أو زيارة رابط التحقق.' : 'This certificate was issued electronically by the AOU Cyber Security Club and does not require a signature or stamp. Verify it by scanning the QR code or visiting the verification link.';
    const emailText = email.sent ? (arabic ? 'تم إرسال نسخة الشهادة إلى بريدك الإلكتروني.' : 'A copy of the certificate was sent to your email.') : (arabic ? 'تعذر إرسال البريد حاليًا، لكن الشهادة متاحة هنا ويمكن طباعتها أو حفظها.' : 'Email delivery failed, but your certificate is available here to print or save.');
    const emailClass = email.sent ? 'email-status success' : 'email-status warning';
    const modal = document.createElement('div'); modal.className = 'certificate-modal'; modal.innerHTML = `<div class="certificate-sheet" dir="${arabic ? 'rtl' : 'ltr'}"><div class="certificate-logos"><img src="assets/branding/aou-logo.png" alt="AOU"><img src="assets/branding/cyberclub-logo.png" alt="Cyber Security Club"></div><h2>${title}</h2><p>${body}</p><h3>${certificate.studentName || ''}</h3><p>${courseLine}</p><h3>${certificate.courseName}</h3><p class="certificate-score">${arabic ? 'نسبة الاجتياز:' : 'Completion score:'} <strong>${certificate.completionPercent || 80}%</strong></p><p class="certificate-code">${arabic ? 'رمز التحقق الرقمي:' : 'Verification code:'} <strong>${certificate.certificateCode}</strong></p><div class="certificate-bottom"><img src="${certificate.qrDataUrl}" alt="QR Code للتحقق"><small>${disclaimer}</small></div><p class="${emailClass}" role="status">${emailText}</p><div class="certificate-actions-print"><button class="btn primary print-certificate">طباعة / حفظ PDF</button><button class="btn ghost close-certificate">إغلاق</button></div></div>`; document.body.appendChild(modal); modal.querySelector('.print-certificate').onclick = () => window.print(); modal.querySelector('.close-certificate').onclick = () => modal.remove();
  }
  function shareCertificate(slug) { const certificate = state.certificates.find((item) => item.courseSlug === slug); const text = certificate ? `I completed ${certificate.courseName} at AOU Cyber Security Club. Certificate: ${certificate.certificateCode}` : 'I completed a course at AOU Cyber Security Club.'; window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/?certificate=' + encodeURIComponent(slug))}&summary=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); }
  function init() {
    bindCourseNavigation();
    document.addEventListener('auth:ready', loadState);
    loadState();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
