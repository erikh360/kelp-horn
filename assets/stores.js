// Store links. Empty until the listings exist: the page then says "coming soon"
// instead of showing badges that go nowhere (docs/sharing.md, Open).
const APP_STORE_URL = '';
const PLAY_STORE_URL = '';

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
