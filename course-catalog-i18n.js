(() => {
  'use strict';
  const courseMeta = {
    'cyber-basics': { ar: ['أساسيات الأمن السيبراني', 'مفاهيم التهديدات وحماية الحسابات والهوية الرقمية.', 'سهل · مبتدئ', 'المسار التأسيسي · 01', 'المتطلبات: لا يوجد — البداية المثالية'], en: ['Introduction to Cybersecurity', 'Threats, account protection, and digital identity fundamentals.', 'Easy · Beginner', 'Foundation Path · 01', 'Prerequisite: None — ideal starting point'], lessons: 5, hours: '3' },
    'digital-literacy': { ar: ['الوعي الرقمي الآمن', 'الخصوصية والهوية الرقمية وإدارة المخاطر في الحياة اليومية.', 'سهل · مبتدئ', 'المسار التأسيسي · 02', 'المتطلبات: أساسيات الأمن السيبراني'], en: ['Digital Safety Awareness', 'Privacy, digital identity, and everyday risk management.', 'Easy · Beginner', 'Foundation Path · 02', 'Prerequisite: Cybersecurity basics'], lessons: 5, hours: '2.5' },
    'network-defense': { ar: ['الدفاع عن الشبكات', 'مراقبة الشبكات وقراءة السجلات والاستجابة للحوادث.', 'متوسط الصعوبة', 'المسار المهني · 01', 'المتطلبات: أساسيات الشبكات والوعي الرقمي'], en: ['Network Defense', 'Network monitoring, log analysis, and incident response.', 'Intermediate', 'Professional Path · 01', 'Prerequisite: Networking and digital safety'], lessons: 5, hours: '5' },
    'digital-forensics': { ar: ['الأدلة الجنائية الرقمية', 'جمع الأدلة والحفاظ على سلامتها وتحليل آثار الحوادث.', 'متوسط الصعوبة', 'المسار المهني · 02', 'المتطلبات: الدفاع عن الشبكات'], en: ['Digital Forensics', 'Evidence collection, preservation, and incident artifact analysis.', 'Intermediate', 'Professional Path · 02', 'Prerequisite: Network defense'], lessons: 5, hours: '6' },
    'secure-coding': { ar: ['البرمجة الآمنة وتطبيقات الويب', 'مبادئ OWASP وحماية الجلسات والتحقق من المدخلات.', 'متوسط الصعوبة', 'المسار المهني · 03', 'المتطلبات: أساسيات الويب والبرمجة'], en: ['Secure Coding and Web Applications', 'OWASP principles, session protection, and input validation.', 'Intermediate', 'Professional Path · 03', 'Prerequisite: Web and programming basics'], lessons: 5, hours: '5' },
    'ethical-hacking': { ar: ['الاختبار الاختراقي الأخلاقي', 'منهجية الاختبار المصرح به واكتشاف الثغرات وكتابة التقارير.', 'صعب · متقدم', 'المسار المتقدم · 01', 'المتطلبات: الدفاع عن الشبكات والبرمجة الآمنة'], en: ['Ethical Hacking', 'Authorized testing methodology, vulnerability discovery, and reporting.', 'Hard · Advanced', 'Advanced Path · 01', 'Prerequisite: Network defense and secure coding'], lessons: 5, hours: '8' },
    'cloud-security': { ar: ['أمن الحوسبة السحابية', 'الهوية السحابية وحماية الموارد ومراقبة الخدمات الموزعة.', 'صعب · متقدم', 'المسار المتقدم · 02', 'المتطلبات: الدفاع عن الشبكات'], en: ['Cloud Security', 'Cloud identity, resource protection, and distributed service monitoring.', 'Hard · Advanced', 'Advanced Path · 02', 'Prerequisite: Network defense'], lessons: 5, hours: '7' },
    'soc-analyst': { ar: ['محلل مركز العمليات الأمنية SOC', 'الفرز الأمني وتحليل التنبيهات وكتابة تقارير الحوادث.', 'صعب · متقدم', 'المسار المتقدم · 03', 'المتطلبات: الدفاع عن الشبكات والأدلة الرقمية'], en: ['SOC Analyst', 'Security triage, alert analysis, and incident reporting.', 'Hard · Advanced', 'Advanced Path · 03', 'Prerequisite: Network defense and digital forensics'], lessons: 5, hours: '9' }
  };
  const groupMeta = { ar: [['المسار التأسيسي', 'مفاهيم الأمن والوعي الرقمي والشبكات'], ['المسار المهني', 'الدفاع والتحليل والبرمجة الآمنة'], ['المسار المتقدم', 'الاختبار الاختراقي والسحابة وعمليات الأمن']], en: [['Foundation Path', 'Security awareness, digital safety, and network basics'], ['Professional Path', 'Defense, analysis, and secure application development'], ['Advanced Path', 'Ethical testing, cloud security, and security operations']] };
  function lang() { return window.i18n?.lang === 'en' ? 'en' : 'ar'; }
  function t(key, fallback) { return window.i18n?.t?.(`courses.${key}`, fallback) || fallback; }
  function apply() {
    const l = lang();
    const heading = document.querySelector('.learning-heading h2');
    const intro = document.querySelector('.learning-heading p');
    if (heading) heading.textContent = t('title', heading.textContent);
    if (intro) intro.textContent = t('intro', intro.textContent);
    document.querySelectorAll('.provider-course-group').forEach((group, i) => {
      const meta = groupMeta[l][i];
      if (!meta) return;
      const title = group.querySelector('.provider-heading h3');
      const desc = group.querySelector('.provider-heading p');
      if (title) title.textContent = meta[0];
      if (desc) desc.textContent = meta[1];
    });
    document.querySelectorAll('.course-card[data-course-id]').forEach((card) => {
      const meta = courseMeta[card.dataset.courseId];
      if (!meta) return;
      const values = meta[l];
      const title = card.querySelector('h3');
      const desc = card.querySelector(':scope > p:not(.course-progress-label)');
      const level = card.querySelector('.course-level');
      const track = card.querySelector('.course-track');
      const req = card.querySelector('.course-requirement');
      const action = card.querySelector('.course-action');
      const stats = card.querySelectorAll('.course-meta span');
      if (title) title.textContent = values[0];
      if (desc) desc.textContent = values[1];
      if (level) level.textContent = values[2];
      if (track) track.textContent = values[3];
      if (req) req.textContent = values[4];
      if (stats[0]) stats[0].textContent = `${meta.lessons} ${t('lessons', l === 'ar' ? 'دروس' : 'lessons')}`;
      if (stats[1]) stats[1].textContent = `${meta.hours} ${t('hours', l === 'ar' ? 'ساعات' : 'hours')}`;
      if (action) action.textContent = t('open', l === 'ar' ? 'عرض الدورة' : 'Open course');
    });
  }
  document.addEventListener('DOMContentLoaded', () => { apply(); document.addEventListener('languagechange', apply); });
})();
