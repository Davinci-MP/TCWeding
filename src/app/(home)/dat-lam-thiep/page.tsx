import { redirect } from "next/navigation";

/** Form đặt làm thiệp cũ: nay điền thông tin ở /thiep#chon. */
export default function OldOrderForm() {
  redirect("/thiep#chon");
}
