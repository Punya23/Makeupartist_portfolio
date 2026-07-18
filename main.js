/* ============================================
   DHRUVI SURANA — main.js
   Interactivity & Animations
   ============================================ */

'use strict';

/* Cursor, scroll-reveal, stat counters, and hero parallax are handled by
   js/motion.js (GSAP) — this file owns functional/content behavior only. */

/* --------- NAV --------- */
(function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mmLinks = document.querySelectorAll('.mm-link');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 60);
  }, { passive: true });

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const opening = !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = opening ? 'hidden' : '';
      if (opening) window.DhruviMotion?.stop(); else window.DhruviMotion?.start();
    });
    mmLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        window.DhruviMotion?.start();
      });
    });
  }
})();


/* --------- GALLERY FILTER --------- */
(function initFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.gallery-item');
  const hasGsap = typeof window.gsap !== 'undefined';

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      items.forEach(item => {
        const cat = item.getAttribute('data-cat');
        const visible = filter === 'all' || cat === filter;
        if (visible) {
          item.style.display = '';
          if (hasGsap) {
            // Routed through GSAP (not raw style writes) so it shares the
            // same transform cache as motion.js's tilt-on-hover effect on
            // these same items — otherwise a mousemove mid-transition can
            // clobber this scale back to whatever GSAP cached.
            gsap.to(item, { opacity: 1, scale: 1, duration: 0.4, overwrite: 'auto' });
          } else {
            // trigger reflow for animation
            requestAnimationFrame(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            });
          }
        } else if (hasGsap) {
          gsap.to(item, {
            opacity: 0, scale: 0.95, duration: 0.4, overwrite: 'auto',
            onComplete: () => { item.style.display = 'none'; },
          });
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 400);
        }
      });

      // Filtering changes document height (hidden items collapse out of
      // the grid), which leaves every ScrollTrigger below the gallery
      // (signature pin, services, about, etc.) pinned to stale offsets.
      setTimeout(() => window.ScrollTrigger?.refresh(), 450);
    });
  });
})();


/* --------- LIGHTBOX --------- */
(function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  const lbPrev = document.getElementById('lightbox-prev');
  const lbNext = document.getElementById('lightbox-next');
  const lbCounter = document.getElementById('lightbox-counter');
  if (!lightbox) return;

  let images = [];
  let currentIdx = 0;

  function buildImageList() {
    const items = document.querySelectorAll('.gallery-item:not([style*="display: none"])');
    images = [];
    items.forEach(item => {
      const img = item.querySelector('img');
      if (img) images.push({ src: img.src, alt: img.alt });
    });
  }

  function openLightbox(idx) {
    buildImageList();
    currentIdx = idx;
    show();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    window.DhruviMotion?.stop();
  }

  function show() {
    if (!images[currentIdx]) return;
    lbImg.style.opacity = '0';
    lbImg.src = images[currentIdx].src;
    lbImg.alt = images[currentIdx].alt;
    lbImg.onload = () => { lbImg.style.opacity = '1'; lbImg.style.transition = 'opacity 0.3s'; };
    lbCounter.textContent = `${currentIdx + 1} / ${images.length}`;
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    window.DhruviMotion?.start();
  }

  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      // buildImageList()/openLightbox() index into the currently VISIBLE
      // (post-filter) items only, not full DOM order — using a fixed
      // forEach index here would open the wrong photo (or nothing) once
      // any filter other than "All" is active.
      const visible = Array.from(document.querySelectorAll('.gallery-item:not([style*="display: none"])'));
      const idx = visible.indexOf(item);
      if (idx === -1) return;
      openLightbox(idx);
    });
  });

  lbClose && lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

  lbPrev && lbPrev.addEventListener('click', () => {
    currentIdx = (currentIdx - 1 + images.length) % images.length;
    show();
  });
  lbNext && lbNext.addEventListener('click', () => {
    currentIdx = (currentIdx + 1) % images.length;
    show();
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') { currentIdx = (currentIdx - 1 + images.length) % images.length; show(); }
    if (e.key === 'ArrowRight') { currentIdx = (currentIdx + 1) % images.length; show(); }
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) { currentIdx = (currentIdx + 1) % images.length; }
      else { currentIdx = (currentIdx - 1 + images.length) % images.length; }
      show();
    }
  });
})();


/* --------- VIDEO REELS --------- */
(function initVideos() {
  const videoItems = document.querySelectorAll('.video-item');

  videoItems.forEach(item => {
    const video = item.querySelector('.reel-video');
    const btn = item.querySelector('.play-btn');
    if (!video || !btn) return;

    // Lazy load intersection
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.load();
          observer.unobserve(video);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(video);

    btn.addEventListener('click', () => {
      if (video.paused) {
        // Pause all other videos
        document.querySelectorAll('.reel-video').forEach(v => {
          if (v !== video) {
            v.pause();
            v.closest('.video-item').classList.remove('playing');
          }
        });
        video.play();
        item.classList.add('playing');
      } else {
        video.pause();
        item.classList.remove('playing');
      }
    });

    video.addEventListener('ended', () => {
      item.classList.remove('playing');
    });
  });
})();


/* --------- TESTIMONIAL SLIDER --------- */
(function initTestimonials() {
  const track = document.getElementById('testimonial-track');
  const dots = document.querySelectorAll('.t-dot');
  const prev = document.getElementById('testimonial-prev');
  const next = document.getElementById('testimonial-next');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  let current = 0;
  let visibleCount = 3;
  let autoplayInterval;

  function getVisibleCount() {
    return window.innerWidth < 900 ? 1 : 3;
  }

  function go(idx) {
    visibleCount = getVisibleCount();
    const maxIdx = Math.max(0, cards.length - visibleCount);
    current = Math.max(0, Math.min(idx, maxIdx));
    const cardWidth = cards[0].offsetWidth;
    const gap = 24; // 1.5rem
    track.style.transform = `translateX(-${current * (cardWidth + gap)}px)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  prev && prev.addEventListener('click', () => { clearInterval(autoplayInterval); go(current - 1); });
  next && next.addEventListener('click', () => { clearInterval(autoplayInterval); go(current + 1); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { clearInterval(autoplayInterval); go(i); }));

  autoplayInterval = setInterval(() => {
    visibleCount = getVisibleCount();
    const maxIdx = cards.length - visibleCount;
    go(current >= maxIdx ? 0 : current + 1);
  }, 5000);

  window.addEventListener('resize', () => go(current));

  // Touch swipe
  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { clearInterval(autoplayInterval); go(diff > 0 ? current + 1 : current - 1); }
  });
})();


/* --------- CONTACT FORM --------- */
(function initForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Simulate send
    setTimeout(() => {
      form.reset();
      btn.textContent = 'Send Message';
      btn.disabled = false;
      if (success) {
        success.classList.add('visible');
        window.DhruviMotion?.playFormSuccess();
        setTimeout(() => success.classList.remove('visible'), 5000);
      }
    }, 1500);
  });
})();


/* --------- SMOOTH ACTIVE NAV LINK --------- */
(function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = ['hero', 'portfolio', 'services', 'about', 'testimonials', 'contact'];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--gold)' : '';
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
})();
