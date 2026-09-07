(() => {
  'use strict';

  const API = '/api/learning';
  const params = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = params.get('course') || (pathParts[0] === 'learn' ? pathParts[1] : '') || 'cyber-basics';
  const $ = (id) => document.getElementById(id);
  const safeLang = () => (localStorage.getItem('club-lang') === 'en' ? 'en' : 'ar');
  let lang = safeLang();
  let current = 0;
  let saved = { percent: 0, lastSection: 0, quizScores: {} };
  let certificate = null;
  let isCompleting = false;

  const courseNames = {
    'cyber-basics': ['أساسيات الأمن السيبراني', 'Introduction to Cybersecurity'],
    'digital-literacy': ['الوعي الرقمي الآمن', 'Digital Safety Awareness'],
    'network-defense': ['شبكات وحماية البيانات', 'Network Security Fundamentals'],
    'digital-forensics': ['التحقيق الجنائي الرقمي', 'Digital Forensics'],
    'secure-coding': ['حماية تطبيقات الويب و OWASP', 'Web Application Security'],
    'ethical-hacking': ['الاختبار الاختراقي الأخلاقي', 'Ethical Hacking'],
    'cloud-security': ['أمن الحوسبة السحابية', 'Cloud Security Essentials'],
    'soc-analyst': ['تحليل التهديدات ومركز العمليات الأمنية', 'Threat Intelligence and SOC Analysis']
  };

  function fallbackCourse(id) {
    const names = courseNames[id] || [id.replace(/-/g, ' '), id.replace(/-/g, ' ')];
    const moduleNames = ['المفاهيم الأساسية', 'التطبيق العملي', 'المراجعة والقياس'];
    const moduleNamesEn = ['Core Concepts', 'Practical Application', 'Review and Assessment'];
    const topicsEn = ['Introduction and Orientation', 'Explanation and Analysis', 'Practice and Assessment'];
    const typeLabels = { video: ['فيديو تعليمي', 'Instructional video'], article: ['قراءة ومقال', 'Reading article'], lab: ['مختبر عملي', 'Hands-on lab'] };
    // A slightly larger generic bank than a single fixed trio, so this
    // preview/fallback path (used only for course slugs with no dedicated
    // content in lms-data.js) doesn't repeat the exact same answer options
    // on every lesson either.
    const correctBank = [
      { ar: `التوثيق والعمل ضمن نطاق مصرح به في سياق ${names[0]}`, en: `Documenting work within an authorized scope for ${names[1]}` },
      { ar: 'التحقق من المصدر والصلاحيات قبل تنفيذ أي إجراء', en: 'Verifying source and permissions before taking any action' },
      { ar: 'تسجيل الملاحظات ومراجعتها قبل الانتقال للخطوة التالية', en: 'Recording notes and reviewing them before moving to the next step' },
    ];
    const wrongBank = [
      { ar: 'تجربة أي إجراء على نظام عام دون تصريح', en: 'Trying any action on a public system without authorization' },
      { ar: 'مشاركة بيانات حساسة خارج القنوات الرسمية', en: 'Sharing sensitive data outside official channels' },
      { ar: 'تخطي التوثيق للانتهاء بشكل أسرع', en: 'Skipping documentation to finish faster' },
    ];
    const modules = moduleNames.map((moduleName, moduleIndex) => ({
      id: `${id}-m${moduleIndex + 1}`,
      title: { ar: `الوحدة ${moduleIndex + 1}: ${moduleName}`, en: `Module ${moduleIndex + 1}: ${moduleNamesEn[moduleIndex]}` },
      lessons: ['مقدمة وتمهيد', 'شرح وتحليل', 'تطبيق واختبار'].map((topic, lessonIndex) => {
        const type = ['video', 'article', 'lab'][(moduleIndex + lessonIndex) % 3];
        const seed = moduleIndex * 3 + lessonIndex;
        const correct = correctBank[seed % correctBank.length];
        const wrong1 = wrongBank[seed % wrongBank.length];
        const wrong2 = wrongBank[(seed + 1) % wrongBank.length];
        const position = seed % 3;
        const arOptions = [wrong1.ar, wrong2.ar]; arOptions.splice(position, 0, correct.ar);
        const enOptions = [wrong1.en, wrong2.en]; enOptions.splice(position, 0, correct.en);
        return {
          id: `${id}-m${moduleIndex + 1}-l${lessonIndex + 1}`,
          title: { ar: `${moduleName}: ${topic}`, en: `${names[1]} — ${topicsEn[lessonIndex]}` },
          type,
          typeLabel: { ar: typeLabels[type][0], en: typeLabels[type][1] },
          body: { ar: `محتوى تمهيدي في دورة «${names[0]}». تعرّف على المفهوم، حلّل المثال، ثم طبّق الخطوات داخل بيئة تدريبية مصرح بها.`, en: `A guided lesson in ${names[1]}. Learn the concept, analyze the example, and apply the steps in an authorized training environment.` },
          steps: { ar: ['حدد الهدف والأصول المرتبطة بالدرس.', 'حلل المخاطر أو البيانات المتاحة.', 'وثّق النتيجة والخطوة التالية.'], en: ['Define the objective and related assets.', 'Analyze the available risks or evidence.', 'Document the result and next action.'] },
          quiz: { ar: { question: `ما الممارسة الصحيحة في درس «${topic}»؟`, options: arOptions, correct: position }, en: { question: `What is the correct practice in "${topic}"?`, options: enOptions, correct: position } }
        };
      })
    }));
    return { slug: id, ar: names[0], en: names[1], level: 'متوسط', desc: 'محتوى تدريبي تجريبي قابل للتعلم والتوسع.', image: 'assets/courses/network-defense.svg', modules };
  }

  const fallback = fallbackCourse(slug);
  const rawCourse = window.CYBERCLUB_LMS_BY_SLUG?.[slug] || fallback;
  const containsArabic = (value) => typeof value === 'string' && /[\u0600-\u06FF]/.test(value);
  const mergeEnglish = (source, backup) => {
    if (Array.isArray(source)) return source.map((item, index) => mergeEnglish(item, backup?.[index]));
    if (source && typeof source === 'object') {
      const output = { ...source };
      Object.keys(output).forEach((key) => {
        const backupValue = backup?.[key];
        if (key === 'en' && (output[key] == null || containsArabic(output[key])) && backupValue) output[key] = backupValue;
        else if (backupValue && typeof output[key] === 'object') output[key] = mergeEnglish(output[key], backupValue);
      });
      return output;
    }
    return source;
  };
  const course = mergeEnglish(rawCourse, fallback);
  const text = (value) => (value && typeof value === 'object' ? (value[lang] || value.ar || value.en || '') : (value || ''));
  const allLessons = () => (course.modules || []).flatMap((module, moduleIndex) => (module.lessons || []).map((lesson, lessonIndex) => ({ lesson, module, moduleIndex, lessonIndex })));
  const flat = () => allLessons();
  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, { credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return result;
  };

  function renderHeader() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = `${text({ ar: course.ar, en: course.en })} | CyberClub`;
    $('course-title').textContent = text({ ar: course.ar, en: course.en });
    $('course-description').textContent = text(course.desc);
    $('course-level').textContent = text(course.level);
    const percent = Number(saved.percent) || 0;
    $('course-progress').textContent = `${percent}%`;
    $('course-progress-bar').style.width = `${percent}%`;
    document.querySelectorAll('[data-course-lang]').forEach((button) => button.classList.toggle('active', button.dataset.courseLang === lang));
  }

  function renderModules() {
    const root = $('modules');
    const lessons = flat();
    if (!lessons.length) {
      root.innerHTML = `<div class="lms-empty">${lang === 'ar' ? 'لا توجد دروس متاحة في هذه الدورة حالياً' : 'No lessons are currently available in this course.'}</div>`;
      return;
    }
    root.innerHTML = (course.modules || []).map((module, moduleIndex) => `<details class="lms-module" ${lessons[current]?.moduleIndex === moduleIndex ? 'open' : ''}><summary><span>${text(module.title)}</span><small>${module.lessons.length} ${lang === 'ar' ? 'دروس' : 'lessons'}</small></summary><div class="lms-module-lessons">${module.lessons.map((lesson, lessonIndex) => { const global = course.modules.slice(0, moduleIndex).reduce((sum, item) => sum + item.lessons.length, 0) + lessonIndex; const done = Boolean(saved.quizScores?.[global]); return `<button class="lms-lesson-link ${global === current ? 'active' : ''}" data-index="${global}" type="button"><span class="lms-check ${done ? 'done' : ''}">${done ? '✓' : ''}</span><span>${text(lesson.title)}</span><small>${text(lesson.typeLabel)}</small></button>`; }).join('')}</div></details>`).join('');
    root.querySelectorAll('[data-index]').forEach((button) => button.addEventListener('click', () => { current = Number(button.dataset.index); render(); }));
  }

  function quizQuestions(lesson) {
    const quiz = lesson.quiz?.[lang] || lesson.quiz?.ar || {};
    if (Array.isArray(quiz.questions) && quiz.questions.length) return quiz.questions;
    if (quiz.question) return [{ ...quiz, type: quiz.type || 'mcq' }];
    if (Array.isArray(lesson.questions) && lesson.questions.length) return lesson.questions;
    return [];
  }
  function renderQuestion(question, questionIndex, done) {
    const type = question.type || 'mcq';
    const disabled = done ? 'disabled' : '';
    if (type === 'matching') {
      return `<fieldset class="lms-quiz-question lms-quiz-matching"><legend>${questionIndex + 1}. ${question.question}</legend>${(question.pairs || []).map((pair, pairIndex) => `<label class="lms-match-row"><span>${pair.left}</span><select data-match-index="${questionIndex}" data-pair-index="${pairIndex}" ${disabled}><option value="">${lang === 'ar' ? 'اختر المطابقة' : 'Choose a match'}</option>${(question.pairs || []).map((option, optionIndex) => `<option value="${optionIndex}">${option.right}</option>`).join('')}</select></label>`).join('')}</fieldset>`;
    }
    if (type === 'ordering') {
      const count = (question.items || []).length;
      return `<fieldset class="lms-quiz-question lms-quiz-ordering"><legend>${questionIndex + 1}. ${question.question}</legend>${(question.items || []).map((item, itemIndex) => `<label class="lms-order-row"><span>${item}</span><select data-order-index="${questionIndex}" data-item-index="${itemIndex}" ${disabled}>${Array.from({ length: count }, (_, position) => `<option value="${position}">${position + 1}</option>`).join('')}</select></label>`).join('')}</fieldset>`;
    }
    return `<fieldset class="lms-quiz-question"><legend>${questionIndex + 1}. ${question.question}</legend>${(question.options || []).map((option, optionIndex) => `<label><input type="radio" name="lms-quiz-${questionIndex}" value="${optionIndex}" ${disabled}> ${option}</label>`).join('')}</fieldset>`;
  }
  function answerIsCorrect(question, questionIndex) {
    const type = question.type || 'mcq';
    if (type === 'matching') {
      const answers = [...document.querySelectorAll(`[data-match-index="${questionIndex}"]`)].map((select) => Number(select.value));
      return answers.length === (question.correct || []).length && answers.every((value, index) => value === question.correct[index]);
    }
    if (type === 'ordering') {
      const answers = [...document.querySelectorAll(`[data-order-index="${questionIndex}"]`)].map((select) => Number(select.value));
      return answers.length === (question.correct || []).length && answers.every((value, index) => value === question.correct[index]);
    }
    const answer = document.querySelector(`input[name="lms-quiz-${questionIndex}"]:checked`);
    return Boolean(answer) && Number(answer.value) === Number(question.correct);
  }
  function renderLesson() {
    const item = flat()[current];
    const content = $('lesson-content');
    if (!item) {
      content.innerHTML = `<div class="lms-empty">${lang === 'ar' ? 'لا توجد دروس متاحة في هذه الدورة حالياً' : 'No lessons are currently available in this course.'}</div>`;
      $('previous-lesson').disabled = true;
      $('complete-lesson').disabled = true;
      return;
    }
    const lesson = item.lesson;
    const done = Boolean(saved.quizScores?.[current]);
    const questions = quizQuestions(lesson);
    const steps = lesson.steps?.[lang] || lesson.steps?.ar || [];
    const media = `<div class="lms-article-placeholder"><strong>${lang === 'ar' ? 'درس مقالي' : 'Article lesson'}</strong><small>${lang === 'ar' ? 'اقرأ المحتوى التالي ثم أجب عن أسئلة الاختبار.' : 'Read the lesson content below, then answer the five-question quiz.'}</small></div>`;
    $('lesson-breadcrumb').textContent = `${text(item.module.title)} / ${text(lesson.title)}`;
    const quizHtml = questions.length ? questions.map((question, questionIndex) => renderQuestion(question, questionIndex, done)).join('') : `<p>${lang === 'ar' ? 'لا توجد أسئلة لهذا الدرس حاليًا.' : 'No questions are currently available for this lesson.'}</p>`;
    content.innerHTML = `<div class="lms-lesson-kicker">${text(lesson.typeLabel)} · ${lang === 'ar' ? `الدرس ${current + 1} من ${flat().length}` : `Lesson ${current + 1} of ${flat().length}`}</div><h2>${text(lesson.title)}</h2>${media}<p class="lms-lesson-body">${text(lesson.body)}</p><div class="lms-lesson-steps"><h3>${lang === 'ar' ? 'ماذا ستطبق؟' : 'What you will practice'}</h3><ol>${steps.map((step) => `<li>${step}</li>`).join('')}</ol></div><div class="lms-quiz"><h3>${lang === 'ar' ? 'اختبار قصير' : 'Quick quiz'}</h3>${quizHtml}<span id="quiz-result">${done ? (lang === 'ar' ? 'تم اجتياز هذا الدرس.' : 'Lesson completed.') : ''}</span></div>`;
    $('previous-lesson').disabled = current === 0;
    $('complete-lesson').disabled = done;
    $('complete-lesson').textContent = current === flat().length - 1 ? (lang === 'ar' ? 'إكمال الدورة' : 'Complete course') : (lang === 'ar' ? 'إكمال والانتقال للدرس التالي' : 'Complete and go to next');
  }

  function renderStatus() {
    const message = $('course-message');
    if (!message) return;
    if (certificate) {
      const imageUrl = certificate.imageUrl || `/api/learning/certificates/${encodeURIComponent(certificate.certificateCode)}/image`;
      const verifyUrl = certificate.verificationUrl || `/certificate-verify.html?code=${encodeURIComponent(certificate.certificateCode)}`;
      const intro = lang === 'ar' ? `تهانينا! أتممت الدورة بنسبة 100%. صدرَت شهادتك برمز <strong>${certificate.certificateCode || ''}</strong> وسيتم إرسالها تلقائيًا إلى بريدك الجامعي.` : `Congratulations! You completed the course with 100%. Your certificate ID is <strong>${certificate.certificateCode || ''}</strong> and it will be emailed automatically to your university address.`;
      message.innerHTML = `<p>${intro}</p><img class="course-certificate-preview" src="${imageUrl}" alt="${lang === 'ar' ? 'معاينة الشهادة' : 'Certificate preview'}"><p><a href="${verifyUrl}" target="_blank" rel="noopener">${lang === 'ar' ? 'فتح صفحة التحقق' : 'Open verification page'}</a> · <a href="/profile.html">${lang === 'ar' ? 'إدارة الشهادات من ملف الطالب' : 'Manage certificates from your profile'}</a></p>`;
      return;
    }
    if (!message.textContent) message.textContent = '';
  }
  function render() { renderHeader(); renderModules(); renderLesson(); renderStatus(); $('course-loading')?.setAttribute('hidden', ''); }

  function setCompletionBusy(busy) {
    const button = $('complete-lesson');
    if (!button) return;
    button.dataset.originalText ||= button.textContent;
    button.disabled = busy;
    button.textContent = busy
      ? (lang === 'ar' ? 'جارٍ حفظ التقدم...' : 'Saving progress...')
      : button.dataset.originalText;
  }

  function promptCertificateOptions() {
    return new Promise((resolve) => {
      const isAr = lang !== 'en';
      const modal = document.createElement('div');
      modal.className = 'certificate-modal certificate-options-modal';
      modal.innerHTML = `<div class="certificate-options-sheet" dir="${isAr ? 'rtl' : 'ltr'}">
        <h3>${isAr ? 'تهانينا! اختر لغة شهادتك' : 'Congratulations! Choose your certificate language'}</h3>
        <p>${isAr ? 'حدد لغة الشهادة قبل إصدارها.' : 'Pick the certificate language before it is issued.'}</p>
        <label class="certificate-option-field">${isAr ? 'لغة الشهادة' : 'Certificate language'}
          <select class="certificate-option-language">
            <option value="ar" ${isAr ? 'selected' : ''}>${isAr ? 'العربية' : 'Arabic'}</option>
            <option value="en" ${!isAr ? 'selected' : ''}>${isAr ? 'الإنجليزية' : 'English'}</option>
          </select>
        </label>
        <div class="certificate-actions-print">
          <button class="btn primary confirm-certificate-options" type="button">${isAr ? 'إصدار الشهادة' : 'Issue certificate'}</button>
        </div>
      </div>`;
      document.body.appendChild(modal);
      modal.querySelector('.confirm-certificate-options').onclick = () => {
        const language = modal.querySelector('.certificate-option-language').value;
        modal.remove();
        resolve({ language, theme: 'light' });
      };
    });
  }

  async function completeLesson() {
    if (isCompleting) return;
    const item = flat()[current];
    const result = $('quiz-result');
    const questions = quizQuestions(item.lesson);
    if (!questions.length) {
      if (result) result.textContent = lang === 'ar' ? 'لا توجد أسئلة لهذا الدرس حاليًا.' : 'No questions are available for this lesson.';
      return;
    }
    const correctAnswers = questions.reduce((total, question, index) => total + (answerIsCorrect(question, index) ? 1 : 0), 0);
    const scorePercent = Math.round((correctAnswers / questions.length) * 100);
    if (scorePercent < 80) {
      if (result) result.textContent = lang === 'ar' ? `نتيجتك ${scorePercent}%. تحتاج إلى 80% على الأقل لإكمال الدرس.` : `Your score is ${scorePercent}%. You need at least 80% to complete this lesson.`;
      return;
    }

    const quizScores = { ...(saved.quizScores || {}), [current]: true };
    const percent = Math.round(Object.values(quizScores).filter(Boolean).length / flat().length * 100);

    // Completing the final lesson issues the certificate immediately, so the
    // learner picks its language first instead of getting a silent default
    // they'd have to reissue afterwards. Theme is always 'light' now that
    // the dark template has been retired.
    let certificateOptions = { language: lang, theme: 'light' };
    if (percent >= 100) {
      certificateOptions = await promptCertificateOptions();
    }

    isCompleting = true;
    setCompletionBusy(true);
    if (result) result.textContent = lang === 'ar' ? `نتيجتك ${scorePercent}% — تم اجتياز الاختبار.` : `Score: ${scorePercent}% — Quiz passed.`;

    try {
      const response = await request(`/progress/${slug}`, {
        method: 'PUT',
        body: JSON.stringify({
          percent,
          lastSection: current + 1,
          quizScores,
          language: certificateOptions.language,
          theme: certificateOptions.theme,
          courseName: text({ ar: course.ar, en: course.en }),
        }),
      });
      saved = response.progress || { ...saved, percent, lastSection: current + 1, quizScores };
      certificate = response.certificate || certificate;
      if (percent >= 100 && !certificate && result) {
        result.textContent = lang === 'ar' ? 'اكتمل التقدم، لكن تعذر إصدار الشهادة الآن. أعد تحميل الصفحة وحاول مرة أخرى.' : 'Progress was completed, but the certificate could not be issued. Reload and try again.';
      }
    } catch (error) {
      if (result) result.textContent = `${lang === 'ar' ? 'تعذر حفظ التقدم. ' : 'Could not save progress. '}${error.message}`;
      return;
    } finally {
      isCompleting = false;
    }

    if (current < flat().length - 1) current += 1;
    render();
  }

  async function init() {
    $('course-loading')?.removeAttribute('hidden');
    render();
    try {
      const result = await request('/progress');
      saved = result.progress?.find((item) => item.courseSlug === slug) || saved;
      current = Math.min(Math.max(Number(saved.lastSection || 0), 0), Math.max(flat().length - 1, 0));
      render();
    } catch (_) {
      // Course content must remain visible even when progress/auth API is unavailable.
      $('course-message').textContent = lang === 'ar' ? 'يتم عرض المحتوى التجريبي. سجّل الدخول لحفظ تقدمك.' : 'Preview content is shown. Sign in to save your progress.';
      render();
    }
  }

  $('previous-lesson').addEventListener('click', () => { if (current > 0) { current -= 1; render(); } });
  $('complete-lesson').addEventListener('click', completeLesson);
  document.querySelectorAll('[data-course-lang]').forEach((button) => button.addEventListener('click', () => { lang = button.dataset.courseLang; localStorage.setItem('club-lang', lang); render(); }));
  init();
})();
