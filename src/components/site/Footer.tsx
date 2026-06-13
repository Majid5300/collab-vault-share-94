import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { getSettings, getLibrary, type SiteSettings, type LibraryImage } from "@/lib/admin-store";

const DEFAULT_ICONS = {
  telegram: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/telegram.svg",
  whatsapp: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg",
  instagram: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg",
  rubika: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/rubygems.svg",
};

export function Footer() {
  const [s, setS] = useState<SiteSettings>(() => getSettings());
  const [lib, setLib] = useState<LibraryImage[]>(() => getLibrary());

  useEffect(() => {
    const r = () => {
      setS(getSettings());
      setLib(getLibrary());
    };
    window.addEventListener("admin-updated", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("admin-updated", r);
      window.removeEventListener("storage", r);
    };
  }, []);

  const c = s.contact;
  const getIcon = (id: string, fallback: string) =>
    lib.find((x) => x.id === id)?.dataUrl || fallback;
  const phone1 = c.phones[0] || "";

  const socials: { key: "telegram" | "whatsapp" | "instagram" | "rubika"; label: string }[] = [
    { key: "telegram", label: "تلگرام" },
    { key: "whatsapp", label: "واتساپ" },
    { key: "instagram", label: "اینستاگرام" },
    { key: "rubika", label: "روبیکا" },
  ];

  return (
    <footer id="contact" className="mt-20">
      <div className="border-t border-black/10 glass-strong">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <h3 className="mb-3 text-lg font-extrabold">پارس گلس</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                عرضه‌کننده‌ی تخصصی گلس و محافظ صفحه نمایش گوشی موبایل به صورت
                عمده با بهترین کیفیت و قیمت برای همکاران سراسر کشور.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-bold text-primary">دسترسی سریع</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/" className="hover:text-foreground">خانه</a></li>
                <li><a href="/#products" className="hover:text-foreground">محصولات</a></li>
                <li><a href="/#finder" className="hover:text-foreground">گلس فایندر</a></li>
                <li><a href="/about" className="hover:text-foreground">درباره ما</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-bold text-primary">تماس</h4>
              <ul className="space-y-1 text-sm text-muted-foreground" dir="ltr">
                {c.phones.length === 0 && <li>—</li>}
                {c.phones.map((p) => (
                  <li key={p}>
                    <a href={`tel:${p}`} className="hover:text-foreground">{p}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-bold text-primary">نماد اعتماد</h4>
              <div className="flex h-24 w-24 items-center justify-center rounded-xl glass text-center text-[10px] leading-tight text-muted-foreground">
                نماد اعتماد الکترونیک
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6">
            <div className="flex items-center gap-4">
              {socials.map(({ key, label }) => {
                const link = c[key].link;
                if (!link) return null;
                const icon = getIcon(c[key].imageId, DEFAULT_ICONS[key]);
                return (
                  <a
                    key={key}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center transition hover:opacity-80"
                  >
                    <img src={icon} alt={label} className="h-7 w-7" />
                  </a>
                );
              })}
              {phone1 && (
                <a
                  href={`tel:${phone1}`}
                  aria-label="تماس"
                  className="flex h-10 w-10 items-center justify-center transition hover:opacity-80"
                >
                  <Phone className="h-6 w-6" />
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              تمامی حقوق برای پارس گلس محفوظ است
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
