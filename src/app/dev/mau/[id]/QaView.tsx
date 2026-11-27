"use client";

import { useEffect, useMemo, useState } from "react";
import { demoInvitationData, type DemoPhotoKey, type InvitationData } from "@/lib/invitation";
import { InvitationView } from "@/templates/InvitationView";

type Variant = "demo" | "long" | "empty";

/** Dữ liệu thử: demo (ảnh mẫu), long (tên / địa chỉ rất dài có dấu, OCB + STK số 0 đầu), empty (thiếu ảnh, bản đồ, album). */
function qaData(cover: DemoPhotoKey, v: Variant): InvitationData {
  const d = demoInvitationData(cover);
  const gifts: InvitationData["gifts"] = [
    { id: "g1", label: "Mừng cưới nhà trai", side: "groom", bankCode: "VCB", bankBin: "970436", bankName: "Vietcombank", accountNumber: "0123456789", accountName: "NGUYEN MINH QUAN", qrImage: "" },
    { id: "g2", label: "Mừng cưới nhà gái", side: "bride", bankCode: "OCB", bankBin: "970448", bankName: "OCB", accountNumber: "0012345678901234", accountName: "TON NU THI PHUONG THAO", qrImage: "" },
  ];
  if (v === "demo") return { ...d, gifts };
  if (v === "long")
    return {
      ...d,
      gifts,
      groom: { ...d.groom, name: "Hoàng Thiên Phúc", fullName: "Nguyễn Hoàng Thiên Phúc Khang", father: "Ông Nguyễn Hoàng Trường Giang", mother: "Bà Trần Thị Ngọc Huyền Trang", address: "Số 128/45 Đường Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh" },
      bride: { ...d.bride, name: "Phương Thảo Nguyên", fullName: "Tôn Nữ Thị Phương Thảo Nguyên", father: "Ông Tôn Thất Quang Huy", mother: "Bà Lê Thị Thanh Hương", address: "Thôn Phú Xuân Thượng, Xã Phú Thượng, Huyện Phú Vang, Tỉnh Thừa Thiên Huế" },
      headline: "Trân trọng báo tin lễ thành hôn",
      events: d.events.map((e, i) => ({
        ...e,
        venue: i ? "Trung tâm Hội nghị Tiệc cưới Riverside Palace — Sảnh Hoàng Gia Kim Cương" : e.venue,
        address: i ? "360D Đường Bến Vân Đồn, Phường 1, Quận 4, Thành phố Hồ Chí Minh, Việt Nam" : e.address,
        mapUrl: i ? "https://www.google.com/maps/place/@10.7618,106.6996,17z" : "",
      })),
    };
  return { ...d, gifts, coverPhoto: "", featurePhoto: "", thankYouPhoto: "", gallery: [], story: d.story.map((s) => ({ ...s, photo: "" })), groom: { ...d.groom, photo: "" }, bride: { ...d.bride, photo: "" }, events: d.events.map((e) => ({ ...e, mapUrl: "" })) };
}

type Offender = { sel: string; text: string; left: number; right: number };

/** Đo tràn: cuộn ngang của trang + phần tử lộ ra ngoài khung nhìn (không bị cha nào cắt) + chữ tràn khỏi hộp của nó. */
function measure() {
  const vw = document.documentElement.clientWidth;
  const root = document.querySelector(".tpl-root");
  const describe = (el: Element): Offender => {
    const r = el.getBoundingClientRect();
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 3).join(".");
    return { sel: `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${el.getAttribute("data-tf") ? `[${el.getAttribute("data-tf")}]` : ""}`, text: (el.textContent ?? "").trim().slice(0, 40), left: Math.round(r.left), right: Math.round(r.right) };
  };
  /** Phần nhìn thấy theo chiều ngang sau khi mọi lớp cha có overflow ≠ visible cắt bớt. */
  const visibleX = (el: Element, r: DOMRect) => {
    let left = r.left;
    let right = r.right;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX === "visible") continue;
      const pr = p.getBoundingClientRect();
      left = Math.max(left, pr.left);
      right = Math.min(right, pr.right);
    }
    return [left, right];
  };
  const outside: Offender[] = [];
  const textOverflow: Offender[] = [];
  const textCut: Offender[] = [];
  const inScroller = (el: Element) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
    return false;
  };
  root?.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.closest("[aria-hidden='true'], .tpl-marquee-wrap, .tpl-marquee-static, svg, canvas, iframe")) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.position === "fixed") return;
    if (r.right > vw + 1 || r.left < -1) {
      const [visibleLeft, visibleRight] = visibleX(el, r);
      if (visibleRight > visibleLeft && (visibleRight > vw + 1 || visibleLeft < -1)) outside.push(describe(el));
    }
    // chữ tràn khỏi hộp của chính nó (vd từ dài không xuống dòng)
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
    // chữ nằm lố ra ngoài màn hình (bị cắt mất), trừ chữ trong dải cuộn ngang
    if (hasText && (r.right > vw + 1 || r.left < -1) && !inScroller(el)) textCut.push(describe(el));
    if (hasText && cs.overflowX === "visible" && cs.whiteSpace !== "nowrap" && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && cs.display !== "inline") textOverflow.push(describe(el));
  });
  return { vw, docOverflow: document.documentElement.scrollWidth - vw, outside: outside.slice(0, 8), outsideCount: outside.length, textOverflow: textOverflow.slice(0, 8), textOverflowCount: textOverflow.length, textCut: textCut.slice(0, 8), textCutCount: textCut.length };
}

export function QaView({ templateId, demoCover, variant, guest }: { templateId: string; demoCover: DemoPhotoKey; variant: Variant; guest?: string }) {
  const data = useMemo(() => qaData(demoCover, variant), [demoCover, variant]);
  const [result, setResult] = useState("");
  useEffect(() => {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      setResult(JSON.stringify({ id: templateId, variant, ...measure() }));
      document.title = "QA-DONE";
    };
    // đo / chụp sau khi font và mọi ảnh đã tải xong (tối đa 12 giây)
    const t = setTimeout(run, 12000);
    // ảnh lazy dưới màn đầu không tự tải khi chụp trọn trang: ép tải luôn
    if (new URLSearchParams(location.search).has("full")) document.querySelectorAll<HTMLImageElement>("img[loading=lazy]").forEach((img) => (img.loading = "eager"));
    const imagesReady = () =>
      Promise.all(
        [...document.images].filter((img) => img.loading !== "lazy").map((img) =>
          img.complete ? Promise.resolve() : new Promise<void>((r) => ((img.onload = img.onerror = () => r()), setTimeout(r, 10000))),
        ),
      );
    Promise.all([document.fonts?.ready, new Promise((r) => setTimeout(r, 800)).then(imagesReady)]).then(() => setTimeout(run, 600));
    return () => clearTimeout(t);
  }, [templateId, variant]);
  return (
    <>
      {/* tab Chrome chạy nền không chạy transition / animation: tắt để đo và chụp đúng trạng thái cuối */}
      <style>{".tpl-root *, .tpl-root *::before, .tpl-root *::after { transition: none !important; animation-duration: 0s !important; animation-delay: 0s !important; } .tpl-root img { opacity: 1 !important; }"}</style>
      <InvitationView templateId={templateId} data={data} slug="qa" mode="preview" guestName={guest ?? "Anh Nguyễn Văn Trường & Gia đình"} />
      {result && (
        <script id="qa-result" type="application/json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: result.replace(/</g, "\\u003c") }} />
      )}
    </>
  );
}
