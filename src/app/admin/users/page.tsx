import { deleteUserAction, setUserPlanAction, setUserRoleAction } from "@/app/actions/admin";
import { ResetPasswordButton } from "@/components/admin/PasswordForms";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Người dùng" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireAdmin();
  const { q } = await searchParams;
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invitations: true } } },
    take: 200,
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Người dùng</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Tìm email, tên…" className="input w-64" />
          <button className="btn btn-outline">Tìm</button>
        </form>
      </div>
      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Thiệp</th>
              <th className="px-4 py-3">Gói</th>
              <th className="px-4 py-3">Quyền</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-zinc-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">{u._count.invitations}</td>
                <td className="px-4 py-3">
                  <form action={setUserPlanAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="plan" value={u.plan === "PREMIUM" ? "FREE" : "PREMIUM"} />
                    <span className={u.plan === "PREMIUM" ? "font-semibold text-amber-600" : ""}>{u.plan === "PREMIUM" ? "★ Premium" : "Free"}</span>
                    <button className="text-xs text-brand hover:underline">{u.plan === "PREMIUM" ? "Hạ cấp" : "Nâng cấp"}</button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={setUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="role" value={u.role === "ADMIN" ? "USER" : "ADMIN"} />
                    <span>{u.role === "ADMIN" ? "Admin" : "User"}</span>
                    {u.id !== me.id && <button className="text-xs text-brand hover:underline">{u.role === "ADMIN" ? "Bỏ admin" : "Cấp admin"}</button>}
                  </form>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{u.createdAt.toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3">
                  {u.id !== me.id && (
                    <div className="flex flex-col items-start gap-2">
                      <ResetPasswordButton id={u.id} email={u.email} />
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <ConfirmButton message={`Xoá người dùng ${u.email} và toàn bộ thiệp của họ?`} className="text-xs text-red-600 hover:underline">
                          Xoá
                        </ConfirmButton>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
