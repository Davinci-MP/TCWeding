#!/usr/bin/env node
// QA kho mẫu thiệp bằng Chrome điều khiển qua DevTools Protocol (Node ≥ 22, không cần cài thêm gói).
//
//   1. Chạy server có trang /dev/mau/<id>:  npm run dev   (hoặc: npm run build && TCW_QA=1 npx next start -p 3005)
//   2. Đo tràn khung:  node scripts/qa-templates.mjs --base http://localhost:3005
//      Chụp ảnh:       node scripts/qa-templates.mjs --base http://localhost:3005 --shots --designs
//
// Tuỳ chọn: --widths 320,390,768,1440  --data long,empty  --ids a,b  --designs (chỉ thiết kế gốc)  --jobs 6  --out .tmp/qa
//           --sizes 390x844,1440x900,390x0 (0 = trọn trang)  --motion (không bật giảm chuyển động)
// Kết quả: <out>/report.json; ảnh ở <out>/shots và bảng ảnh <out>/sheet-*.html khi có --shots.

import { spawn, execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i < 0 ? d : args[i + 1];
};
const flag = (k) => args.includes(`--${k}`);

const BASE = opt("base", "http://localhost:3005").replace(/\/$/, "");
const WIDTHS = opt("widths", "320,390,768,1440").split(",").map(Number);
const DATA = opt("data", "long,empty").split(",");
const JOBS = Number(opt("jobs", "6"));
const OUT = resolve(opt("out", ".tmp/qa"));
const SHOTS = flag("shots");
const CHROME =
  process.env.CHROME ??
  ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => existsSync(p));
if (!CHROME) throw new Error("Không tìm thấy Chrome (đặt biến CHROME=đường dẫn)");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function templateList() {
  const only = opt("ids", "");
  if (only) return only.split(",");
  mkdirSync(OUT, { recursive: true });
  const tmp = join(OUT, "list-templates.mts");
  const rel = relative(OUT, resolve("src/templates/registry.ts")).replace(/\\/g, "/");
  writeFileSync(tmp, `import { TEMPLATES } from "./${rel}"; console.log(JSON.stringify(TEMPLATES.map((t) => ({ id: t.id, base: t.baseId ?? null }))));`);
  const list = JSON.parse(execSync(`npx tsx "${tmp}"`, { encoding: "utf8" }).trim().split("\n").pop());
  return (flag("designs") ? list.filter((t) => !t.base) : list).map((t) => t.id);
}

/* ---------------- Chrome + CDP tối giản ---------------- */
async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "tcwqa-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/json/version`);
      return { port, close: () => (proc.kill(), setTimeout(() => rmSync(profile, { recursive: true, force: true }), 1000)) };
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Chrome không khởi động được");
}

async function openTab(port) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    } else listeners.forEach((f) => f(m));
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const k = ++id;
      pending.set(k, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
      ws.send(JSON.stringify({ id: k, method, params }));
    });
  const waitEvent = (name, ms = 30000) =>
    new Promise((res) => {
      const t = setTimeout(() => (listeners.delete(f), res(null)), ms);
      const f = (m) => m.method === name && (clearTimeout(t), listeners.delete(f), res(m.params));
      listeners.add(f);
    });
  await send("Page.enable");
  await send("Runtime.enable");
  return { send, waitEvent, close: () => (ws.close(), fetch(`http://127.0.0.1:${port}/json/close/${t.id}`).catch(() => {})) };
}

async function load(tab, url, width, height) {
  // tab chạy nền không tải ảnh lazy / không chạy animation: đưa tab lên trước
  await tab.send("Page.bringToFront").catch(() => {});
  await tab.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await tab.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: flag("motion") ? "no-preference" : "reduce" }] });
  const loaded = tab.waitEvent("Page.loadEventFired", 45000);
  await tab.send("Page.navigate", { url });
  await loaded;
  // chờ trang QA đo xong (document.title = QA-DONE)
  for (let i = 0; i < 60; i++) {
    const r = await tab.send("Runtime.evaluate", { expression: "document.title", returnByValue: true });
    if (r.result.value === "QA-DONE") return true;
    await sleep(250);
  }
  return false;
}

async function measureOne(tab, id, width, data) {
  const ok = await load(tab, `${BASE}/dev/mau/${encodeURIComponent(id)}?data=${data}`, width, 900);
  if (!ok) return { id, width, data, error: "hết thời gian chờ" };
  const r = await tab.send("Runtime.evaluate", { expression: "document.getElementById('qa-result')?.textContent", returnByValue: true });
  return r.result.value ? { width, ...JSON.parse(r.result.value) } : { id, width, data, error: "không đọc được kết quả" };
}

/** Chụp riêng một mục (vd #mung-cuoi): cuộn tới mục để ảnh lazy tự tải, chờ ảnh trong mục xong rồi cắt đúng khung mục. */
async function sectionShot(tab, id, width, data, section) {
  const file = join(OUT, "shots", `${id}__${width}x${section}__${data}.png`);
  await load(tab, `${BASE}/dev/mau/${encodeURIComponent(id)}?data=${data}`, width, 900);
  const expr = `(async () => {
    const el = document.getElementById(${JSON.stringify(section)});
    if (!el) return null;
    el.scrollIntoView({ block: "start" });
    const imgs = [...el.querySelectorAll("img")];
    imgs.forEach((i) => (i.loading = "eager"));
    await Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); }))));
    await new Promise((r) => setTimeout(r, 900));
    const r = el.getBoundingClientRect();
    return { x: 0, y: Math.round(r.top + scrollY), width: ${width}, height: Math.min(Math.round(r.height), 6000) };
  })()`;
  const r = await tab.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  const clip = r.result.value;
  if (!clip) return null;
  const shot = await tab.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...clip, scale: 1 } });
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  return file;
}

async function shotOne(tab, id, width, height, data) {
  const file = join(OUT, "shots", `${id}__${width}x${height || "full"}__${data}.png`);
  await load(tab, `${BASE}/dev/mau/${encodeURIComponent(id)}?data=${data}${height ? "" : "&full=1"}`, width, height || 900);
  await sleep(1200); // ảnh hiện dần (opacity 0,7 giây) sau khi tải xong
  let clip;
  if (!height) {
    const r = await tab.send("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true });
    clip = { x: 0, y: 0, width, height: Math.min(r.result.value, 16000), scale: 0.5 };
  }
  const shot = await tab.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !height, ...(clip ? { clip } : {}) });
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  return file;
}

async function pool(items, worker) {
  const chrome = await launchChrome();
  const results = [];
  let i = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: JOBS }, async () => {
      const tab = await openTab(chrome.port);
      while (i < items.length) {
        const k = i++;
        try {
          results[k] = await worker(tab, items[k]);
        } catch (e) {
          results[k] = { id: items[k][0], width: items[k][1], error: String(e.message ?? e) };
        }
        if (++done % 25 === 0 || done === items.length) process.stderr.write(`  ${done}/${items.length}\n`);
      }
      tab.close();
    }),
  );
  chrome.close();
  return results;
}

const ids = templateList();
mkdirSync(join(OUT, "shots"), { recursive: true });

const SECTION = opt("section", "");
if (SHOTS && SECTION) {
  const widths = opt("widths", "390").split(",").map(Number);
  const data = DATA[0];
  const jobs = ids.flatMap((id) => widths.map((w) => [id, w]));
  console.error(`Chụp mục #${SECTION}: ${jobs.length} ảnh…`);
  const files = (await pool(jobs, (tab, [id, w]) => sectionShot(tab, id, w, data, SECTION))).filter((f) => typeof f === "string");
  for (let p = 0; p < files.length; p += 8) {
    const cells = files
      .slice(p, p + 8)
      .map((f) => `<figure><img src="file:///${f.replace(/\\/g, "/")}"><figcaption>${f.split(/[\\/]/).pop().split("__")[0]}</figcaption></figure>`)
      .join("");
    writeFileSync(join(OUT, `sheet-${SECTION}-${p / 8 + 1}.html`), `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#777;font:14px sans-serif;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px;align-items:start}figure{margin:0;background:#fff}img{width:100%;display:block}figcaption{padding:2px 6px;font-weight:600}</style>${cells}`);
  }
  console.error(`Xong. ${files.length} ảnh ở ${join(OUT, "shots")}`);
} else if (SHOTS) {
  const sizes = opt("sizes", "390x844,1440x900,390x0").split(",").map((s) => s.split("x").map(Number));
  const data = DATA[0];
  const jobs = ids.flatMap((id) => sizes.map(([w, h]) => [id, w, h]));
  console.error(`Chụp ${jobs.length} ảnh (${ids.length} mẫu, dữ liệu "${data}")…`);
  const files = await pool(jobs, (tab, [id, w, h]) => shotOne(tab, id, w, h, data));
  for (const [w, h] of sizes) {
    const tag = `__${w}x${h || "full"}__`;
    const group = files.filter((f) => typeof f === "string" && f.includes(tag));
    const per = h ? (w > 800 ? 4 : 8) : 6;
    for (let p = 0; p < group.length; p += per) {
      const cells = group
        .slice(p, p + per)
        .map((f) => `<figure><img src="file:///${f.replace(/\\/g, "/")}"><figcaption>${f.split(/[\\/]/).pop().split("__")[0]}</figcaption></figure>`)
        .join("");
      const cols = h ? (w > 800 ? 2 : 4) : 6;
      writeFileSync(join(OUT, `sheet-${w}x${h || "full"}-${p / per + 1}.html`), `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#777;font:14px sans-serif;display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:8px;align-items:start}figure{margin:0;background:#fff}img{width:100%;display:block}figcaption{padding:2px 6px;font-weight:600}</style>${cells}`);
    }
  }
  console.error(`Xong. Ảnh ở ${join(OUT, "shots")}`);
} else {
  const jobs = ids.flatMap((id) => WIDTHS.flatMap((w) => DATA.map((d) => [id, w, d])));
  console.error(`Đo ${jobs.length} lượt (${ids.length} mẫu × ${WIDTHS.length} khổ × ${DATA.length} bộ dữ liệu)…`);
  const results = await pool(jobs, (tab, [id, w, d]) => measureOne(tab, id, w, d));
  writeFileSync(join(OUT, "report.json"), JSON.stringify(results, null, 1));
  const bad = results.filter((r) => r.error || r.docOverflow > 0 || r.outsideCount > 0 || r.textOverflowCount > 0 || r.textCutCount > 0);
  console.log(`Đã đo ${results.length} lượt, ${new Set(results.map((r) => r.id)).size} mẫu. Có vấn đề: ${bad.length}.`);
  for (const r of bad.slice(0, Number(opt("show", "80"))))
    console.log(
      `- ${r.id} @${r.width} [${r.variant ?? r.data}] ${r.error ?? `cuộn ngang ${r.docOverflow}px · lộ khung ${r.outsideCount} · chữ tràn ${r.textOverflowCount} · chữ lố màn ${r.textCutCount}`}${r.outside?.[0] ? ` · vd ${r.outside[0].sel} "${r.outside[0].text}" (${r.outside[0].left}→${r.outside[0].right})` : ""}${r.textOverflow?.[0] ? ` · chữ: ${r.textOverflow[0].sel} "${r.textOverflow[0].text}"` : ""}${r.textCut?.[0] ? ` · lố: ${r.textCut[0].sel} "${r.textCut[0].text}" (${r.textCut[0].left}→${r.textCut[0].right})` : ""}`,
    );
}
