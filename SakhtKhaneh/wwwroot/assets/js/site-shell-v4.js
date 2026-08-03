(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ready = callback => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  };

  ready(() => {
    // Content visibility must never depend on the success of optional effects.
    document.body.classList.add('sk-ui-ready');

    const safeInit = (name, initializer) => {
      try {
        initializer();
      } catch (error) {
        console.error(`[SakhtKhaneh] ${name} initialization failed.`, error);
      }
    };

    safeInit('preloader', hidePreloader);
    safeInit('navbar', initNavbar);
    safeInit('background images', initBackgroundImages);
    safeInit('reveal animations', initReveals);
    safeInit('home carousels', initHomeCarousels);
    safeInit('detail galleries', initDetailGalleries);
    safeInit('lightbox', initLightbox);
    safeInit('scroll progress', initScrollProgress);
    safeInit('section rail', initSectionRail);
  });

  function hidePreloader() {
    const loader = document.getElementById('preloader');
    if (!loader) return;

    const hide = () => {
      loader.classList.add('is-hidden');
      window.setTimeout(() => loader.remove(), 360);
    };

    // Two frames are enough to avoid a flash while never waiting for all images.
    requestAnimationFrame(() => requestAnimationFrame(hide));
    window.setTimeout(hide, 900);
  }

  function initNavbar() {
    const navbar = document.querySelector('[data-site-navbar]');
    const collapse = document.getElementById('siteNavbar');
    const toggler = document.querySelector('.sk-navbar__toggler');
    const close = document.querySelector('[data-navbar-close]');
    const backdrop = document.querySelector('[data-navbar-backdrop]');
    if (!(navbar instanceof HTMLElement) || !(collapse instanceof HTMLElement)) return;

    let previousY = window.scrollY;
    let scheduled = false;

    const update = () => {
      const y = Math.max(window.scrollY, 0);
      navbar.classList.toggle('is-scrolled', y > 42);
      navbar.classList.toggle('is-hidden', y > previousY && y > 480 && !document.body.classList.contains('sk-menu-open'));
      previousY = y;
      scheduled = false;
    };

    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();

    const setOpen = open => {
      collapse.classList.toggle('show', open);
      document.body.classList.toggle('sk-menu-open', open);
      backdrop?.classList.toggle('is-visible', open);
      toggler?.setAttribute('aria-expanded', String(open));
      navbar.classList.remove('is-hidden');
    };

    toggler?.addEventListener('click', () => setOpen(!collapse.classList.contains('show')));
    close?.addEventListener('click', () => setOpen(false));
    backdrop?.addEventListener('click', () => setOpen(false));

    collapse.querySelectorAll('.dropdown-toggle').forEach(toggle => {
      toggle.addEventListener('click', event => {
        event.preventDefault();
        const parent = toggle.closest('.dropdown');
        if (!parent) return;
        const shouldOpen = !parent.classList.contains('show');
        collapse.querySelectorAll('.dropdown.show').forEach(item => item.classList.remove('show'));
        parent.classList.toggle('show', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
      });
    });

    collapse.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) setOpen(false);
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('sk-menu-open')) {
        setOpen(false);
        toggler?.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 992) setOpen(false);
    }, { passive: true });
  }

  function initBackgroundImages() {
    const apply = element => {
      const url = element.getAttribute('data-background');
      if (url && !element.style.backgroundImage) {
        element.style.backgroundImage = `url("${url.replaceAll('"', '%22')}")`;
      }
    };

    const lazy = [];
    document.querySelectorAll('[data-background]').forEach(element => {
      if (element.getAttribute('data-background-lazy') === 'true') lazy.push(element);
      else apply(element);
    });

    if (!lazy.length) return;
    const hydrate = () => lazy.forEach(apply);
    if ('requestIdleCallback' in window) window.requestIdleCallback(hydrate, { timeout: 2200 });
    else window.setTimeout(hydrate, 1400);
  }

  function initReveals() {
    const elements = [...document.querySelectorAll('[data-sk-reveal], .animate-box')];
    if (!elements.length) return;

    const reveal = element => {
      element.classList.add('is-revealed');
      element.classList.remove('sk-reveal-pending');
    };

    elements.forEach((element, index) => {
      if (!element.hasAttribute('data-sk-reveal')) element.setAttribute('data-sk-reveal', 'up');
      element.style.setProperty('--sk3-reveal-delay', `${Math.min(index % 5, 4) * 55}ms`);
      element.classList.add('sk-reveal-pending');
    });

    // A broken observer or a later script error must never leave content invisible.
    const failSafe = window.setTimeout(() => elements.forEach(reveal), 2200);

    if (reducedMotion || !('IntersectionObserver' in window)) {
      window.clearTimeout(failSafe);
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .06 });

    elements.forEach(element => observer.observe(element));
  }

  function initHomeCarousels() {
    const $ = window.jQuery;
    if (!$?.fn?.owlCarousel) return;

    const autoplayDuration = 5000;
    const arrow = direction => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction === 'prev' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const hero = $('.slider-fade .owl-carousel');
    const progress = document.querySelector('[data-hero-progress]');

    const resetProgress = () => {
      if (!(progress instanceof HTMLElement)) return;
      progress.style.setProperty('--sk-hero-duration', `${autoplayDuration}ms`);
      progress.classList.remove('is-paused', 'is-running');
      // Force a fresh animation cycle only after the slide transition completes.
      void progress.offsetWidth;
      if (!reducedMotion && !document.hidden) progress.classList.add('is-running');
    };

    const pauseProgress = () => {
      if (progress instanceof HTMLElement) progress.classList.add('is-paused');
    };

    if (hero.length) {
      hero.on('translate.owl.carousel', () => {
        progress?.classList.remove('is-running', 'is-paused');
      });
      hero.on('translated.owl.carousel', resetProgress);
      hero.on('drag.owl.carousel', pauseProgress);
      hero.on('dragged.owl.carousel', resetProgress);
    }

    if (hero.length && !hero.hasClass('owl-loaded')) {
      hero.owlCarousel({
        items: 1,
        loop: true,
        dots: false,
        margin: 0,
        autoplay: !reducedMotion,
        autoplayTimeout: autoplayDuration,
        autoplayHoverPause: false,
        smartSpeed: reducedMotion ? 0 : 850,
        touchDrag: true,
        mouseDrag: true,
        animateOut: reducedMotion ? false : 'fadeOut',
        nav: true,
        navText: [arrow('prev'), arrow('next')]
      });
    }

    const projects = $('.projects .owl-carousel');
    if (projects.length && !projects.hasClass('owl-loaded')) {
      projects.owlCarousel({
        loop: projects.children().length > 2,
        margin: 30,
        mouseDrag: true,
        touchDrag: true,
        autoplay: false,
        dots: true,
        nav: false,
        responsive: { 0: { items: 1 }, 600: { items: 2 }, 1000: { items: 2 } }
      });
    }

    const makeAccessible = root => {
      root.find('.owl-prev').removeAttr('role').attr({ 'aria-label': 'اسلاید قبلی', type: 'button' });
      root.find('.owl-next').removeAttr('role').attr({ 'aria-label': 'اسلاید بعدی', type: 'button' });
      root.find('.owl-dot').each(function(index) {
        $(this).removeAttr('role').attr({ 'aria-label': `رفتن به اسلاید ${index + 1}`, type: 'button' });
      });
    };

    makeAccessible(hero);
    makeAccessible(projects);
    hero.on('initialized.owl.carousel refreshed.owl.carousel changed.owl.carousel', () => makeAccessible(hero));
    projects.on('initialized.owl.carousel refreshed.owl.carousel changed.owl.carousel', () => makeAccessible(projects));

    const resume = () => {
      if (document.hidden || reducedMotion || !hero.length) return;
      hero.trigger('play.owl.autoplay', [autoplayDuration]);
      resetProgress();
    };

    const pause = () => {
      hero.trigger('stop.owl.autoplay');
      pauseProgress();
    };

    document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
    window.addEventListener('pageshow', resume);
    window.addEventListener('orientationchange', () => window.setTimeout(resume, 300), { passive: true });
    hero.get(0)?.addEventListener('touchend', () => window.setTimeout(resume, 650), { passive: true });

    // Owl may already be initialized before event listeners receive the first event.
    window.setTimeout(resetProgress, 60);
  }

  function initDetailGalleries() {
    document.querySelectorAll('[data-detail-gallery]').forEach(gallery => {
      const slides = [...gallery.querySelectorAll('[data-gallery-slide]')];
      const thumbs = [...gallery.querySelectorAll('[data-gallery-thumb]')];
      if (!slides.length) return;
      let active = 0;

      const select = index => {
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
        thumbs.forEach((thumb, i) => {
          thumb.classList.toggle('is-active', i === active);
          thumb.setAttribute('aria-current', i === active ? 'true' : 'false');
        });
        thumbs[active]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
      };

      thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => select(index)));
      gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => select(active - 1));
      gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => select(active + 1));
      select(0);
    });
  }

  function initLightbox() {
    const modal = document.querySelector('[data-gallery-lightbox]');
    if (!(modal instanceof HTMLElement)) return;

    const image = modal.querySelector('[data-lightbox-image]');
    const viewport = modal.querySelector('[data-lightbox-viewport]');
    const thumbs = modal.querySelector('[data-lightbox-thumbs]');
    const title = modal.querySelector('[data-lightbox-title]');
    const counter = modal.querySelector('[data-lightbox-counter]');
    const resetButton = modal.querySelector('[data-lightbox-reset]');
    if (!(image instanceof HTMLImageElement) || !(viewport instanceof HTMLElement) || !(thumbs instanceof HTMLElement)) return;

    let items = [];
    let active = 0;
    let scale = 1;
    let x = 0;
    let y = 0;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let restoreFocus = null;

    const applyTransform = () => {
      image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      if (resetButton) resetButton.textContent = `${Math.round(scale * 100)}٪`;
    };

    const resetTransform = () => {
      scale = 1; x = 0; y = 0; applyTransform();
    };

    const render = () => {
      const item = items[active];
      if (!item) return;
      image.src = item.src;
      image.alt = item.alt || item.title || '';
      if (title) title.textContent = item.title || 'گالری تصاویر';
      if (counter) counter.textContent = `${active + 1} از ${items.length}`;
      resetTransform();

      thumbs.querySelectorAll('button').forEach((button, index) => {
        button.classList.toggle('is-active', index === active);
        button.setAttribute('aria-current', index === active ? 'true' : 'false');
      });
      thumbs.children[active]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    };

    const select = index => {
      active = (index + items.length) % items.length;
      render();
    };

    const open = (group, index, trigger) => {
      const triggers = [...document.querySelectorAll(`[data-gallery-group="${CSS.escape(group)}"]`)];
      items = triggers.map(node => ({
        src: node.getAttribute('data-gallery-src') || node.querySelector('img')?.currentSrc || node.querySelector('img')?.src || '',
        alt: node.getAttribute('data-gallery-alt') || node.querySelector('img')?.alt || '',
        title: node.getAttribute('data-gallery-title') || ''
      })).filter(item => item.src);
      if (!items.length) return;

      restoreFocus = trigger;
      active = Math.max(0, Math.min(index, items.length - 1));
      thumbs.replaceChildren(...items.map((item, thumbIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `نمایش تصویر ${thumbIndex + 1}`);
        const thumbImage = document.createElement('img');
        thumbImage.src = item.src;
        thumbImage.alt = '';
        thumbImage.loading = 'lazy';
        button.append(thumbImage);
        button.addEventListener('click', () => select(thumbIndex));
        return button;
      }));

      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sk-lightbox-open');
      render();
      modal.querySelector('[data-lightbox-close]')?.focus();
    };

    const close = () => {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sk-lightbox-open');
      image.removeAttribute('src');
      restoreFocus?.focus?.();
    };

    document.querySelectorAll('[data-gallery-group]').forEach((trigger, indexInDocument) => {
      trigger.addEventListener('click', event => {
        event.preventDefault();
        const group = trigger.getAttribute('data-gallery-group');
        if (!group) return;
        const groupItems = [...document.querySelectorAll(`[data-gallery-group="${CSS.escape(group)}"]`)];
        open(group, groupItems.indexOf(trigger), trigger);
      });
    });

    modal.querySelectorAll('[data-lightbox-close]').forEach(button => button.addEventListener('click', close));
    modal.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => select(active - 1));
    modal.querySelector('[data-lightbox-next]')?.addEventListener('click', () => select(active + 1));
    modal.querySelector('[data-lightbox-zoom-in]')?.addEventListener('click', () => { scale = Math.min(5, scale + .25); applyTransform(); });
    modal.querySelector('[data-lightbox-zoom-out]')?.addEventListener('click', () => { scale = Math.max(.5, scale - .25); applyTransform(); });
    resetButton?.addEventListener('click', resetTransform);
    image.addEventListener('dblclick', () => { scale = scale > 1 ? 1 : 2; x = 0; y = 0; applyTransform(); });

    viewport.addEventListener('wheel', event => {
      event.preventDefault();
      scale = Math.max(.5, Math.min(5, scale + (event.deltaY < 0 ? .15 : -.15)));
      applyTransform();
    }, { passive: false });

    viewport.addEventListener('pointerdown', event => {
      if (scale <= 1) return;
      dragging = true;
      startX = event.clientX; startY = event.clientY;
      originX = x; originY = y;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    });

    viewport.addEventListener('pointermove', event => {
      if (!dragging) return;
      x = originX + event.clientX - startX;
      y = originY + event.clientY - startY;
      applyTransform();
    });

    const endDrag = () => {
      dragging = false;
      viewport.classList.remove('is-dragging');
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    document.addEventListener('keydown', event => {
      if (modal.hidden) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') select(active + 1);
      if (event.key === 'ArrowRight') select(active - 1);
      if (event.key === '+') { scale = Math.min(5, scale + .25); applyTransform(); }
      if (event.key === '-') { scale = Math.max(.5, scale - .25); applyTransform(); }
    });
  }


  function initSectionRail() {
    const sections = [...document.querySelectorAll('[data-sk-scroll-section]')]
      .filter(section => section instanceof HTMLElement);

    if (sections.length < 3) return;

    const rail = document.createElement('nav');
    rail.className = 'sk-section-rail';
    rail.setAttribute('aria-label', 'پیمایش بخش‌های صفحه');

    const buttons = sections.map((section, index) => {
      if (!section.id) section.id = `sk-section-${index + 1}`;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sk-section-rail__item';
      button.dataset.label = section.getAttribute('data-scroll-label') || `بخش ${index + 1}`;
      button.setAttribute('aria-label', `رفتن به ${button.dataset.label}`);
      button.addEventListener('click', () => {
        const header = document.querySelector('[data-site-navbar]');
        const offset = header instanceof HTMLElement ? header.offsetHeight + 10 : 0;
        const top = section.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
      rail.append(button);
      return button;
    });

    document.body.append(rail);

    let activeIndex = -1;
    const update = () => {
      const reference = window.innerHeight * .42;
      let nextIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - reference);
        if (rect.top <= reference && rect.bottom >= reference) {
          nextIndex = index;
          bestDistance = -1;
          return;
        }
        if (bestDistance >= 0 && distance < bestDistance) {
          bestDistance = distance;
          nextIndex = index;
        }
      });

      if (activeIndex !== nextIndex) {
        activeIndex = nextIndex;
        buttons.forEach((button, index) => {
          const active = index === activeIndex;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-current', active ? 'true' : 'false');
        });
      }

      rail.classList.toggle('is-visible', window.scrollY > Math.min(180, window.innerHeight * .2));
    };

    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        update();
        scheduled = false;
      });
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  }

  function initScrollProgress() {
    const button = document.querySelector('.progress-wrap');
    const path = button?.querySelector('path');
    if (!(button instanceof HTMLElement) || !(path instanceof SVGPathElement)) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      path.style.strokeDashoffset = String(length - ratio * length);
      button.classList.toggle('active-progress', window.scrollY > 160);
    };

    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
    update();
  }
})();
