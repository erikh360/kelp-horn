// Store links. Both stores went live 2026-11-11. If one is ever emptied, the page
// says "coming soon" instead of showing a badge that goes nowhere (docs/sharing.md, Open).
const APP_STORE_URL = 'https://apps.apple.com/app/id6820970192';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=dev.h360.kelphorn';

document.addEventListener('DOMContentLoaded', () => {
  for (const block of document.querySelectorAll('[data-stores]')) {
    const badges = block.querySelector('.badges');
    const soon = block.querySelector('.soon');
    const links = [
      [APP_STORE_URL, 'App Store'],
      [PLAY_STORE_URL, 'Google Play'],
    ];
    for (const [url, label] of links) {
      if (!url) continue;
      const a = document.createElement('a');
      a.href = url;
      a.textContent = label;
      badges.append(a);
    }
    const any = badges.children.length > 0;
    badges.hidden = !any;
    soon.hidden = any;
  }
});
