/* ============================================
   DHRUVI SURANA — motion.js
   GSAP + ScrollTrigger + SplitText + Lenis
   Preloader, smooth scroll, reveals, cursor, tilt
   ============================================ */

'use strict';

(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  let hoverCapable = hoverQuery.matches;
  const gsapReady = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  document.documentElement.classList.add('is-loading');

  function setStatCountersInstant() {
    document.querySelectorAll('.stat-num[data-count]').forEach((el) => {
      el.textContent = el.getAttribute('data-count');
    });
  }

  function playFormSuccessStatic() {
    // no-op: main.js already toggles the .visible class for CSS display
  }

  function finishWithoutAnimation() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.style.display = 'none';
    document.documentElement.classList.remove('is-loading');
    window.DhruviScene && window.DhruviScene.revealHero && window.DhruviScene.revealHero();
    setStatCountersInstant();
    window.DhruviMotion = { lenis: null, stop() {}, start() {}, playFormSuccess: playFormSuccessStatic };
  }

  if (reducedMotion || !gsapReady) {
    finishWithoutAnimation();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const hasSplitText = typeof window.SplitText !== 'undefined';
  if (hasSplitText) gsap.registerPlugin(SplitText);

  function trySplit(target, opts) {
    if (!hasSplitText) return null;
    try { return new SplitText(target, opts); } catch (e) { return null; }
  }

  /* ---------------- PRELOADER ---------------- */
  function setBackgroundInert(inert) {
    // Prevents Tab from reaching nav/hero controls still hidden under the
    // opaque preloader, and stops a screen reader from surfacing them
    // before real content. 'inert' is a no-op (safe) on browsers that
    // don't support it — pointer-events on the preloader already blocks
    // mouse interaction either way.
    document.querySelectorAll('body > *').forEach((el) => {
      if (el.id !== 'preloader') {
        if (inert) el.setAttribute('inert', ''); else el.removeAttribute('inert');
      }
    });
  }

  function runPreloader() {
    const preloader = document.getElementById('preloader');
    const percentEl = document.getElementById('preloader-percent');
    const ringFill = document.getElementById('preloader-ring-fill');
    if (!preloader) return Promise.resolve();

    setBackgroundInert(true);

    const RING_R = 54;
    const RING_C = 2 * Math.PI * RING_R;
    if (ringFill) {
      ringFill.style.strokeDasharray = String(RING_C);
      ringFill.style.strokeDashoffset = String(RING_C);
    }

    const state = { p: 0 };
    function setProgress(v) {
      state.p = v;
      if (percentEl) percentEl.textContent = Math.round(v) + '%';
      if (ringFill) ringFill.style.strokeDashoffset = String(RING_C * (1 - v / 100));
    }

    const fontsReady = (document.fonts && document.fonts.ready)
      ? document.fonts.ready.catch(() => {})
      : Promise.resolve();
    const heroImgs = Array.from(document.querySelectorAll('#hero img[loading="eager"]'));
    const imgReady = Promise.all(heroImgs.map((img) => (img.complete
      ? Promise.resolve()
      : new Promise((res) => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      }))));

    return new Promise((resolve) => {
      gsap.to(state, { p: 88, duration: 1.1, ease: 'power1.out', onUpdate: () => setProgress(state.p) });

      Promise.all([fontsReady, imgReady]).then(() => {
        gsap.to(state, {
          p: 100,
          duration: 0.35,
          delay: 0.15,
          ease: 'power1.out',
          onUpdate: () => setProgress(state.p),
          onComplete: () => {
            const tl = gsap.timeline({
              onComplete: () => {
                preloader.style.display = 'none';
                document.documentElement.classList.remove('is-loading');
                setBackgroundInert(false);
                resolve();
              },
            });
            tl.to('.preloader-inner, .preloader-tagline', { opacity: 0, y: -12, duration: 0.45, ease: 'power2.in' })
              .to(preloader, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, '-=0.15')
              .set(preloader, { pointerEvents: 'none' });
          },
        });
      });
    });
  }

  /* ---------------- HERO ENTRANCE ---------------- */
  function playHeroEntrance() {
    const split = trySplit('.hero-name-line', { type: 'chars' });
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (split && split.chars && split.chars.length) {
      gsap.set(split.chars, { opacity: 0, yPercent: 120, rotateX: -40, transformOrigin: '50% 100%' });
      tl.to(split.chars, { opacity: 1, yPercent: 0, rotateX: 0, duration: 0.9, stagger: 0.022 });
    } else {
      gsap.set('.hero-name-line', { opacity: 0, y: 40 });
      tl.to('.hero-name-line', { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 });
    }

    gsap.set(['.hero-tagline', '.hero-actions', '.hero-stats'], { opacity: 0, y: 24 });
    tl.to('.hero-tagline', { opacity: 1, y: 0, duration: 0.8 }, '-=0.55')
      .to('.hero-actions', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
      .to('.hero-stats', { opacity: 1, y: 0, duration: 0.7 }, '-=0.45');
  }

  /* ---------------- SCROLL PROGRESS ---------------- */
  function setupScrollProgress() {
    const bar = document.getElementById('scroll-progress-bar');
    if (!bar) return;
    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        start: 0,
        end: () => document.documentElement.scrollHeight - window.innerHeight,
        scrub: 0.3,
      },
    });
  }

  /* ---------------- CURSOR ---------------- */
  let cursorInitialized = false;
  function setupCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    const label = document.getElementById('cursor-label');
    if (!cursor || !follower || !hoverCapable || cursorInitialized) return;
    cursorInitialized = true;

    // CSS defaults these to opacity:0 (they're unpositioned until the
    // first gsap.set below) — fade them in only once actually placed, so
    // a stale/late hoverCapable check never leaves a stray dot at (0,0).
    gsap.set([cursor, follower], { xPercent: -50, yPercent: -50 });
    gsap.to([cursor, follower], { opacity: 1, duration: 0.4, delay: 0.15 });

    const dotX = gsap.quickTo(cursor, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(cursor, 'y', { duration: 0.12, ease: 'power3' });
    const followX = gsap.quickTo(follower, 'x', { duration: 0.45, ease: 'power3' });
    const followY = gsap.quickTo(follower, 'y', { duration: 0.45, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      dotX(e.clientX); dotY(e.clientY);
      followX(e.clientX); followY(e.clientY);
    });

    document.addEventListener('mouseleave', () => gsap.to([cursor, follower], { opacity: 0, duration: 0.3 }));
    document.addEventListener('mouseenter', () => gsap.to([cursor, follower], { opacity: 1, duration: 0.3 }));

    document.querySelectorAll('a, button, .gallery-item, .video-item, .service-card, .magnetic').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('cursor--hover');
        follower.classList.add('cursor-follower--hover');
        gsap.to(cursor, { scale: 2, duration: 0.3, ease: 'power2.out' });
        gsap.to(follower, { scale: 1.5, duration: 0.3, ease: 'power2.out' });
        const text = el.getAttribute('data-cursor-label');
        if (text && label) {
          label.textContent = text;
          follower.classList.add('cursor-follower--label');
        }
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('cursor--hover');
        follower.classList.remove('cursor-follower--hover');
        follower.classList.remove('cursor-follower--label');
        gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(follower, { scale: 1, duration: 0.3, ease: 'power2.out' });
        if (label) label.textContent = '';
      });
    });
  }

  /* Hover capability can change live on hybrid/2-in-1 devices (docking a
     mouse, folding a convertible) — re-check and lazily activate the
     cursor rather than trusting the load-time snapshot forever. */
  function watchHoverCapability() {
    hoverQuery.addEventListener('change', (e) => {
      hoverCapable = e.matches;
      if (hoverCapable) {
        setupCursor();
      } else {
        const cursor = document.getElementById('cursor');
        const follower = document.getElementById('cursor-follower');
        if (cursor && follower) gsap.to([cursor, follower], { opacity: 0, duration: 0.2 });
      }
    });
  }

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  function setupMagnetic() {
    if (!hoverCapable) return;
    document.querySelectorAll('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------- 3D TILT ---------------- */
  function setupTilt(selector, max) {
    if (!hoverCapable) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.style.transformPerspective = '800px';
      const rotX = gsap.quickTo(el, 'rotateX', { duration: 0.6, ease: 'power3' });
      const rotY = gsap.quickTo(el, 'rotateY', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rotY(px * max);
        rotX(-py * max);
      });
      el.addEventListener('mouseleave', () => { rotX(0); rotY(0); });
    });
  }

  /* ---------------- SECTION HEADER REVEALS ---------------- */
  function setupSectionReveals() {
    document.querySelectorAll('.section-header').forEach((header) => {
      const label = header.querySelector('.section-label');
      const title = header.querySelector('.section-title, .section-title-sm');
      const sub = header.querySelector('.section-sub');
      const tl = gsap.timeline({
        scrollTrigger: { trigger: header, start: 'top 82%', once: true },
        defaults: { ease: 'power3.out' },
      });
      if (label) {
        gsap.set(label, { opacity: 0, x: -24 });
        tl.to(label, { opacity: 1, x: 0, duration: 0.6 });
      }
      const splitTitle = title ? trySplit(title, { type: 'lines', linesClass: 'split-line' }) : null;
      if (splitTitle && splitTitle.lines && splitTitle.lines.length) {
        gsap.set(splitTitle.lines, { overflow: 'hidden' });
        gsap.set(splitTitle.lines, { opacity: 0, yPercent: 100 });
        tl.to(splitTitle.lines, { opacity: 1, yPercent: 0, duration: 0.8, stagger: 0.08 }, '-=0.3');
      } else if (title) {
        gsap.set(title, { opacity: 0, y: 30 });
        tl.to(title, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3');
      }
      if (sub) {
        gsap.set(sub, { opacity: 0, y: 16 });
        tl.to(sub, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5');
      }
    });
  }

  /* ---------------- HERO PARALLAX ---------------- */
  function setupHeroParallax() {
    document.querySelectorAll('[data-parallax]').forEach((img) => {
      const factor = parseFloat(img.getAttribute('data-parallax')) || 0.1;
      gsap.to(img, {
        y: () => window.innerHeight * factor,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------------- GALLERY + VIDEO REVEALS ---------------- */
  function setupGalleryReveals() {
    if (document.querySelector('.gallery-item')) {
      gsap.set('.gallery-item', { opacity: 0, y: 50, scale: 0.94 });
      ScrollTrigger.batch('.gallery-item', {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.07, ease: 'power3.out' }),
      });
      setupTilt('.gallery-item', 6);
    }
    if (document.querySelector('.video-item')) {
      gsap.set('.video-item', { opacity: 0, y: 50, scale: 0.94 });
      ScrollTrigger.batch('.video-item', {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' }),
      });
      setupTilt('.video-item', 5);
    }
  }

  /* ---------------- SERVICES ---------------- */
  function setupServiceReveals() {
    if (!document.querySelector('.service-card')) return;
    gsap.set('.service-card', { opacity: 0, y: 40 });
    ScrollTrigger.batch('.service-card', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }),
    });
    setupTilt('.service-card', 5);

    document.querySelectorAll('.service-icon svg path, .service-icon svg circle, .service-icon svg line').forEach((shape) => {
      try {
        const len = shape.getTotalLength();
        shape.style.strokeDasharray = String(len);
        shape.style.strokeDashoffset = String(len);
        gsap.to(shape, {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: shape.closest('.service-card'), start: 'top 85%', once: true },
        });
      } catch (e) { /* non-geometry shape, skip */ }
    });
  }

  /* ---------------- ABOUT ---------------- */
  function setupAboutReveals() {
    const about = document.querySelector('.about');
    if (!about) return;
    gsap.set('.about-media', { opacity: 0, y: 30 });
    gsap.set('.about-content > *', { opacity: 0, y: 30 });

    gsap.timeline({ scrollTrigger: { trigger: about, start: 'top 75%', once: true }, defaults: { ease: 'power3.out', duration: 0.8 } })
      .to('.about-media', { opacity: 1, y: 0 })
      .to('.about-content > *', { opacity: 1, y: 0, stagger: 0.1 }, '-=0.5');

    if (document.querySelector('.about-img-back')) {
      gsap.fromTo('.about-img-back', { y: -20 }, {
        y: 20, ease: 'none',
        scrollTrigger: { trigger: about, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
    if (document.querySelector('.about-img-front')) {
      gsap.fromTo('.about-img-front', { y: 15 }, {
        y: -25, ease: 'none',
        scrollTrigger: { trigger: about, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
    if (document.querySelector('.about-badge')) {
      gsap.from('.about-badge', {
        scale: 0, rotate: -15, duration: 0.7, ease: 'back.out(1.8)',
        scrollTrigger: { trigger: '.about-badge', start: 'top 85%', once: true },
      });
    }
  }

  /* ---------------- TESTIMONIALS ---------------- */
  function setupTestimonialReveals() {
    if (!document.querySelector('.testimonial-card')) return;
    gsap.set('.testimonial-card', { opacity: 0, y: 40 });
    ScrollTrigger.batch('.testimonial-card', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }),
    });
  }

  /* ---------------- TICKER (velocity skew + speed) ---------------- */
  function setupTicker() {
    const track = document.querySelector('.ticker-track');
    if (!track) return;
    gsap.set(track, { xPercent: 0 });
    const baseTween = gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
    // quickTo setters (not gsap.to) since onUpdate can fire on every
    // scroll-driven frame — allocating a fresh tween per tick here would
    // be the one place in this file doing that.
    const timeScaleTo = gsap.quickTo(baseTween, 'timeScale', { duration: 0.3, ease: 'power2.out' });
    const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power2.out' });
    ScrollTrigger.create({
      trigger: '.ticker-wrap',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        timeScaleTo(gsap.utils.clamp(0.3, 2.5, 1 + Math.abs(self.getVelocity()) / 1400));
        skewTo(gsap.utils.clamp(-8, 8, self.getVelocity() / -300));
      },
    });
  }

  /* ---------------- STAT COUNTERS ---------------- */
  function setupCounters() {
    document.querySelectorAll('.stat-num[data-count]').forEach((el) => {
      const target = parseInt(el.getAttribute('data-count'), 10) || 0;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        snap: { val: 1 },
        onUpdate: () => { el.textContent = String(Math.round(obj.val)); },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------------- SIGNATURE RING SCENE ---------------- */
  function setupSignatureScene() {
    const section = document.getElementById('signature');
    if (!section) return;
    const caption = section.querySelector('.signature-caption');

    if (caption) {
      gsap.set(caption, { opacity: 0, y: 20 });
      gsap.to(caption, {
        opacity: 1, y: 0, duration: 1,
        scrollTrigger: { trigger: section, start: 'top 60%', end: 'top top', scrub: 0.6 },
      });
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=140%',
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => {
        if (window.DhruviScene && window.DhruviScene.setSignatureProgress) {
          window.DhruviScene.setSignatureProgress(self.progress);
        }
      },
    });
  }

  /* ---------------- FOOTER ---------------- */
  function setupFooterReveal() {
    if (!document.querySelector('.footer')) return;
    gsap.set('.footer-top > *, .footer-bottom > *', { opacity: 0, y: 20 });
    gsap.to('.footer-top > *, .footer-bottom > *', {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true },
    });
  }

  /* ---------------- FORM SUCCESS ---------------- */
  function playFormSuccess() {
    const success = document.getElementById('form-success');
    if (!success) return;
    gsap.fromTo(success,
      { opacity: 0, y: 10, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)' });
  }

  /* ---------------- LENIS + SCROLLTRIGGER BRIDGE ---------------- */
  function initSmoothScroll() {
    if (typeof window.Lenis === 'undefined') return null;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  /* Anchor links animate via Lenis instead of native scroll-behavior,
     which would otherwise fight Lenis's own scroll easing. */
  function setupAnchorScroll(lenis) {
    if (!lenis) return;
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -84, duration: 1.4 });
      });
    });
  }

  /* ---------------- BOOT ---------------- */
  function initFullMotion() {
    const lenis = initSmoothScroll();
    window.DhruviMotion = {
      lenis,
      stop() { if (lenis) lenis.stop(); },
      start() { if (lenis) lenis.start(); },
      playFormSuccess,
    };

    setupAnchorScroll(lenis);
    setupScrollProgress();
    setupCursor();
    watchHoverCapability();
    setupMagnetic();
    setupSectionReveals();
    setupHeroParallax();
    setupGalleryReveals();
    setupServiceReveals();
    setupAboutReveals();
    setupTestimonialReveals();
    setupTicker();
    setupCounters();
    setupSignatureScene();
    setupFooterReveal();

    ScrollTrigger.refresh();
  }

  runPreloader().then(() => {
    playHeroEntrance();
    if (window.DhruviScene && window.DhruviScene.revealHero) window.DhruviScene.revealHero();
    initFullMotion();
  });
})();
