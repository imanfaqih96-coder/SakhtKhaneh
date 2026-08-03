/*
 * Local, dependency-free SVG icon renderer for Angular Material <mat-icon> elements.
 * It removes the admin panel's dependency on Google Material Icons fonts.
 */
(() => {
  'use strict';

  const p = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.5 3.5-7 8-7s7.2 2.5 8 7"/>',
    users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.7-4 2.8-6 6-6s5.3 2 6 6M15 15c3 0 5 1.7 6 5"/>',
    home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/>',
    images: '<rect x="6" y="5" width="15" height="14" rx="2"/><path d="M3 16V5a2 2 0 0 1 2-2h13"/><circle cx="12" cy="10" r="2"/><path d="m7 17 4-4 3 3 2-2 4 4"/>',
    file: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    article: '<path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    folder: '<path d="M3 6h7l2 2h9v11H3V6Z"/>',
    folders: '<path d="M3 8h6l2 2h9v9H3V8Z"/><path d="M5 8V5h6l2 2h7v3"/>',
    tag: '<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M7 3 4 6c1 7 7 13 14 14l3-3-4-4-3 2c-2-1-4-3-5-5l2-3-4-4Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l2 2M14 9l2 2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-3Z"/><path d="M9 12l2 2 4-5"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m3 3 18 18M10.5 6.2A11 11 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-2.2 3M6.2 6.2C3.7 8 2 12 2 12s4 6 10 6c1.1 0 2.1-.2 3-.5M9.9 9.9A3 3 0 0 0 14.1 14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 19h16"/>',
    save: '<path d="M5 3h12l3 3v15H4V3h1Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.5 8A7 7 0 0 1 19 10M17.5 16A7 7 0 0 1 5 14"/>',
    warning: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.6-1.5.9-1.9-2.1-2.1-1.9.9-1.5-.6L11.1 2h-3l-.7 2-1.5.6-1.9-.9-2.1 2.1.9 1.9-.6 1.5-2 .7v3l2 .7.6 1.5-.9 1.9L4 19.1l1.9-.9 1.5.6.7 2h3l.7-2 1.5-.6 1.9.9 2.1-2.1-.9-1.9.6-1.5 2-.6Z" transform="translate(1.5 0) scale(.88)"/>',
    location: '<path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3v-4a3 3 0 0 1 3-3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    login: '<path d="M10 4H5v16h5M13 8l4 4-4 4M8 12h9"/>',
    logout: '<path d="M14 4h5v16h-5M11 8l-4 4 4 4M16 12H7"/>',
    arrowForward: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    book: '<path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2V5ZM20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2V5Z"/>',
    tools: '<path d="m14 6 4-4 4 4-4 4M3 21l8-8M8 4l12 12-4 4L4 8 8 4Z"/>',
    badge: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6.5 16c.5-2 1.3-3 2.5-3s2 .9 2.5 3M14 10h3M14 14h3"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/>',
    text: '<path d="M4 5h16M12 5v14M8 19h8"/>',
    align: '<path d="M4 6h16M4 10h12M4 14h16M4 18h10"/>',
    dashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>'
  };

  const aliases = {
    dashboard: p.dashboard,
    layers: p.layers,
    home: p.home,
    info: p.info,
    home_repair_service: p.tools,
    phone_enabled: p.phone,
    call: p.phone,
    perm_media: p.images,
    photo_library: p.images,
    photo_camera: p.image,
    photo: p.image,
    image_search: p.image,
    add_photo_alternate: p.image + p.plus,
    grid_view: p.grid,
    view_module: p.grid,
    auto_stories: p.book,
    article: p.article,
    description: p.file,
    dashboard_customize: p.grid,
    group: p.users,
    person: p.user,
    account_circle: p.user,
    manage_accounts: p.user + p.settings,
    person_add: p.user + p.plus,
    how_to_reg: p.user + p.check,
    badge: p.badge,
    alternate_email: p.mail,
    email: p.mail,
    mail: p.mail,
    add: p.plus,
    check: p.check,
    cancel: p.close,
    delete: p.trash,
    edit: p.edit,
    search: p.search,
    settings: p.settings,
    folder: p.folder,
    folder_open: p.folder,
    account_tree: p.layers,
    construction: p.tools,
    keyboard_arrow_up: p.arrowForward,
    keyboard_arrow_down: p.arrowForward,
    contact_page: p.badge,
    share: p.route,
    query_stats: p.dashboard,
    folders: p.folders,
    title: p.text,
    text_fields: p.align,
    tag: p.tag,
    lock: p.lock,
    password: p.key,
    key: p.key,
    vpn_key: p.key,
    shield_lock: p.shield,
    visibility: p.eye,
    visibility_off: p.eyeOff,
    save: p.save,
    upload: p.upload,
    cloud_upload: p.upload,
    replay: p.refresh,
    warning: p.warning,
    login: p.login,
    logout: p.logout,
    arrow_forward: p.arrowForward,
    open_in_new: p.external,
    route: p.route,
    travel_explore: p.globe,
    language: p.globe,
    location_on: p.location,
    pin_drop: p.location,
    menu: p.menu
  };

  const svg = paths => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths || p.grid}</svg>`;

  const render = element => {
    if (!(element instanceof Element) || element.tagName.toLowerCase() !== 'mat-icon') return;
    const currentText = (element.textContent || '').trim();
    const iconName = currentText || element.dataset.localIconName;
    if (!iconName) return;
    if (element.dataset.localIconName === iconName && element.querySelector('svg')) return;
    element.dataset.localIconName = iconName;
    element.classList.add('local-svg-icon');
    element.innerHTML = svg(aliases[iconName]);
  };

  const scan = root => {
    if (root instanceof Element && root.matches('mat-icon')) render(root);
    if (root.querySelectorAll) root.querySelectorAll('mat-icon').forEach(render);
  };

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        render(mutation.target.parentElement);
        continue;
      }
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        else if (node.nodeType === Node.TEXT_NODE) render(node.parentElement);
      });
    }
  });

  const start = () => {
    scan(document);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
