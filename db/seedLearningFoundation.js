'use strict';

/*
 * Phase 0-A import only. This script deliberately reads the current browser
 * catalog as data and stores it alongside the live system; it does not change
 * any API response, progress calculation, certificate, or frontend behavior.
 *
 * Run after migrations:
 *   npm run seed:learning-foundation
 */

require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pool } = require('./pool');

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const lmsDataPath = path.join(projectRoot, 'js', 'lms-data.js');
const sourceName = 'static-lms-data-v1';

function loadStaticCatalog() {
  const source = fs.readFileSync(lmsDataPath, 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: lmsDataPath, timeout: 3000 });
  if (!Array.isArray(context.window.CYBERCLUB_LMS)) {
    throw new Error('Static LMS catalog did not expose CYBERCLUB_LMS.');
  }
  return { source, courses: context.window.CYBERCLUB_LMS };
}

function bilingual(article, language) {
  return article && article[language] ? article[language] : '';
}

function mapQuestion(question, number) {
  const typeMap = {
    mcq: 'multiple_choice',
    ordering: 'ordering',
    matching: 'matching',
    'true-false': 'true_false',
  };
  return {
    id: `q${number + 1}`,
    type: typeMap[question.type] || question.type || 'multiple_choice',
    prompt: question.question,
    options: question.options || null,
    pairs: question.pairs || null,
    items: question.items || null,
    // Phase 0-A intentionally retains the static key in storage. Phase 0-B
    // moves it into a private answer-key table before any lesson API exposes
    // this content to a browser.
    correct_answer: question.correct,
  };
}

function lessonContent(lesson) {
  const makeLanguage = (language) => ({
    title: bilingual(lesson.title, language),
    body: bilingual(lesson.body, language),
    steps: Array.isArray(lesson.steps?.[language]) ? lesson.steps[language] : [],
    callouts: [],
    questions: (lesson.quiz?.[language]?.questions || []).map(mapQuestion),
    why_this_matters: '',
  });
  return {
    version: 1,
    source: 'static-lms-data',
    article: { body: { ar: bilingual(lesson.body, 'ar'), en: bilingual(lesson.body, 'en') }, callouts: [] },
    translations: { ar: makeLanguage('ar'), en: makeLanguage('en') },
  };
}

function staticChallenges() {
  return [
    {
      id: 'ctf-simple-encoding',
      ar: { title: 'تشفير بسيط', prompt: 'ما هو نص "HELLO" بعد تحويله إلى Base64؟' },
      en: { title: 'Simple Encoding', prompt: 'What is the text "HELLO" after converting it to Base64?' },
      answer: 'SEVMTE8=',
    },
    {
      id: 'ctf-reverse-engineering',
      ar: { title: 'هندسة عكسية', prompt: 'ما هو نص "dGVzdA==" بعد فك Base64؟' },
      en: { title: 'Reverse Engineering', prompt: 'What is the text "dGVzdA==" after decoding from Base64?' },
      answer: 'test',
    },
    {
      id: 'ctf-easy-puzzle',
      ar: { title: 'لغز سهل', prompt: 'ما هو مجموع 2 + 2؟' },
      en: { title: 'Easy Puzzle', prompt: 'What is 2 + 2?' },
      answer: '4',
    },
  ];
}

async function upsertCourse(client, course) {
  const { rows } = await client.query(
    `INSERT INTO learning_foundation_courses (slug, title_ar, title_en, metadata)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (slug) DO UPDATE SET
       title_ar = EXCLUDED.title_ar,
       title_en = EXCLUDED.title_en,
       metadata = EXCLUDED.metadata,
       updated_at = now()
     RETURNING id`,
    [
      course.slug,
      course.ar,
      course.en,
      JSON.stringify({ level: course.level, description: course.desc, image: course.image }),
    ]
  );
  return rows[0].id;
}

async function upsertLesson(client, lesson, courseId, module, moduleOrder, lessonOrder) {
  await client.query(
    `INSERT INTO learning_foundation_lessons
       (external_id, course_id, module_key, module_order, lesson_order, lesson_type, icon, content)
     VALUES ($1, $2, $3, $4, $5, $6::learning_foundation_lesson_type, $7, $8::jsonb)
     ON CONFLICT (external_id) DO UPDATE SET
       course_id = EXCLUDED.course_id,
       module_key = EXCLUDED.module_key,
       module_order = EXCLUDED.module_order,
       lesson_order = EXCLUDED.lesson_order,
       lesson_type = EXCLUDED.lesson_type,
       icon = EXCLUDED.icon,
       content = EXCLUDED.content,
       updated_at = now()`,
    [lesson.id, courseId, module.id, moduleOrder, lessonOrder, lesson.type || 'article', lesson.type || 'article', JSON.stringify(lessonContent(lesson))]
  );
}

async function seed() {
  const { source, courses } = loadStaticCatalog();
  const fingerprint = crypto.createHash('sha256').update(source).digest('hex');
  const challenges = staticChallenges();
  const client = await pool.connect();
  let lessonCount = 0;
  try {
    await client.query('BEGIN');
    for (const course of courses) {
      const courseId = await upsertCourse(client, course);
      for (const [moduleIndex, module] of course.modules.entries()) {
        for (const [lessonIndex, lesson] of module.lessons.entries()) {
          await upsertLesson(client, lesson, courseId, module, moduleIndex, lessonIndex);
          lessonCount += 1;
        }
      }
    }

    const challengeCourseId = await upsertCourse(client, {
      slug: 'reverse-engineering-challenge-board',
      ar: 'لوحة تحديات الهندسة العكسية',
      en: 'Reverse Engineering Challenge Board',
      level: { ar: 'تحديات تدريبية', en: 'Practice challenges' },
      desc: { ar: 'المحتوى الثابت الحالي للتحديات.', en: 'Current static challenge content.' },
      image: null,
    });
    for (const [index, challenge] of challenges.entries()) {
      const content = {
        version: 1,
        source: 'dynamic-i18n-challenges',
        translations: {
          ar: { title: challenge.ar.title, questions: [{ id: 'q1', type: 'spot_mistake', prompt: challenge.ar.prompt, options: null, correct_answer: challenge.answer }], why_this_matters: '' },
          en: { title: challenge.en.title, questions: [{ id: 'q1', type: 'spot_mistake', prompt: challenge.en.prompt, options: null, correct_answer: challenge.answer }], why_this_matters: '' },
        },
      };
      await client.query(
        `INSERT INTO learning_foundation_lessons
           (external_id, course_id, module_key, module_order, lesson_order, lesson_type, icon, content)
         VALUES ($1, $2, 'challenge-board', 0, $3, 'quiz', 'challenge', $4::jsonb)
         ON CONFLICT (external_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
        [challenge.id, challengeCourseId, index, JSON.stringify(content)]
      );
    }

    await client.query(
      `INSERT INTO learning_foundation_import_runs
         (source_name, source_fingerprint, imported_courses, imported_lessons, imported_challenges)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source_name) DO UPDATE SET
         source_fingerprint = EXCLUDED.source_fingerprint,
         imported_at = now(),
         imported_courses = EXCLUDED.imported_courses,
         imported_lessons = EXCLUDED.imported_lessons,
         imported_challenges = EXCLUDED.imported_challenges`,
      [sourceName, fingerprint, courses.length + 1, lessonCount, challenges.length]
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ importedCourses: courses.length + 1, importedLessons: lessonCount, importedChallenges: challenges.length }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Learning foundation import failed:', error.message);
  process.exit(1);
});
