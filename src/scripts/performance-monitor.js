/**
 * High Refresh-Rate & Performance Guard
 */
export function initPerformanceGuard() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.body.classList.add('page-hidden');
    } else {
      document.body.classList.remove('page-hidden');
    }
  });

  const mobileToggle = document.querySelector('.nav-mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('nav-open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
        navLinks.classList.remove('nav-open');
      }
    });
  }
}
