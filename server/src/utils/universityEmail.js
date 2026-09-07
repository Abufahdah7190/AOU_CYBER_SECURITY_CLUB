const EMAIL_PATTERN = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/i;
const OFFICIAL_AOU_DOMAINS = new Set(['aou.edu.sa', 'aou.edu']);
const REJECTION_MESSAGE = 'الموقع متاح فقط لطلاب الجامعة العربية المفتوحة بالبريد الجامعي الرسمي';

/**
 * يقبل حصراً البريدين الجامعيين الرسميين للجامعة العربية المفتوحة.
 * يعيد null عندما يكون البريد صحيحاً، أو رسالة الرفض الموحدة في كل الحالات الأخرى.
 */
function validateUniversityEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const match = EMAIL_PATTERN.exec(normalized);
  if (!match || !OFFICIAL_AOU_DOMAINS.has(match[1])) {
    return REJECTION_MESSAGE;
  }
  return null;
}

module.exports = { validateUniversityEmail, REJECTION_MESSAGE };
