import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PHOTOS, demoInvitationData, type DemoPhotoKey } from "../src/lib/invitation";

const db = new PrismaClient();

async function main() {
  const prod = process.env.NODE_ENV === "production";
  const email = (process.env.ADMIN_EMAIL ?? "admin@thiepcuoi.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? (prod ? "" : "admin123");
  if (prod && password.length < 10) throw new Error("Production: đặt ADMIN_PASSWORD (tối thiểu 10 ký tự) trong .env trước khi seed.");
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, name: "Quản trị viên", role: "ADMIN", plan: "PREMIUM", passwordHash: await bcrypt.hash(password, 10) },
  });

  // Production chỉ tạo admin; tài khoản & thiệp demo (mật khẩu demo123) chỉ khi bật SEED_DEMO=true
  if (prod && process.env.SEED_DEMO !== "true") {
    console.log(`✔ Seed xong. Admin: ${email}`);
    return;
  }

  const demo = await db.user.upsert({
    where: { email: "demo@thiepcuoi.local" },
    update: {},
    create: { email: "demo@thiepcuoi.local", name: "Minh Quân", passwordHash: await bcrypt.hash("demo123", 10) },
  });

  const inv = await db.invitation.upsert({
    where: { slug: "quan-ha" },
    update: { data: JSON.stringify(demoInvitationData()) },
    create: {
      userId: demo.id,
      slug: "quan-ha",
      title: "Minh Quân & Thu Hà",
      templateId: "classic-ivory",
      status: "PUBLISHED",
      data: JSON.stringify(demoInvitationData()),
    },
  });

  if ((await db.wish.count({ where: { invitationId: inv.id } })) === 0) {
    await db.wish.createMany({
      data: [
        { invitationId: inv.id, name: "Lan Anh", message: "Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé! 💕" },
        { invitationId: inv.id, name: "Đức Huy", message: "Happy wedding! Chúc mừng ông bạn thân nhất của tôi." },
      ],
    });
    await db.rsvp.createMany({
      data: [
        { invitationId: inv.id, name: "Lan Anh", attending: "YES", guests: 2, side: "BRIDE" },
        { invitationId: inv.id, name: "Đức Huy", attending: "YES", guests: 1, side: "GROOM", phone: "0901234567" },
        { invitationId: inv.id, name: "Thầy Bình", attending: "MAYBE", guests: 1, side: "GROOM" },
      ],
    });
  }

  await seedDemoAlbums();

  console.log(`✔ Seed xong. Admin: ${email}${prod ? "" : ` / ${password}`} · Demo: demo@thiepcuoi.local / demo123 · Thiệp mẫu: /w/quan-ha`);
}

/** Album minh hoạ bằng ảnh Unsplash để trang studio có nội dung khi phát triển (không chạy ở production trừ khi SEED_DEMO=true). */
async function seedDemoAlbums() {
  if ((await db.album.count()) > 0) return;
  const ph = (k: DemoPhotoKey, w: number, h: number) => ({
    url: `https://images.unsplash.com/photo-${DEMO_PHOTOS[k]}?auto=format&fit=crop&w=${w}&h=${h}&q=75`,
    width: w,
    height: h,
  });
  const V = (k: DemoPhotoKey) => ph(k, 1200, 1600);
  const H = (k: DemoPhotoKey) => ph(k, 1600, 1067);
  const S = (k: DemoPhotoKey) => ph(k, 1400, 1400);
  type Seed = { kind?: string; title: string; category: string; location?: string; size?: string; description: string; featured?: boolean; photos: ReturnType<typeof ph>[] };
  const albums: Seed[] = [
    { title: "Hoàng hôn trên đồi", category: "ngoai-canh", location: "Đà Lạt", featured: true, description: "Buổi chụp cuối chiều trên đồi thông, ánh nắng xiên và gió lạnh.", photos: [H("coupleHill"), V("coupleSunset"), V("coupleField"), H("coupleWalk"), V("handsHold"), V("coupleForehead")] },
    { title: "Một ngày ở biệt thự cũ", category: "studio", location: "Hà Nội", featured: true, description: "Hành lang, cầu thang gỗ và cửa sổ lớn — ánh sáng tự nhiên trong nhà.", photos: [V("coupleHallway"), H("coupleEstate"), V("coupleClose"), V("brideLetter"), H("lace")] },
    { title: "Biển sáng sớm", category: "ngoai-canh", location: "Phú Quốc", featured: true, description: "Chụp lúc 5 giờ sáng khi bãi biển còn vắng.", photos: [V("brideSea"), H("coupleBeach"), V("coupleCanoe"), V("coupleLaugh"), H("coupleBlue")] },
    { title: "Ngày chung đôi", category: "phong-su", location: "Hà Nội", featured: true, description: "Phóng sự ngày cưới: chuẩn bị, làm lễ và tiệc tối.", photos: [V("coupleVeilKiss"), H("table"), V("bouquet"), V("rings"), H("placeSetting"), V("shoes"), V("coupleDance")] },
    { title: "Vườn nho mùa thu", category: "ngoai-canh", location: "Ninh Thuận", description: "Những hàng nho chín và nắng vàng cuối mùa.", photos: [H("coupleVineyard"), V("brideBlossom"), V("coupleForest")] },
    { title: "Trắng đen", category: "studio", location: "Studio TCWedding", description: "Bộ ảnh đen trắng trong studio, ánh sáng một nguồn.", photos: [V("coupleBW"), V("coupleCastle"), H("ringsCard")] },
    { kind: "SAMPLE", title: "Prewedding Đà Lạt", category: "prewedding", size: "30x30", description: "Khung hình lớn tràn trang, nhiều khoảng thở.", photos: [S("coupleHill"), S("coupleSunset"), S("coupleField"), S("coupleWalk"), S("handsHold"), S("coupleForehead"), S("brideBlossom"), S("coupleForest"), S("coupleVineyard")] },
    { kind: "SAMPLE", title: "Phóng sự ngày cưới", category: "phong-su", size: "35x25", description: "Kể lại trọn ngày vui theo dòng thời gian.", photos: [H("coupleVeilKiss"), H("table"), H("bouquet"), H("rings"), H("placeSetting"), H("shoes"), H("coupleDance")] },
    { kind: "SAMPLE", title: "Chân dung cô dâu", category: "prewedding", size: "25x35", description: "Album dọc tôn dáng, hợp ảnh chân dung.", photos: [V("brideSea"), V("brideLetter"), V("coupleClose"), V("coupleHallway"), V("coupleBW"), V("coupleCastle")] },
  ];
  for (const [i, a] of albums.entries()) {
    const slug = a.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await db.album.create({
      data: {
        kind: a.kind ?? "COLLECTION",
        slug: a.kind === "SAMPLE" ? `mau-${slug}` : slug,
        title: a.title,
        category: a.category,
        location: a.location ?? "",
        size: a.size ?? "",
        description: a.description,
        featured: !!a.featured,
        status: "PUBLISHED",
        sortOrder: i,
        photos: { create: a.photos.map((p, j) => ({ ...p, sortOrder: j })) },
      },
    });
  }
}

main().finally(() => db.$disconnect());
