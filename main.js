/* ============================================
   DHRUVI SURANA — main.js
   Interactivity & Animations
   ============================================ */

'use strict';

/* --------- CURSOR --------- */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  if (!cursor || !follower) return;

  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  function animateFollower() {
    fx += (mx - fx) * 0.1;
    fy += (my - fy) * 0.1;
    follower.style.left = fx + 'px';
    follower.style.top = fy + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  const hoverEls = document.querySelectorAll('a, button, .gallery-item, .video-item, .service-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('cursor--hover');
      follower.classList.add('cursor-follower--hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor--hover');
      follower.classList.remove('cursor-follower--hover');
    });
  });

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; follower.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; follower.style.opacity = '1'; });
})();


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
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mmLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
})();


/* --------- REVEAL ON SCROLL --------- */
(function initReveal() {
  const sections = document.querySelectorAll(
    '.section-header, .service-card, .about-content > *, .about-media, .contact-left > *, .contact-right, .video-item, .gallery-item'
  );

  sections.forEach((el, i) => {
    el.classList.add('reveal');
    const delay = Math.min(i % 4, 3);
    if (delay > 0) el.classList.add(`reveal-delay-${delay}`);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  sections.forEach(el => observer.observe(el));
})();


/* --------- STAT COUNTER --------- */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num[data-count]');

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'));
    const duration = 1800;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
})();


/* --------- PARALLAX HERO --------- */
(function initParallax() {
  const images = document.querySelectorAll('[data-parallax]');
  if (!images.length) return;

  function applyParallax() {
    const scrollY = window.scrollY;
    images.forEach(img => {
      const factor = parseFloat(img.getAttribute('data-parallax'));
      img.style.transform = `translateY(${scrollY * factor}px)`;
    });
  }

  window.addEventListener('scroll', applyParallax, { passive: true });
})();


/* --------- GALLERY FILTER --------- */
(function initFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.gallery-item');

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
          // trigger reflow for animation
          requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          });
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 400);
        }
      });
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
  }

  document.querySelectorAll('.gallery-item').forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(idx));
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
