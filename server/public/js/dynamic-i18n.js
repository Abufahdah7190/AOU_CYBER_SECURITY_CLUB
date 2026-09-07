/**
 * dynamic-i18n.js — translations for content that script.js builds at
 * runtime (quiz questions, simulator scenarios, games, challenges, etc.).
 * This is separate from /locales/*.json because it also holds structured
 * data (arrays of options, HTML snippets) rather than plain strings.
 *
 * Usage: D('some.key')  -> string in the current language
 *        D.lang         -> 'ar' | 'en'
 */
(function () {
  const DATA = {
    ar: {
      link: {
        enterUrlFirst: 'الرجاء إدخال رابط أولاً',
        warnIp: 'الرابط يحتوي على عنوان IP بدلاً من اسم نطاق',
        warnWord: (word) => `الرابط يحتوي على كلمة مشبوهة: ${word}`,
        warnSubdomains: 'الرابط يحتوي على عدد كبير من المجالات الفرعية',
        warnLong: 'الرابط طويل جدًا',
        warnHomograph: 'الرابط قد يحتوي على أحرف مشابهة (Homograph Attack)',
        warnTld: 'الرابط يحتوي على نهاية نطاق غير شائعة',
        safe: 'يبدو الرابط آمنًا (هذا مجرد فحص أولي)',
        warningsTitle: 'تحذيرات:',
        malformed: 'تعذّر تحليل هذا الرابط - تأكد من كتابته بشكل صحيح',
        riskLevelLabel: 'مستوى الخطورة:',
        riskLevels: { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' },
        noFindingsSafe: 'لم يتم رصد أي مؤشرات خطر واضحة (هذا فحص أولي وليس ضمانًا كاملاً)',
        verdictLabel: 'الحكم:',
        safetyPercent: 'نسبة الأمان المُقدّرة:',
        verdicts: { safe: 'آمن', suspicious: 'مشبوه', unsafe: 'غير آمن' },
        findings: {
          noScheme: 'الرابط بدون بروتوكول محدد؛ تم افتراض http:// تلقائيًا للتحليل',
          insecureHttp: 'الرابط يستخدم HTTP غير المشفّر بدلاً من HTTPS',
          ipHost: 'الرابط يستخدم عنوان IP مباشرة بدلاً من اسم نطاق - إشارة خطر قوية',
          punycode: 'اسم النطاق مُشفّر بصيغة Punycode (xn--)، وقد يُستخدم لتقليد نطاق حقيقي بأحرف متشابهة',
          atTrick: 'الرابط يحتوي على "@" بطريقة قد تُخفي الوجهة الحقيقية خلف نص يبدو كنطاق موثوق',
          manySubdomains: 'عدد كبير وغير معتاد من النطاقات الفرعية',
          shortener: 'هذا رابط مُختصر؛ لا يمكن معرفة الوجهة الحقيقية دون فتحه',
          typosquat: (brand) => `اسم النطاق قريب جدًا من "${brand}" المعروف - قد تكون محاولة انتحال (Typosquatting)`,
          brandImpersonation: (brand) => `الرابط يحتوي على اسم "${brand}" لكنه ليس نطاق "${brand}" الرسمي - نمط شائع في روابط التصيّد`,
          fakeSubdomainChain: (brand) => `الرابط يحتوي على نطاق "${brand}" الحقيقي كجزء من نطاق أطول وغير مرتبط - حيلة تصيّد شائعة جدًا`,
          openRedirect: 'الرابط يحتوي على معامل قد يُعيد توجيهك لموقع آخر مختلف تمامًا',
          directDownload: (ext) => `الرابط يشير مباشرة لتحميل ملف قابل للتنفيذ (.${ext})`,
          suspiciousTld: 'امتداد النطاق (TLD) من الامتدادات المستخدمة كثيرًا في التصيّد والبريد المزعج',
          manyHyphens: 'اسم النطاق يحتوي على عدد كبير من الشرطات، وهو أسلوب شائع في الروابط المزيفة',
          suspiciousKeyword: (words) => `الرابط يحتوي على كلمات مرتبطة بعادةً بالتصيّد: ${words}`,
          unusualPort: (port) => `الرابط يستخدم منفذ شبكة غير معتاد (${port})`,
          veryLong: 'الرابط طويل جدًا بشكل غير معتاد',
        },
      },
      file: {
        selectFirst: 'الرجاء اختيار ملف أولاً',
        riskExecutable: 'نوع الملف قابل للتنفيذ - قد يكون خطيرًا',
        riskTooBig: 'الملف كبير جدًا',
        safe: 'يبدو الملف آمنًا (هذا مجرد فحص أولي)',
        warningsTitle: 'تحذيرات:',
        riskLevelLabel: 'مستوى الخطورة:',
        riskLevels: { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' },
        detectedType: 'النوع الفعلي المكتشف:',
        unknownType: 'غير معروف',
        entropyLabel: 'الإنتروبيا (عشوائية المحتوى):',
        verdictLabel: 'الحكم:',
        safetyPercent: 'نسبة الأمان المُقدّرة:',
        verdicts: { safe: 'آمن', suspicious: 'مشبوه', unsafe: 'غير آمن' },
        findings: {
          signatureMismatch: (fmt) => `محتوى الملف الفعلي (${fmt}) لا يطابق امتداده المعلن - قد يكون الامتداد مزيّفًا لإخفاء ملف تنفيذي`,
          doubleExtension: (ext) => `الملف يستخدم امتدادًا مزدوجًا (${ext}) - أسلوب شائع لتمويه الملفات التنفيذية كملفات مستندات`,
          executableExt: (ext) => `امتداد الملف (.${ext}) قابل للتنفيذ ويمكن أن يشغّل برمجية على جهازك`,
          macroOffice: (ext) => `هذا مستند أوفيس يدعم وحدات الماكرو (.${ext})، وهي طريقة شائعة لتوزيع البرمجيات الخبيثة`,
          archiveExt: 'هذا ملف أرشيف مضغوط؛ تأكد من مصدره قبل فك الضغط عنه وفتح محتوياته',
          tooLarge: 'حجم الملف كبير جدًا (أكبر من 25 ميجابايت)',
          highEntropy: (val) => `محتوى الملف عشوائي بشكل كبير (إنتروبيا ${val}/8) - قد يكون مضغوطًا أو مشفّرًا لإخفاء محتواه الحقيقي`,
        },
      },
      pw: {
        needLength: 'يجب أن تكون كلمة المرور على الأقل 8 أحرف',
        useLower: 'استخدم أحرف صغيرة',
        useUpper: 'استخدم أحرف كبيرة',
        useDigits: 'استخدم أرقام',
        useSymbols: 'استخدم رموز',
        labels: ['ضعيف', 'متوسط', 'جيد', 'قوي', 'قوي جدًا'],
        excellent: 'كلمة مرور ممتازة!',
        tips: [
          'لا تستخدم كلمات المرور نفسها لأكثر من حساب',
          'استخدم مدير كلمات المرور لحفظ كلماتك',
          'فعّل المصادقة الثنائية (2FA) في الحسابات المهمة',
          'لا تشارك كلمات المرور مع أي شخص',
          'تجنّب استخدام معلومات شخصية في كلمات المرور',
        ],
        show: 'إظهار',
        hide: 'إخفاء',
        copied: 'تم النسخ',
        phraseWords: ['سيبر', 'أمن', 'رقمي', 'حماية', 'شبكة', 'برمجية', 'تشفير', 'هجوم', 'الوصول', 'أجهزة', 'البيانات', 'العالم'],

        warnCommon: 'هذه من أكثر كلمات المرور شيوعًا في العالم — يمكن تخمينها فورًا.',
        warnRepeated: 'تحتوي على تكرار لنفس الحرف عدة مرات متتالية (مثل aaa)، وهذا يسهّل تخمينها.',
        warnSequential: 'تحتوي على تسلسل بسيط للأحرف أو الأرقام (مثل abc أو 123)، وهذا نمط متوقع.',
        warnKeyboard: 'تحتوي على نمط متتابع على لوحة المفاتيح (مثل qwerty)، وهذا من أول الأنماط التي تجربها أدوات الاختراق.',
        warnOnlyDigits: 'تتكوّن من أرقام فقط، وهذا يقلّل مساحة الاحتمالات بشكل كبير.',
        warnTooShort: 'كلمة المرور قصيرة جدًا (أقل من 8 أحرف).',
        warnContainsWord: (word) => `تحتوي على كلمة شائعة يسهل تخمينها: "${word}"`,

        checks: {
          length12: 'الطول 12 حرفًا على الأقل',
          upperLower: 'مزيج من أحرف كبيرة وصغيرة',
          digits: 'تحتوي على أرقام',
          symbols: 'تحتوي على رموز خاصة',
          notCommon: 'ليست من كلمات المرور الشائعة',
          noRepeats: 'بدون تكرار أو تسلسل واضح',
        },

        scenarioLabels: {
          online: 'محاولة أونلاين (مع تحديد المحاولات) — 10 تخمينات/ثانية',
          offlineSlow: 'اختراق أوفلاين بتشفير بطيء (bcrypt) — 10 آلاف تخمين/ثانية',
          offlineFast: 'اختراق أوفلاين بمعالج رسومي (GPU) — 10 مليار تخمين/ثانية',
          cluster: 'مجموعة معالجات ضخمة (Cluster) — 1 تريليون تخمين/ثانية',
        },

        time: {
          instant: 'فوري تقريبًا',
          seconds: (n) => `${n} ثانية`,
          minutes: (n) => `${n} دقيقة`,
          hours: (n) => `${n} ساعة`,
          days: (n) => `${n} يوم`,
          years: (n) => `${n} سنة`,
          centuries: 'قرون طويلة',
        },
      },
      games: {
        ghostScore: (score) => `النتيجة: ${score}`,
        ghostCaught: 'اصطدت!',
        ghostMissed: 'فاتك! حاول مرة أخرى.',
        bowCenter: 'أصبت المركز!',
        bowClose: 'قريب جدًا!',
        bowRetry: 'حاول مرة أخرى!',
        linkScore: (score) => `النقاط: ${score}`,
        packetScore: (score) => `النتيجة: ${score}`,
        packetBlocked: 'تم صد الحزمة الخبيثة بنجاح.',
        packetLeaked: 'تسرّبت حزمة خبيثة! أعيد ضبط النتيجة.',
        packetBlockedSafe: 'صددت حزمة آمنة بالخطأ! أعيد ضبط النتيجة.',
        whackScore: (score) => `النتيجة: ${score}`,
        whackHit: 'ضربة موفقة!',
        whackWrongClick: 'هذا ملف آمن! أعيد ضبط النتيجة.',
        correct: 'صحيح!',
        wrongTryAgain: 'خطأ، حاول مرة أخرى!',
        linkTasks: [
          {
            task: 'ابحث عن رابط تسجيل الدخول الحقيقي لـ Google',
            real: 'https://accounts.google.com/login',
            fake: ['https://accounts.googIe.com/login', 'https://google.secure-login.com', 'https://login-google.tk'],
          },
          {
            task: 'ابحث عن الرابط الحقيقي لـ GitHub',
            real: 'https://github.com/login',
            fake: ['https://githab.com/login', 'https://github.login.net', 'https://secure-github.net'],
          },
          {
            task: 'ابحث عن الرابط الحقيقي لـ PayPal',
            real: 'https://www.paypal.com/signin',
            fake: ['https://www.paypaI.com/signin', 'https://paypal.secure-login.com', 'https://paypal-login.org'],
          },
        ],
        defenseScenarios: [
          {
            text: 'اكتشاف ثغرة في خادم البريد.',
            best: 'patch',
            feedback: {
              patch: 'صحيح! التحديث العاجل يغلق الثغرة قبل أن يستغلها أحد.',
              isolate: 'عزل الخدمة يوقف الضرر مؤقتًا، لكن الثغرة تبقى قائمة حتى يتم تحديثها.',
              monitor: 'المراقبة مفيدة لكنها لا تغلق الثغرة نفسها؛ التحديث العاجل أهم هنا.',
              backup: 'النسخ الاحتياطي لا يعالج ثغرة أمنية نشطة.',
            },
          },
          {
            text: 'برنامج فدية (Ransomware) يقوم بتشفير الملفات على أحد الخوادم الآن!',
            best: 'isolate',
            feedback: {
              patch: 'التحديث مهم لاحقًا، لكن أول خطوة يجب أن تكون إيقاف الانتشار.',
              isolate: 'صحيح! عزل الخادم فورًا يمنع الفدية الخبيثة من الانتشار لبقية الشبكة.',
              monitor: 'خطأ! المراقبة وحدها لا توقف هجومًا نشطًا يعمل الآن على تشفير ملفاتك.',
              backup: 'النسخ الاحتياطية مهمة للتعافي لاحقًا، لكنها لا توقف الهجوم النشط الآن.',
            },
          },
          {
            text: 'رصدت محاولات تسجيل دخول غير معتادة من عدة دول خلال دقائق.',
            best: 'monitor',
            feedback: {
              patch: 'لا توجد ثغرة محددة بعد لتحديثها؛ تحتاج أولاً لفهم ما يحدث.',
              isolate: 'عزل الخدمة الآن قد يكون مبكرًا قبل التأكد من حجم التهديد.',
              monitor: 'صحيح! المراقبة المعمّقة تساعدك على فهم النمط قبل اتخاذ قرار حاسم.',
              backup: 'النسخ الاحتياطي غير مرتبط بهذا الموقف مباشرة.',
            },
          },
          {
            text: 'تلف قاعدة بيانات مهمة بعد فشل تحديث غير مخطط له.',
            best: 'backup',
            feedback: {
              patch: 'خطأ! التحديث هو سبب المشكلة أصلًا؛ لا تكرره الآن.',
              isolate: 'العزل لا يستعيد البيانات التالفة.',
              monitor: 'المراقبة لا تحل مشكلة تلف البيانات القائمة.',
              backup: 'صحيح! استعادة نسخة احتياطية سليمة هي الحل الأسرع لاستعادة الخدمة.',
            },
          },
          {
            text: 'تم نشر ثغرة يوم-صفر (Zero-Day) جديدة تؤثر على خادم الويب الخاص بكم.',
            best: 'patch',
            feedback: {
              patch: 'صحيح! تطبيق التحديث الأمني فور توفره يغلق الثغرة قبل استغلالها.',
              isolate: 'قد يكون إجراءً مؤقتًا مقبولًا، لكن التحديث هو الحل الجذري.',
              monitor: 'المراقبة مهمة، لكنها لا تمنع استغلال ثغرة يوم-صفر معروفة.',
              backup: 'النسخ الاحتياطي لا يمنع استغلال ثغرة أمنية نشطة.',
            },
          },
          {
            text: 'تأكدت الإدارة من انتشار برمجية خبيثة عبر عدة أجهزة على الشبكة الداخلية.',
            best: 'isolate',
            feedback: {
              patch: 'التحديث مفيد لاحقًا لسد الثغرة المستغلة، لكن أولوية الآن إيقاف الانتشار.',
              isolate: 'صحيح! عزل الأجهزة المصابة فورًا يمنع البرمجية الخبيثة من الوصول لبقية الشبكة.',
              monitor: 'خطأ! المراقبة فقط تسمح للبرمجية بالاستمرار في الانتشار أثناء المراقبة.',
              backup: 'النسخ الاحتياطي مهم للتعافي، لكنه لا يوقف الانتشار النشط الآن.',
            },
          },
        ],
      },
      quiz: {
        questionOf: (n, total) => `السؤال ${n} من ${total}`,
        letters: ['أ', 'ب', 'ج', 'د'],
        questions: [
          {
            category: 'الأمان العام',
            question: 'ما هي أفضل طريقة لحماية حسابك من الاختراق؟',
            options: [
              { text: 'استخدام كلمة مرور سهلة', correct: false },
              { text: 'استخدام المصادقة الثنائية وكلمة مرور قوية', correct: true },
              { text: 'كتابة كلمة المرور على ورقة ملاحظات', correct: false },
              { text: 'مشاركة كلمة المرور مع الأصدقاء', correct: false },
            ],
          },
          {
            category: 'الهجمات',
            question: 'ما هو هجوم التصيد (Phishing)؟',
            options: [
              { text: 'هجوم يهدف لتدمير جهازك', correct: false },
              { text: 'هجوم يهدف لسرقة معلوماتك عن طريق خداعك', correct: true },
              { text: 'هجوم يهدف لإيقاف خدمة', correct: false },
              { text: 'هجوم يهدف لتغيير مظهر الموقع', correct: false },
            ],
          },
          {
            category: 'كلمات المرور',
            question: 'ما طول كلمة المرور الموصى به؟',
            options: [
              { text: '4 أحرف', correct: false },
              { text: '8 أحرف', correct: false },
              { text: '12 حرفًا أو أكثر', correct: true },
              { text: 'حرف واحد فقط', correct: false },
            ],
          },
        ],
      },
      simulator: {
        situation: 'الموقف',
        underConstruction: 'هذا الموقف قيد الإنشاء!',
        scenarios: {
          phishing: {
            title: 'هجوم التصيد الاحتيالي',
            situationLabel: 'الموقف:',
            situationText: 'تلقيت بريدًا يبدو أنه من بنكك يطلب منك النقر على رابط لتحديث معلومات حسابك!',
            promptLabel: 'ما الذي تفعله؟',
            choices: [
              { text: 'لا تنقر على الرابط وتتحقق من عنوان المرسل', alert: 'صحيح! لا تنقر على روابط غير معروفة! تحقق دائماً من عنوان البريد والمرسل!' },
              { text: 'تنقر على الرابط وتدخل معلوماتك', alert: 'خطأ! هذا ما يريده المهاجم!' },
              { text: 'تجاهل البريد وتبحث عن المزيد من المعلومات', alert: 'على الأرجح أنت بحاجة للإبلاغ عن هذا البريد للبنك!' },
            ],
          },
          bruteforce: {
            title: 'هجوم القوة الغاشمة',
            situationLabel: 'الموقف:',
            situationText: 'لاحظت محاولات تسجيل دخول كثيرة فاشلة على حسابك من مجهول!',
            promptLabel: 'ما الذي تفعله؟',
            choices: [
              { text: 'فعّل المصادقة الثنائية فورًا', alert: 'صحيح! المصادقة الثنائية توفر حماية إضافية كبيرة!' },
              { text: 'جعل كلمة المرور أسهل للتذكّر', alert: 'خطأ! هذا سيجعل الأمر أسهل للمهاجم!' },
              { text: 'تغيّر كلمة المرور', alert: 'هذا جيد، لكن الأفضل تفعيل 2FA!' },
            ],
          },
          social: {
            title: 'الهندسة الاجتماعية',
            situationLabel: 'الموقف:',
            situationText: 'اتصل بك شخص يدّعي أنه من الدعم الفني لشركتك، ويطلب منك كلمة المرور "للتحقق من حسابك بسرعة" لأن هناك مشكلة عاجلة!',
            promptLabel: 'ما الذي تفعله؟',
            choices: [
              { text: 'تعطيه كلمة المرور فورًا لحل المشكلة بسرعة', alert: 'خطأ! لا يوجد دعم فني شرعي يطلب كلمة مرورك مطلقًا! هذا أسلوب هندسة اجتماعية كلاسيكي.' },
              { text: 'ترفض بأدب، وتتصل بقسم الدعم الفني عبر رقم رسمي معروف للتحقق', alert: 'صحيح! لا تشارك بيانات حساسة أبدًا عبر مكالمة غير موثّقة، وتحقق دائمًا عبر قناة رسمية معروفة.' },
              { text: 'تسأله عن اسمه فقط وتعطيه كلمة المرور', alert: 'خطأ! معرفة الاسم لا يثبت الهوية؛ المهاجمون يستخدمون أسماء وهمية ومقنعة بسهولة.' },
            ],
          },
          ddos: {
            title: 'هجوم حجب الخدمة (DDoS)',
            situationLabel: 'الموقف:',
            situationText: 'موقع ناديكم الإلكتروني أصبح بطيئًا جدًا فجأة، ولاحظتم كمية هائلة من الطلبات تصل من آلاف العناوين المختلفة في نفس الوقت!',
            promptLabel: 'ما هو أفضل إجراء أولي؟',
            choices: [
              { text: 'تفعيل خدمة حماية من DDoS (مثل جدار حماية تطبيقات الويب أو CDN) وتصفية الطلبات المشبوهة', alert: 'صحيح! خدمات الحماية المتخصصة (WAF/CDN) تستطيع امتصاص وتصفية حركة المرور الضارة قبل وصولها للخادم.' },
              { text: 'إيقاف الخادم تمامًا حتى تنتهي المشكلة من تلقاء نفسها', alert: 'هذا يوقف الخدمة عن الجميع، بما فيهم المستخدمين الشرعيين — ليس الحل الأمثل رغم أنه قد يكون إجراء طارئ مؤقت.' },
              { text: 'تجاهل الأمر لأنه على الأغلب سيزول لوحده', alert: 'خطأ! تجاهل هجوم DDoS النشط قد يُسقط الخدمة بالكامل ويعرّض البنية التحتية لمخاطر أكبر.' },
            ],
          },
          malware: {
            title: 'انتشار البرمجيات الخبيثة',
            situationLabel: 'الموقف:',
            situationText: 'لاحظت أن جهاز أحد الأعضاء أصبح بطيئًا جدًا بعد تحميل ملف من رابط مجهول، والآن أجهزة أخرى على نفس الشبكة بدأت تُظهر سلوكًا غريبًا أيضًا!',
            promptLabel: 'ما الذي تفعله؟',
            choices: [
              { text: 'تعزل الجهاز المصاب عن الشبكة فورًا، ثم تفحصه ببرنامج مكافحة فيروسات محدّث', alert: 'صحيح! العزل الفوري يمنع انتشار البرمجية الخبيثة لبقية الأجهزة، والفحص يساعد على تحديد وإزالة التهديد.' },
              { text: 'تعيد تشغيل الجهاز فقط وتكمل العمل عليه بشكل طبيعي', alert: 'خطأ! إعادة التشغيل وحدها لا تزيل البرمجية الخبيثة عادةً وقد تسمح لها بالاستمرار في الانتشار.' },
              { text: 'تحذف الملف المشبوه فقط وتترك الجهاز متصلاً بالشبكة', alert: 'خطوة جيدة جزئيًا، لكن البرمجية قد تكون ثبّتت نفسها بالفعل في أماكن أخرى؛ الفحص الكامل والعزل المؤقت أكثر أمانًا.' },
            ],
          },
        },
      },
      cybermap: {
        pause: 'إيقاف مؤقت',
        resume: 'استمرار',
      },
      challenges: {
        check: 'تحقق',
        solutionPlaceholder: 'أدخل الحل هنا...',
        correct: 'صحيح! أحسنت!',
        wrong: 'خطأ! حاول مرة أخرى.',
        items: [
          { title: 'تشفير بسيط', description: 'ما هو نص "HELLO" بعد تحويله إلى Base64؟', flag: 'SEVMTE8=' },
          { title: 'هندسة عكسية', description: 'ما هو نص "dGVzdA==" بعد فك Base64؟', flag: 'test' },
          { title: 'لغز سهل', description: 'ما هو مجموع 2 + 2؟', flag: '4' },
        ],
      },
    },
    en: {
      link: {
        enterUrlFirst: 'Please enter a link first',
        warnIp: 'The link contains an IP address instead of a domain',
        warnWord: (word) => `The link contains a suspicious word: ${word}`,
        warnSubdomains: 'The link contains an unusually large number of subdomains',
        warnLong: 'The link is too long',
        warnHomograph: 'The link may contain look-alike characters (homograph attack)',
        warnTld: 'The link has an unusual domain ending',
        safe: 'The link looks safe (this is only a preliminary check)',
        warningsTitle: 'Warnings:',
        malformed: 'Could not parse this link - please check that it is written correctly',
        riskLevelLabel: 'Risk level:',
        riskLevels: { low: 'Low', medium: 'Medium', high: 'High' },
        noFindingsSafe: 'No clear risk indicators detected (this is a preliminary check, not a full guarantee)',
        verdictLabel: 'Verdict:',
        safetyPercent: 'Estimated safety score:',
        verdicts: { safe: 'Safe', suspicious: 'Suspicious', unsafe: 'Not Safe' },
        findings: {
          noScheme: 'The link has no explicit protocol; http:// was assumed automatically for analysis',
          insecureHttp: 'The link uses unencrypted HTTP instead of HTTPS',
          ipHost: 'The link uses a raw IP address instead of a domain name - a strong warning sign',
          punycode: 'The domain name is Punycode-encoded (xn--), which can be used to imitate a real domain with look-alike characters',
          atTrick: 'The link contains an "@" in a way that may hide the real destination behind text that looks like a trusted domain',
          manySubdomains: 'An unusually large number of subdomains',
          shortener: 'This is a shortened link; the real destination cannot be known without opening it',
          typosquat: (brand) => `The domain name is very close to the well-known "${brand}" - this may be a typosquatting attempt`,
          brandImpersonation: (brand) => `The link contains the name "${brand}" but is not ${brand}'s official domain - a common phishing pattern`,
          fakeSubdomainChain: (brand) => `The link contains the real "${brand}" domain as part of a longer, unrelated domain - a very common phishing trick`,
          openRedirect: 'The link contains a parameter that could redirect you to a completely different site',
          directDownload: (ext) => `The link points directly to downloading an executable file (.${ext})`,
          suspiciousTld: 'The domain ending (TLD) is one that is heavily used in phishing and spam',
          manyHyphens: 'The domain name contains an unusually large number of hyphens, a common trick in fake links',
          suspiciousKeyword: (words) => `The link contains words commonly associated with phishing: ${words}`,
          unusualPort: (port) => `The link uses an unusual network port (${port})`,
          veryLong: 'The link is unusually long',
        },
      },
      file: {
        selectFirst: 'Please choose a file first',
        riskExecutable: 'This file type is executable - it may be dangerous',
        riskTooBig: 'The file is too large',
        safe: 'The file looks safe (this is only a preliminary check)',
        warningsTitle: 'Warnings:',
        riskLevelLabel: 'Risk level:',
        riskLevels: { low: 'Low', medium: 'Medium', high: 'High' },
        detectedType: 'Actual detected type:',
        unknownType: 'Unknown',
        entropyLabel: 'Entropy (content randomness):',
        verdictLabel: 'Verdict:',
        safetyPercent: 'Estimated safety score:',
        verdicts: { safe: 'Safe', suspicious: 'Suspicious', unsafe: 'Not Safe' },
        findings: {
          signatureMismatch: (fmt) => `The file's actual content (${fmt}) does not match its stated extension - the extension may be faked to disguise an executable`,
          doubleExtension: (ext) => `The file uses a double extension (${ext}) - a common trick to disguise executables as document files`,
          executableExt: (ext) => `The file extension (.${ext}) is executable and could run software on your device`,
          macroOffice: (ext) => `This is a macro-enabled Office document (.${ext}), a common way malware is distributed`,
          archiveExt: 'This is a compressed archive; make sure you trust the source before extracting and opening its contents',
          tooLarge: 'The file is very large (over 25 MB)',
          highEntropy: (val) => `The file's content is highly random (entropy ${val}/8) - it may be compressed or encrypted to hide its real content`,
        },
      },
      pw: {
        needLength: 'Your password should be at least 8 characters',
        useLower: 'Use lowercase letters',
        useUpper: 'Use uppercase letters',
        useDigits: 'Use numbers',
        useSymbols: 'Use symbols',
        labels: ['Weak', 'Fair', 'Good', 'Strong', 'Very strong'],
        excellent: 'Excellent password!',
        tips: [
          "Don't reuse the same password across accounts",
          'Use a password manager to store your passwords',
          'Enable two-factor authentication (2FA) on important accounts',
          "Don't share your passwords with anyone",
          'Avoid using personal information in your passwords',
        ],
        show: 'Show',
        hide: 'Hide',
        copied: 'Copied',
        phraseWords: ['cyber', 'secure', 'shield', 'network', 'encrypt', 'firewall', 'breach', 'access', 'device', 'guard', 'vector', 'signal'],

        warnCommon: 'This is one of the most common passwords in the world — it can be guessed instantly.',
        warnRepeated: 'Contains the same character repeated several times in a row (like aaa), which makes it much easier to guess.',
        warnSequential: 'Contains a simple sequence of letters or numbers (like abc or 123), which is a predictable pattern.',
        warnKeyboard: 'Contains a keyboard-adjacent pattern (like qwerty) — one of the first patterns cracking tools try.',
        warnOnlyDigits: 'Made up of digits only, which drastically shrinks the space of possibilities.',
        warnTooShort: 'The password is too short (fewer than 8 characters).',
        warnContainsWord: (word) => `Contains an easily-guessable common word: "${word}"`,

        checks: {
          length12: 'At least 12 characters long',
          upperLower: 'A mix of uppercase and lowercase letters',
          digits: 'Contains numbers',
          symbols: 'Contains special symbols',
          notCommon: 'Not one of the common passwords',
          noRepeats: 'No obvious repetition or sequences',
        },

        scenarioLabels: {
          online: 'Online attempt (rate-limited) — 10 guesses/sec',
          offlineSlow: 'Offline crack, slow hash (bcrypt) — 10 thousand guesses/sec',
          offlineFast: 'Offline crack, GPU cluster — 10 billion guesses/sec',
          cluster: 'Massive compute cluster — 1 trillion guesses/sec',
        },

        time: {
          instant: 'Nearly instant',
          seconds: (n) => `${n} seconds`,
          minutes: (n) => `${n} minutes`,
          hours: (n) => `${n} hours`,
          days: (n) => `${n} days`,
          years: (n) => `${n} years`,
          centuries: 'Many centuries',
        },
      },
      games: {
        ghostScore: (score) => `Score: ${score}`,
        ghostCaught: 'Caught it!',
        ghostMissed: 'Missed! Try again.',
        bowCenter: 'Bullseye!',
        bowClose: 'So close!',
        bowRetry: 'Try again!',
        linkScore: (score) => `Score: ${score}`,
        packetScore: (score) => `Score: ${score}`,
        packetBlocked: 'Malicious packet blocked successfully.',
        packetLeaked: 'A malicious packet got through! Score reset.',
        packetBlockedSafe: 'You blocked a safe packet by mistake! Score reset.',
        whackScore: (score) => `Score: ${score}`,
        whackHit: 'Nice hit!',
        whackWrongClick: 'That was a safe file! Score reset.',
        correct: 'Correct!',
        wrongTryAgain: 'Wrong, try again!',
        linkTasks: [
          {
            task: 'Find the real Google login link',
            real: 'https://accounts.google.com/login',
            fake: ['https://accounts.googIe.com/login', 'https://google.secure-login.com', 'https://login-google.tk'],
          },
          {
            task: 'Find the real GitHub link',
            real: 'https://github.com/login',
            fake: ['https://githab.com/login', 'https://github.login.net', 'https://secure-github.net'],
          },
          {
            task: 'Find the real PayPal link',
            real: 'https://www.paypal.com/signin',
            fake: ['https://www.paypaI.com/signin', 'https://paypal.secure-login.com', 'https://paypal-login.org'],
          },
        ],
        defenseScenarios: [
          {
            text: 'A vulnerability was discovered in the mail server.',
            best: 'patch',
            feedback: {
              patch: 'Correct! An urgent patch closes the vulnerability before anyone can exploit it.',
              isolate: 'Isolating stops damage temporarily, but the vulnerability remains until patched.',
              monitor: 'Monitoring helps, but it does not close the vulnerability itself — patching is the priority here.',
              backup: "A backup does not address an active security vulnerability.",
            },
          },
          {
            text: 'Ransomware is actively encrypting files on one of your servers right now!',
            best: 'isolate',
            feedback: {
              patch: 'Patching matters later, but the first step must be stopping the spread.',
              isolate: 'Correct! Isolating the server immediately stops the ransomware from spreading to the rest of the network.',
              monitor: 'Wrong! Monitoring alone does not stop an active attack that is encrypting your files right now.',
              backup: 'Backups matter for recovery later, but they do not stop the active attack now.',
            },
          },
          {
            text: 'You detect unusual login attempts from several countries within minutes.',
            best: 'monitor',
            feedback: {
              patch: 'There is no specific vulnerability identified yet to patch; you need to understand what is happening first.',
              isolate: 'Isolating the service now may be premature before confirming the scale of the threat.',
              monitor: 'Correct! Deep monitoring helps you understand the pattern before taking a drastic action.',
              backup: 'A backup is not directly related to this situation.',
            },
          },
          {
            text: 'An important database became corrupted after a failed, unplanned update.',
            best: 'backup',
            feedback: {
              patch: 'Wrong! The update is what caused the problem in the first place; do not repeat it now.',
              isolate: 'Isolating does not restore corrupted data.',
              monitor: 'Monitoring does not fix the existing data corruption.',
              backup: 'Correct! Restoring a healthy backup is the fastest way to bring the service back.',
            },
          },
          {
            text: 'A new zero-day exploit affecting your web server was just published.',
            best: 'patch',
            feedback: {
              patch: 'Correct! Applying the security patch as soon as it is available closes the hole before it gets exploited.',
              isolate: 'This can be an acceptable temporary measure, but patching is the real fix.',
              monitor: 'Monitoring matters, but it does not prevent exploitation of a known zero-day.',
              backup: 'A backup does not prevent exploitation of an active vulnerability.',
            },
          },
          {
            text: 'IT confirms malware has spread across several devices on the internal network.',
            best: 'isolate',
            feedback: {
              patch: 'Patching helps close the exploited hole later, but the priority right now is stopping the spread.',
              isolate: 'Correct! Immediately isolating the infected devices stops the malware from reaching the rest of the network.',
              monitor: 'Wrong! Just monitoring lets the malware keep spreading while you watch.',
              backup: 'Backups matter for recovery, but they do not stop the active spread right now.',
            },
          },
        ],
      },
      quiz: {
        questionOf: (n, total) => `Question ${n} of ${total}`,
        letters: ['A', 'B', 'C', 'D'],
        questions: [
          {
            category: 'General Security',
            question: 'What is the best way to protect your account from being hacked?',
            options: [
              { text: 'Use an easy password', correct: false },
              { text: 'Use two-factor authentication and a strong password', correct: true },
              { text: 'Write the password on a sticky note', correct: false },
              { text: 'Share the password with friends', correct: false },
            ],
          },
          {
            category: 'Attacks',
            question: 'What is a phishing attack?',
            options: [
              { text: 'An attack that aims to destroy your device', correct: false },
              { text: 'An attack that aims to steal your information by deceiving you', correct: true },
              { text: 'An attack that aims to take down a service', correct: false },
              { text: "An attack that aims to change a website's appearance", correct: false },
            ],
          },
          {
            category: 'Passwords',
            question: 'What is the recommended password length?',
            options: [
              { text: '4 characters', correct: false },
              { text: '8 characters', correct: false },
              { text: '12 characters or more', correct: true },
              { text: 'Just one character', correct: false },
            ],
          },
        ],
      },
      simulator: {
        situation: 'Situation',
        underConstruction: 'This scenario is under construction!',
        scenarios: {
          phishing: {
            title: 'Phishing Attack',
            situationLabel: 'Situation:',
            situationText: 'You received an email that looks like it is from your bank, asking you to click a link to update your account information!',
            promptLabel: 'What do you do?',
            choices: [
              { text: "Don't click the link and verify the sender's address", alert: "Correct! Don't click unknown links! Always verify the email address and sender!" },
              { text: 'Click the link and enter your information', alert: "Wrong! That's exactly what the attacker wants!" },
              { text: 'Ignore the email and look for more information', alert: 'You probably need to report this email to your bank!' },
            ],
          },
          bruteforce: {
            title: 'Brute Force Attack',
            situationLabel: 'Situation:',
            situationText: 'You notice many failed login attempts on your account from an unknown source!',
            promptLabel: 'What do you do?',
            choices: [
              { text: 'Enable two-factor authentication immediately', alert: 'Correct! Two-factor authentication adds a major extra layer of protection!' },
              { text: 'Make your password easier to remember', alert: "Wrong! That will make it easier for the attacker!" },
              { text: 'Change your password', alert: 'Good, but enabling 2FA is even better!' },
            ],
          },
          social: {
            title: 'Social Engineering',
            situationLabel: 'Situation:',
            situationText: 'Someone calls claiming to be IT support for your organization, asking for your password "to quickly verify your account" because of an urgent issue!',
            promptLabel: 'What do you do?',
            choices: [
              { text: 'Give them the password right away to resolve it quickly', alert: 'Wrong! No legitimate IT support will ever ask for your password. This is a classic social engineering tactic.' },
              { text: 'Politely refuse and call IT support back using a known official number to verify', alert: 'Correct! Never share sensitive credentials over an unverified call — always confirm through a known official channel.' },
              { text: 'Just ask for their name, then give them the password', alert: 'Wrong! Knowing a name proves nothing; attackers easily use fake, convincing names.' },
            ],
          },
          ddos: {
            title: 'Denial of Service Attack (DDoS)',
            situationLabel: 'Situation:',
            situationText: "Your club's website suddenly becomes very slow, and you notice a massive number of requests arriving from thousands of different addresses at once!",
            promptLabel: 'What is the best first action?',
            choices: [
              { text: 'Enable DDoS protection (such as a web application firewall or CDN) and filter suspicious traffic', alert: 'Correct! Specialized protection services (WAF/CDN) can absorb and filter malicious traffic before it reaches the server.' },
              { text: 'Shut the server down completely until the problem goes away on its own', alert: 'This takes the service down for everyone, including legitimate users — not ideal, though it may work as a temporary emergency measure.' },
              { text: "Ignore it, since it will probably resolve itself", alert: 'Wrong! Ignoring an active DDoS attack can bring the service down entirely and put the infrastructure at greater risk.' },
            ],
          },
          malware: {
            title: 'Malware Spread',
            situationLabel: 'Situation:',
            situationText: "You notice a member's device became very slow after downloading a file from an unknown link, and now other devices on the same network are starting to act strangely too!",
            promptLabel: 'What do you do?',
            choices: [
              { text: 'Immediately isolate the infected device from the network, then scan it with updated antivirus software', alert: 'Correct! Immediate isolation prevents the malware from spreading to other devices, and scanning helps identify and remove the threat.' },
              { text: 'Just restart the device and keep using it normally', alert: 'Wrong! A restart alone usually does not remove malware and may let it keep spreading.' },
              { text: 'Just delete the suspicious file but leave the device connected to the network', alert: 'A partially good step, but the malware may have already installed itself elsewhere; a full scan plus temporary isolation is safer.' },
            ],
          },
        },
      },
      cybermap: {
        pause: 'Pause',
        resume: 'Resume',
      },
      challenges: {
        check: 'Check',
        solutionPlaceholder: 'Enter your solution here...',
        correct: 'Correct! Well done!',
        wrong: 'Wrong! Try again.',
        items: [
          { title: 'Simple Encoding', description: 'What is the text "HELLO" after converting it to Base64?', flag: 'SEVMTE8=' },
          { title: 'Reverse Engineering', description: 'What is the text "dGVzdA==" after decoding from Base64?', flag: 'test' },
          { title: 'Easy Puzzle', description: 'What is 2 + 2?', flag: '4' },
        ],
      },
    },
  };

  function getLang() {
    return (window.i18n && window.i18n.lang) || 'ar';
  }

  function D(path) {
    const parts = path.split('.');
    let node = DATA[getLang()];
    for (const p of parts) {
      if (node == null) return undefined;
      node = node[p];
    }
    return node;
  }

  Object.defineProperty(D, 'lang', { get: getLang });

  window.D = D;
})();
