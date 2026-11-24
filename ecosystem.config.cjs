// PM2: giữ website chạy nền trên VPS và tự khởi động lại khi lỗi / khi máy chủ khởi động lại.
// Dùng: pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "tcwedding",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
      max_memory_restart: "700M",
      time: true,
    },
  ],
};
