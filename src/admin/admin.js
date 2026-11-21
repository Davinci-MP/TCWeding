import { prepareDrivePicker, selectDrivePhotos } from './drive-picker.js';

// TCWedding quản trị — SPA nhỏ, điều hướng bằng hash: #/ · #/albums · #/albums/new · #/albums/:id
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const app = $('#app');
let ME = null;
let TAX = null;

// ---------- API ----------
class ApiError extends Error { constructor(msg, status, field) { super(msg); this.status = status; this.field = field; } }
async function api(path, opts = {}) {
  const init = { method: opts.method || 'GET', credentials: 'same-origin', headers: {} };
  if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
  const r = await fetch(path, init);
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !path.startsWith('/api/auth/login')) { ME = null; renderLogin('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.'); throw new ApiError('unauth', 401); }
  if (!r.ok) throw new ApiError(j.error || `Lỗi ${r.status}`, r.status, j.field);
  return j;
}
function toast(msg, err = false) {
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), err ? 6000 : 3200);
}
const fail = (e) => { if (e.status !== 401) toast(e.message || 'Có lỗi xảy ra.', true); };
const when = (s) => { if (!s) return ''; const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z'); return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); };
const canAlbums = () => ME?.perms.includes('albums');
const statusBadge = (a) => a.deletedAt ? '<span class="badge badge--trash">Thùng rác</span>' : a.status === 'published' ? '<span class="badge badge--published">Đã xuất bản</span>' : '<span class="badge badge--draft">Nháp</span>';
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

// ---------- Đăng nhập ----------
function renderLogin(msg = '') {
  document.title = 'Đăng nhập — Quản trị TCWedding';
  app.innerHTML = `<main class="login"><form class="login__card" id="loginForm" novalidate>
    <a class="brand" href="/"><span class="brand__mark">TC</span><span><span class="brand__word">TCWedding</span><small>Quản trị</small></span></a>
    <h1>Đăng nhập</h1>
    <label class="field"><span>Email</span><input name="email" type="email" autocomplete="username" required autofocus></label>
    <label class="field"><span>Mật khẩu</span><input name="password" type="password" autocomplete="current-password" required></label>
    <p class="err" id="loginErr" role="alert">${esc(msg)}</p>
    <button class="btn btn--pri" type="submit">Đăng nhập</button>
  </form></main>`;
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.currentTarget; const b = $('button', f); b.disabled = true;
    try { ME = await api('/api/auth/login', { method: 'POST', body: { email: f.email.value, password: f.password.value } }); TAX = null; route(); }
    catch (err) { $('#loginErr').textContent = err.message; b.disabled = false; }
  });
}
async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } catch {} ME = null; TAX = null; location.hash = '#/'; renderLogin(); }

// ---------- Khung ----------
function shell(active, inner) {
  return `<div class="mtop"><a class="brand" href="#/"><span class="brand__mark">TC</span><span class="brand__word">TCWedding</span></a><button type="button" id="sideBtn" aria-controls="side" aria-expanded="false" aria-label="Mở menu quản trị">☰</button></div>
  <div class="shell">
    <aside class="side" id="side">
      <a class="brand" href="#/"><span class="brand__mark">TC</span><span><span class="brand__word">TCWedding</span><small>Quản trị</small></span></a>
      <nav aria-label="Phân hệ quản trị">
        <a href="#/" ${active === 'dash' ? 'aria-current="page"' : ''}>Tổng quan</a>
        ${canAlbums() ? `<a href="#/albums" ${active === 'albums' ? 'aria-current="page"' : ''}>Album &amp; Portfolio</a>` : ''}
        <a class="soon" aria-disabled="true">Khách hàng <em>sắp có</em></a>
        <a class="soon" aria-disabled="true">Thiệp mời <em>sắp có</em></a>
      </nav>
      <a class="side__site" href="/" target="_blank" rel="noopener">Xem website ↗</a>
      <div class="side__user"><span><b>${esc(ME.name)}</b>${esc(ME.roleLabel)} · ${esc(ME.email)}</span><button class="btn btn--sm" type="button" id="logoutBtn">Đăng xuất</button></div>
    </aside>
    <main class="main" id="main">${inner}</main>
  </div>`;
}
function mount(active, inner, title) {
  document.title = `${title} — Quản trị TCWedding`;
  app.innerHTML = shell(active, inner);
  $('#logoutBtn').addEventListener('click', logout);
  const sb = $('#sideBtn'); const side = $('#side');
  sb.addEventListener('click', () => { const o = !side.classList.contains('open'); side.classList.toggle('open', o); sb.setAttribute('aria-expanded', String(o)); });
  side.addEventListener('click', (e) => { if (e.target.closest('a')) side.classList.remove('open'); });
  window.scrollTo(0, 0);
}

// ---------- Tổng quan ----------
const ACT = { 'album.create': 'tạo album', 'album.update': 'lưu album', 'album.publish': 'xuất bản', 'album.unpublish': 'gỡ xuất bản', 'album.trash': 'chuyển vào thùng rác', 'album.restore': 'khôi phục', 'album.cover': 'đổi ảnh bìa', 'photo.upload': 'tải ảnh lên', 'photo.drive-import': 'nhập ảnh từ Google Drive', 'photo.reorder': 'đổi thứ tự ảnh', 'photo.delete': 'xoá ảnh', 'taxonomy.create': 'thêm phân loại' };
async function viewDashboard() {
  if (!canAlbums()) {
    mount('dash', `<div class="top"><div><h1>Xin chào, ${esc(ME.name)}</h1><p>Vai trò: ${esc(ME.roleLabel)}</p></div></div>
      <div class="card"><h2>Chưa có phân hệ cho vai trò này</h2><p class="note">Mốc 1 chỉ gồm Album &amp; Portfolio, dành cho Admin và Marketing/Design. Phân hệ Khách hàng cho Sale/Tư vấn sẽ có ở mốc sau.</p></div>`, 'Tổng quan');
    return;
  }
  mount('dash', `<div class="top"><div><h1>Tổng quan</h1><p>Album và Portfolio của TCWedding</p></div><div class="top__actions"><a class="btn btn--pri" href="#/albums/new">+ Tạo album</a></div></div><div id="dashBody"><p class="note">Đang tải…</p></div>`, 'Tổng quan');
  try {
    const d = await api('/api/admin/dashboard');
    const wm = d.watermark;
    $('#dashBody').innerHTML = `<div class="stats">
        <a class="card stat" href="#/albums?status=draft"><b>${d.drafts}</b><span>Album nháp</span></a>
        <a class="card stat" href="#/albums?status=published"><b>${d.published}</b><span>Album đã xuất bản</span></a>
        <div class="card stat"><b>${d.photos}</b><span>Ảnh trong album</span></div>
        <a class="card stat" href="#/albums?status=trash"><b>${d.trash}</b><span>Trong thùng rác</span></a>
      </div>
      <div class="dash">
        <section class="card"><h2>Hoạt động gần đây</h2>${d.recent.length ? `<ul class="feed">${d.recent.map((r) => `<li><span><b>${esc(r.user || 'Hệ thống')}</b> ${esc(ACT[r.action] || r.action)}${r.album ? ` · <a href="#/albums/${r.album_id}">${esc(r.album)}</a>` : ''}${r.detail ? ` <span class="note">${esc(r.detail)}</span>` : ''}</span><time>${when(r.created_at)}</time></li>`).join('')}</ul>` : '<p class="empty">Chưa có hoạt động nào. Bắt đầu bằng nút Tạo album.</p>'}</section>
        <section class="card"><h2>Watermark</h2><p class="note">${wm.active ? 'Đang bật — logo được đóng lên bản hiển thị của ảnh tải lên mới. Bản gốc lưu riêng, không đóng dấu.' : wm.hasAsset ? 'Đã có file logo nhưng đang tắt (WATERMARK_ENABLED=false).' : 'Đang tắt — chưa có file logo TCWedding. Khi có logo PNG nền trong suốt, đặt vào data/brand/watermark.png và bật WATERMARK_ENABLED=true.'}</p></section>
      </div>`;
  } catch (e) { fail(e); }
}

// ---------- Danh sách album ----------
async function viewAlbums(status) {
  const tabs = [['all', 'Tất cả'], ['draft', 'Nháp'], ['published', 'Đã xuất bản'], ['trash', 'Thùng rác']];
  mount('albums', `<div class="top"><div><h1>Album &amp; Portfolio</h1><p>Album đã xuất bản hiện ở mục Bộ sưu tập trên website.</p></div><div class="top__actions"><a class="btn btn--pri" href="#/albums/new">+ Tạo album</a></div></div>
    <nav class="tabs" aria-label="Lọc theo trạng thái">${tabs.map(([k, l]) => `<a href="#/albums?status=${k}" ${k === status ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="alist" id="alist"><p class="note">Đang tải…</p></div>`, 'Album');
  try {
    const list = await api(`/api/admin/albums?status=${status}`);
    $('#alist').innerHTML = list.length ? list.map((a) => `<a class="arow" href="#/albums/${a.id}">
        <span class="thumb" style="${a.cover ? `background-image:url('${esc(a.cover.thumb)}')` : ''}"></span>
        <span><h3>${esc(a.title)}</h3><p>/${esc(a.slug)} · ${a.photoCount} ảnh${a.style ? ' · ' + esc(a.style) : ''}${a.category ? ' · ' + esc(a.category) : ''}</p></span>
        ${statusBadge(a)}<time>${when(a.updatedAt)}</time></a>`).join('')
      : `<div class="card"><p class="empty">${status === 'trash' ? 'Thùng rác trống.' : 'Chưa có album nào ở mục này.'}</p></div>`;
  } catch (e) { fail(e); }
}

// ---------- Sửa album ----------
async function loadTax() { if (!TAX) TAX = await api('/api/admin/taxonomies'); return TAX; }
const KIND_LABEL = { style: 'Phong cách', location: 'Địa điểm', category: 'Hạng mục' };

async function viewEditor(id) {
  const isNew = id === 'new';
  mount('albums', `<p class="note">Đang tải…</p>`, isNew ? 'Tạo album' : 'Sửa album');
  let A;
  try {
    await loadTax();
    A = isNew ? { title: '', slug: '', description: '', sortOrder: 0, styleId: null, locationId: null, categoryId: null, videoUrl: '', status: 'draft', photos: [], deletedAt: null } : await api(`/api/admin/albums/${id}`);
  } catch (e) { if (e.status === 404) { location.hash = '#/albums'; toast('Không tìm thấy album.', true); } else fail(e); return; }
  let slugTouched = !isNew;
  let dirty = false;

  const taxField = (kind) => `<label class="field" data-kind="${kind}"><span>${KIND_LABEL[kind]}</span>
      <span class="row-add"><select name="${kind}Id"><option value="">— Chưa chọn —</option>${TAX[kind].map((t) => `<option value="${t.id}" ${A[`${kind}Id`] === t.id ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select>
      <button type="button" class="btn btn--sm" data-add="${kind}" aria-label="Thêm lựa chọn ${KIND_LABEL[kind].toLowerCase()}">+ Thêm</button></span></label>`;

  const head = () => `<div class="top"><div><a class="crumb" href="#/albums">← Album</a><h1 id="edTitle">${isNew ? 'Tạo album' : esc(A.title)}</h1><p>${isNew ? 'Lưu nháp để bắt đầu tải ảnh.' : `${statusBadge(A)} <span class="note" id="dirtyNote"></span>`}</p></div>
    <div class="top__actions">
      ${A.deletedAt ? `<button class="btn" type="button" data-act="restore">Khôi phục</button>` : `
      <button class="btn" type="button" data-act="save">${isNew ? 'Lưu nháp' : 'Lưu'}</button>
      ${isNew ? '' : `<button class="btn" type="button" data-act="preview">Xem trước</button>
      ${A.status === 'published' ? `<button class="btn" type="button" data-act="unpublish">Gỡ xuất bản</button>` : `<button class="btn btn--ok" type="button" data-act="publish">Xuất bản</button>`}
      <button class="btn btn--ghost btn--danger" type="button" data-act="trash">Chuyển vào thùng rác</button>`}`}
    </div></div>`;

  $('#main').innerHTML = `<div id="edHead">${head()}</div>
    <div class="editor">
      <form class="card form" id="albumForm" novalidate>
        <h2>Thông tin album</h2>
        <label class="field"><span>Tên album *</span><input name="title" value="${esc(A.title)}" maxlength="150" required></label>
        <label class="field"><span>Slug (đường dẫn)</span><input name="slug" value="${esc(A.slug)}" maxlength="80" pattern="[a-z0-9-]+"><span class="hint">Chỉ chữ thường không dấu, số và gạch ngang. Mỗi album một slug riêng.</span></label>
        <label class="field"><span>Mô tả</span><textarea name="description" maxlength="5000">${esc(A.description)}</textarea></label>
        ${taxField('style')}${taxField('location')}${taxField('category')}
        <div class="grid2">
          <label class="field"><span>Thứ tự hiển thị</span><input name="sortOrder" type="number" step="1" value="${A.sortOrder}"><span class="hint">Số nhỏ hiện trước.</span></label>
          <label class="field"><span>Video / lookbook</span><input name="videoUrl" type="url" value="${esc(A.videoUrl)}" placeholder="Link YouTube hoặc Vimeo"></label>
        </div>
        <p class="err" id="formErr" role="alert"></p>
      </form>
      <section class="card" aria-labelledby="phTitle">
        <div class="sec-h"><h2 id="phTitle">Ảnh trong album</h2><span class="note" id="phCount"></span></div>
        <label class="drop" id="drop" ${isNew || A.deletedAt ? 'aria-disabled="true"' : ''}>
          <b>Kéo thả ảnh vào đây hoặc bấm để chọn</b><span>JPG, PNG, WebP · tối đa ${25} MB mỗi ảnh · chọn được nhiều ảnh</span>
          <input type="file" id="fileIn" class="sr" accept="image/jpeg,image/png,image/webp" multiple ${isNew || A.deletedAt ? 'disabled' : ''}>
        </label>
        ${isNew || A.deletedAt ? '' : `<div id="driveControls" ${A.status !== 'draft' ? 'hidden' : ''}>
          <button class="btn" type="button" id="driveImport" style="margin-top:12px">Nhập ảnh từ Google Drive</button>
          <p class="note" id="driveStatus" role="status"></p>
        </div>`}
        <div id="queueWrap"></div>
        <p class="note" style="margin-top:12px">Kéo ảnh để đổi thứ tự (hoặc dùng nút ‹ ›). Ảnh có viền đỏ là ảnh bìa.</p>
        <div class="photos" id="photos"></div>
      </section>
    </div>`;

  const form = $('#albumForm');
  const setDirty = (v) => { dirty = v; const n = $('#dirtyNote'); if (n) n.textContent = v ? '· Có thay đổi chưa lưu' : ''; };
  form.addEventListener('input', (e) => {
    if (e.target.name === 'slug') slugTouched = true;
    if (e.target.name === 'title' && !slugTouched) form.slug.value = slugify(e.target.value);
    setDirty(true);
  });
  const formData = () => ({ title: form.title.value, slug: form.slug.value, description: form.description.value, sortOrder: form.sortOrder.value, videoUrl: form.videoUrl.value, styleId: form.styleId.value || null, locationId: form.locationId.value || null, categoryId: form.categoryId.value || null });
  const showErr = (e) => {
    $$('.field.has-err', form).forEach((f) => f.classList.remove('has-err'));
    $('#formErr').textContent = e?.message || '';
    if (e?.field && form[e.field]) { form[e.field].closest('.field').classList.add('has-err'); form[e.field].focus(); }
  };

  // thêm lựa chọn phân loại mới
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const kind = b.dataset.add; const fld = b.closest('.field');
    if ($('.add-inline', fld)) { $('.add-inline input', fld).focus(); return; }
    fld.insertAdjacentHTML('beforeend', `<span class="add-inline"><input type="text" maxlength="60" placeholder="Tên ${KIND_LABEL[kind].toLowerCase()} mới" aria-label="Tên ${KIND_LABEL[kind].toLowerCase()} mới"><button type="button" class="btn btn--sm btn--pri">Lưu</button></span>`);
    const box = $('.add-inline', fld); const inp = $('input', box); inp.focus();
    const go = async () => {
      if (!inp.value.trim()) return;
      try {
        const t = await api('/api/admin/taxonomies', { method: 'POST', body: { kind, label: inp.value } });
        if (!TAX[kind].some((x) => x.id === t.id)) TAX[kind].push(t);
        const sel = form[`${kind}Id`]; if (![...sel.options].some((o) => o.value === String(t.id))) sel.add(new Option(t.label, t.id));
        sel.value = String(t.id); box.remove(); setDirty(true); toast(`Đã thêm "${t.label}"`);
      } catch (err) { fail(err); }
    };
    $('button', box).addEventListener('click', go);
    inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } if (ev.key === 'Escape') box.remove(); });
  });

  async function save() {
    showErr(null);
    try {
      const out = await api(isNew ? '/api/admin/albums' : `/api/admin/albums/${A.id}`, { method: isNew ? 'POST' : 'PUT', body: formData() });
      setDirty(false);
      if (isNew) { toast('Đã lưu nháp. Giờ bạn có thể tải ảnh lên.'); location.hash = `#/albums/${out.id}`; return null; }
      A = out; refreshHead(); toast('Đã lưu.'); return out;
    } catch (e) { showErr(e); fail(e); throw e; }
  }
  function refreshHead() { $('#edHead').innerHTML = head(); $('#edTitle').textContent = A.title; document.title = `${A.title} — Quản trị TCWedding`; }

  $('#edHead').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'publish' && (choosingDrive || running)) {
      toast('Hãy chờ quá trình tải ảnh hoàn tất trước khi xuất bản.', true);
      return;
    }
    b.disabled = true;
    try {
      if (act === 'save') await save();
      else if (act === 'preview') { if (dirty) await save(); window.open(`/?preview=${A.id}#bo-suu-tap`, '_blank', 'noopener'); }
      else if (act === 'publish') { if (dirty) await save(); A = await api(`/api/admin/albums/${A.id}/publish`, { method: 'POST' }); refreshHead(); syncDriveControls(); renderPhotos(); toast('Đã xuất bản — album hiện trên website.'); }
      else if (act === 'unpublish') { A = await api(`/api/admin/albums/${A.id}/unpublish`, { method: 'POST' }); refreshHead(); syncDriveControls(); toast('Đã gỡ xuất bản — album không còn hiện trên website.'); }
      else if (act === 'trash') { if (!confirm(`Chuyển album "${A.title}" vào thùng rác? Album sẽ bị gỡ khỏi website; có thể khôi phục sau.`)) { b.disabled = false; return; } await api(`/api/admin/albums/${A.id}/trash`, { method: 'POST' }); toast('Đã chuyển vào thùng rác.'); location.hash = '#/albums?status=trash'; return; }
      else if (act === 'restore') { await api(`/api/admin/albums/${A.id}/restore`, { method: 'POST' }); toast('Đã khôi phục album (ở trạng thái nháp).'); viewEditor(String(A.id)); return; }
    } catch (err) { if (act !== 'save') fail(err); }
    const nb = $(`[data-act="${act}"]`); if (nb) nb.disabled = false;
  });

  // ----- ảnh -----
  function renderPhotos() {
    const ps = A.photos || [];
    $('#phCount').textContent = ps.length ? `${ps.length} ảnh` : '';
    $('#photos').innerHTML = ps.length ? ps.map((p, i) => `<figure class="ph ${p.id === A.coverPhotoId ? 'is-cover' : ''}" draggable="true" data-id="${p.id}" style="margin:0">
        <img src="${esc(p.thumb)}" alt="${esc(p.name)}" loading="lazy" width="300" height="300">
        ${p.id === A.coverPhotoId ? '<span class="tag">Ảnh bìa</span>' : ''}<span class="idx">${i + 1}</span>
        <div class="acts">
          <button type="button" data-mv="-1" aria-label="Đưa ảnh ${i + 1} lên trước" ${i === 0 ? 'disabled' : ''}>‹</button>
          <button type="button" data-cover ${p.id === A.coverPhotoId ? 'disabled' : ''}>${p.id === A.coverPhotoId ? 'Đang là bìa' : 'Đặt làm bìa'}</button>
          <button type="button" data-mv="1" aria-label="Đưa ảnh ${i + 1} ra sau" ${i === ps.length - 1 ? 'disabled' : ''}>›</button>
          <button type="button" class="del" data-del aria-label="Xoá ảnh ${esc(p.name)}">✕</button>
        </div></figure>`).join('') : (isNew ? '' : '<p class="empty" style="grid-column:1/-1">Chưa có ảnh nào.</p>');
  }
  renderPhotos();

  async function saveOrder(ids) {
    const prev = A.photos; A.photos = ids.map((id) => prev.find((p) => p.id === id)); renderPhotos();
    try { A = await api(`/api/admin/albums/${A.id}/photos/order`, { method: 'PUT', body: { ids } }); renderPhotos(); }
    catch (e) { A.photos = prev; renderPhotos(); fail(e); }
  }
  const grid = $('#photos');
  grid.addEventListener('click', async (e) => {
    const fig = e.target.closest('.ph'); if (!fig) return; const pid = fig.dataset.id;
    const ids = A.photos.map((p) => p.id); const i = ids.indexOf(pid);
    if (e.target.closest('[data-mv]')) { const d = Number(e.target.closest('[data-mv]').dataset.mv); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; await saveOrder(ids); }
    else if (e.target.closest('[data-cover]')) { try { A = await api(`/api/admin/albums/${A.id}/cover`, { method: 'PUT', body: { photoId: pid } }); renderPhotos(); toast('Đã đổi ảnh bìa.'); } catch (err) { fail(err); } }
    else if (e.target.closest('[data-del]')) { if (!confirm('Xoá ảnh này và các bản lưu trên website?')) return; try { A = await api(`/api/admin/photos/${pid}`, { method: 'DELETE' }); renderPhotos(); toast('Đã xoá ảnh.'); } catch (err) { fail(err); } }
  });
  // kéo thả đổi thứ tự
  let dragId = null;
  grid.addEventListener('dragstart', (e) => { const f = e.target.closest('.ph'); if (!f) return; dragId = f.dataset.id; f.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
  grid.addEventListener('dragend', () => { dragId = null; $$('.ph', grid).forEach((f) => f.classList.remove('dragging', 'drop-before')); });
  grid.addEventListener('dragover', (e) => { if (!dragId) return; e.preventDefault(); const f = e.target.closest('.ph'); $$('.ph', grid).forEach((x) => x.classList.toggle('drop-before', x === f && f.dataset.id !== dragId)); });
  grid.addEventListener('drop', (e) => {
    if (!dragId) return; e.preventDefault(); const f = e.target.closest('.ph');
    const ids = A.photos.map((p) => p.id).filter((x) => x !== dragId);
    const at = f ? ids.indexOf(f.dataset.id) : ids.length; ids.splice(at < 0 ? ids.length : at, 0, dragId);
    saveOrder(ids);
  });

  // tải ảnh: mỗi ảnh một yêu cầu, 3 ảnh song song, tiến độ + lỗi riêng từng ảnh, thử lại ảnh lỗi
  const queue = [];
  let running = 0;
  let choosingDrive = false;
  let driveToken;
  let pickerConfig;
  const queueWrap = $('#queueWrap');
  const driveControls = $('#driveControls');
  const driveButton = $('#driveImport');
  const driveStatus = $('#driveStatus');
  function syncDriveControls() {
    if (driveControls) driveControls.hidden = A.status !== 'draft';
  }
  async function loadDrivePicker() {
    const settings = await api('/api/admin/drive/config');
    if (!settings.enabled) throw new Error('Chưa cấu hình Google Drive. Xem hướng dẫn trong README.');
    await prepareDrivePicker();
    pickerConfig = settings;
  }
  if (driveButton) {
    driveButton.addEventListener('click', async () => {
      choosingDrive = true;
      driveButton.disabled = true;
      driveStatus.textContent = '';
      try {
        if (!pickerConfig) {
          await loadDrivePicker();
          driveStatus.textContent = 'Đã sẵn sàng. Bấm nút để chọn ảnh.';
          return;
        }
        const selection = await selectDrivePhotos(pickerConfig);
        if (!selection || !queueWrap.isConnected) return;
        driveToken = selection.token;
        for (const drive of selection.files) {
          const previous = queue.find((entry) => entry.drive?.id === drive.id);
          if (previous) {
            const wasRemoved = previous.state === 'ok' && !A.photos.some((photo) => photo.id === previous.photoId);
            if (previous.state === 'fail' || wasRemoved) {
              Object.assign(previous, { drive, state: 'wait', pct: 0 });
            }
          } else queue.push({ drive, state: 'wait', pct: 0 });
        }
        renderQueue();
        pump();
      } catch (err) {
        driveStatus.textContent = err.message;
      } finally {
        choosingDrive = false;
        driveButton.disabled = false;
      }
    });
    if (!driveControls.hidden) {
      driveButton.disabled = true;
      loadDrivePicker().catch((err) => { driveStatus.textContent = err.message; })
        .finally(() => { driveButton.disabled = false; });
    }
  }
  function renderQueue() {
    const done = queue.filter((q) => q.state === 'ok').length; const failed = queue.filter((q) => q.state === 'fail').length;
    queueWrap.innerHTML = queue.length ? `<div class="qhead"><span>Đã xong ${done}/${queue.length}${failed ? ` · <b style="color:var(--err)">${failed} lỗi</b>` : ''}</span>
      <span>${failed ? '<button type="button" class="btn btn--sm" data-retry-all>Thử lại ảnh lỗi</button>' : ''} ${queue.every((q) => q.state === 'ok' || q.state === 'fail') ? '<button type="button" class="btn btn--sm btn--ghost" data-clear>Ẩn danh sách</button>' : ''}</span></div>
      <ul class="queue">${queue.map((q, i) => `<li class="${q.state}"><span class="name">${esc(q.drive?.name || q.file?.name || 'Ảnh Google Drive')}</span><span>${q.state === 'ok' ? '✓ Xong' : q.state === 'fail' ? `<button type="button" class="btn btn--sm" data-retry="${i}">Thử lại</button>` : q.state === 'wait' ? 'Đang chờ' : (q.drive ? 'Đang nhập' : `${q.pct}%`)}</span>
        <span class="bar"><i style="width:${q.state === 'ok' ? 100 : q.pct}%"></i></span>${q.state === 'fail' ? `<span class="msg">${esc(q.error)}</span>` : ''}</li>`).join('')}</ul>` : '';
  }
  queueWrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-retry]')) { const q = queue[Number(e.target.closest('[data-retry]').dataset.retry)]; q.state = 'wait'; q.pct = 0; renderQueue(); pump(); }
    if (e.target.closest('[data-retry-all]')) { queue.filter((q) => q.state === 'fail').forEach((q) => { q.state = 'wait'; q.pct = 0; }); renderQueue(); pump(); }
    if (e.target.closest('[data-clear]')) { queue.length = 0; renderQueue(); }
  });
  async function importDrivePhoto(q) {
    try {
      const { id: fileId, name, resourceKey } = q.drive;
      const photo = await api(`/api/admin/albums/${A.id}/photos/drive`, {
        method: 'POST', body: { fileId, name, resourceKey, accessToken: driveToken },
      });
      q.state = 'ok';
      q.photoId = photo.id;
      if (!A.photos.some((item) => item.id === photo.id)) A.photos.push(photo);
      if (!A.coverPhotoId) A.coverPhotoId = photo.id;
      if (queueWrap.isConnected) renderPhotos();
    } catch (err) {
      q.state = 'fail';
      q.error = err.status === 401 ? 'Phiên đăng nhập quản trị đã hết.' : err.message;
    }
  }
  function sendOne(q) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest(); const fd = new FormData(); fd.append('file', q.file, q.file.name);
      xhr.open('POST', `/api/admin/albums/${A.id}/photos`); xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) { q.pct = Math.min(95, Math.round((e.loaded / e.total) * 95)); renderQueue(); } };
      xhr.onload = () => {
        let j = {}; try { j = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status === 201) { q.state = 'ok'; A.photos.push(j); if (!A.coverPhotoId) A.coverPhotoId = j.id; if (queueWrap.isConnected) renderPhotos(); }
        else if (xhr.status === 401) { q.state = 'fail'; q.error = 'Phiên đăng nhập đã hết.'; }
        else { q.state = 'fail'; q.error = j.error || `Lỗi ${xhr.status}`; }
        resolve();
      };
      xhr.onerror = () => { q.state = 'fail'; q.error = 'Mất kết nối tới máy chủ.'; resolve(); };
      xhr.send(fd);
    });
  }
  async function pump() {
    while (queueWrap.isConnected && running < 3) {
      const q = queue.find((x) => x.state === 'wait'); if (!q) break;
      q.state = 'up'; q.pct = 0; running++; renderQueue();
      const task = q.drive ? importDrivePhoto(q) : sendOne(q);
      task.then(() => {
        running--;
        if (!queueWrap.isConnected) return;
        renderQueue();
        pump();
        if (!running && !queue.some((x) => x.state === 'wait')) refreshAlbum();
      });
    }
  }
  async function refreshAlbum() {
    try {
      const album = await api(`/api/admin/albums/${A.id}`);
      if (!queueWrap.isConnected || running) return;
      A = album;
      renderPhotos();
    } catch {}
  }
  const addFiles = (files) => { for (const f of files) queue.push({ file: f, state: 'wait', pct: 0, error: '' }); renderQueue(); pump(); };
  $('#fileIn').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  const drop = $('#drop');
  drop.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); drop.classList.add('over'); } });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); if (!isNew && !A.deletedAt) addFiles(e.dataTransfer.files); });

  window.onbeforeunload = () => (dirty || running ? true : undefined);
}

// ---------- Định tuyến ----------
async function route() {
  window.onbeforeunload = null;
  if (!ME) { try { ME = await api('/api/auth/me'); } catch { return; } }
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?'); const q = new URLSearchParams(qs || '');
  const m = path.match(/^\/albums\/(new|\d+)$/);
  if ((path === '/albums' || m) && !canAlbums()) { toast('Tài khoản của bạn không có quyền quản lý album.', true); location.hash = '#/'; return; }
  if (m) return viewEditor(m[1]);
  if (path === '/albums') return viewAlbums(q.get('status') || 'all');
  return viewDashboard();
}
window.addEventListener('hashchange', route);
route();
