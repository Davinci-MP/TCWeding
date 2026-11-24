import { createInvitationAction } from "@/app/actions/invitations";
import { TemplateGrid } from "@/components/TemplateGrid";
import { listTemplates } from "@/lib/templates";

export const metadata = { title: "Chọn mẫu thiệp" };

export default async function NewInvitation({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; template?: string }>;
}) {
  const { error, template } = await searchParams;
  let templates = await listTemplates();
  // Đưa mẫu khách đã chọn từ trang "Xem thử" lên đầu
  if (template) templates = [...templates.filter((t) => t.id === template), ...templates.filter((t) => t.id !== template)];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Chọn mẫu cho thiệp mới</h1>
      <p className="mt-1 text-zinc-500">Bạn có thể đổi sang mẫu khác bất cứ lúc nào trong trình chỉnh sửa.</p>
      {error === "premium" && (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mẫu này dành cho gói Premium. Vui lòng nâng cấp tài khoản hoặc chọn mẫu khác.
        </p>
      )}
      <div className="mt-8">
        <TemplateGrid templates={templates} action={createInvitationAction} />
      </div>
    </div>
  );
}
