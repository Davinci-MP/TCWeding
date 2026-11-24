import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { demoInvitationData } from "../src/lib/invitation";

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

  console.log(`✔ Seed xong. Admin: ${email}${prod ? "" : ` / ${password}`} · Demo: demo@thiepcuoi.local / demo123 · Thiệp mẫu: /w/quan-ha`);
}

main().finally(() => db.$disconnect());
