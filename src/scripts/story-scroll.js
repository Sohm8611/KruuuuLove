export function initScrollSystem() {
  const nav = document.querySelector('.site-nav');
  const reveals = document.querySelectorAll('.reveal-on-scroll');

  function onScroll() {
    if (window.scrollY > 80) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '120px 0px 60px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}
