(() => {
  'use strict';
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const courses = [...document.querySelectorAll('[data-category]')];
  const result = document.querySelector('#result');
  const emptyState = document.querySelector('#no-courses');
  let selectedCategory = 'all';
  function filterCourses() {
    let count = 0;
    courses.forEach(course => {
      const matchesCategory = selectedCategory === 'all' || course.dataset.category === selectedCategory;
      course.hidden = !matchesCategory;
      if (!course.hidden) count += 1;
    });
    result.textContent = `${count}件の体験メニューを表示しています`;
    emptyState.hidden = count > 0;
  }
  filterButtons.forEach(button => button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filterCourses();
  }));
  filterCourses();

  const navLinks = [...document.querySelectorAll('.page-nav a')];
  const navSections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
  let navTicking = false;
  function updateNavigation() {
    let current = 0;
    navSections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.4) current = index;
    });
    navLinks.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    navTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!navTicking) {
      navTicking = true;
      window.requestAnimationFrame(updateNavigation);
    }
  }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  updateNavigation();

  // 読む内容は常に表示したまま、画面に入ったときだけ短く動かす。
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const activeReveals = new Set();
  if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        if (reducedMotion.matches) return;
        const isPhoto = entry.target.classList.contains('photo-strip');
        const animation = entry.target.animate([
          { opacity: 0, transform: `translateY(${isPhoto ? 14 : 20}px)` },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: isPhoto ? 850 : 620, easing: 'cubic-bezier(.22,.68,.2,1)' });
        activeReveals.add(animation);
        const forgetAnimation = () => activeReveals.delete(animation);
        animation.addEventListener('finish', forgetAnimation, { once: true });
        animation.addEventListener('cancel', forgetAnimation, { once: true });
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.benefit, .highlights article, .courses article, .photo-strip, .venue')
      .forEach(element => revealObserver.observe(element));
    const stopReveals = () => {
      if (reducedMotion.matches) [...activeReveals].forEach(animation => animation.cancel());
    };
    if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', stopReveals);
  }

  const dialog = document.querySelector('#reservation-dialog');
  let lastTrigger;
  function closeDialog() {
    dialog.close();
    lastTrigger?.focus();
  }
  const rawUrl = window.LP_CONFIG?.reservationUrl?.trim() || '';
  let reservationUrl = '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') reservationUrl = parsed.href;
  } catch { /* 空欄・無効なURLではダミー案内を表示 */ }
  document.querySelectorAll('[data-apply]').forEach(link => {
    if (reservationUrl) {
      link.href = reservationUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${link.textContent.trim()}（新しいタブで開きます）`);
    } else {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        event.preventDefault();
        lastTrigger = link;
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else window.alert('申込ページは現在準備中です。');
      });
    }
  });
  if (reservationUrl) document.querySelector('[data-reservation-note]').textContent = 'クリックすると、新しいタブで申込サイトが開きます。';
  dialog.querySelectorAll('button').forEach(button => button.addEventListener('click', closeDialog));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
    }
  });
  dialog.addEventListener('cancel', () => lastTrigger?.focus());
})();
