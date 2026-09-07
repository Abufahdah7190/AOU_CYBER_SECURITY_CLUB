# إعداد Render وتشخيص مشكلة MIME للأصول

المشروع الحالي عبارة عن واجهة HTML/CSS/JavaScript تخدمها خدمة Node/Express، مع API للتسجيل والتعلم والتقدم والشهادات. الخيار الموصى به هو نشر المستودع كـ **Web Service** واحدة؛ لأن الخادم يخدم صفحات HTML والأصول الثابتة وواجهات API من نفس النطاق.

## إعداد Web Service الموصى به

استخدم الإعدادات التالية:

| الإعداد | القيمة |
|---|---|
| Root Directory | اتركه فارغاً، أي جذر المستودع |
| Build Command | `npm install --prefix server --no-audit --no-fund` |
| Start Command | `node server/src/server.js` |
| Health Check Path | `/api/health` |
| NODE_ENV | `production` |

يمكن استخدام ملف `render.yaml` المرفق لإنشاء الخدمة بهذه القيم. يجب إضافة متغيرات `DATABASE_URL` و`JWT_ACCESS_SECRET` و`JWT_REFRESH_SECRET` و`FRONTEND_URL` من لوحة Render، وعدم وضع قيمها السرية داخل المستودع.

## سبب خطأ `MIME type text/html`

يحدث الخطأ عندما يطلب المتصفح `/css/style.css` أو `/js/course.js` ثم تعيد قاعدة Rewrite صفحة `/index.html`. بعد الإصلاح الحالي، تُخدم الأصول قبل أي fallback، وتعيد الأصول المفقودة `404` صريحاً بدلاً من صفحة HTML؛ لذلك لن يظهر CSS أو JavaScript كـ Plain Text بسبب إعادة التوجيه.

إذا كانت هناك **Static Site منفصلة** بدلاً من Web Service، فلا تستخدم Rewrite عاماً من `/*` إلى `/index.html`. يجب استثناء المسارات التالية من الـ rewrite:

```text
/css/*
/js/*
/assets/*
/locales/*
```

وعندها يكون Rewrite التنقل الخاص بالدروس فقط:

```text
/learn/*  ->  /course.html
```

بعد النشر، تحقق من نوع المحتوى في المتصفح أو عبر أدوات الشبكة، ثم اختبر:

```text
GET /api/health       -> application/json
GET /css/style.css    -> text/css
GET /js/course.js     -> JavaScript
GET /locales/ar.json  -> application/json
GET /learn/cyber-basics -> text/html
GET /missing.css      -> 404 وليس index.html
```
