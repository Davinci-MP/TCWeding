import sharp from 'sharp';

const image = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#dbc5af' } }).jpeg().toBuffer();
const realFetch = globalThis.fetch;
globalThis.fetch = (url, options) => {
  const { origin, pathname, searchParams } = new URL(url);
  if (origin !== 'https://www.googleapis.com') return realFetch(url, options);
  if (options.headers.Authorization !== 'Bearer fixture' || searchParams.get('alt') !== 'media') {
    return Promise.resolve(new Response(null, { status: 401 }));
  }
  const fileId = pathname.split('/').pop();
  if (fileId === 'missing') return Promise.resolve(new Response(null, { status: 404 }));
  if (fileId === 'oversized') {
    return Promise.resolve(new Response(Buffer.alloc(6 * 1024 * 1024)));
  }
  return Promise.resolve(new Response(fileId === 'invalid-image' ? 'not a photo' : image));
};
