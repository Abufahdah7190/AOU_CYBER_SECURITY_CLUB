# مذكرة تنفيذ — نادي الأمن السيبراني

## الإصلاح العاجل لمسارات الأصول

تم تحويل مراجع CSS وJavaScript والصور في صفحات HTML إلى مسارات جذرية مثل `/css/style.css` و`/js/course.js` و`/assets/...` حتى تعمل الصفحات عند فتحها من `/learn/:courseId` أو من أي مسار آخر. كما تم تعديل `server/src/app.js` بحيث تُخدم الأصول قبل fallback الخاص بالصفحات، ويُعاد `404` للأصل المفقود بدلاً من إعادة صفحة `index.html`. هذا يمنع خطأ المتصفح `MIME type text/html`.

تمت إضافة `render.yaml` وتحديث `RENDER-SETUP.md`. الإعداد الموصى به هو Web Service واحدة بخدمة Node/Express، مع `npm install --prefix server --no-audit --no-fund` للبناء و`node server/src/server.js` للتشغيل. إذا بقيت الواجهة Static Site منفصلة، يجب استثناء `/css/*` و`/js/*` و`/assets/*` و`/locales/*` من أي rewrite عام إلى `index.html`.

## نظام التعلم واللغات

يحتوي `js/lms-data.js` على محتوى عربي وإنجليزي لكل دورة ووحدة ودرس، وتم توسيع نص الدرس إلى شرح تطبيقي يتضمن تحديد النطاق والأصول والمخاطر والضوابط والتوثيق والأخطاء الشائعة. يقوم `js/course.js` بتبديل اللغة وتغيير اتجاه الصفحة وحفظ اللغة في `localStorage`.

تم توسيع كل اختبار إلى خمسة أسئلة تشمل اختياراً من متعدد، وصحاً أو خطأ، وربطاً، وترتيب خطوات، ثم سؤال اختيار من متعدد إضافياً. يدعم `course.js` عرض الأنواع الأربعة وتصحيحها وحساب درجة الاجتياز بنسبة 80%.

## التقدم والشهادات

الـ API الحالي في `server/src/routes/learning.routes.js` يحفظ تقدم الطالب في `student_course_progress` مع النسبة والدرس الأخير ودرجات الاختبارات ووقت آخر وصول، ويصدر الشهادة عند إكمال الدورة بنسبة 100%. تتضمن الشهادة لغة عربية أو إنجليزية، وثيماً أبيض أو أسود ممثلاً داخلياً بالقيمتين `light` و`dark`، ورمز تحقق فريداً وQR Code يقود إلى صفحة التحقق.

تم إصلاح `server/src/services/certificate.service.js` ليستطيع قراءة شعار النادي من تخطيطي Render، وإضافة استيراد `fs` المطلوب لتضمين الشعار في SVG. تُحفظ الشهادة في قاعدة البيانات، وتظهر عبر `/api/learning/certificates/:certificateCode/image`، ويمكن التحقق منها عبر `/api/learning/verify/:certificateCode`.

## التشغيل

```bash
cd server
npm install
npm run migrate
npm start
```

يجب ضبط `DATABASE_URL` و`JWT_ACCESS_SECRET` و`JWT_REFRESH_SECRET` و`FRONTEND_URL` في بيئة التشغيل. بعد النشر، تحقق من `GET /api/health` ثم من أن `/css/style.css` يعيد `text/css` وأن الأصل المفقود يعيد `404` وليس `index.html`.

## فحوصات منفذة

تم تنفيذ فحص syntax لملفات JavaScript الرئيسية، واختبار مولد الدروس الذي تحقق من وجود ثماني دورات، ونسختي اللغة، والأنواع الأربعة للأسئلة. كما تم تشغيل الخادم محلياً والتحقق من صفحات `/learn/cyber-basics` و`/student/profile` ومسارات CSS وJavaScript وJSON.
