// App ngân hàng của KHÁCH (người gửi tiền mừng) và deep link chính thức của VietQR (Casso).
// Nguồn: https://www.vietqr.io/deeplink — danh sách lấy từ https://api.vietqr.io/v2/android-app-deeplinks
// và /v2/ios-app-deeplinks (lưu sẵn ở đây vì API giới hạn 5 lần/phút/IP). Cập nhật: 27/11/2026.
//
// android / ios: 0 = không có app trên nền tảng này, 1 = chỉ mở được app, 2 = mở app và điền sẵn
// số tài khoản, ngân hàng nhận, nội dung chuyển khoản (cờ "autofill" của VietQR).
// Số tiền không bao giờ điền sẵn: khách tự nhập, kiểm tra người nhận và xác nhận trong app.

export type BankApp = { id: string; name: string; android: 0 | 1 | 2; ios: 0 | 1 | 2 };

export const BANK_APPS: BankApp[] = [
  { id: "mb", name: "MB Bank", android: 2, ios: 2 },
  { id: "vcb", name: "VCB Digibank", android: 1, ios: 1 },
  { id: "tcb", name: "Techcombank Mobile", android: 1, ios: 1 },
  { id: "vba", name: "Agribank Plus", android: 1, ios: 1 },
  { id: "icb", name: "VietinBank iPay", android: 2, ios: 2 },
  { id: "bidv", name: "BIDV SmartBanking", android: 2, ios: 2 },
  { id: "vpb", name: "VPBank NEO", android: 1, ios: 1 },
  { id: "cake", name: "CAKE - Ngân hàng số", android: 1, ios: 1 },
  { id: "tpb", name: "TPBank Mobile", android: 1, ios: 1 },
  { id: "ocb", name: "OCB OMNI", android: 2, ios: 2 },
  { id: "acb", name: "ACB ONE", android: 2, ios: 2 },
  { id: "lpb", name: "LPBank", android: 1, ios: 1 },
  { id: "timo", name: "Timo - Ngân hàng số by BVBank", android: 1, ios: 1 },
  { id: "vib-2", name: "MyVIB", android: 1, ios: 1 },
  { id: "hdb", name: "HDBank", android: 1, ios: 1 },
  { id: "shb", name: "SHB SAHA", android: 1, ios: 1 },
  { id: "seab", name: "SeAMobile", android: 1, ios: 1 },
  { id: "scb", name: "SCB Mobile Banking", android: 1, ios: 1 },
  { id: "shbvn", name: "Shinhan SOL Việt Nam", android: 1, ios: 1 },
  { id: "abb", name: "ABBank", android: 1, ios: 1 },
  { id: "nab", name: "Nam A Bank Open Banking", android: 1, ios: 0 },
  { id: "eib", name: "Eximbank EDigi", android: 1, ios: 1 },
  { id: "pvcb", name: "PVConnect", android: 1, ios: 1 },
  { id: "coopbank", name: "Co-opBank Mobile Banking", android: 1, ios: 1 },
  { id: "wvn", name: "Woori WON Vietnam", android: 1, ios: 1 },
  { id: "klb", name: "KienlongBank Plus", android: 1, ios: 1 },
  { id: "bvb", name: "BAOVIET Smart", android: 1, ios: 1 },
  { id: "vab", name: "Vietbank Digital Plus", android: 1, ios: 1 },
  { id: "ncb", name: "NCB iziMobile", android: 1, ios: 1 },
  { id: "mbv", name: "MBV Bank", android: 1, ios: 1 },
  { id: "pbvn", name: "PB engage VN", android: 1, ios: 1 },
  { id: "sgicb", name: "SAIGONBANK Smart Banking", android: 1, ios: 1 },
  { id: "cimb", name: "Octo by CIMB Vietnam", android: 1, ios: 1 },
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
 * Deep link VietQR. Chỉ điền sẵn số tài khoản + ngân hàng nhận + nội dung khi app hỗ trợ (autofill);
 * app khác chỉ được mở lên. Không truyền số tiền (am) để khách tự nhập.
 */
export function bankDeepLink(app: BankApp, platform: Platform, to: { bankCode: string; accountNumber: string; accountName: string; content: string; returnUrl: string }) {
  const q = new URLSearchParams({ app: app.id });
  if (appSupport(app, platform) === 2 && to.bankCode && to.accountNumber) {
    // ba = SO_TAI_KHOAN@ma_ngan_hang (mã ngắn viết thường, vd 113366668888@vcb), bn = tên chủ tài khoản,
    // url = trang quay về sau khi chuyển (VietQR thêm từ bản 2.15)
    q.set("ba", `${to.accountNumber}@${to.bankCode.toLowerCase()}`);
    if (to.content) q.set("tn", to.content);
    if (to.accountName) q.set("bn", to.accountName);
    if (to.returnUrl) q.set("url", to.returnUrl);
  }
  // giữ "@" nguyên dạng như ví dụ chính thức (ba=113366668888@vcb)
  return `https://dl.vietqr.io/pay?${q.toString().replace("%40", "@")}`;
}
