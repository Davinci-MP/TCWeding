import { ThiepApp } from "@/components/thiep/ThiepApp";
import type { TplLite } from "@/components/thiep/TemplateCard";
import { settingsError } from "@/lib/orders";
import { getMusicLibrary, getOrderSettings } from "@/lib/settings";
import { listTemplates } from "@/lib/templates";
import { fontLabel } from "@/lib/thiep";

export const metadata = {
  title: "Thiệp cưới online",
  description: "Chọn mẫu thiệp cưới online, xem thiệp chạy thật và điền thông tin để TCWedding làm thiệp cho hai bạn. Không cần tạo tài khoản.",
};

/**
 * Một trang, điều hướng bằng #hash giống quocanhwedding.com/thiep:
 * /thiep            thư viện mẫu (thả tim, hộp chi tiết mẫu)
 * /thiep#tc-02      thiệp chạy thật của mẫu TC-02
 * /thiep#chon-tc-02 form điền thông tin, chọn sẵn mẫu TC-02
 * /thiep#xem        xem trước thiệp với thông tin khách đã điền
 */
export default async function ThiepPage() {
  const [templates, library, settings] = await Promise.all([listTemplates(), getMusicLibrary(), getOrderSettings()]);
  const list: TplLite[] = templates.map((t) => ({ id: t.id, name: t.name, description: t.description, category: t.category, premium: t.isPremium, fonts: fontLabel(t) }));
  const deposit = settings.enabled && !settingsError(settings) ? settings.deposit : 0;
  return (
    <ThiepApp
      templates={list}
      library={library.map((t) => ({ id: t.id, name: t.name }))}
      price={{ price: settings.price, deposit, intro: settings.intro }}
      studioName="TCWedding"
    />
  );
}
