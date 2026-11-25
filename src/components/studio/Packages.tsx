import Link from "next/link";
import type { StudioPackage } from "@/lib/studio";

/** Bảng giá gói chụp. Nút "Chọn gói này" chọn sẵn gói trong form đặt lịch tư vấn. */
export function Packages({ packages }: { packages: StudioPackage[] }) {
  const list = packages.filter((p) => p.name);
  if (!list.length) return null;
  return (
    <div className={`grid gap-5 ${list.length >= 3 ? "lg:grid-cols-3" : list.length === 2 ? "md:grid-cols-2" : ""}`}>
      {list.map((p) => (
        <article
          key={p.id}
          className={`relative flex flex-col rounded-3xl p-7 sm:p-8 ${p.highlight ? "bg-[#1d1a17] text-white shadow-2xl lg:-my-4 lg:py-12" : "border border-[#1d1a17]/12 bg-white text-[#1d1a17]"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif-display text-3xl">{p.name}</h3>
            {p.highlight && p.badge && <span className="rounded-full bg-[#d8cdbf] px-3 py-1 text-xs font-semibold text-[#1d1a17]">{p.badge}</span>}
          </div>
          {p.tagline && <p className={`mt-2 text-sm ${p.highlight ? "text-white/65" : "text-zinc-500"}`}>{p.tagline}</p>}
          <p className="mt-6 flex items-baseline gap-2">
            <span className="font-serif-display text-5xl">{p.price || "Liên hệ"}</span>
            {p.unit && <span className={`text-sm ${p.highlight ? "text-white/60" : "text-zinc-500"}`}>{p.unit}</span>}
          </p>
          <ul className={`mt-7 flex-1 space-y-3 border-t pt-6 text-[15px] ${p.highlight ? "border-white/15" : "border-[#1d1a17]/10"}`}>
            {p.features.map((f) => (
              <li key={f} className="flex gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`mt-0.5 shrink-0 ${p.highlight ? "text-[#d8cdbf]" : "text-[#7b2d26]"}`} aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={`/?goi=${p.id}#lien-he`}
            className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold transition ${
              p.highlight ? "bg-[#efe7dc] text-[#1d1a17] hover:bg-white" : "border border-[#1d1a17]/20 hover:border-[#1d1a17]"
            }`}
          >
            Chọn gói này
          </Link>
        </article>
      ))}
    </div>
  );
}
