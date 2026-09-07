# Learning foundation — Phase 0-A

This phase is additive only. The current website, APIs, progress calculation, and certificate flow remain unchanged until Phase 0-B is reviewed and implemented.

## Added storage

- `learning_foundation_courses`
- `learning_foundation_lessons`
- `learning_foundation_lesson_progress`
- `learning_foundation_quiz_attempts`
- `learning_foundation_import_runs`

The `learning_foundation_*` prefix is intentional: the project already has legacy tables named `lessons`, `lesson_progress`, and `quiz_attempts`, while the live site currently uses `student_course_progress`. Keeping this foundation separate prevents this preparatory phase from changing live behavior.

## Import source and result

Run `npm run seed:learning-foundation` from `server/` after migrations. The importer evaluates the existing `js/lms-data.js` catalog as data and stores it without changing the original source.

- 8 existing learning courses
- 72 existing bilingual lessons (8 courses × 3 modules × 3 lessons)
- 3 existing bilingual reverse-engineering challenge-board items
- 9 imported course records in total, including the challenge board

Article bodies, steps, quiz prompts/options, and the current static answer keys are stored in JSON during this storage-only phase. Correct answers remain **unexposed** because no new lesson API is enabled yet. Phase 0-B must move them to a private answer-key table before serving this content to a browser.

## Manual review

- The current catalog has only article lessons with associated quiz data. It contains no authored simulation, animated explanation, video, prerequisite, or scenario content to auto-migrate.
- Existing challenge items are imported as quiz-ready records, but their old static page stays untouched and continues as the live fallback.
- Phase 0-B must introduce server-side grading before any imported quiz content is sent to clients.
