import { config } from './config.js';
import { MediaError } from './media.js';

export const driveEnabled = () => Object.values(config.drive).every(Boolean);
const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(value);

export async function downloadDrivePhoto({ fileId, resourceKey, accessToken }) {
  if (!validId(fileId) || (resourceKey && !validId(resourceKey)) ||
      typeof accessToken !== 'string' || !/^[A-Za-z0-9._~+/=-]{1,4096}$/.test(accessToken)) {
    throw new MediaError('Thông tin ảnh Google Drive không hợp lệ.');
  }

  const limit = config.maxUploadMb * 1024 * 1024;
  const oversized = () => new MediaError(`Ảnh vượt quá ${config.maxUploadMb} MB.`, 413);
  const headers = { Authorization: `Bearer ${accessToken}` };
  if (resourceKey) headers['X-Goog-Drive-Resource-Keys'] = `${fileId}/${resourceKey}`;
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
  try {
    const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(45_000) });
    if (!response.ok || Number(response.headers.get('content-length')) > limit) {
      await response.body?.cancel();
      if (response.ok) throw oversized();
      if (response.status === 401) throw new MediaError('Phiên Google Drive đã hết. Hãy kết nối lại.', 424);
      if ([403, 404].includes(response.status)) throw new MediaError('Không có quyền tải ảnh này từ Google Drive.', 424);
      throw new MediaError('Google Drive chưa trả được ảnh. Hãy thử lại.', 502);
    }

    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > limit) throw oversized();
      chunks.push(chunk);
    }
    return Buffer.concat(chunks, bytes);
  } catch (err) {
    if (err instanceof MediaError) throw err;
    throw new MediaError('Không tải được ảnh từ Google Drive. Hãy thử lại.', 502);
  }
}
