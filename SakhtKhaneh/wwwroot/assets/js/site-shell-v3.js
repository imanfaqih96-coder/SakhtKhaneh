(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const body = document.body;

    const onReady = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    };

    onReady(() => {
        body.classList.add('sk-ui-ready');
        initNavbar();
        initRevealAnimations();
        initHeroSlider();
        initCarouselControls();
        initImageStates();
        initInternalAnchors();
        hidePreloaderSafely();
    });

    function initNavbar() {
        const navbar = document.querySelector('[data-site-navbar]');
        const collapseElement = document.getElementById('siteNavbar');
        const toggler = navbar?.querySelector('.navbar-toggler');
        const closeButton = document.querySelector('[data-navbar-close]');
        const backdrop = document.querySelector('[data-navbar-backdrop]');

        if (!(navbar instanceof HTMLElement)) return;

        let previousScroll = window.scrollY;
        let ticking = false;

        const updateNavbar = () => {
            const currentScroll = Math.max(window.scrollY, 0);
            const shouldStick = currentScroll > 42;
            const shouldHide = currentScroll > previousScroll && currentScroll > 420 && !body.classList.contains('sk-menu-open');

            navbar.classList.toggle('is-scrolled', shouldStick);
            navbar.classList.toggle('is-hidden', shouldHide);
            previousScroll = currentScroll;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateNavbar);
        }, { passive: true });

        updateNavbar();

        if (!(collapseElement instanceof HTMLElement)) return;

        const getCollapse = () => {
            if (!window.bootstrap?.Collapse) return null;
            return window.bootstrap.Collapse.getOrCreateInstance(collapseElement, { toggle: false });
        };

        const openState = () => {
            body.classList.add('sk-menu-open');
            backdrop?.classList.add('is-visible');
            toggler?.setAttribute('aria-expanded', 'true');
            navbar.classList.remove('is-hidden');
        };

        const closedState = () => {
            body.classList.remove('sk-menu-open');
            backdrop?.classList.remove('is-visible');
            toggler?.setAttribute('aria-expanded', 'false');
        };

        collapseElement.addEventListener('show.bs.collapse', openState);
        collapseElement.addEventListener('shown.bs.collapse', openState);
        collapseElement.addEventListener('hide.bs.collapse', closedState);
        collapseElement.addEventListener('hidden.bs.collapse', closedState);

        const closeMenu = () => {
            const instance = getCollapse();
            if (instance) {
                instance.hide();
            } else {
                collapseElement.classList.remove('show');
                closedState();
            }
        };

        closeButton?.addEventListener('click', closeMenu);
        backdrop?.addEventListener('click', closeMenu);

        collapseElement.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 992) closeMenu();
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && body.classList.contains('sk-menu-open')) {
                closeMenu();
                toggler?.focus();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) closedState();
        }, { passive: true });
    }

    function initRevealAnimations() {
        const legacyElements = document.querySelectorAll('.animate-box');
        legacyElements.forEach(element => {
            if (!element.hasAttribute('data-sk-reveal')) {
                const legacyEffect = element.getAttribute('data-animate-effect');
                const direction = legacyEffect === 'fadeInLeft'
                    ? 'left'
                    : legacyEffect === 'fadeInRight'
                        ? 'right'
                        : 'up';
                element.setAttribute('data-sk-reveal', direction);
            }
        });

        const elements = [...document.querySelectorAll('[data-sk-reveal]')];
        if (!elements.length) return;

        elements.forEach((element, index) => {
            const localIndex = Number(element.getAttribute('data-sk-delay-index') ?? index % 5);
            element.style.setProperty('--sk3-reveal-delay', `${Math.min(localIndex, 6) * 65}ms`);
        });

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            elements.forEach(element => element.classList.add('is-revealed'));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -7% 0px',
            threshold: 0.08
        });

        elements.forEach(element => observer.observe(element));
    }

    function initHeroSlider() {
        const hero = document.querySelector('[data-home-hero]');
        const progress = hero?.querySelector('[data-hero-progress]');
        if (!(hero instanceof HTMLElement)) return;

        const setProgress = () => {
            if (!(progress instanceof HTMLElement) || prefersReducedMotion) return;
            progress.classList.remove('is-running');
            void progress.offsetWidth;
            progress.classList.add('is-running');
        };

        const configure = () => {
            const $ = window.jQuery;
            if (!$?.fn?.owlCarousel) return false;

            const slider = $(hero).find('.owl-carousel');
            if (!slider.length || !slider.hasClass('owl-loaded')) return false;

            const previousIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const nextIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

            slider.find('.owl-prev').html(previousIcon).attr('aria-label', 'اسلاید قبلی');
            slider.find('.owl-next').html(nextIcon).attr('aria-label', 'اسلاید بعدی');

            slider.off('.sk3hero');
            slider.on('changed.owl.carousel.sk3hero translated.owl.carousel.sk3hero', setProgress);

            const play = () => {
                if (!document.hidden && !prefersReducedMotion) {
                    slider.trigger('play.owl.autoplay', [5000]);
                    setProgress();
                }
            };

            const pause = () => slider.trigger('stop.owl.autoplay');

            document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());
            window.addEventListener('pageshow', play);
            window.addEventListener('orientationchange', () => window.setTimeout(play, 350), { passive: true });
            hero.addEventListener('touchend', () => window.setTimeout(play, 700), { passive: true });

            if (prefersReducedMotion) pause(); else play();
            return true;
        };

        let attempts = 0;
        const waitForSlider = window.setInterval(() => {
            attempts += 1;
            if (configure() || attempts > 30) window.clearInterval(waitForSlider);
        }, 100);
    }

    function initCarouselControls() {
        const configure = () => {
            const $ = window.jQuery;
            if (!$?.fn?.owlCarousel) return false;

            const previousIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const nextIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

            $('.project-page .owl-carousel.owl-loaded').each(function () {
                $(this).find('.owl-prev').html(previousIcon).attr('aria-label', 'تصویر قبلی');
                $(this).find('.owl-next').html(nextIcon).attr('aria-label', 'تصویر بعدی');
            });

            return $('.project-page .owl-carousel').length === 0 || $('.project-page .owl-carousel.owl-loaded').length > 0;
        };

        let attempts = 0;
        const timer = window.setInterval(() => {
            attempts += 1;
            if (configure() || attempts > 30) window.clearInterval(timer);
        }, 100);
    }

    function initImageStates() {
        document.querySelectorAll('img').forEach(image => {
            const markLoaded = () => image.classList.add('is-loaded');
            if (image.complete) markLoaded();
            else image.addEventListener('load', markLoaded, { once: true });
        });
    }

    function initInternalAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', event => {
                const targetId = anchor.getAttribute('href');
                if (!targetId || targetId === '#') return;
                const target = document.querySelector(targetId);
                if (!(target instanceof HTMLElement)) return;
                event.preventDefault();
                target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
            });
        });
    }

    function hidePreloaderSafely() {
        const preloader = document.getElementById('preloader');
        const background = document.querySelector('.preloader-bg');
        if (!preloader && !background) return;

        let hidden = false;
        const hide = () => {
            if (hidden) return;
            hidden = true;
            preloader?.classList.add('fade-out');
            background?.classList.add('fade-out');
            window.setTimeout(() => {
                preloader?.remove();
                background?.remove();
            }, 650);
        };

        if (document.readyState === 'complete') hide();
        else window.addEventListener('load', hide, { once: true });
        window.setTimeout(hide, 4200);
    }
})();
