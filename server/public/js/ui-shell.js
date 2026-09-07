(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finishBoot = () => {
    body.classList.remove('booting');
    body.classList.add('boot-complete');
  };
  window.setTimeout(finishBoot, reduceMotion ? 0 : 620);

  const toggle = document.getElementById('mobile-nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;
  const setMenu = (open) => {
    body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) nav.querySelector('.tab')?.focus();
  };
  toggle.addEventListener('click', () => setMenu(!body.classList.contains('nav-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('.tab')) setMenu(false);
  });
  document.addEventListener('tabchange', (event) => {
    const activeTab = event.detail?.tab;
    nav.querySelectorAll('.tab').forEach((item) => {
      item.classList.toggle('active', item.dataset.tab === activeTab);
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && body.classList.contains('nav-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
})();
