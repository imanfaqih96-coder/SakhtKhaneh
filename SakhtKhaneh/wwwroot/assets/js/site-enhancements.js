(() => {
  'use strict';

  const ready = callback => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  ready(() => {
    initContactForm();
    normalizeExternalLinks();

    // Analytics must never compete with the hero, fonts or layout for first paint.
    const schedule = window.requestIdleCallback
      ? callback => window.requestIdleCallback(callback, { timeout: 2500 })
      : callback => window.setTimeout(callback, 1600);
    schedule(recordVisit);
  });

  function initContactForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!(form instanceof HTMLFormElement)) return;

    const status = form.querySelector('[data-contact-status]');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const phone = String(formData.get('phone') ?? '').trim();
      if (!/^09\d{9}$/.test(phone)) {
        showStatus('شماره تلفن همراه باید ۱۱ رقم و با 09 شروع شود.', false);
        return;
      }

      const payload = {
        name: String(formData.get('name') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        phone,
        subject: String(formData.get('subject') ?? '').trim(),
        content: String(formData.get('message') ?? '').trim()
      };

      submitButton?.setAttribute('disabled', 'disabled');
      showStatus('در حال ارسال پیام…', true, false);

      try {
        const response = await fetch('/api/SendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || 'ارسال پیام انجام نشد.');

        form.reset();
        showStatus(result.message || 'پیام شما با موفقیت ثبت شد.', true);
      } catch (error) {
        showStatus(error instanceof Error ? error.message : 'خطا در ارتباط با سرور.', false);
      } finally {
        submitButton?.removeAttribute('disabled');
      }
    });

    function showStatus(message, success, complete = true) {
      if (!(status instanceof HTMLElement)) return;
      status.textContent = message;
      status.className = `contact-status is-visible ${success ? 'is-success' : 'is-error'}`;
      status.setAttribute('role', complete && !success ? 'alert' : 'status');
    }
  }

  function recordVisit() {
    if (navigator.doNotTrack === '1') return;

    const body = document.body;
    const payload = JSON.stringify({
      path: `${location.pathname}${location.search}`,
      pathType: body.dataset.visitType || 'static',
      pathParam: body.dataset.visitParam || null,
      geolocation: null
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/submitVisitRecord', blob)) return;
    }

    fetch('/api/submitVisitRecord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => undefined);
  }

  function normalizeExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      link.setAttribute('rel', [...rel].join(' '));
    });
  }
})();
