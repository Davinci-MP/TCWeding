import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteShowcaseAction, publishShowcaseAction, updateShowcaseAction } from "@/app/actions/showcase";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CoverStudio } from "@/components/admin/CoverStudio";
import { ShowcasePreview, TargetPicker } from "@/components/admin/ShowcaseParts";
import { db } from "@/lib/db";
import { galleryNeighbors, getCoverState, publicPhotoCandidates } from "@/lib/showcase";
import { templateCode, templateHash } from "@/lib/thiep";
import { getTemplateDef } from "@/templates/registry";

export const metadata = { title: "Bản giới thiệu mẫu" };

export default async function ShowcasePage({ params }: { params: Promise<{ id: string }> }) {
  const sc = await db.templateShowcase.findUnique({ where: { id: (await params).id } });
  if (!sc) notFound();
  const [state, candidates, neighbors, albums, source] = await Promise.all([
    getCoverState(sc.templateId),
    publicPhotoCandidates(),
    galleryNeighbors(sc.templateId),
    db.album.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], select: { id: true, title: true, _count: { select: { photos: true } } } }),
    sc.sourceInvitationId ? db.invitation.findUnique({ where: { id: sc.sourceInvitationId }, select: { id: true, slug: true } }) : null,
  ]);
  const tpl = getTemplateDef(sc.templateId);
  const published = sc.status === "PUBLISHED";
  const id = <input type="hidden" name="id" value={sc.id} />;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/showcase" className="text-sm text-zinc-500 hover:underline">
          ← Bản giới thiệu & ảnh bìa
        </Link>
        <h1 className="font-display mt-1 text-3xl font-semibold">
          Bản giới thiệu · {templateCode(sc.templateId)} {tpl.name}
        </h1>
        <p className="text-sm text-zinc-500">
          {published ? "🟢 Đang dùng cho “Xem mẫu” của mẫu này" : "⚪ Bản nháp — khách chưa thấy"}
          {source && (
            <>
              {" · "}tạo từ thiệp{" "}
              <Link href={`/dashboard/${source.id}/edit`} className="text-brand hover:underline">
                /w/{source.slug}
              </Link>{" "}
              (thiệp gốc không bị thay đổi)
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <form action={updateShowcaseAction} className="card space-y-4">
            {id}
            <h2 className="font-semibold">Mẫu đích và ảnh</h2>
            <TargetPicker value={sc.templateId} />
            <label className="block text-sm">
              <span className="font-medium">Ảnh trong bản giới thiệu</span>
              <select name="albumId" defaultValue={sc.albumId} className="input mt-1">
                <option value="">Ảnh demo mặc định</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    Album studio: {a.title} ({a._count.photos} ảnh)
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-zinc-500">Chỉ album đã xuất bản (ảnh được phép công khai). Ảnh của thiệp gốc không bao giờ được dùng.</span>
            </label>
            <button className="btn btn-primary">Áp dụng</button>
            <p className="text-xs text-zinc-500">
              Giữ từ thiệp gốc: màu chủ đạo, font, cỡ chữ, kiểu chữ từng ô, hiệu ứng, nhạc dựng sẵn, các phần bật/tắt. Thay bằng dữ liệu demo: tên (Thành Công &amp; Võ Thùy), gia đình, địa chỉ, bản đồ,
              ngày giờ, lời mời, câu chuyện, ảnh, STK/VietQR, nhạc tự tải. Khách mời, lời chúc, bill không được chép.
            </p>
          </form>

          <div className="card space-y-3">
            <h2 className="font-semibold">Duyệt</h2>
            <div className="flex flex-wrap gap-3">
              <form action={publishShowcaseAction}>
                {id}
                <input type="hidden" name="publish" value={published ? "0" : "1"} />
                <button className={published ? "btn btn-outline" : "btn btn-primary"}>{published ? "Gỡ khỏi “Xem mẫu”" : "Duyệt và dùng cho “Xem mẫu”"}</button>
              </form>
              <a href={`/thiep#${templateHash(sc.templateId)}`} target="_blank" className="btn btn-outline">
                Mở “Xem mẫu”
              </a>
              <form action={deleteShowcaseAction}>
                {id}
                <ConfirmButton message="Xoá bản giới thiệu này? Thiệp gốc không bị ảnh hưởng." className="btn btn-outline text-red-600">
                  Xoá
                </ConfirmButton>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-center text-sm text-zinc-500">Khách thấy khi bấm “Xem mẫu”</p>
          <ShowcasePreview templateId={sc.templateId} json={sc.data} cover={state.current} />
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Ảnh bìa của {templateCode(sc.templateId)} trong kho mẫu</h2>
        {/* key: đổi mẫu đích → nạp lại ảnh bìa đã lưu của mẫu mới */}
        <CoverStudio key={sc.templateId} templateId={sc.templateId} current={state.current} history={state.history} candidates={candidates} neighbors={neighbors} />
      </div>
    </div>
  );
}
