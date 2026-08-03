(() => {
  'use strict';
  const allowsCustomZoom = target => target instanceof Element && Boolean(target.closest('[data-allow-zoom]'));
  const block = event => {
    if (!allowsCustomZoom(event.target)) event.preventDefault();
  };

  document.addEventListener('gesturestart', block, { passive: false });
  document.addEventListener('gesturechange', block, { passive: false });
  document.addEventListener('gestureend', block, { passive: false });
  document.addEventListener('wheel', event => {
    if ((event.ctrlKey || event.metaKey) && !allowsCustomZoom(event.target)) event.preventDefault();
  }, { passive: false });
  document.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (['+', '=', '-', '_', '0'].includes(event.key)) event.preventDefault();
  });

  let lastTouchEnd = 0;
  document.addEventListener('touchend', event => {
    if (allowsCustomZoom(event.target)) return;
    const now = Date.now();
    if (now - lastTouchEnd < 350) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
})();
