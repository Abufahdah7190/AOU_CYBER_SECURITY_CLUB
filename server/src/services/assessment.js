'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../public/js/lms-data.js'), 'utf8'), context);
const courses = context.window.CYBERCLUB_LMS_BY_SLUG;
function evaluate(slug, index, answers) {
  const lessons = courses[slug]?.modules.flatMap(m => m.lessons);
  if (!lessons || !Number.isInteger(index) || index < 0 || index >= lessons.length) return null;
  const questions = lessons[index].quiz.en.questions;
  if (!Array.isArray(answers) || answers.length !== questions.length) return null;
  const correct = questions.filter((q,i) => JSON.stringify(q.correct) === JSON.stringify(answers[i])).length;
  return { passed: correct / questions.length >= 0.8, count: lessons.length };
}
module.exports = { evaluate, courses };
