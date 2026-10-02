// The share page: /s/?id={sighting_id}. See docs/sharing.md, decision 3.
//
// It reads the same fields anonymous viewers of the app can, with the same
// publishable key, and nothing more. Everything that came from the database goes
// onto the page with textContent, never innerHTML: credited_name and spot names
// are typed by people (security concerns, low 8).

const SUPABASE_URL = 'https://ywbdosltbwhucwzpvawz.supabase.co';
// Publishable, like the one in the app: it only gets what RLS gives anon.
const SUPABASE_KEY = 'sb_publishable_Qfa2wUssvxGdJF6iu5pMwg_eNeFM63N';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The wording below matches kelp-horn-app/src/lib/format.ts. Keep them together.

const NOUNS = {
  southern_right: ['Southern right whale', 'Southern right whales'],
  humpback: ['Humpback whale', 'Humpback whales'],
  brydes: ["Bryde's whale", "Bryde's whales"],
  orca: ['Orca', 'Orcas'],
  dolphin: ['Dolphin', 'Dolphins'],
  unknown: ['Whale', 'Whales'],
};

const COUNT_LABELS = { one: '1', two: '2', three: '3', several: 'Several' };
const BEHAVIOUR_LABELS = { breaching: 'breaching', floating: 'floating' };

// South Africa has no daylight saving, so SAST is always UTC+2. Times are shown
// in SAST even on a tourist's phone that is still on home time.
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

function noun(sighting) {
  const [one, many] = NOUNS[sighting.species] ?? NOUNS.unknown;
  return sighting.count === 'one' ? one : many;
}

function detailLine(sighting) {
  const parts = sighting.count ? [COUNT_LABELS[sighting.count]] : [];
  for (const behaviour of sighting.behaviours ?? []) {
    if (BEHAVIOUR_LABELS[behaviour]) parts.push(BEHAVIOUR_LABELS[behaviour]);
  }
  return parts.join(' · ');
}

function sastTime(iso) {
  const local = new Date(Date.parse(iso) + SAST_OFFSET_MS);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}

function confirmedPhrase(count) {
  if (!count || count <= 0) return null;
  return count === 1 ? '1 person confirmed' : `${count} people confirmed`;
}

async function select(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!response.ok) throw new Error(`${response.status} for ${path}`);
  return response.json();
}

// A static map: the few OpenStreetMap tiles around the spot, with a pin in the
// middle. No map library, and no WebGL, which OpenStreetMap's own embed now needs.
// Sharp screens get tiles from one zoom level deeper at half the size, so the
// map shows the same area either way.
function drawMap(container, lat, lng) {
  const sharp = window.devicePixelRatio > 1;
  const zoom = sharp ? 16 : 15;
  const tile = sharp ? 128 : 256;
  const worldTiles = 2 ** zoom;

  // The spot, in tiles from the top left of the world.
  const rad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * worldTiles;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * worldTiles;

  const width = container.clientWidth;
  const height = container.clientHeight;
  const left = x * tile - width / 2;
  const top = y * tile - height / 2;

  for (let ty = Math.floor(top / tile); ty * tile < top + height; ty++) {
    for (let tx = Math.floor(left / tile); tx * tile < left + width; tx++) {
      const img = document.createElement('img');
      img.src = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
      img.alt = '';
      img.width = tile;
      img.height = tile;
      img.style.left = `${Math.round(tx * tile - left)}px`;
      img.style.top = `${Math.round(ty * tile - top)}px`;
      container.prepend(img);
    }
  }

  container.href = `https://www.openstreetmap.org/?mlat=${lat.toFixed(5)}&mlon=${lng.toFixed(5)}#map=16/${lat.toFixed(5)}/${lng.toFixed(5)}`;
}

function show(id) {
  document.getElementById('loading').hidden = true;
  document.getElementById(id).hidden = false;
}

function field(section, name) {
  return document.querySelector(`#${section} [data-field="${name}"]`);
}

async function load() {
  const id = new URLSearchParams(location.search).get('id') ?? '';
  // Check the id before it goes anywhere near a query.
  if (!UUID.test(id)) return show('gone');

  // sightings_public only has today's sightings that haven't been removed. Anything
  // else, and any id that never existed, comes back empty and gets the same page.
  const columns = 'id,spot_id,area_id,species,count,behaviours,last_seen_at,expires_at,confirm_count,credited_name';
  const [sighting] = await select(`sightings_public?id=eq.${id}&select=${columns}`);
  if (!sighting) return show('gone');

  const [spots, areas] = await Promise.all([
    select(`spots?id=eq.${encodeURIComponent(sighting.spot_id)}&select=name,lat,lng`),
    select(`areas?id=eq.${encodeURIComponent(sighting.area_id)}&select=name`),
  ]);
  const spot = spots[0];
  const area = areas[0];
  if (!spot) return show('gone');

  const place = area ? `${spot.name}, ${area.name}` : spot.name;
  const live = Date.parse(sighting.expires_at) > Date.now();

  if (!live) {
    field('grey', 'last-seen').textContent =
      `${noun(sighting)} ${sighting.count === 'one' ? 'was' : 'were'} last seen at ${spot.name} at ${sastTime(sighting.last_seen_at)}.`;
    document.title = `${spot.name} · Kelp Horn`;
    return show('grey');
  }

  field('live', 'title').textContent = `${noun(sighting)} at ${place}`;

  const detail = detailLine(sighting);
  field('live', 'detail').textContent = detail;
  field('live', 'detail').hidden = !detail;

  const confirmed = confirmedPhrase(sighting.confirm_count);
  const seen = `Seen ${sastTime(sighting.last_seen_at)}`;
  field('live', 'seen').textContent = confirmed ? `${seen} · ${confirmed}` : seen;

  const credit = field('live', 'credit');
  credit.textContent = sighting.credited_name ? `Posted by ${sighting.credited_name}` : '';
  credit.hidden = !sighting.credited_name;

  document.title = `${noun(sighting)} at ${spot.name} · Kelp Horn`;
  show('live');
  // After show(): the map needs its laid-out size to know which tiles to fetch.
  drawMap(field('live', 'map'), spot.lat, spot.lng);
}

load().catch((error) => {
  console.error(error);
  show('error');
});
