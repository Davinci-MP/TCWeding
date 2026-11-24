import "server-only";
import { db } from "./db";
import { TEMPLATES, type TemplateDef } from "@/templates/registry";

export type TemplateWithConfig = TemplateDef & { isActive: boolean; isPremium: boolean; sortOrder: number };

/** Trộn mẫu trong code với cấu hình admin trong DB. */
export async function listTemplates(opts: { includeInactive?: boolean } = {}): Promise<TemplateWithConfig[]> {
  const configs = await db.templateConfig.findMany();
  const byId = new Map(configs.map((c) => [c.id, c]));
  return TEMPLATES.map((t, i) => {
    const c = byId.get(t.id);
    return {
      ...t,
      isActive: c?.isActive ?? true,
      isPremium: c?.isPremium ?? t.premium,
      sortOrder: c?.sortOrder ?? i,
    };
  })
    .filter((t) => opts.includeInactive || t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getTemplateWithConfig(id: string) {
  return (await listTemplates({ includeInactive: true })).find((t) => t.id === id) ?? null;
}

/** Gói FREE được tạo tối đa bao nhiêu thiệp. */
export const FREE_INVITATION_LIMIT = 1;
