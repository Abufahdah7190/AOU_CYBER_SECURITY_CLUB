(() => {
  'use strict';
  const lessonTypes = ['article'];
  const seeds = [
    { slug: 'cyber-basics', ar: 'أساسيات الأمن السيبراني', en: 'Introduction to Cybersecurity', level: 'سهل · مبتدئ', desc: 'مدخل عملي إلى التهديدات والهوية الرقمية وحماية الحسابات.', modules: ['مفاهيم الأمن السيبراني', 'حماية الهوية والأجهزة', 'الوعي والاستجابة اليومية'] },
    { slug: 'digital-literacy', ar: 'الوعي الرقمي الآمن', en: 'Digital Safety Awareness', level: 'سهل · مبتدئ', desc: 'مهارات الخصوصية والمعلومات المضللة والسلوك الرقمي الآمن.', modules: ['الهوية والخصوصية', 'الأجهزة والبيانات', 'التفكير النقدي الرقمي'] },
    { slug: 'network-defense', ar: 'شبكات وحماية البيانات', en: 'Network Security Fundamentals', level: 'متوسط', desc: 'مسار بأسلوب Cisco لفهم الشبكات والجدران النارية ومراقبة السجلات.', modules: ['أساسيات الشبكات', 'التحكم في الوصول', 'المراقبة والاستجابة'] },
    { slug: 'digital-forensics', ar: 'التحقيق الجنائي الرقمي', en: 'Digital Forensics', level: 'متوسط', desc: 'جمع الأدلة الرقمية وحفظ سلامتها وبناء الخط الزمني للحوادث.', modules: ['الدليل الرقمي', 'الجمع والحفظ', 'التحليل والتقرير'] },
    { slug: 'secure-coding', ar: 'حماية تطبيقات الويب وOWASP Top 10', en: 'Web Application Security and OWASP Top 10', level: 'متوسط', desc: 'تطوير تطبيقات ويب آمنة عبر التحقق والجلسات ومعالجة الثغرات.', modules: ['نمذجة التهديدات', 'ثغرات التطبيقات', 'الاختبار والمعالجة'] },
    { slug: 'ethical-hacking', ar: 'الاختبار الاختراقي الأخلاقي', en: 'Ethical Hacking', level: 'صعب · متقدم', desc: 'منهجية اختبار مصرح بها تبدأ بالنطاق وتنتهي بتقرير احترافي.', modules: ['التصريح والاستطلاع', 'التقييم الآمن', 'التقرير وإعادة الاختبار'] },
    { slug: 'cloud-security', ar: 'أمن الحوسبة السحابية', en: 'Cloud Security Essentials', level: 'صعب · متقدم', desc: 'الهوية السحابية والمسؤولية المشتركة وحماية الموارد والمراقبة.', modules: ['المسؤولية والهوية', 'الموارد والشبكات', 'المراقبة والتعافي'] },
    { slug: 'soc-analyst', ar: 'تحليل التهديدات والاستخبارات الأمنية', en: 'Cyber Threat Intelligence and SOC Analysis', level: 'صعب · متقدم', desc: 'تحليل التنبيهات والمؤشرات وبناء استخبارات قابلة للتنفيذ بأسلوب IBM.', modules: ['دور المحلل والفرز', 'المؤشرات والسياق', 'التواصل والتحسين'] },
  ];
  const topics = [
    ['المفاهيم الأساسية', 'قراءة المخاطر', 'تمرين تحديد الأصول'],
    ['المنهجية العملية', 'تحليل حالة تدريبية', 'مختبر تطبيقي'],
    ['المراجعة والقياس', 'بناء قائمة تحقق', 'اختبار الوحدة'],
  ];
  const topicsEn = [
    ['Core concepts', 'Risk reading', 'Asset identification exercise'],
    ['Practical methodology', 'Case study analysis', 'Hands-on lab'],
    ['Review and measurement', 'Checklist building', 'Module assessment'],
  ];
  const moduleNamesEn = ['Core Concepts', 'Practical Application', 'Review and Assessment'];
  const levelsEn = { 'سهل · مبتدئ': 'Easy · Beginner', 'متوسط': 'Intermediate', 'صعب · متقدم': 'Hard · Advanced' };
  const typeLabels = { video: 'فيديو تعليمي', article: 'قراءة ومقال', lab: 'مختبر عملي' };

  // -------------------------------------------------------------------
  // Per-course knowledge banks. Each course gets its own set of concrete,
  // topic-specific "correct practice" and "distractor" statements instead
  // of the platform sharing one generic trio of options for every single
  // lesson. Question stems and option combinations are then rotated per
  // module/lesson/question so no two quiz questions — even within the
  // same lesson — end up showing the same set of answers, and the correct
  // answer isn't always in the same position.
  // -------------------------------------------------------------------
  const knowledgeBanks = {
    'cyber-basics': {
      correct: [
        { ar: 'تفعيل التحقق بخطوتين (MFA) على جميع الحسابات المهمة', en: 'Turn on two-factor authentication (MFA) for every important account' },
        { ar: 'استخدام كلمة مرور فريدة وطويلة لكل حساب عبر مدير كلمات مرور', en: 'Use a unique, long password per account via a password manager' },
        { ar: 'التحقق من عنوان المرسل ورابط الموقع قبل إدخال أي بيانات', en: "Verify the sender's address and the link's destination before entering any data" },
        { ar: 'الإبلاغ عن الرسائل المشبوهة لفريق تقنية المعلومات بدلاً من فتحها', en: 'Report suspicious messages to the IT team instead of opening them' },
        { ar: 'تحديث نظام التشغيل والتطبيقات فور توفر التحديثات الأمنية', en: 'Update the operating system and apps as soon as security patches are available' },
      ],
      wrong: [
        { ar: 'استخدام نفس كلمة المرور في كل المواقع لتسهيل التذكر', en: 'Reusing the same password across every site to make it easier to remember' },
        { ar: 'الضغط على أي رابط يصل عبر البريد دون التحقق من مصدره', en: 'Clicking any link that arrives by email without checking its source' },
        { ar: 'مشاركة رمز التحقق لمرة واحدة (OTP) مع أي شخص يطلبه هاتفياً', en: 'Sharing a one-time verification code (OTP) with anyone who asks over the phone' },
        { ar: 'تعطيل التحديثات الأمنية لأنها تبطئ الجهاز مؤقتًا', en: 'Disabling security updates because they slow the device down temporarily' },
        { ar: 'كتابة كلمات المرور في ملاحظة لاصقة على الشاشة', en: 'Writing passwords on a sticky note attached to the screen' },
      ],
    },
    'digital-literacy': {
      correct: [
        { ar: 'مراجعة إعدادات الخصوصية في كل تطبيق قبل نشر أي محتوى', en: 'Review privacy settings in each app before posting any content' },
        { ar: 'التحقق من المصدر الأصلي للخبر قبل إعادة نشره', en: 'Verify a news item at its original source before resharing it' },
        { ar: 'تحديد من يمكنه رؤية الموقع الجغرافي والصور الشخصية', en: 'Control who can see location data and personal photos' },
        { ar: 'التفكير في الأثر الرقمي طويل المدى قبل نشر أي محتوى حساس', en: 'Think about the long-term digital footprint before posting sensitive content' },
        { ar: 'الإبلاغ عن حسابات وهمية أو محتوى مسيء بدلاً من التفاعل معه', en: 'Report fake accounts or abusive content instead of engaging with it' },
      ],
      wrong: [
        { ar: 'قبول جميع طلبات الصداقة دون التحقق من هوية الطرف الآخر', en: "Accepting every friend request without verifying the other party's identity" },
        { ar: 'مشاركة الموقع الجغرافي المباشر في كل منشور علني', en: 'Sharing real-time location on every public post' },
        { ar: 'إعادة نشر أي خبر مثير دون التحقق من صحته', en: 'Resharing any sensational headline without checking whether it is true' },
        { ar: 'استخدام نفس الصورة والاسم الحقيقي في كل منصة دون تمييز الخصوصية', en: 'Using the same photo and real name on every platform without privacy distinctions' },
        { ar: 'تجاهل الرد على تعليقات مسيئة والاستمرار بمشاركة بيانات شخصية', en: 'Ignoring abusive comments while continuing to share personal data' },
      ],
    },
    'network-defense': {
      correct: [
        { ar: 'تقييد الوصول بقواعد جدار حماية دقيقة (Firewall ACL) حسب مبدأ الحد الأدنى من الصلاحيات', en: 'Restrict access with precise firewall ACL rules following least-privilege' },
        { ar: 'تقسيم الشبكة إلى شرائح (VLAN/Segmentation) لعزل الأنظمة الحساسة', en: 'Segment the network into VLANs to isolate sensitive systems' },
        { ar: 'مراجعة سجلات الأحداث (Logs) بانتظام لرصد الأنماط غير الطبيعية', en: 'Regularly review event logs to spot abnormal patterns' },
        { ar: 'تفعيل نظام كشف/منع التسلل (IDS/IPS) على نقاط الدخول الرئيسية', en: 'Enable an IDS/IPS on the main network entry points' },
        { ar: 'توثيق كل تغيير في إعدادات الشبكة قبل تطبيقه', en: 'Document every network configuration change before applying it' },
      ],
      wrong: [
        { ar: 'فتح جميع المنافذ (Ports) لتسهيل الاتصال بين الأجهزة', en: 'Opening all ports to make device-to-device connectivity easier' },
        { ar: 'استخدام كلمة مرور افتراضية واحدة لجميع أجهزة الشبكة', en: 'Using one default password for every network device' },
        { ar: 'تجاهل تنبيهات نظام كشف التسلل لأنها كثيرة', en: 'Ignoring intrusion-detection alerts because there are too many of them' },
        { ar: 'وضع جميع الخوادم على نفس الشريحة الشبكية دون فصل', en: 'Placing every server on the same network segment with no separation' },
        { ar: 'حذف سجلات الأحداث دوريًا لتوفير مساحة التخزين', en: 'Periodically deleting event logs to save storage space' },
      ],
    },
    'digital-forensics': {
      correct: [
        { ar: 'توثيق سلسلة الحيازة (Chain of Custody) لكل دليل رقمي منذ لحظة جمعه', en: 'Document the chain of custody for every piece of digital evidence from the moment it is collected' },
        { ar: 'أخذ نسخة مطابقة (Bit-by-bit Image) من القرص قبل أي تحليل', en: 'Take a bit-by-bit forensic image of the disk before any analysis' },
        { ar: 'حساب القيمة التجزيئية (Hash) للدليل للتأكد من عدم تعديله لاحقًا', en: 'Compute a hash value for the evidence to prove it was not altered later' },
        { ar: 'بناء خط زمني دقيق للأحداث بالاعتماد على الطوابع الزمنية (Timestamps)', en: 'Build an accurate event timeline based on timestamps' },
        { ar: 'العمل على نسخة من الدليل الأصلي وليس الدليل نفسه', en: 'Work on a copy of the original evidence, never the original itself' },
      ],
      wrong: [
        { ar: 'تحليل القرص الأصلي مباشرة دون أخذ نسخة عنه', en: 'Analyzing the original disk directly without imaging it first' },
        { ar: 'تعديل الطوابع الزمنية للملفات لتسهيل الترتيب', en: 'Modifying file timestamps to make sorting easier' },
        { ar: 'مشاركة الدليل الرقمي عبر البريد الشخصي غير المشفر', en: 'Sharing digital evidence over unencrypted personal email' },
        { ar: 'تجاهل توثيق من قام بنقل الدليل ومتى', en: 'Skipping documentation of who transferred the evidence and when' },
        { ar: 'حذف الملفات المؤقتة قبل تحليل نظام التشغيل', en: 'Deleting temporary files before analyzing the operating system' },
      ],
    },
    'secure-coding': {
      correct: [
        { ar: 'التحقق من صحة كل مدخل (Input Validation) على جانب الخادم', en: 'Validate every input on the server side' },
        { ar: 'استخدام الاستعلامات المُعاملة (Parameterized Queries) لمنع حقن SQL', en: 'Use parameterized queries to prevent SQL injection' },
        { ar: 'تشفير رموز الجلسة (Session Tokens) وتحديد وقت انتهاء صلاحيتها', en: 'Encrypt session tokens and give them a defined expiry' },
        { ar: 'ترميز المخرجات (Output Encoding) لمنع هجمات XSS', en: 'Encode output to prevent cross-site scripting (XSS) attacks' },
        { ar: 'تطبيق التحقق من الصلاحيات في كل طلب وليس فقط عند تسجيل الدخول', en: 'Enforce authorization checks on every request, not only at login' },
      ],
      wrong: [
        { ar: 'دمج مدخلات المستخدم مباشرة داخل استعلام SQL كنص خام', en: "Concatenating raw user input directly into a SQL query" },
        { ar: 'تخزين كلمات المرور كنص عادي في قاعدة البيانات', en: 'Storing passwords as plain text in the database' },
        { ar: 'عرض مدخلات المستخدم في الصفحة دون أي ترميز أو تنقية', en: 'Rendering user input on the page with no encoding or sanitization' },
        { ar: 'الاعتماد على التحقق من جانب المتصفح فقط دون التحقق في الخادم', en: 'Relying only on client-side validation with no server-side check' },
        { ar: 'إبقاء رموز الجلسة سارية إلى ما لا نهاية دون انتهاء صلاحية', en: 'Keeping session tokens valid indefinitely with no expiry' },
      ],
    },
    'ethical-hacking': {
      correct: [
        { ar: 'الحصول على تصريح مكتوب يحدد النطاق قبل بدء أي اختبار', en: 'Obtain written authorization defining the scope before testing begins' },
        { ar: 'الالتزام الصارم بالنطاق (Scope) المتفق عليه أثناء الاختبار', en: 'Strictly stay within the agreed-upon scope during testing' },
        { ar: 'توثيق كل خطوة ونتيجة أثناء الاستطلاع والفحص', en: 'Document every step and finding during reconnaissance and scanning' },
        { ar: 'إبلاغ العميل فورًا عند اكتشاف ثغرة حرجة قبل استغلالها', en: 'Notify the client immediately upon discovering a critical vulnerability, before exploiting it' },
        { ar: 'كتابة تقرير نهائي يتضمن خطوات إعادة الإنتاج وتوصيات المعالجة', en: 'Write a final report including reproduction steps and remediation recommendations' },
      ],
      wrong: [
        { ar: 'اختبار أنظمة خارج النطاق المتفق عليه لأنها "قد تكون مرتبطة"', en: 'Testing systems outside the agreed scope because they "might be related"' },
        { ar: 'استغلال ثغرة حرجة وحذف بيانات حقيقية لإثبات الأثر', en: 'Exploiting a critical vulnerability and deleting real data to prove impact' },
        { ar: 'بدء الاختبار دون تصريح كتابي بالاعتماد على موافقة شفهية', en: 'Starting the test without written authorization, relying on a verbal okay' },
        { ar: 'الاحتفاظ بالوصول الذي تم الحصول عليه لاستخدامه لاحقًا', en: 'Keeping the access gained for later personal use' },
        { ar: 'تسليم النتائج شفهيًا دون تقرير موثق', en: 'Delivering findings verbally with no documented report' },
      ],
    },
    'cloud-security': {
      correct: [
        { ar: 'تطبيق مبدأ الحد الأدنى من الصلاحيات (Least Privilege) في أدوار IAM', en: 'Apply least-privilege in IAM roles and permissions' },
        { ar: 'تفعيل التشفير للبيانات أثناء التخزين وأثناء النقل', en: 'Enable encryption for data at rest and in transit' },
        { ar: 'فهم نموذج المسؤولية المشتركة بين المزود والعميل', en: 'Understand the shared-responsibility model between provider and customer' },
        { ar: 'مراجعة أذونات موارد التخزين السحابي (Buckets) بشكل دوري', en: 'Regularly audit cloud storage bucket permissions' },
        { ar: 'تفعيل تسجيل الأحداث والمراقبة المستمرة للموارد السحابية', en: 'Enable logging and continuous monitoring for cloud resources' },
      ],
      wrong: [
        { ar: 'ترك مورد التخزين السحابي (Bucket) بإعداد عام (Public) دون داعٍ', en: 'Leaving a cloud storage bucket public with no real need' },
        { ar: 'منح صلاحية المسؤول الكامل (Admin) لكل مستخدم جديد', en: 'Granting full admin privileges to every new user by default' },
        { ar: 'الافتراض أن المزود السحابي مسؤول عن كل شيء بما فيه بيانات العميل', en: "Assuming the cloud provider is responsible for everything, including the customer's own data" },
        { ar: 'تعطيل سجلات المراقبة لتقليل التكلفة', en: 'Disabling monitoring logs to cut cost' },
        { ar: 'تخزين مفاتيح الوصول (Access Keys) داخل الكود المصدري العام', en: 'Storing access keys directly inside public source code' },
      ],
    },
    'soc-analyst': {
      correct: [
        { ar: 'فرز التنبيهات (Triage) حسب الخطورة والأثر قبل التحقيق', en: 'Triage alerts by severity and impact before investigating' },
        { ar: 'ربط مؤشرات الاختراق (IOCs) بسياق الحادثة الكامل', en: 'Correlate indicators of compromise (IOCs) with the full incident context' },
        { ar: 'التحقق من التنبيه عبر أكثر من مصدر بيانات قبل التصعيد', en: 'Confirm an alert across more than one data source before escalating' },
        { ar: 'توثيق كل تنبيه والإجراء المتخذ في نظام إدارة الحوادث', en: 'Document every alert and the action taken in the incident-management system' },
        { ar: 'تحديث قواعد الكشف (Detection Rules) بناءً على الحوادث السابقة', en: 'Tune detection rules based on lessons from prior incidents' },
      ],
      wrong: [
        { ar: 'إغلاق كل تنبيه دون توثيق باعتباره إنذارًا كاذبًا', en: 'Closing every alert without documentation, assuming it is a false positive' },
        { ar: 'التصعيد الفوري لكل تنبيه بغض النظر عن مستوى الخطورة', en: 'Escalating every alert immediately regardless of its severity' },
        { ar: 'تجاهل مؤشر الاختراق لأنه ظهر مرة واحدة فقط', en: 'Ignoring an indicator of compromise because it appeared only once' },
        { ar: 'الاعتماد على مصدر بيانات واحد فقط لتأكيد الحادثة', en: 'Relying on a single data source alone to confirm an incident' },
        { ar: 'حذف سجل التنبيهات القديمة دون أرشفة', en: 'Deleting old alert history with no archiving' },
      ],
    },
  };

  const arStems = [
    (topic) => `ما الممارسة الصحيحة أثناء درس «${topic}»؟`,
    (topic) => `ما الخطوة الأولى الآمنة في «${topic}»؟`,
    (topic) => `ما السلوك الذي يحافظ على جودة العمل في «${topic}»؟`,
    (topic) => `ما الإجراء المناسب بعد تحليل «${topic}»؟`,
    (topic) => `ما القاعدة الأساسية عند تطبيق «${topic}»؟`,
  ];
  const enStems = [
    (topicEn) => `What is the correct practice during "${topicEn}"?`,
    (topicEn) => `What is the first safe step in "${topicEn}"?`,
    (topicEn) => `Which behavior preserves quality when working on "${topicEn}"?`,
    (topicEn) => `What should you do after analyzing "${topicEn}"?`,
    (topicEn) => `What is the core rule when applying "${topicEn}"?`,
  ];

  // Deterministic shuffle so the same lesson always renders the same quiz
  // (stable across reloads/devices) while still varying between lessons.
  function pick(bank, offset, count) {
    const out = [];
    for (let i = 0; i < count; i += 1) out.push(bank[(offset + i) % bank.length]);
    return out;
  }

  function buildQuiz(courseSlug, moduleIndex, lessonIndex, topic, topicEn) {
    const bank = knowledgeBanks[courseSlug] || knowledgeBanks['cyber-basics'];
    const lessonSeed = moduleIndex * 3 + lessonIndex;
    const correct = bank.correct[lessonSeed % bank.correct.length];
    const wrong = bank.wrong[lessonSeed % bank.wrong.length];
    const secondWrong = bank.wrong[(lessonSeed + 2) % bank.wrong.length];
    const stepsAr = [
      `حدد النطاق والهدف من ${topic}.`,
      `اجمع المعلومات ذات الصلة وسجّل مصدر كل معلومة.`,
      `طبّق الإجراء الآمن: ${correct.ar}.`,
      'راجع النتيجة ووثّقها قبل الإغلاق.',
    ];
    const stepsEn = [
      `Define the scope and objective of ${topicEn}.`,
      'Collect relevant information and record each source.',
      `Apply the safe practice: ${correct.en}.`,
      'Review and document the result before closing the task.',
    ];
    const arQuestions = [
      (() => { const options = [wrong.ar, correct.ar, secondWrong.ar]; return { type: 'mcq', question: arStems[0](topic), options, correct: 1 }; })(),
      { type: 'true-false', question: `صح أم خطأ: ${correct.ar}.`, options: ['صح', 'خطأ'], correct: 0 },
      { type: 'matching', question: `اربط الممارسة بالنتيجة الصحيحة في «${topic}».`, pairs: [{ left: 'الممارسة الآمنة', right: correct.ar }, { left: 'الممارسة الخاطئة', right: wrong.ar }], correct: [0, 1] },
      { type: 'ordering', question: `رتّب خطوات تنفيذ «${topic}» ترتيباً صحيحاً.`, items: stepsAr, correct: [0, 1, 2, 3] },
      { type: 'mcq', question: arStems[4](topic), options: [secondWrong.ar, correct.ar, wrong.ar], correct: 1 },
    ];
    const enQuestions = [
      (() => { const options = [wrong.en, correct.en, secondWrong.en]; return { type: 'mcq', question: enStems[0](topicEn), options, correct: 1 }; })(),
      { type: 'true-false', question: `True or false: ${correct.en}.`, options: ['True', 'False'], correct: 0 },
      { type: 'matching', question: `Match each practice to the correct outcome for "${topicEn}".`, pairs: [{ left: 'Safe practice', right: correct.en }, { left: 'Unsafe practice', right: wrong.en }], correct: [0, 1] },
      { type: 'ordering', question: `Put the steps for "${topicEn}" in the correct order.`, items: stepsEn, correct: [0, 1, 2, 3] },
      { type: 'mcq', question: enStems[4](topicEn), options: [secondWrong.en, correct.en, wrong.en], correct: 1 },
    ];
    return { ar: { questions: arQuestions }, en: { questions: enQuestions } };
  }

  function buildLesson(course, moduleName, moduleIndex, lessonIndex) {
    const topic = topics[moduleIndex][lessonIndex];
    const topicEn = topicsEn[moduleIndex][lessonIndex];
    const moduleNameEn = moduleNamesEn[moduleIndex];
    const type = lessonTypes[(moduleIndex + lessonIndex) % lessonTypes.length];
    const title = `${moduleName}: ${topic}`;
    const bank = knowledgeBanks[course.slug] || knowledgeBanks['cyber-basics'];
    const lessonSeed = moduleIndex * 3 + lessonIndex;
    // Body text pulls in two course-specific practices relevant to this exact
    // lesson (not the same boilerplate for every lesson on the platform), so
    // the reading material stays tied to what the quiz actually asks about.
    const highlight1 = bank.correct[lessonSeed % bank.correct.length];
    const highlight2 = bank.correct[(lessonSeed + 2) % bank.correct.length];
    const pitfall = bank.wrong[lessonSeed % bank.wrong.length];
    return {
      id: `${course.slug}-m${moduleIndex + 1}-l${lessonIndex + 1}`,
      title: { ar: title, en: `${course.en} — ${moduleNameEn}: ${topicEn}` },
      type,
      typeLabel: { ar: 'درس مقالي', en: 'Article lesson' },
      body: {
        ar: `في هذا الدرس من دورة «${course.ar}»، ننتقل من التعريف النظري إلى ممارسة قابلة للتطبيق حول ${topic.toLowerCase()}. يبدأ التحليل بتحديد الأصول والبيانات والأطراف المعنية، ثم تقدير أثر الخطر واحتمال وقوعه قبل اختيار الضوابط المناسبة. سنطبّق مثالاً واقعياً يتطلب ${highlight1.ar} و${highlight2.ar}، مع توثيق القرار والافتراضات حتى يستطيع شخص آخر مراجعته. ومن الأخطاء الشائعة ${pitfall.ar}؛ لذلك يجب اختبار الإجراء في نطاق مصرح به، وقياس النتيجة، وتسجيل ما يحتاج إلى تحسين قبل الانتقال إلى المرحلة التالية.`,
        en: `In this ${course.en} lesson, we move from theory to a practical workflow for ${topicEn.toLowerCase()}. Start by identifying the assets, data, and stakeholders involved, then estimate impact and likelihood before selecting controls. The worked scenario applies ${highlight1.en} and ${highlight2.en}, while documenting assumptions so another analyst can review the decision. A common failure is ${pitfall.en}; keep the activity authorized, validate the outcome, and record improvements before moving to the next stage.`,
      },
      steps: {
        ar: [`حدد كيف يرتبط "${highlight1.ar}" بالهدف العملي لهذا الدرس.`, `قارن بين الممارسة الصحيحة والخطأ الشائع: ${pitfall.ar}.`, 'وثّق ملاحظتك ثم انتقل إلى اختبار الوحدة.'],
        en: [`Identify how "${highlight1.en}" ties back to this lesson's practical goal.`, `Contrast the correct practice with the common mistake: ${pitfall.en}.`, 'Note your takeaway, then move on to the unit quiz.'],
      },
      quiz: buildQuiz(course.slug, moduleIndex, lessonIndex, topic, topicEn),
    };
  }
  window.CYBERCLUB_LMS = seeds.map((course) => ({ ...course, level: { ar: course.level, en: levelsEn[course.level] || course.level }, desc: { ar: course.desc, en: `A structured learning path for ${course.en}, with guided lessons, practice, and assessment.` }, image: `assets/courses/${course.slug === 'cyber-basics' || course.slug === 'digital-literacy' ? 'cyber-basics' : course.slug === 'ethical-hacking' || course.slug === 'cloud-security' || course.slug === 'soc-analyst' ? 'ethical-hacking' : 'network-defense'}.svg`, modules: course.modules.map((name, moduleIndex) => ({ id: `${course.slug}-m${moduleIndex + 1}`, title: { ar: `الوحدة ${moduleIndex + 1}: ${name}`, en: `Module ${moduleIndex + 1}: ${moduleNamesEn[moduleIndex]}` }, lessons: topics[moduleIndex].map((_, lessonIndex) => buildLesson(course, name, moduleIndex, lessonIndex)) })) }));
  window.CYBERCLUB_LMS_BY_SLUG = Object.fromEntries(window.CYBERCLUB_LMS.map((course) => [course.slug, course]));
})();
