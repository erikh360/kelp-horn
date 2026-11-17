// Store links. Both stores went live 2026-11-11. If one is ever emptied, the page
// says "coming soon" instead of showing a badge that goes nowhere (docs/sharing.md, Open).
const APP_STORE_URL = 'https://apps.apple.com/app/id6820970192';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=dev.h360.kelphorn';

document.addEventListener('DOMContentLoaded', () => {
  for (const block of document.querySelectorAll('[data-stores]')) {
    const badges = block.querySelector('.badges');
    const soon = block.querySelector('.soon');
    // The official badges, from Apple's marketing tools and Google's badge page.
    // Width and height keep the layout steady while they load.
    const links = [
      [APP_STORE_URL, '/assets/badge-app-store.svg', 'Download on the App Store', 120, 40],
      [PLAY_STORE_URL, '/assets/badge-google-play.png', 'Get it on Google Play', 570, 172],
    ];
    for (const [url, src, label, width, height] of links) {
      if (!url) continue;
      const a = document.createElement('a');
      a.href = url;
      const img = document.createElement('img');
      img.src = src;
      img.alt = label;
      img.width = width;
      img.height = height;
      a.append(img);
      badges.append(a);
    }
    const any = badges.children.length > 0;
    badges.hidden = !any;
    soon.hidden = any;
  }
});
