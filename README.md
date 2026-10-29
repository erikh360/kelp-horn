# kelp-horn-website

`kelphorn.h360.dev` on GitHub Pages: the home page, the privacy policy, the share page for
WhatsApp links, and the files that let those links open the app. Plain static HTML, CSS and
JavaScript. No build step, no framework. The decisions behind it are in `docs/sharing.md`
and `docs/backend.md` (decision 6) in the parent folder.

| Path | What |
|---|---|
| `/` | Home page |
| `/whale-watching-hermanus/` | Guide to watching from the shore: season, the 20 spots, tips. The page people search for. |
| `/privacy/` | Privacy policy. App Store review needs it. |
| `/delete-account/` | How to delete an account, in the app or by email. Play's Data safety form needs the URL. |
| `/s/?id={sighting_id}` | Share page. Loads the sighting in the browser from `sightings_public`. |
| `/.well-known/` | `apple-app-site-association` and `assetlinks.json`, for Universal Links and App Links |
| `/llms.txt` | Plain-text summary for AI assistants |
| `og.jpg` | The one link preview image, 1200×630. Keep it under 300 KB or WhatsApp drops it. |

Search and AI discovery, and what to do after deploying, are in `docs/discovery.md` in the
parent folder. The FAQ on the home page is in its JSON-LD too: change both together.

`.nojekyll` is what makes GitHub Pages serve `.well-known`. Don't delete it.

## Before the first push

```sh
grep -rn TODO-BEFORE-PUSH .
```

- [x] **Privacy policy:** the contact line at the bottom (h360.dev and the email).

## Later, when the pieces exist

```sh
grep -rn TODO-LATER .
```

- [x] **Apple Team ID** in `.well-known/apple-app-site-association`: `97735R5A4C`.
- [ ] **Associated domains in the app.** It needs `associatedDomains: ["applinks:kelphorn.h360.dev"]`.
- [x] **Android signing SHA-256** in `.well-known/assetlinks.json`: the Play App Signing key,
  from the Play Console (Protected with Play).
- [ ] **Android intent filter in the app**, an `intentFilters` entry for `https://kelphorn.h360.dev/s/`.
- [ ] **The app handling `/s/?id=`.** A Universal Link lands on the route `/s` with the id.
  The app has no such route yet; it should open the spot sheet, or the map if the sighting
  is gone.
- [ ] **Store links** in `assets/stores.js`. While they're empty, pages say "Coming soon".
- [ ] **Check that iOS accepts the association file.** GitHub Pages serves it as
  `application/octet-stream`. Apple's CDN has accepted that for years, but confirm with
  `curl https://app-site-association.cdn-apple.com/a/v1/kelphorn.h360.dev` once it's live.

## Security

- Everything from the database goes onto the page with `textContent`, never `innerHTML`
  (security concerns, low 8).
- The share page checks that `id` is a UUID before querying with it.
- The publishable key in `s/sighting.js` is the same one the app ships. It only reaches
  what RLS gives anon.
- Each page has a Content Security Policy: scripts from this site only, network requests
  only to the Supabase project, images only from here and OpenStreetMap's tiles.
- **Only ever put an `sb_publishable_…` key in here.** An `sb_secret_…` or service-role
  key on a static page hands out the whole database, and this repo is public, so a
  committed secret stays in the history until the key is rotated.
- **If the publishable key is rotated**, change it here and in the app together, or the
  share page stops loading sightings.

## Checking it locally

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/s/?id=<a sighting id from today>`. The page talks to the
hosted project, so it needs a real sighting from today.
