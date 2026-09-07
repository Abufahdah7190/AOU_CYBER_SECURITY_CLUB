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
  const moreMenu = document.getElementById('more-menu');
  const moreTrigger = document.getElementById('more-menu-trigger');
  const morePanel = document.getElementById('more-menu-panel');
  if (!nav) return;
  const setMenu = (open) => {
    body.classList.toggle('nav-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (open) nav.querySelector('.tab')?.focus();
  };
  const setMoreMenu = (open, { focus = false } = {}) => {
    if (!moreMenu || !moreTrigger || !morePanel) return;
    moreMenu.classList.toggle('is-open', open);
    moreTrigger.setAttribute('aria-expanded', String(open));
    morePanel.hidden = !open;
    if (open && focus) morePanel.querySelector('[role="menuitem"]')?.focus();
  };
  toggle?.addEventListener('click', () => {
    const willOpen = !body.classList.contains('nav-open');
    setMoreMenu(false);
    setMenu(willOpen);
  });
  moreTrigger?.addEventListener('click', () => {
    const willOpen = morePanel.hidden;
    setMenu(false);
    setMoreMenu(willOpen);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('.tab')) {
      setMenu(false);
      setMoreMenu(false);
    }
  });
  document.addEventListener('tabchange', (event) => {
    const activeTab = event.detail?.tab;
    nav.querySelectorAll('.tab').forEach((item) => {
      item.classList.toggle('active', item.dataset.tab === activeTab);
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (morePanel && !morePanel.hidden) {
        setMoreMenu(false);
        moreTrigger?.focus();
      }
      if (body.classList.contains('nav-open')) {
        setMenu(false);
        toggle?.focus();
      }
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (moreMenu && !morePanel?.hidden && !moreMenu.contains(event.target)) setMoreMenu(false);
    if (toggle && body.classList.contains('nav-open') && !nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
  morePanel?.addEventListener('keydown', (event) => {
    const items = [...morePanel.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    if (index < 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  });
})();
