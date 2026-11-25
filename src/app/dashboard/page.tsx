import { redirect } from "next/navigation";

/** Danh sách thiệp nằm trong trang quản trị. */
export default function DashboardIndex() {
  redirect("/admin/invitations");
}
