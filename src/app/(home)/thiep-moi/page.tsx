import { permanentRedirect } from "next/navigation";

/** Trang giới thiệu thiệp cũ: nay chọn mẫu và đặt thiệp ở /thiep. */
export default function OldInvitationLanding() {
  permanentRedirect("/thiep");
}
