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
  // Keep visual enhancement work event-driven: one observer and a rAF-scrolled
  // class, never a continuous animation loop. Content is readable before reveal.
  const installVisualEnhancements = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      let scheduled = false;
      const syncHeader = () => {
        topbar.classList.toggle('is-condensed', window.scrollY > 20);
        scheduled = false;
      };
      window.addEventListener('scroll', () => {
        if (!scheduled) {
          scheduled = true;
          window.requestAnimationFrame(syncHeader);
        }
      }, { passive: true });
      syncHeader();
    }
    if (reduce || !('IntersectionObserver' in window)) return;
    const revealTargets = document.querySelectorAll(
      '.panel:not(#tab-auth), .secure-hero, .home-mission > .card, .about-card, .provider-course-group, .certificates-card, .student-overview, .profile-layout > .card, .dashboard-certificates'
    );
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -20px' });
    revealTargets.forEach((element, index) => {
      element.classList.add('reveal-on-scroll');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 45}ms`);
      observer.observe(element);
    });

    // One delegated pointer handler gives the dense SOC cards a quiet depth cue
    // without a render loop. It is unavailable to touch devices and reduced
    // motion users, and it also covers cards that course/catalogue scripts add
    // after this shell has initialized.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let pendingCard = null;
      let pendingPoint = null;
      let pointerFrame = 0;
      const applyTilt = () => {
        pointerFrame = 0;
        if (!pendingCard || !pendingPoint) return;
        const rect = pendingCard.getBoundingClientRect();
        const x = (pendingPoint.clientX - rect.left) / rect.width - .5;
        const y = (pendingPoint.clientY - rect.top) / rect.height - .5;
        pendingCard.style.setProperty('--soc-tilt-x', `${(-y * 2).toFixed(2)}deg`);
        pendingCard.style.setProperty('--soc-tilt-y', `${(x * 2).toFixed(2)}deg`);
      };
      document.addEventListener('pointermove', (event) => {
        const card = event.target.closest('.course-card,.about-card,.event-card,.ctf-card,.game-card,.provider-course-group');
        if (!card) return;
        card.setAttribute('data-soc-tilt', '');
        pendingCard = card;
        pendingPoint = event;
        if (!pointerFrame) pointerFrame = window.requestAnimationFrame(applyTilt);
      }, { passive: true });
      document.addEventListener('pointerout', (event) => {
        const card = event.target.closest?.('[data-soc-tilt]');
        if (!card || card.contains(event.relatedTarget)) return;
        card.style.removeProperty('--soc-tilt-x');
        card.style.removeProperty('--soc-tilt-y');
      }, { passive: true });
    }
  };
  installVisualEnhancements();
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
