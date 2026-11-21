// Ô ảnh: hiện ảnh thật khi file có trong /public/images, giữ khung chờ khi chưa có
document.querySelectorAll('.slot img').forEach((img) => {
  const slot = img.closest('.slot');
  const ok = () => slot.classList.add('is-loaded');
  if (img.complete && img.naturalWidth > 0) ok();
  else img.addEventListener('load', ok, { once: true });
});

// Menu mobile
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const setMenu = (open) => {
  nav.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
};
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); } });
matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

// Header đổi nền khi rời hero
const hdr = document.getElementById('hdr');
const onScroll = () => hdr.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.75);
if (document.body.dataset.page === 'home') { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); }

// Đánh dấu mục menu đang xem
const links = [...document.querySelectorAll('[data-nav]')];
const mark = (id) => links.forEach((a) => (a.dataset.nav === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
if (document.body.dataset.page === 'profile') mark('profile');
else {
  const ids = ['trang-chu', 'bo-suu-tap', 'thiep-moi', 'bang-gia', 'lien-he'];
  const secs = ids.map((id) => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) mark(en.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach((s) => io.observe(s));
  // phần giới thiệu thuộc trang chủ
  const intro = document.getElementById('gioi-thieu');
  if (intro) new IntersectionObserver((en) => { if (en[0].isIntersecting) mark('trang-chu'); }, { rootMargin: '-45% 0px -50% 0px' }).observe(intro);
}

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
