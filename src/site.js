// Thông tin website (liên hệ, mạng xã hội, nội dung trang chủ) từ /api/public/site — sửa trong /admin/ › Thông tin website.
//   data-site="key"          thay chữ bên trong (trống thì giữ chữ mặc định có sẵn)
//   data-site-link="key"     đặt href (tel:, mailto:, link mạng xã hội); thêm data-site-keep-text để giữ nhãn
//   data-site-wrap="key"     ẩn khi trường trống
//   data-site-group          ẩn khi mọi data-site-wrap bên trong đều ẩn
const root = document.documentElement;

function setText(el, value) {
  if (!el.hasAttribute('data-site-multiline')) { el.textContent = value; return; }
  // xuống dòng -> <br>, an toàn vì chỉ tạo text node
  const nodes = [];
  value.split('\n').forEach((line, i) => { if (i) nodes.push(document.createElement('br')); nodes.push(document.createTextNode(line)); });
  el.replaceChildren(...nodes);
}

function apply(site) {
  const all = { ...site.contact, ...site.social, ...site.home };
  const href = { phone: site.contact.phoneHref, email: site.contact.emailHref };
  document.querySelectorAll('[data-site]').forEach((el) => { const v = all[el.dataset.site]; if (v) setText(el, v); });
  document.querySelectorAll('[data-site-link]').forEach((a) => {
    const k = a.dataset.siteLink; const url = href[k] || all[k];
    if (!url) return;
    a.href = url;
    if (!a.hasAttribute('data-site-keep-text')) a.textContent = all[k];
  });
  document.querySelectorAll('[data-site-wrap]').forEach((el) => { el.hidden = !all[el.dataset.siteWrap]; });
  document.querySelectorAll('[data-site-group]').forEach((g) => { g.hidden = !g.querySelector('[data-site-wrap]:not([hidden])'); });
}

fetch('/api/public/site', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : null))
  .then((site) => { if (site) apply(site); })
  .catch(() => {})
  .finally(() => root.classList.remove('site-loading'));
