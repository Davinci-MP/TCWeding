// Bộ sưu tập: tải album đã xuất bản từ API khi mở trang — xuất bản/gỡ trong /admin/ là thấy ngay, không cần build lại.
// Mở album: #album-<slug>. Xem trước nháp (chỉ người đăng nhập quản trị): /?preview=<id>
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const grid = $('#colGrid');
const filter = $('#colFilter');
const empty = $('#colEmpty');
const viewer = $('#viewer');
const vBody = $('#vBody');
const lb = $('#lb');
let albums = [];
let current = null;
let lbIndex = 0;
let lastFocus = null;
let cat = '';

const meta = (a) => [a.category, a.style, a.location].filter(Boolean).map(esc).join(' · ');

function card(a) {
  const c = a.cover;
  return `<a class="album" href="#album-${esc(a.slug)}" data-slug="${esc(a.slug)}">
    <figure class="slot is-loaded">${c ? `<img src="${esc(c.thumb)}" alt="Ảnh bìa album ${esc(a.title)}" loading="lazy" width="${c.width}" height="${c.height}">` : ''}</figure>
    <span class="album__name">${esc(a.title)}</span>
    <span class="album__meta">${meta(a)}${meta(a) ? ' · ' : ''}${a.photoCount} ảnh</span></a>`;
}

function renderGrid() {
  const list = cat ? albums.filter((a) => a.category === cat) : albums;
  grid.innerHTML = list.map(card).join('');
  grid.setAttribute('aria-busy', 'false');
  empty.hidden = albums.length > 0;
  const cats = [...new Set(albums.map((a) => a.category).filter(Boolean))];
  filter.hidden = cats.length < 2;
  filter.innerHTML = cats.length < 2 ? '' : [['', 'Tất cả'], ...cats.map((c) => [c, c])]
    .map(([v, l]) => `<button type="button" class="chip" data-cat="${esc(v)}" aria-pressed="${v === cat}">${esc(l)}</button>`).join('');
}

async function loadAlbums() {
  try {
    const r = await fetch('/api/public/albums', { cache: 'no-cache' });
    albums = r.ok ? await r.json() : [];
  } catch { albums = []; }
  renderGrid();
}

filter.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; renderGrid(); });

// ---------- trình xem album ----------
function openViewer(a, preview = false) {
  current = a;
  lastFocus = document.activeElement;
  $('#vFlag').hidden = !preview;
  vBody.innerHTML = `<div class="wrap">
      <header class="viewer__head">
        <p class="eyebrow">${meta(a) || 'Album ảnh cưới'}</p>
        <h2 class="h2" id="vTitle">${esc(a.title)}</h2>
        ${a.description ? `<p class="lead">${esc(a.description).replace(/\n/g, '<br>')}</p>` : ''}
      </header>
      ${a.video ? `<div class="viewer__video"><iframe src="${esc(a.video.embed)}" title="Video ${esc(a.title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : ''}
      <div class="viewer__grid">${a.photos.map((p, i) => `<button type="button" class="viewer__ph" data-i="${i}" aria-label="Xem ảnh ${i + 1} trên ${a.photos.length}" style="aspect-ratio:${p.width}/${p.height}"><img src="${esc(p.thumb)}" alt="" loading="lazy" width="${p.width}" height="${p.height}"></button>`).join('')}</div>
      <div class="viewer__cta"><a class="btn btn--pri" href="#lien-he" data-close>Đặt lịch tư vấn</a></div>
    </div>`;
  viewer.hidden = false;
  viewer.scrollTop = 0;
  document.body.classList.add('menu-open');
  $('.viewer__close', viewer).focus();
}
function closeViewer(goHash) {
  if (viewer.hidden) return;
  viewer.hidden = true; vBody.innerHTML = ''; current = null;
  document.body.classList.remove('menu-open');
  if (goHash !== false && location.hash.startsWith('#album-')) history.replaceState(null, '', '#bo-suu-tap');
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
viewer.addEventListener('click', (e) => {
  const ph = e.target.closest('.viewer__ph'); if (ph) return openLb(Number(ph.dataset.i));
  const c = e.target.closest('[data-close]');
  if (c) { const toContact = c.getAttribute('href') === '#lien-he'; closeViewer(!toContact); if (toContact) { e.preventDefault(); location.hash = 'lien-he'; } }
});

// ---------- ảnh lớn ----------
function openLb(i) {
  const ps = current.photos; lbIndex = (i + ps.length) % ps.length;
  const p = ps[lbIndex]; const img = $('#lbImg');
  img.src = p.large; img.width = p.width; img.height = p.height; img.alt = `${current.title} — ảnh ${lbIndex + 1}`;
  $('#lbPos').textContent = `${lbIndex + 1} / ${ps.length}`;
  lb.hidden = false; $('.lb__close', lb).focus();
  // tải trước ảnh kế tiếp
  const n = ps[(lbIndex + 1) % ps.length]; if (n) { const pre = new Image(); pre.src = n.large; }
}
const closeLb = () => { lb.hidden = true; $('#lbImg').removeAttribute('src'); const b = vBody.querySelector(`[data-i="${lbIndex}"]`); if (b) b.focus(); };
lb.addEventListener('click', (e) => {
  if (e.target.closest('[data-lb]')) openLb(lbIndex + Number(e.target.closest('[data-lb]').dataset.lb));
  else if (e.target.closest('[data-lbclose]') || e.target === lb) closeLb();
});
let tx0 = null;
lb.addEventListener('touchstart', (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => { if (tx0 === null) return; const dx = e.changedTouches[0].clientX - tx0; if (Math.abs(dx) > 50) openLb(lbIndex + (dx < 0 ? 1 : -1)); tx0 = null; });

document.addEventListener('keydown', (e) => {
  if (!lb.hidden) { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') openLb(lbIndex + 1); if (e.key === 'ArrowLeft') openLb(lbIndex - 1); return; }
  if (!viewer.hidden && e.key === 'Escape') closeViewer();
});

// ---------- hash ----------
async function fromHash() {
  const m = location.hash.match(/^#album-([a-z0-9-]+)$/);
  if (!m) { closeViewer(false); return; }
  try {
    const r = await fetch(`/api/public/albums/${m[1]}`, { cache: 'no-cache' });
    // album không tồn tại hoặc đã gỡ xuất bản: đóng trình xem, về lưới bộ sưu tập
    if (!r.ok) { closeViewer(false); history.replaceState(null, '', '#bo-suu-tap'); document.getElementById('bo-suu-tap')?.scrollIntoView(); return; }
    openViewer(await r.json());
  } catch {}
}
window.addEventListener('hashchange', fromHash);

async function boot() {
  await loadAlbums();
  // lưới tải xong sau lần cuộn tới anchor đầu tiên -> căn lại khi mở thẳng /#bo-suu-tap
  if (location.hash === '#bo-suu-tap') document.getElementById('bo-suu-tap')?.scrollIntoView({ behavior: 'instant' });
  const pid = new URLSearchParams(location.search).get('preview');
  if (pid) {
    const r = await fetch(`/api/admin/albums/${encodeURIComponent(pid)}/preview`, { credentials: 'same-origin' });
    if (r.ok) return openViewer(await r.json(), true);
  }
  fromHash();
}
boot();
