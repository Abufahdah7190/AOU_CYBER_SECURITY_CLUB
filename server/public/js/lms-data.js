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

(() => {
const scenarios={"cyber-basics":[["تصنيف الأصول","Asset classification","يحتوي حاسوب النادي على سجل أعضاء ونسخة إعلان عامة. تسريب السجل يؤثر في السرية، وتعديل الإعلان يؤثر في السلامة، وتعطل التسجيل يؤثر في التوافر. قيّم الأثر من 1 إلى 5 والاحتمال من 1 إلى 5؛ خطر أثره 5 واحتماله 3 يحصل على 15. هذا ترتيب أولي وليس احتمالاً إحصائياً.","A club laptop holds a membership list and a public announcement. Disclosure affects confidentiality, unauthorized edits affect integrity, and registration downtime affects availability. Score impact and likelihood from 1 to 5; impact 5 and likelihood 3 give a prioritization score of 15, not a statistical probability.","أنشئ جدولاً بثلاثة أصول ومالك كل أصل وتصنيفه. اختر ضابطاً يقلل أعلى خطر وسجّل المخاطر المتبقية.","Build a three-asset register with owners and classifications. Select a control for the highest risk and document residual risk.","سجل الأعضاء: سري؛ الإعلان: عام؛ حساب الإدارة: وصول مقيد. النسخ الاحتياطي يحسن التوافر ولا يمنع التسريب.","Member list: confidential; announcement: public; administrator account: restricted. Backups improve availability but do not prevent disclosure."],["حماية الهوية","Protecting identity","إعادة استخدام كلمة المرور تجعل اختراق خدمة واحدة مدخلاً لخدمات أخرى. مدير كلمات المرور ينشئ أسراراً فريدة، والمصادقة متعددة العوامل تضيف حاجزاً ثانياً. خزّن رموز الاسترداد خارج الجهاز اليومي ولا تشارك رمز التحقق مع أي متصل.","Password reuse lets a breach in one service spread to others. A password manager generates unique secrets; MFA adds another barrier. Store recovery codes separately from your everyday device and never share a verification code with a caller.","على حساب تجريبي فعّل MFA، وسجّل خروجك، واختبر الدخول ثم استرداد الوصول دون تعطيل الحماية.","Enable MFA on a test account, sign out, test login, then test recovery without disabling protection.","لا ينجح الدخول بكلمة المرور وحدها، وتوجد طريقة استرداد مجرّبة. لا تضع أي كلمة مرور حقيقية في التقرير.","A password alone cannot complete login and a tested recovery method exists. Include no real password in the report."],["الاستجابة للتصيد","Phishing response","رسالة تزعم انتهاء حسابك وتربط إلى aou-login.example ليست دليلاً على ارتباطها بالجامعة. افحص اسم النطاق الفعلي عبر قناة مستقلة. HTTPS يشفر النقل ولا يثبت نزاهة الموقع. عند إدخال كلمة مرور في رابط مشبوه غيّرها عبر الموقع المعروف وألغ الجلسات وأبلغ المسؤول.","An expiry message linking to aou-login.example does not prove university ownership. Verify the actual domain through an independent channel. HTTPS protects transport, not the honesty of a site. If credentials were entered, change them on the known site, revoke sessions and report.","حلل رسالة تدريبية غير مرسلة: اكتب ثلاث علامات اشتباه وخطوات الاحتواء بالترتيب دون فتح الرابط.","Analyze an unsent mock message: record three indicators and ordered containment steps without visiting the link.","المخرج: نطاق مختلف، استعجال غير مبرر، طلب سر؛ ثم حفظ الرسالة والإبلاغ وحماية الحساب.","Output: unrelated domain, urgency and a secret request; preserve the message, report and secure the account."]],"digital-literacy":[["تقليل البيانات","Data minimization","نموذج حضور فعالية يحتاج الاسم والبريد الجامعي؛ رقم الهوية الوطنية والعنوان المنزلي لا يخدمان الغرض. تقليل البيانات يقلل أثر أي تسريب. وثّق الغرض والمالك ومدة الاحتفاظ، ثم اختبر حذف نسخة تدريبية.","An event attendance form needs a name and university email, not a national ID or home address. Minimization reduces breach impact. Document purpose, owner and retention period, then test deletion on sample data.","صمم نموذجاً من أربعة حقول كحد أقصى، وبرر كل حقل وضع خطة حذف بعد انتهاء الحاجة.","Design a form with at most four fields, justify each and specify deletion when no longer needed.","لا تجمع بيانات بلا غرض، ويستطيع المراجع تحديد وقت الحذف والمسؤول عنه.","Every field has a purpose and reviewers can identify the deletion time and owner."],["نسخ احتياطي قابل للاستعادة","Recoverable backups","نجاح نسخ ملف لا يعني إمكانية استعادته. احتفظ بنسخ منفصلة، إحداها غير متصلة أو غير قابلة للتعديل، واختبر الاستعادة. RPO يحدد مقدار البيانات المقبول فقدها، وRTO يحدد زمن العودة المقبول.","Copy success does not prove recoverability. Keep separate copies, including an offline or immutable copy, and restore a sample. RPO bounds acceptable data loss; RTO bounds acceptable recovery time.","أنشئ ملفاً تجريبياً ونسخة احتياطية، عدّل الأصل، ثم استعد النسخة إلى مجلد جديد وقارن المحتوى والزمن.","Create a test file and backup, modify the original, restore to a new folder and compare contents and elapsed time.","تعود النسخة السابقة دون الكتابة فوق الأصل، ويُسجّل زمن الاستعادة وتاريخ النسخة.","The earlier version is restored without overwriting the original; restoration time and backup timestamp are recorded."],["تقييم المصادر","Evaluating sources","لقطة شاشة مجهولة ليست مصدراً أصلياً. افصل الادعاء عن الدليل، وابحث عن المصدر الأول وتاريخ الحدث والسياق. لا ترسل مستندات النادي إلى أدوات عامة للتحقق من محتواها.","An anonymous screenshot is not a primary source. Separate claim from evidence and identify the original source, event date and context. Do not upload club documents to public tools to validate them.","اكتب بطاقة تقييم لادعاء تدريبي: المصدر، التاريخ، دليل مؤيد، تفسير بديل، درجة الثقة.","Write an evidence card for a mock claim: origin, date, supporting evidence, alternate explanation and confidence.","النتيجة قد تكون غير محسومة؛ لا تستبدل نقص الدليل بثقة زائفة.","An inconclusive result is acceptable; lack of evidence must not become false confidence."]],"network-defense":[["تقسيم الشبكة","Network segmentation","افصل شبكة الضيوف عن الإدارة وعن الخوادم. اسم VLAN وحده ليس ضابط وصول؛ يلزم توجيه مضبوط وقواعد بين الشبكات. اسمح للضيوف بالإنترنت وامنع الوصول إلى واجهة إدارة النادي.","Separate guests, administration and servers. A VLAN name alone is not access control; routing and inter-segment rules are necessary. Allow guest internet traffic and deny access to club administration.","ارسم ثلاث مناطق واكتب جدول المصدر والوجهة والمنفذ والإجراء لكل تدفق مطلوب.","Draw three zones and build a source, destination, port and action table for required flows.","ضيوف إلى الإدارة: منع؛ واجهة الويب إلى قاعدة البيانات: المنفذ المحدد فقط؛ بقية التدفقات: منع افتراضي.","Guest to admin: deny; web application to database: required port only; all other flows: default deny."],["قواعد الجدار الناري","Firewall rules","تُقيّم كثير من الجدران القواعد حسب أول تطابق. قاعدة سماح واسعة قبل قاعدة منع تجعل الأخيرة عديمة الأثر. قلل المصدر والوجهة والخدمة، وسجّل محاولات الرفض دون تسريب محتوى حساس.","Many firewalls use first-match evaluation. A broad allow rule placed before a deny rule can make the deny ineffective. Restrict source, destination and service; log denials without sensitive payloads.","راجع القواعد التدريبية: allow any any؛ deny guest admin؛ allow web db 5432. أعد ترتيبها واستبدل السماح العام.","Review mock rules: allow any any; deny guest admin; allow web db 5432. Reorder and replace the broad allow.","تسبق القواعد المحددة المنع الافتراضي وتُختبر حالة مسموحة وأخرى ممنوعة.","Specific rules precede default deny and both allowed and denied cases are tested."],["تحليل سجلات الشبكة","Network log analysis","السجل 10:00 guest→admin:443 deny ثم 10:01 guest→admin:22 deny يستحق التحقيق، لكنه لا يثبت اختراقاً. اربط المصدر بهوية الجهاز والوقت والمنطقة الزمنية، وابحث عن نجاح لاحق قبل التصعيد.","Logs showing 10:00 guest→admin:443 deny and 10:01 guest→admin:22 deny merit review but do not prove compromise. Correlate source, device identity, timestamp and timezone; look for subsequent success.","كوّن خطاً زمنياً من السجلين وأضف سجل نجاح افتراضياً. اكتب كيف يغيّر ذلك أولوية التنبيه.","Build a timeline from both events and add a hypothetical success. Explain how it changes alert priority.","يفصل التقرير المحاولات المرفوضة عن الوصول الناجح ويذكر الأدلة الناقصة.","The report distinguishes blocked attempts from successful access and identifies missing evidence."]],"digital-forensics":[["سلامة الدليل","Evidence integrity","احسب SHA-256 لنسخة دليل تدريبية قبل التحليل وبعده. تطابق البصمتين يدعم عدم تغير البايتات؛ لا يثبت أصالة المصدر أو اكتمال الجمع. احتفظ بالأصل للقراءة فقط وحلل نسخة عمل.","Hash a sample evidence copy with SHA-256 before and after analysis. Matching hashes support byte integrity, not authenticity or collection completeness. Preserve the original read-only and analyze a working copy.","استخدم Get-FileHash -Algorithm SHA256 على ملف تجريبي، انسخه، ثم قارن البصمتين بعد تعديل النسخة.","Use Get-FileHash -Algorithm SHA256 on a sample file, copy it, then compare hashes after editing the copy.","تتطابق النسخة قبل التعديل وتختلف بعده؛ يبقى الأصل دون تغيير.","The copy matches before modification and differs afterward; the original remains unchanged."],["سلسلة الحيازة","Chain of custody","يجب أن يعرف المراجع من جمع الدليل ومتى وبأي أداة ومن استلمه. سجل معرفاً فريداً والوقت والمنطقة الزمنية والبصمة وسبب كل نقل. لا تغيّر الدليل لتسهيل قراءته؛ احتفظ بتحويلات العرض كنسخ مشتقة.","Reviewers need collector identity, time, tool and transfers. Record a unique ID, timezone, hash and reason for each handoff. Never alter evidence for readability; retain display conversions as derived copies.","أنشئ سجل حيازة لدليل اصطناعي يمر بين جامع ومحلل ومراجع، مع ثلاثة أحداث تسليم.","Create a custody log for synthetic evidence passing through collector, analyst and reviewer with three handoffs.","كل انتقال يحدد المرسل والمستلم والوقت والغرض والبصمة.","Every transfer identifies sender, recipient, time, purpose and hash."],["بناء خط زمني","Timeline reconstruction","10:00+03:00 يساوي 07:00Z. جمع سجلات بمناطق زمنية مختلفة دون توحيدها يعكس ترتيب الأحداث. احتفظ بالوقت الأصلي والوقت الموحد ومصدر الساعة واحتمال انحرافها.","10:00+03:00 equals 07:00Z. Combining timezones without normalization can reverse event order. Preserve original and normalized timestamps, clock source and possible clock skew.","رتّب أحداث 10:00+03:00 و07:02Z و09:59+03:00. اكتب استنتاجاً وحدود الثقة فيه.","Order events at 10:00+03:00, 07:02Z and 09:59+03:00. State a conclusion and its confidence limits.","الترتيب UTC: 06:59 ثم 07:00 ثم 07:02؛ السببية تحتاج أدلة إضافية.","UTC order: 06:59, 07:00, 07:02; causation requires additional evidence."]],"secure-coding":[["التحقق من الملكية","Ownership authorization","تسجيل الدخول لا يمنح المستخدم حق قراءة كل سجل. في GET /profiles/:id يجب أن يقارن الخادم مالك السجل بالهوية المتحققة. لا تقبل userId من الطلب كدليل هوية. سياسات RLS طبقة إضافية وليست بديلاً للتحقق من JWT.","Login does not authorize every record. For GET /profiles/:id, the server must compare ownership with verified identity. A request userId is not proof of identity. RLS adds defense but does not replace JWT validation.","باستخدام مستخدمين تجريبيين A وB، اختبر قراءة A لسجله ثم لسجل B وطلباً دون جلسة.","With test users A and B, test A reading their record, B’s record and an unauthenticated request.","المتوقع: 200 للمالك، 403 أو404 لغير المالك، 401 دون مصادقة.","Expected: 200 for owner, 403 or 404 for non-owner, 401 without authentication."],["فصل البيانات عن الأوامر","Separating data from code","الاستعلام SELECT * FROM users WHERE id=$1 يفصل البيانات عن SQL عند تمرير المعامل منفصلاً. في الواجهة استخدم textContent لاسم المستخدم؛ innerHTML يحوّل النص إلى بنية قابلة للتنفيذ. التحقق من المدخلات لا يغني عن الترميز حسب السياق.","SELECT * FROM users WHERE id=$1 separates data from SQL when parameters are passed separately. Use textContent for user names; innerHTML interprets markup. Input validation does not replace context-aware encoding.","اعرض النص التدريبي <b>student</b> كنص حرفي، واكتب استعلاماً بمعامل منفصل ثم تحقق من عدم إنشاء عنصر b.","Display the test string <b>student</b> literally, write a parameterized query and verify no b element is created.","تظهر الأقواس حرفياً، وتبقى قيمة المعامل بيانات حتى لو تضمنت علامة اقتباس.","Angle brackets remain literal and a quote within the parameter remains data."],["اختبارات الجلسة","Session testing","الجلسة المنتهية يجب أن تفشل في الخادم حتى لو بقي زر ظاهرًا. مستمع تحديث الرمز لا ينبغي أن يعيد المستخدم إلى البداية أو يمحو نموذجاً غير محفوظ. لا تضع أسرار الخدمة في ملفات JavaScript العامة.","An expired session must fail server-side even if buttons remain visible. Token refresh should not reset navigation or unsaved forms. Never include service secrets in public JavaScript.","اختبر رمزاً مفقوداً ومنتهياً ومعدلاً، ثم بدّل اللغة أثناء تحرير اسم المستخدم.","Test missing, expired and modified tokens, then switch language while editing a user name.","الطلبات غير الصالحة مرفوضة؛ تبقى المدخلات والجلسة عند تبديل اللغة.","Invalid requests are rejected; language changes preserve inputs and session."]],"ethical-hacking":[["نطاق الاختبار","Rules of engagement","قبل أي اختبار حدد المالك والأهداف المسموحة والوقت وحدود الحمل والتقنيات الممنوعة ونقطة الإيقاف. التصريح على نطاق واحد لا يمتد لمزود خارجي أو حسابات مستخدمين حقيقية.","Before testing, define owner, allowed targets, time window, load limits, prohibited techniques and stop conditions. Permission for one scope does not extend to third-party providers or real user accounts.","اكتب تصريحاً تدريبياً لتطبيق محلي فقط، مع شرط توقف عند ارتفاع الأخطاء وخطة تواصل.","Draft training authorization for a local app only, with an error-rate stop condition and contact plan.","يمكن لمراجع آخر تحديد ما يجوز اختباره وما يستلزم تصريحاً جديداً.","A reviewer can distinguish authorized actions from those requiring new permission."],["إثبات محدود الأثر","Minimal-impact validation","نتيجة ماسح الثغرات فرضية وليست إثباتاً. أكد إعداداً غير آمن على نسخة تدريبية بأقل طلبات ممكنة. لا تستخرج بيانات إضافية لإثبات أثر سبق إثباته. احفظ الدليل مع إخفاء الأسرار.","Scanner output is a hypothesis, not proof. Confirm a configuration issue on a training copy with minimal requests. Do not extract additional data once impact is established. Preserve evidence with secrets redacted.","قيّم إعداد cookie دون HttpOnly في تطبيق مختبري، وحدد الأثر وشروط الاستغلال والإصلاح دون استخدام بيانات حقيقية.","Review a missing HttpOnly flag in a lab app; state impact, preconditions and remediation without real data.","التقرير يميز بين وجود الإعداد وبين إثبات هجوم ناجح.","The report distinguishes a missing control from a demonstrated successful attack."],["إعادة الاختبار","Retesting fixes","التقرير المفيد يشمل الأصل والخطوات والمتوقع والفعلي والأثر والدليل والإصلاح. بعد الإصلاح أعد نفس الحالة واختبر وظيفة مشروعة حتى لا يصبح المنع تعطلاً للخدمة.","A useful report includes asset, steps, expected and actual behavior, impact, evidence and remediation. After a fix, repeat the original case and a legitimate workflow to catch overblocking.","اكتب تقريراً لحالة وصول غير مصرح إلى سجل تدريبي ثم مصفوفة إعادة اختبار للمالك وغير المالك.","Write a report for unauthorized access to a sample record and a retest matrix for owner and non-owner.","يُمنع الوصول غير المصرح وتبقى الوظيفة المسموحة تعمل.","Unauthorized access is blocked while legitimate use still succeeds."]],"cloud-security":[["المسؤولية المشتركة","Shared responsibility","المزود يدير بعض الطبقات، والعميل يظل مسؤولاً عن الهوية والبيانات والإعدادات حسب الخدمة. في تطبيق مُدار لا تعني حماية مركز البيانات أن حاوية التخزين العامة آمنة.","Provider and customer responsibilities depend on service type. Customers remain responsible for identity, data and configuration. A secure data center does not make a public storage bucket safe.","ارسم جدولاً للهوية وتحديث المضيف والنسخ الاحتياطي وإعداد الشبكة، وحدد المالك في سيناريو خدمة مُدارة.","Assign identity, host patching, backups and network configuration ownership in a managed-service scenario.","كل ضابط له مسؤول واضح وطريقة تحقق؛ البنود المتغيرة موثقة كافتراضات.","Every control has an owner and verification method; service-dependent details are explicit assumptions."],["أقل صلاحية","Least privilege","هوية النشر لا تحتاج قراءة بيانات الطلاب. افصل أدوار النشر والتشغيل والإدارة وقيّد المورد والإجراء والمدة. لا تمنح صلاحيات إدارية عبر user_metadata القابل للتحرير.","A deployment identity does not need student data access. Separate deployment, runtime and administration; restrict resource, action and duration. Never derive administrator access from editable user_metadata.","صمم سياسة تدريبية تسمح بقراءة كائن واحد وتمنع الحذف، ثم اختبر ثلاث طلبات على محاكي محلي.","Design a sample policy allowing one object read but denying delete, then test three requests in a local simulator.","قراءة المورد المحدد تنجح؛ الحذف وقراءة مورد آخر يفشلان.","The intended read succeeds; deletion and another resource read fail."],["المراقبة والتعافي","Monitoring and recovery","احتفظ بسجلات تغيير السياسات في وجهة منفصلة وأبلغ عند فتح تخزين للعامة. خطة التعافي تحتاج نسخة قابلة للاستعادة وهوية طوارئ وضبطاً للوقت. أسرار الاستعادة يجب ألا تعتمد فقط على الخدمة المعطلة.","Keep policy-change logs separately and alert on public storage exposure. Recovery needs a restorable backup, emergency identity and time targets. Recovery secrets must not depend solely on the failed service.","نفذ تمريناً ورقياً لتعطل قاعدة بيانات: حدد أول خمس خطوات ومتى تعلن استعادة الخدمة.","Run a tabletop database outage exercise: record the first five actions and the criteria for declaring recovery.","تُختبر سلامة البيانات ووظيفة الدخول قبل الإعلان، ويُسجّل RTO الفعلي.","Data integrity and login are checked before declaring recovery; actual RTO is recorded."]],"soc-analyst":[["فرز التنبيهات","Alert triage","محاولات دخول فاشلة متكررة قد تأتي من جهاز خاطئ الإعداد أو هجوم. اربط عدد المحاولات والحساب والجهاز والنجاح اللاحق. أولوية التنبيه تتأثر بحساسية الأصل لا بالعدد وحده.","Repeated failed logins may indicate misconfiguration or attack. Correlate frequency, account, device and later success. Priority depends on asset sensitivity, not only event count.","حلل 12 فشلاً ثم نجاحاً لحساب إدارة، وقارنها باثني عشر فشلاً لحساب تجريبي دون نجاح.","Compare twelve failures followed by an admin success with twelve failures for a test account and no success.","ترتفع أولوية حالة الإدارة مع بقاء فرضية الخطأ البشري مفتوحة.","Admin activity receives higher priority while human error remains an alternative explanation."],["سياق المؤشرات","Indicator context","عنوان IP قد يكون مشتركاً أو يعاد تخصيصه. المؤشر يحتاج المصدر ووقت الرصد والثقة والسياق ومدة الصلاحية. الحظر دون تحقق قد يقطع خدمة سليمة؛ اربط مؤشراً واحداً بسلوك إضافي قبل القرار.","An IP can be shared or reassigned. Indicators need source, observation time, confidence, context and expiry. Blocking without validation may interrupt legitimate service; correlate additional behavior before deciding.","أنشئ بطاقة لمؤشر اصطناعي 192.0.2.10 مع مصدر افتراضي ووقت وانتهاء وثقة وقرار مراجعة.","Create a card for synthetic indicator 192.0.2.10 with mock source, timestamp, expiry, confidence and review decision.","يُستخدم العنوان للتوثيق فقط ولا يُفحص؛ القرار مرتبط بالسياق وقابل للمراجعة.","The documentation address is not scanned; the decision is contextual and reviewable."],["قياس جودة الكشف","Detection quality","من 20 تنبيهاً، 5 صحيحة و15 كاذبة؛ الدقة precision تساوي 25%. لا يمكن حساب recall دون معرفة الحوادث التي فاتت الأداة. تحسين القاعدة يحتاج مجموعة اختبار سليمة وأخرى خبيثة اصطناعية.","Of 20 alerts, 5 are true and 15 false: precision is 25%. Recall cannot be computed without missed incidents. Tune rules using benign and synthetic malicious test sets.","احسب الدقة ثم اقترح شرط سياق يقلل التنبيهات الكاذبة، واذكر كيف تختبر عدم فقد كشف مهم.","Compute precision, propose a context condition that reduces false positives and explain how to test for lost detection.","تُوثّق نتيجة الاختبار قبل وبعد التعديل ولا يُدّعى قياس recall من التنبيهات وحدها.","Record before-and-after results; do not claim recall from alert counts alone."]]};
const stages={ar:['تحليل الحالة','التطبيق العملي','التحقق والتقرير'],en:['Analyze the case','Perform the exercise','Verify and report']};
for(const course of window.CYBERCLUB_LMS){ course.modules.forEach((module,mi)=>{const s=scenarios[course.slug][mi];module.title={ar:s[0],en:s[1]};module.lessons.forEach((lesson,li)=>{lesson.title={ar:s[0]+' — '+stages.ar[li],en:s[1]+' — '+stages.en[li]};lesson.body={ar:s[2]+' '+lesson.body.ar,en:s[3]+' '+lesson.body.en};lesson.steps={ar:[s[4], 'استخدم بيانات اصطناعية فقط داخل بيئة محلية أو مصرح بها.', li===0?'حدد الافتراضات والأدلة الناقصة.':li===1?'سجل الخطوات والنتائج كما حدثت، بما في ذلك الفشل.':'قارن النتيجة بالمتوقع ودوّن حدود الاستنتاج.'],en:[s[5],'Use synthetic data only in a local or authorized environment.',li===0?'Identify assumptions and missing evidence.':li===1?'Record actions and actual outcomes, including failures.':'Compare actual and expected outcomes and document limitations.']};lesson.expected={ar:s[6],en:s[7]};lesson.diagram='/assets/courses/'+course.slug+'-flow.svg';});});}
})();
