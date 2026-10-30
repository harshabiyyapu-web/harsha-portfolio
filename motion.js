// Page motion: one reveal as sections arrive. Content is visible without it (only `.js` hides it),
// and the footer "Motion" toggle switches it off through window.siteMotion.
(() => {
  const root = document.documentElement;
  let io = null;

  function init() {
    root.classList.remove('motion-off');
    if (io) return;
    io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }), { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(el => io.observe(el));
  }

  function kill() {
    root.classList.add('motion-off');
    io?.disconnect(); io = null;
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  window.siteMotion = { enable: init, disable: kill };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) kill(); else init();
})();
