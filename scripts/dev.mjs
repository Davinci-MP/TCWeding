// Chạy song song: API (Express) + Vite (giao diện, proxy /api và /media sang API).
// API tự khởi động lại khi sửa file trong server/ — chỉ theo dõi server/, không theo dõi data/ (ảnh tải lên).
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';

const tagged = (name) => (d) => process.stdout.write(String(d).split('\n').filter(Boolean).map((l) => `[${name}] ${l}\n`).join(''));
let stopping = false;
let api;

function startApi() {
  api = spawn(process.execPath, ['--env-file-if-exists=.env', 'server/index.js'], { stdio: ['ignore', 'pipe', 'pipe'] });
  api.stdout.on('data', tagged('api')); api.stderr.on('data', tagged('api'));
  api.on('exit', (code, sig) => { if (!stopping && sig !== 'SIGTERM') console.log(`[api] dừng (${code}) — sửa lỗi rồi lưu file trong server/ để chạy lại`); });
}
startApi();

let timer;
watch('server', { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => { console.log('[api] có thay đổi trong server/, khởi động lại…'); api.once('exit', startApi); api.kill('SIGTERM'); if (api.exitCode !== null) startApi(); }, 200);
});

const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
web.stdout.on('data', tagged('web')); web.stderr.on('data', tagged('web'));
web.on('exit', (code) => { stopping = true; api.kill(); process.exit(code ?? 0); });

const stop = () => { stopping = true; api.kill(); web.kill(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
