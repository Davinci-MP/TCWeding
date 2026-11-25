import { redirect } from "next/navigation";

/** Khách không cần tài khoản nữa: chọn mẫu và gửi thông tin ở /thiep. */
export default function RegisterPage() {
  redirect("/thiep");
}
