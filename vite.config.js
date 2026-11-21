import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Ghép phần dùng chung (header, footer) vào từng trang: <!-- @include header -->
const partials = () => ({
  name: 'tc-partials',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
        readFileSync(resolve(__dirname, `src/partials/${name}.html`), 'utf8'),
      );
    },
  },
});

const api = `http://localhost:${process.env.PORT || 8787}`;

export default defineConfig({
  plugins: [partials()],
  server: {
    proxy: { '/api': api, '/media': api },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        profile: resolve(__dirname, 'profile/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
