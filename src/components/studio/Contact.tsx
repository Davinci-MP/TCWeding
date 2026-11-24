import { contactLinks, type StudioContent } from "@/lib/studio";
import { Icon, type IconName } from "@/templates/icons";

type Contact = StudioContent["contact"];

/** Các kênh liên hệ đã điền. Kênh trống thì không hiện. */
export function socialLinks(c: Contact) {
  const l = contactLinks(c);
  return (
    [
      ["Zalo", l.zalo, "chat"],
      ["Facebook", c.facebook, "facebook"],
      ["Instagram", c.instagram, "instagram"],
      ["TikTok", c.tiktok, "video"],
    ] as [string, string, IconName][]
  ).filter(([, href]) => href);
}

export function ContactBlock({ contact }: { contact: Contact }) {
  const l = contactLinks(contact);
  const rows = (
    [
      ["Điện thoại", contact.phone, l.tel],
      ["Email", contact.email, l.mail],
      ["Địa chỉ", contact.address, ""],
      ["Giờ làm việc", contact.hours, ""],
    ] as [string, string, string][]
  ).filter(([, v]) => v);
  const social = socialLinks(contact);
  const empty = !rows.length && !social.length;

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Liên hệ</p>
        <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl lg:text-6xl">
          Kể cho chúng tôi <em>về ngày cưới của hai bạn</em>
        </h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-600">
          Ngày cưới, địa điểm và phong cách ảnh hai bạn thích — chúng tôi sẽ gợi ý concept và báo giá phù hợp.
        </p>
        {(l.tel || l.zalo) && (
          <div className="mt-9 flex flex-wrap gap-3">
            {l.zalo && (
              <a href={l.zalo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#7b2d26] px-7 py-3.5 font-semibold text-white transition hover:bg-[#5f221d]">
                <Icon name="chat" size={18} />
                Nhắn Zalo
              </a>
            )}
            {l.tel && (
              <a href={l.tel} className="inline-flex items-center gap-2 rounded-full border border-[#1d1a17]/25 px-7 py-3.5 font-semibold text-[#1d1a17] transition hover:border-[#1d1a17]">
                <Icon name="phone" size={18} />
                Gọi {contact.phone}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#1d1a17]/15 lg:border-l lg:border-t-0 lg:pl-12">
        {empty ? (
          <p className="pt-8 text-zinc-500 lg:pt-0">Thông tin liên hệ đang được cập nhật.</p>
        ) : (
          <dl className="divide-y divide-[#1d1a17]/10">
            {rows.map(([label, value, href]) => (
              <div key={label} className="py-5 first:pt-8 lg:first:pt-0">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">{label}</dt>
                <dd className="mt-1.5 text-lg text-[#1d1a17]">
                  {href ? (
                    <a href={href} className="underline decoration-[#1d1a17]/20 underline-offset-4 hover:decoration-[#7b2d26]">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
            {social.length > 0 && (
              <div className="py-5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Mạng xã hội</dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {social.map(([name, href, icon]) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1d1a17]/15 px-4 text-sm font-medium text-[#1d1a17] transition hover:border-[#7b2d26] hover:text-[#7b2d26]"
                    >
                      <Icon name={icon} size={16} />
                      {name}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
