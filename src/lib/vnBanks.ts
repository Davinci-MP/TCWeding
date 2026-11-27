// Danh mục ngân hàng NHẬN tiền (tài khoản của cô dâu chú rể) theo VietQR / NAPAS 247.
// Nguồn: https://api.vietqr.io/v2/banks (chỉ ngân hàng hỗ trợ chuyển khoản), lưu sẵn ngày 27/11/2026.
// code = mã VietQR (dùng cho img.vietqr.io và tham số ba của deep link), bin = mã BIN NAPAS 6 số.

export type VnBank = { code: string; bin: string; short: string; name: string };

export const VN_BANKS: VnBank[] = [
  { code: "ICB", bin: "970415", short: "VietinBank", name: "Ngân hàng TMCP Công thương Việt Nam" },
  { code: "VCB", bin: "970436", short: "Vietcombank", name: "Ngân hàng TMCP Ngoại Thương Việt Nam" },
  { code: "BIDV", bin: "970418", short: "BIDV", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam" },
  { code: "VBA", bin: "970405", short: "Agribank", name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam" },
  { code: "OCB", bin: "970448", short: "OCB", name: "Ngân hàng TMCP Phương Đông" },
  { code: "MB", bin: "970422", short: "MBBank", name: "Ngân hàng TMCP Quân đội" },
  { code: "TCB", bin: "970407", short: "Techcombank", name: "Ngân hàng TMCP Kỹ thương Việt Nam" },
  { code: "ACB", bin: "970416", short: "ACB", name: "Ngân hàng TMCP Á Châu" },
  { code: "VPB", bin: "970432", short: "VPBank", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  { code: "TPB", bin: "970423", short: "TPBank", name: "Ngân hàng TMCP Tiên Phong" },
  { code: "STB", bin: "970403", short: "Sacombank", name: "Ngân hàng TMCP Sài Gòn Tài Lộc" },
  { code: "HDB", bin: "970437", short: "HDBank", name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh" },
  { code: "VCCB", bin: "970454", short: "VietCapitalBank", name: "Ngân hàng TMCP Bản Việt" },
  { code: "SCB", bin: "970429", short: "SCB", name: "Ngân hàng TMCP Sài Gòn" },
  { code: "VIB", bin: "970441", short: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam" },
  { code: "SHB", bin: "970443", short: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội" },
  { code: "EIB", bin: "970431", short: "Eximbank", name: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam" },
  { code: "MSB", bin: "970426", short: "MSB", name: "Ngân hàng TMCP Hàng Hải" },
  { code: "CAKE", bin: "546034", short: "CAKE", name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank" },
  { code: "Ubank", bin: "546035", short: "Ubank", name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank" },
  { code: "TIMO", bin: "963388", short: "Timo", name: "Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)" },
  { code: "SGICB", bin: "970400", short: "SaigonBank", name: "Ngân hàng TMCP Sài Gòn Công Thương" },
  { code: "BAB", bin: "970409", short: "BacABank", name: "Ngân hàng TMCP Bắc Á" },
  { code: "PVDB", bin: "971133", short: "PVcomBank Pay", name: "Ngân hàng số PVcomBank" },
  { code: "momo", bin: "971025", short: "MoMo", name: "CTCP Dịch Vụ Di Động Trực Tuyến" },
  { code: "PVCB", bin: "970412", short: "PVcomBank", name: "Ngân hàng TMCP Đại Chúng Việt Nam" },
  { code: "MBV", bin: "970414", short: "MBV", name: "Ngân hàng TNHH MTV Việt Nam Hiện Đại" },
  { code: "NCB", bin: "970419", short: "NCB", name: "Ngân hàng TMCP Quốc Dân" },
  { code: "SHBVN", bin: "970424", short: "ShinhanBank", name: "Ngân hàng TNHH MTV Shinhan Việt Nam" },
  { code: "ABB", bin: "970425", short: "ABBANK", name: "Ngân hàng TMCP An Bình" },
  { code: "VAB", bin: "970427", short: "VietABank", name: "Ngân hàng TMCP Việt Á" },
  { code: "NAB", bin: "970428", short: "NamABank", name: "Ngân hàng TMCP Nam Á" },
  { code: "PGB", bin: "970430", short: "PGBank", name: "Ngân hàng TMCP Thịnh vượng và Phát triển" },
  { code: "VIETBANK", bin: "970433", short: "VietBank", name: "Ngân hàng TMCP Việt Nam Thương Tín" },
  { code: "BVB", bin: "970438", short: "BaoVietBank", name: "Ngân hàng TMCP Bảo Việt" },
  { code: "SEAB", bin: "970440", short: "SeABank", name: "Ngân hàng TMCP Đông Nam Á" },
  { code: "COOPBANK", bin: "970446", short: "COOPBANK", name: "Ngân hàng Hợp tác xã Việt Nam" },
  { code: "LPB", bin: "970449", short: "LPBank", name: "Ngân hàng TMCP Lộc Phát Việt Nam" },
  { code: "KLB", bin: "970452", short: "KienLongBank", name: "Ngân hàng TMCP Kiên Long" },
  { code: "KBank", bin: "668888", short: "KBank", name: "Ngân hàng Đại chúng TNHH Kasikornbank" },
  { code: "ZALOPAY", bin: "971101", short: "ZaloPay", name: "Ví điện tử ZaloPay" },
  { code: "MVAS", bin: "971032", short: "MVAS", name: "Trung tâm Dịch vụ số Mobifone – Chi nhánh Tổng Công ty viễn thông Mobifone" },
  { code: "IVB", bin: "970434", short: "IndovinaBank", name: "Ngân hàng TNHH Indovina" },
  { code: "CIMB", bin: "422589", short: "CIMB", name: "Ngân hàng TNHH MTV CIMB Việt Nam" },
  { code: "CBB", bin: "970444", short: "CBBank", name: "Ngân hàng Thương mại trách nhiệm hữu hạn một thành viên Ngoại thương Công nghệ số (Vietcombank Neo Limited)" },
  { code: "WVN", bin: "970457", short: "Woori", name: "Ngân hàng TNHH MTV Woori Việt Nam" },
  { code: "KBHN", bin: "970462", short: "KookminHN", name: "Ngân hàng Kookmin - Chi nhánh Hà Nội" },
  { code: "KBHCM", bin: "970463", short: "KookminHCM", name: "Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh" },
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Tìm theo mã VietQR hoặc BIN (không phân biệt hoa thường). */
export function findBank(codeOrBin: string): VnBank | undefined {
  const k = codeOrBin.trim().toUpperCase();
  if (!k) return undefined;
  return VN_BANKS.find((b) => b.code.toUpperCase() === k || b.bin === k);
}

/** Tên hiển thị gọn: "OCB · Ngân hàng TMCP Phương Đông". */
export const bankLabel = (b: VnBank) => (b.short && b.short !== b.name ? `${b.short} · ${b.name}` : b.name);

/** Tìm ngân hàng theo tên, tên viết tắt, mã hoặc BIN. Khớp đầu từ được xếp trước. */
export function searchBanks(q: string, limit = 12): VnBank[] {
  const n = norm(q);
  if (!n) return VN_BANKS.slice(0, limit);
  const scored: [number, VnBank][] = [];
  for (const b of VN_BANKS) {
    const fields = [b.code, b.short, b.name, b.bin].map(norm);
    let s = 0;
    if (fields[0] === n || fields[1] === n) s = 100;
    else if (fields[0].startsWith(n) || fields[1].startsWith(n)) s = 80;
    else if (fields.some((f) => f.split(" ").some((w) => w.startsWith(n)))) s = 60;
    else if (fields.some((f) => f.includes(n))) s = 40;
    if (s) scored.push([s, b]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(([, b]) => b);
}

/** Đoán ngân hàng từ chữ khách gõ tay (chỉ khi khớp duy nhất / chính xác). */
export function matchBankText(text: string): VnBank | undefined {
  const n = norm(text);
  if (!n) return undefined;
  const exact = VN_BANKS.filter((b) => [b.code, b.short, b.name].map(norm).includes(n));
  return exact.length === 1 ? exact[0] : undefined;
}
