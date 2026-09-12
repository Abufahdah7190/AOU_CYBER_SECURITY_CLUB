'use strict';
(() => {
  const form = document.getElementById('club-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('form-status');
  const label = button.querySelector('span');
  const originalLabel = label.textContent;
  let pending = false;
  const show = (text, state) => { status.textContent = text; status.dataset.state = state; };
  const normalizePhone = value => value.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[\s().-]/g, '');
  form.addEventListener('input', event => event.target.setCustomValidity?.(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const data = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(data)) data[key] = data[key].trim();
    data.phone = normalizePhone(data.phone);
    let invalid = null;
    for (const [key,value] of Object.entries(data)) {
      const field = form.elements.namedItem(key);
      const min = key === 'message' || key === 'reason_to_join' ? 10 : key === 'name' || key === 'major' ? 2 : 1;
      const max = {name:120,email:254,phone:16,major:160,message:4000,reason_to_join:4000}[key];
      if (value.length > max) { field.setCustomValidity(`الحد الأقصى لهذا الحقل ${max} حرفًا.`); invalid ||= field; }
      if (value.length < min) { field.setCustomValidity(`يرجى كتابة ${min} أحرف على الأقل.`); invalid ||= field; }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { form.elements.email.setCustomValidity('اكتب بريدًا إلكترونيًا كاملًا، مثل name@example.com.'); invalid ||= form.elements.email; }
    if (!/^\+?[0-9]{8,15}$/.test(data.phone)) { form.elements.phone.setCustomValidity('اكتب رقم جوال صحيحًا من 8 إلى 15 رقمًا، ويمكن إضافة رمز الدولة.'); invalid ||= form.elements.phone; }
    if (invalid || !form.checkValidity()) { form.reportValidity(); return; }
    pending = true; button.disabled = true; form.setAttribute('aria-busy','true'); label.textContent = 'جارٍ الإرسال…'; show('يتم إرسال طلبك، لحظة من فضلك.', 'loading');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      if (typeof SUPABASE_URL !== 'string' || typeof SUPABASE_ANON_KEY !== 'string') throw new Error('config');
      const response = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${form.dataset.table}`, {method:'POST',headers:{apikey:SUPABASE_ANON_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(data),signal:controller.signal});
      if (!response.ok) throw new Error('send');
      form.reset();
      show(form.dataset.table === 'suggestions' ? 'وصلت رسالتك بنجاح. شكرًا لمشاركتك، ويسعدنا التواصل معك عبر بياناتك.' : 'وصل طلب انضمامك بنجاح. شكرًا لاهتمامك بالنادي، وسنتواصل معك عبر بياناتك.', 'success');
      status.focus();
    } catch (error) {
      show(error.name === 'AbortError' ? 'لم نتمكن من تأكيد وصول الطلب بسبب بطء الاتصال. احتفظنا بما كتبته؛ انتظر قليلًا قبل المحاولة مجددًا لتجنب التكرار.' : 'تعذر إرسال الطلب الآن. احتفظنا بما كتبته؛ تحقق من اتصالك وحاول مرة أخرى لاحقًا.', 'error');
      status.focus();
    } finally { clearTimeout(timeout); pending = false; button.disabled = false; form.removeAttribute('aria-busy'); label.textContent = originalLabel; }
  });
})();
