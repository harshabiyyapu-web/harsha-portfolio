// Page motion: Lenis smooth scrolling plus GSAP intro, scroll, marquee and drag effects.
// Everything created in init() lives in one gsap.context so the footer "Motion" toggle can fully revert it.
(() => {
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 80);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Rolling pill labels: the visible copy slides up and a duplicate slides in on hover.
  document.querySelectorAll('.pill:not(.static)').forEach(pill => {
    if (pill.children.length) return;
    const text = pill.textContent.trim();
    pill.innerHTML = `<span class="roll"><span>${text}</span><span aria-hidden="true">${text}</span></span>`;
  });

  // Repeat each marquee's content until half the track covers the viewport, so a -50% loop never shows a gap.
  document.querySelectorAll('[data-marquee]').forEach(track => {
    const unit = [...track.children];
    let copies = 1;
    const unitWidth = track.scrollWidth || 1;
    while (unitWidth * copies < innerWidth * 2 || copies % 2) {
      unit.forEach(node => { const clone = node.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.append(clone); });
      copies++;
    }
  });

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, ...[window.SplitText, window.Draggable, window.InertiaPlugin].filter(Boolean));

  let lenis = null, ctx = null, raf = null, active = false;
  // Phones and touch screens get native scrolling and no scroll-scrubbed effects; those are what made mobile janky.
  const lite = matchMedia('(max-width: 760px), (pointer: coarse)').matches;

  function init() {
    if (active) return;
    active = true;

    if (window.Lenis && !lite) {
      lenis = new Lenis({ lerp: 0.1, anchors: true, autoRaf: false });
      lenis.on('scroll', ScrollTrigger.update);
      raf = time => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    ctx = gsap.context(() => {
      const cleanups = [];
      const fine = matchMedia('(pointer: fine)').matches;

      // Hero intro
      const word = document.querySelector('.hero-word');
      const chars = window.SplitText ? SplitText.create(word, { type: 'chars', charsClass: 'char' }).chars : [word];
      // Short and snappy: the loader already did the waiting, so the hero lands in about a second.
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
        .from('.hero .tube', { strokeDashoffset: 1, duration: 1.6, ease: 'power3.inOut', stagger: 0.05 }, 0)
        .from('.eyebrow-pill', { y: 24, autoAlpha: 0, duration: 0.7 }, 0.05)
        .from(chars, { yPercent: 120, rotate: () => gsap.utils.random(-14, 14), autoAlpha: 0, duration: 1, stagger: 0.04, ease: 'back.out(1.7)' }, 0.05)
        .from('.hero-tagline', { y: 30, autoAlpha: 0, duration: 0.8 }, 0.35)
        .from('.hero-actions .pill', { y: 24, autoAlpha: 0, stagger: 0.06, duration: 0.8 }, 0.45)
        .from('.hero .sticker', { scale: 0, rotate: -60, duration: 1.3, stagger: 0.07, ease: 'elastic.out(1, 0.5)' }, 0.4);
      (window.pageReady || Promise.resolve()).then(() => intro.play());

      if (!lite) {
        // Hero parallax on scroll
        const heroScrub = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
        gsap.to('.hero-tube', { scale: 1.3, rotate: -7, yPercent: 10, ease: 'none', scrollTrigger: heroScrub });
        gsap.to('.hero-inner', { yPercent: 28, autoAlpha: 0.15, ease: 'none', scrollTrigger: { ...heroScrub } });

        // Stickers drift at different speeds.
        document.querySelectorAll('.sticker').forEach(sticker => {
          const depth = Number(sticker.dataset.depth || 1);
          gsap.to(sticker, { y: -140 * depth, ease: 'none', scrollTrigger: { trigger: sticker.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      }
      if (matchMedia('(pointer: fine)').matches) {
        const movers = [...document.querySelectorAll('.sticker')].map(el => ({
          depth: Number(el.dataset.depth || 1),
          x: gsap.quickTo(el, '--mx', { duration: 1.2, ease: 'expo.out' }),
          y: gsap.quickTo(el, '--my', { duration: 1.2, ease: 'expo.out' })
        }));
        const move = e => {
          const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
          movers.forEach(m => { m.x(`${dx * 40 * m.depth}px`); m.y(`${dy * 40 * m.depth}px`); });
        };
        addEventListener('pointermove', move, { passive: true });
        cleanups.push(() => removeEventListener('pointermove', move));
      }

      // Big headings rise line by line out of a mask.
      if (window.SplitText) {
        document.querySelectorAll('[data-split]').forEach(el => {
          const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
          gsap.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
        });
      }

      // Statement lines and the inline photo pill
      gsap.from('.st-line', { yPercent: 60, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.statement', start: 'top 70%', once: true } });
      gsap.from('.st-photo', { scale: 0, rotate: -20, duration: 1.5, ease: 'elastic.out(1, 0.55)', delay: 0.35, scrollTrigger: { trigger: '.statement', start: 'top 70%', once: true } });
      gsap.from('.statement .sticker', { scale: 0, rotate: 50, duration: 1.5, stagger: 0.1, ease: 'elastic.out(1, 0.5)', scrollTrigger: { trigger: '.statement', start: 'top 60%', once: true } });

      // Panels lift into place as they arrive.
      if (!lite) document.querySelectorAll('.panel:not(.hero)').forEach(panel => {
        gsap.from(panel, { scale: 0.94, transformOrigin: '50% 0%', ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top 45%', scrub: true } });
      });

      // Cards and blocks spring in as a batch.
      const pop = '.row, .geopulse-feature, .stat, .milestone, .academic-card, .school-history article, .event-card, .certificate, .social-card, .experience, .venture-band';
      gsap.set(pop, lite ? { y: 40, autoAlpha: 0 } : { y: 90, rotate: 2.5, autoAlpha: 0 });
      ScrollTrigger.batch(pop, {
        start: lite ? 'top 98%' : 'top 92%', once: true,
        onEnter: batch => gsap.to(batch, { y: 0, rotate: 0, autoAlpha: 1, duration: 1.3, stagger: 0.09, ease: 'elastic.out(1, 0.75)', overwrite: true, clearProps: 'all' })
      });

      // Counting stats
      document.querySelectorAll('[data-count]').forEach(el => {
        const end = Number(el.dataset.count), suffix = el.dataset.suffix || '', final = el.textContent, value = { n: 0 };
        gsap.to(value, { n: end, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => { el.textContent = Math.round(value.n) + suffix; }, onComplete: () => { el.textContent = final; } });
        cleanups.push(() => { el.textContent = final; });
      });

      // Draggable, flickable card rail
      const rail = document.querySelector('[data-drag-rail]');
      if (rail && window.Draggable) {
        const track = rail.querySelector('.card-track');
        const cards = [...track.children];
        // Cards lean into the drag direction, then spring upright when released.
        let lastX = 0;
        const lean = self => {
          const v = self.x - lastX; lastX = self.x;
          gsap.to(cards, { rotate: gsap.utils.clamp(-9, 9, v * 0.35), skewX: gsap.utils.clamp(-6, 6, -v * 0.2), duration: 0.35, stagger: 0.015, overwrite: 'auto' });
        };
        const settleCards = () => gsap.to(cards, { rotate: 0, skewX: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)', stagger: 0.03, overwrite: 'auto', clearProps: 'transform' });
        const [drag] = Draggable.create(track, { type: 'x', bounds: rail, inertia: Boolean(window.InertiaPlugin), edgeResistance: 0.85, zIndexBoost: false,
          onPress() { lastX = this.x; }, onDrag() { lean(this); }, onThrowUpdate() { lean(this); }, onRelease() { if (!this.tween) settleCards(); }, onThrowComplete: settleCards });
        cleanups.push(() => drag.kill());
        gsap.from(cards, { x: 260, y: 60, rotate: 6, autoAlpha: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: rail, start: 'top 85%', once: true } });
      }

      // Marquees speed up with scroll velocity, then settle back.
      const loops = [...document.querySelectorAll('[data-marquee]')].map(track => {
        const reverse = track.hasAttribute('data-reverse');
        return gsap.fromTo(track, { xPercent: reverse ? -50 : 0 }, { xPercent: reverse ? 0 : -50, duration: Number(track.dataset.marquee), ease: 'none', repeat: -1 });
      });
      let boost = 1;
      if (lenis) lenis.on('scroll', e => { boost = Math.max(boost, 1 + Math.min(Math.abs(e.velocity) / 5, 6)); });
      const settle = () => { boost += (1 - boost) * 0.06; loops.forEach(t => t.timeScale(boost)); };
      gsap.ticker.add(settle);
      cleanups.push(() => gsap.ticker.remove(settle));

      // Scroll progress bar
      gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

      // Headings lean with scroll speed.
      const heads = gsap.utils.toArray('[data-split]');
      if (lenis && heads.length) {
        const skew = gsap.quickTo(heads, 'skewY', { duration: 0.6, ease: 'power3.out' });
        lenis.on('scroll', e => skew(gsap.utils.clamp(-4, 4, e.velocity * -0.25)));
      }

      // Hero letters hop when the pointer passes over them.
      if (fine && chars.length > 1) chars.forEach(ch => {
        const hop = () => gsap.fromTo(ch, { yPercent: 0 }, { yPercent: -14, rotate: gsap.utils.random(-10, 10), duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' });
        ch.addEventListener('pointerenter', hop);
      });

      // Clicking the hero throws a burst of confetti shapes.
      const hero = document.querySelector('.hero');
      const colors = ['#c6ff3d', '#ff5ca8', '#3dd6ff', '#6d3cff', '#ffffff'];
      const burst = e => {
        if (e.target.closest('a, button')) return;
        const r = hero.getBoundingClientRect();
        for (let i = 0; i < 14; i++) {
          const bit = document.createElement('span');
          bit.className = 'burst';
          bit.style.cssText = `left:${e.clientX - r.left - 9}px;top:${e.clientY - r.top - 9}px;background:${colors[i % colors.length]};border-radius:${i % 3 ? '50%' : '4px'}`;
          hero.append(bit);
          const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4, dist = gsap.utils.random(90, 210);
          gsap.fromTo(bit, { scale: 0 }, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: gsap.utils.random(0.6, 1.5), rotate: gsap.utils.random(-200, 200), duration: gsap.utils.random(0.7, 1.1), ease: 'expo.out',
            onComplete: () => gsap.to(bit, { scale: 0, autoAlpha: 0, duration: 0.3, onComplete: () => bit.remove() }) });
        }
      };
      hero.addEventListener('pointerdown', burst);
      cleanups.push(() => hero.removeEventListener('pointerdown', burst));

      if (fine) {
        // Magnetic buttons drift toward the pointer.
        document.querySelectorAll('.header .pill, .logo-btn, .menu-toggle, .hero-actions .pill, #reset-skills, #gallery-more').forEach(el => {
          const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }), y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
          const move = e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.4); };
          const leave = () => { x(0); y(0); };
          el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
          cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); gsap.set(el, { clearProps: 'transform' }); });
        });

        // Cards tilt in 3D under the pointer.
        document.querySelectorAll('.gallery-photo, .certificate, .stat, .milestone').forEach(el => {
          const move = e => {
            const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
            gsap.to(el, { rotationY: px * 12, rotationX: -py * 12, y: -8, transformPerspective: 900, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
          };
          const leave = () => gsap.to(el, { rotationY: 0, rotationX: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.45)', overwrite: 'auto', clearProps: 'transform' });
          el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
          cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
        });

        // A lime cursor that swells over links and labels what you can do.
        const cursor = document.createElement('div');
        cursor.className = 'cursor'; cursor.setAttribute('aria-hidden', 'true'); cursor.innerHTML = '<span></span>';
        document.body.append(cursor);
        const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' }), cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
        const labelFor = t => t.closest('.card-rail') ? 'DRAG' : t.closest('.skill-block') ? 'TOSS' : t.closest('.gallery-photo, .certificate') ? 'VIEW' : t.closest('#geo-launch') ? 'OPEN' : '';
        const track = e => {
          cx(e.clientX); cy(e.clientY); cursor.style.opacity = '1';
          const text = labelFor(e.target), link = !text && e.target.closest('a, button, summary');
          cursor.classList.toggle('has-label', Boolean(text)); cursor.classList.toggle('is-link', Boolean(link));
          if (text) cursor.firstChild.textContent = text;
        };
        const hide = () => { cursor.style.opacity = '0'; };
        addEventListener('pointermove', track, { passive: true });
        document.documentElement.addEventListener('pointerleave', hide);
        cleanups.push(() => { removeEventListener('pointermove', track); document.documentElement.removeEventListener('pointerleave', hide); cursor.remove(); });
      }

      return () => cleanups.forEach(fn => fn());
    });

    // Layout shifts (fonts, images, accordions, gallery) move trigger positions.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  function kill() {
    if (!active) return;
    active = false;
    ctx?.revert(); ctx = null;
    if (raf) gsap.ticker.remove(raf);
    lenis?.destroy(); lenis = null; raf = null;
    document.querySelectorAll('.sticker').forEach(s => { s.style.removeProperty('--mx'); s.style.removeProperty('--my'); });
  }

  let refreshTimer;
  new ResizeObserver(() => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => active && ScrollTrigger.refresh(), 200); }).observe(document.querySelector('main'));

  window.siteMotion = { enable: init, disable: kill };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) init();
})();
