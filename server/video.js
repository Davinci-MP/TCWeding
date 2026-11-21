// Nhận link YouTube/Vimeo, trả về link nhúng. Link khác -> null (bị từ chối khi lưu).
export function parseVideo(url) {
  const u = String(url || '').trim();
  if (!u) return { ok: true, embed: '' };
  let m = u.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (m) return { ok: true, provider: 'youtube', id: m[1], embed: `https://www.youtube-nocookie.com/embed/${m[1]}` };
  m = u.match(/^(?:https?:\/\/)?(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d{6,12})(?:\/([0-9a-f]{6,}))?/i);
  if (m) return { ok: true, provider: 'vimeo', id: m[1], embed: `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ''}` };
  return { ok: false };
}
