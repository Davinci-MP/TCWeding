"use client";

import { useMemo, useState } from "react";
import { TemplateThumb } from "@/components/TemplateThumb";
import { parseInvitationData } from "@/lib/invitation";
import { applyCover, type TemplateCover } from "@/lib/templateCover";
import { templateCode } from "@/lib/thiep";
import { getTemplateDef, TEMPLATES } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";

/** Chọn mẫu đích (mẫu gốc + các biến thể màu của nó), thấy ngay mẫu và ảnh bìa hiện tại trước khi áp dụng. */
export function TargetPicker({ value, name = "templateId" }: { value: string; name?: string }) {
  const [id, setId] = useState(value);
  const groups = useMemo(() => {
    const bases = TEMPLATES.filter((t) => !t.baseId);
    return bases.map((b) => ({ base: b, items: [b, ...TEMPLATES.filter((t) => t.baseId === b.id)] }));
  }, []);
  const t = getTemplateDef(id);
  return (
    <div className="flex flex-wrap items-start gap-4">
      <label className="block min-w-60 flex-1 text-sm">
        <span className="font-medium">Mẫu đích</span>
        <select name={name} value={id} onChange={(e) => setId(e.target.value)} className="input mt-1">
          {groups.map((g) => (
            <optgroup key={g.base.id} label={g.base.name}>
              {g.items.map((x) => (
                <option key={x.id} value={x.id}>
                  {templateCode(x.id)} · {x.baseId ? `${x.colorName ?? x.name} (biến thể màu)` : `${x.name} (mẫu gốc)`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="mt-1 block text-xs text-zinc-500">
          {templateCode(id)} · {t.category} · {t.name}
          {id !== value ? " — bấm “Áp dụng” để đổi" : ""}
        </span>
      </label>
      <div className="w-36 shrink-0">
        <p className="mb-1 text-xs text-zinc-500">Ảnh bìa hiện tại</p>
        <div className="overflow-hidden rounded-xl ring-1 ring-zinc-200">
          <TemplateThumb key={id} templateId={id} height={240} />
        </div>
      </div>
    </div>
  );
}

/** Xem bản giới thiệu như khách thấy ở "Xem mẫu" (khung điện thoại). */
export function ShowcasePreview({ templateId, json, cover }: { templateId: string; json: string; cover: TemplateCover | null }) {
  const data = useMemo(() => applyCover(parseInvitationData(json), cover), [json, cover]);
  return (
    <div className="mx-auto h-[640px] w-[360px] max-w-full overflow-y-auto overflow-x-hidden rounded-[2rem] border-8 border-zinc-900 bg-white [transform:translateZ(0)]">
      <InvitationView templateId={templateId} data={data} slug="demo" mode="preview" />
    </div>
  );
}
