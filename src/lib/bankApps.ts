// App ngân hàng của KHÁCH (người gửi tiền mừng) và deep link chính thức của VietQR (Casso).
// Nguồn: https://www.vietqr.io/deeplink — danh sách lấy từ https://api.vietqr.io/v2/android-app-deeplinks
// và /v2/ios-app-deeplinks (lưu sẵn ở đây vì API giới hạn 5 lần/phút/IP). Cập nhật: 27/11/2026.
//
// android / ios: 0 = không có app trên nền tảng này, 1 = chỉ mở được app, 2 = mở app và điền sẵn
// số tài khoản, ngân hàng nhận, nội dung chuyển khoản (cờ "autofill" của VietQR).
// Số tiền không bao giờ điền sẵn: khách tự nhập, kiểm tra người nhận và xác nhận trong app.

/**
 * iosUrl / intent: link mở app mà chính dl.vietqr.io dùng (lấy từ trang chuyển hướng của VietQR ngày 27/11/2026:
 * iOS là URL scheme, Android là intent:// chưa có phần browser_fallback_url). Thiệp gọi thẳng các link này ngay trong
 * lần chạm của khách, vì qua trang trung gian dl.vietqr.io thì app mở bằng hẹn giờ (iOS chặn / bắt bấm thêm nút,
 * trình duyệt Zalo / Facebook chặn chuyển hướng intent).
 */
export type BankApp = { id: string; name: string; android: 0 | 1 | 2; ios: 0 | 1 | 2; iosUrl: string; intent: string };

export const BANK_APPS: BankApp[] = [
  { id: "mb", name: "MB Bank", android: 2, ios: 2, iosUrl: "mbbank://", intent: "intent://#Intent;scheme=mbbank;package=com.mbmobile;" },
  { id: "vcb", name: "VCB Digibank", android: 1, ios: 1, iosUrl: "vietcombankmobile://", intent: "intent://#Intent;scheme=vietcombankmobile;package=com.VCB;" },
  { id: "tcb", name: "Techcombank Mobile", android: 1, ios: 1, iosUrl: "tcb://", intent: "intent://applink/#Intent;scheme=tcb;package=vn.com.techcombank.bb.app;" },
  { id: "vba", name: "Agribank Plus", android: 1, ios: 1, iosUrl: "agribankmobile://", intent: "intent://#Intent;scheme=agribankmobile;package=com.vnpay.Agribank3g;" },
  { id: "icb", name: "VietinBank iPay", android: 2, ios: 2, iosUrl: "vietinbankipay://", intent: "intent://#Intent;scheme=vietinbankipay;package=com.vietinbank.ipay;" },
  { id: "bidv", name: "BIDV SmartBanking", android: 2, ios: 2, iosUrl: "bidv.smartbanking.partner://", intent: "intent://payment/#Intent;scheme=bidv.smartbanking.partner;package=com.vnpay.bidv;" },
  { id: "vpb", name: "VPBank NEO", android: 1, ios: 1, iosUrl: "vpbankneo://", intent: "intent://#Intent;scheme=vpbankneo;package=com.vnpay.vpbankonline;" },
  { id: "cake", name: "CAKE - Ngân hàng số", android: 1, ios: 1, iosUrl: "cake.vn://", intent: "intent://#Intent;scheme=cake.vn;package=xyz.be.cake;" },
  { id: "tpb", name: "TPBank Mobile", android: 1, ios: 1, iosUrl: "hydro://", intent: "intent://onboarding/#Intent;scheme=hydro;package=com.tpb.mb.gprsandroid;" },
  { id: "ocb", name: "OCB OMNI", android: 2, ios: 2, iosUrl: "newomni-app://", intent: "intent://#Intent;scheme=newomni-app;package=vn.com.ocb.awe;" },
  { id: "acb", name: "ACB ONE", android: 2, ios: 2, iosUrl: "acbone://", intent: "intent://#Intent;scheme=acbone;package=mobile.acb.com.vn;" },
  { id: "lpb", name: "LPBank", android: 1, ios: 1, iosUrl: "lv24h://", intent: "intent://#Intent;scheme=lv24h;package=vn.com.lpb.lienviet24h;" },
  { id: "timo", name: "Timo - Ngân hàng số by BVBank", android: 1, ios: 1, iosUrl: "plus://", intent: "intent://#Intent;scheme=plus;package=io.lifestyle.plus;" },
  { id: "vib-2", name: "MyVIB", android: 1, ios: 1, iosUrl: "myvib2://", intent: "intent://myvib2.com.vn/data#Intent;scheme=myvib2;package=com.vib.myvib2;" },
  { id: "hdb", name: "HDBank", android: 1, ios: 1, iosUrl: "hdbankmobile://", intent: "intent://#Intent;scheme=hdbankmobile;package=com.vnpay.hdbank;" },
  { id: "shb", name: "SHB SAHA", android: 1, ios: 1, iosUrl: "shbmobile://", intent: "intent://#Intent;scheme=shbmobile;package=vn.shb.saha.mbanking;" },
  { id: "seab", name: "SeAMobile", android: 1, ios: 1, iosUrl: "seamobile://", intent: "intent://app/#Intent;scheme=seamobile;package=vn.com.seabank.mb1;" },
  { id: "scb", name: "SCB Mobile Banking", android: 1, ios: 1, iosUrl: "scbmobilebanking://", intent: "intent://#Intent;scheme=scbmobilebanking;package=com.vnpay.SCB;" },
  { id: "shbvn", name: "Shinhan SOL Việt Nam", android: 1, ios: 1, iosUrl: "shinhanglbvnbank://", intent: "intent://#Intent;scheme=shinhanglbvnbank;package=com.shinhan.global.vn.bank;" },
  { id: "abb", name: "ABBank", android: 1, ios: 1, iosUrl: "vn.abbank.retail://", intent: "intent://#Intent;scheme=vn.abbank.retail;package=vn.abbank.retail;" },
  { id: "nab", name: "Nam A Bank Open Banking", android: 1, ios: 0, iosUrl: "", intent: "intent://nab/softotp#Intent;scheme=deeplinkapp;package=ops.namabank.com.vn;" },
  { id: "eib", name: "Eximbank EDigi", android: 1, ios: 1, iosUrl: "eximbankmobile://", intent: "intent://#Intent;scheme=eximbankmobile;package=com.vnpay.EximBankOmni;" },
  { id: "pvcb", name: "PVConnect", android: 1, ios: 1, iosUrl: "pvcombankapp://", intent: "intent://#Intent;scheme=pvcombankapp;package=com.pvcombank.retail;" },
  { id: "coopbank", name: "Co-opBank Mobile Banking", android: 1, ios: 1, iosUrl: "coopbankmobile://", intent: "intent://#Intent;scheme=coopbankmobile;package=com.vnpay.coopbank;" },
  { id: "wvn", name: "Woori WON Vietnam", android: 1, ios: 1, iosUrl: "wvbs://", intent: "intent://#Intent;scheme=wvbs;package=vn.com.woori.smart;" },
  { id: "klb", name: "KienlongBank Plus", android: 1, ios: 1, iosUrl: "kienlongbankmobilebanking://", intent: "intent://ksbank.co/#Intent;scheme=ksbank;package=com.sunshine.ksbank;" },
  { id: "bvb", name: "BAOVIET Smart", android: 1, ios: 1, iosUrl: "baovietmobile://", intent: "intent://#Intent;scheme=baovietmobile;package=com.vnpay.bvbank;" },
  { id: "vab", name: "Vietbank Digital Plus", android: 1, ios: 1, iosUrl: "vabmobilebanking://", intent: "intent://#Intent;scheme=vabmobilebanking;package=com.vn.vietbankomni;" },
  { id: "ncb", name: "NCB iziMobile", android: 1, ios: 1, iosUrl: "ncbizimobile://", intent: "intent://#Intent;scheme=ncbizimobile;package=com.ncb.bank;" },
  { id: "mbv", name: "MBV Bank", android: 1, ios: 1, iosUrl: "mbv://", intent: "intent://#Intent;scheme=mbv;package=com.mbv.mobilebanking;" },
  { id: "pbvn", name: "PB engage VN", android: 1, ios: 1, iosUrl: "publicbankmobile://", intent: "intent://#Intent;scheme=publicbankmobile;package=com.vnpay.publicbank;" },
  { id: "sgicb", name: "SAIGONBANK Smart Banking", android: 1, ios: 1, iosUrl: "saigonbankmobilebanking://", intent: "intent://#Intent;scheme=Sgbmobile;package=com.vnpay.sgbank;" },
  { id: "cimb", name: "Octo by CIMB Vietnam", android: 1, ios: 1, iosUrl: "cimb://", intent: "intent://#Intent;scheme=cimb;package=vn.cimbbank.octo;" },
];

export type Platform = "android" | "ios" | "desktop";

export function detectPlatform(ua: string): Platform {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

export const bankAppLogo = (id: string, platform: Platform) => `https://cdn.vietqr.io/bank-app-icon/${id}-${platform === "ios" ? "ios" : "android"}.webp`;

/** Mức hỗ trợ của app trên thiết bị (desktop: không mở được app). */
export const appSupport = (app: BankApp, platform: Platform): 0 | 1 | 2 => (platform === "desktop" ? 0 : app[platform]);

/**
 * Link mở app trên điện thoại (gắn vào thẻ <a> để trình duyệt coi là thao tác của khách).
 * Android: intent:// có browser_fallback_url quay về thiệp (máy chưa cài app thì về lại thiệp, không mở Play Store).
 */
export function appOpenUrl(app: BankApp, platform: Platform, fallbackUrl: string) {
  if (appSupport(app, platform) === 0) return "";
  if (platform === "ios") return app.iosUrl;
  return app.intent ? `${app.intent}S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end` : "";
}

/**
 * Link "Web Call App" công bố tại https://www.vietqr.io/deeplink (bảng tham số): dl.vietqr.io/pay với
 *   app = app gửi tiền của KHÁCH (mb, icb, bidv, acb, ocb…),
 *   ba  = SO_TAI_KHOAN@ma_ngan_hang của bên NHẬN (vd 0123456789@ocb),
 *   am  = số tiền (tài liệu ghi BẮT BUỘC), tn = nội dung, bn = tên chủ TK nhận, url = trang quay về.
 * Mở bằng chính thẻ <a> khách chạm vào. App có autofill tự điền thông tin này khi mở.
 * Trả "" khi app không có autofill trên thiết bị, thiếu ngân hàng / STK, hoặc chưa có số tiền (không gán số tiền mặc định).
 */
export function webCallAppUrl(app: BankApp, platform: Platform, to: { bankCode: string; accountNumber: string; accountName: string; content: string; amount: number; returnUrl: string }) {
  const acc = to.accountNumber.replace(/s+/g, "");
  if (appSupport(app, platform) !== 2 || !to.bankCode || !acc || !(to.amount > 0)) return "";
  const q = new URLSearchParams({ app: app.id, ba: `${acc}@${to.bankCode.toLowerCase()}`, am: String(Math.round(to.amount)), tn: to.content });
  if (to.accountName) q.set("bn", to.accountName);
  if (to.returnUrl) q.set("url", to.returnUrl);
  // giữ "@" nguyên dạng như ví dụ chính thức (ba=113366668888@vcb)
  return `https://dl.vietqr.io/pay?${q.toString().replace("%40", "@")}`;
}
