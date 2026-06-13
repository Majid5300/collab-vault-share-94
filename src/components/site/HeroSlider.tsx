import { useEffect, useState } from "react";
import { getSettings, getLibrary, type SiteSettings, type LibraryImage } from "@/lib/admin-store";

const fallbackBanners = [
  { title: "گلس‌های پرمیوم با گارانتی کیفیت", subtitle: "محافظ صفحه نمایش برای تمامی برندها", gradient: "from-sky-500/40 via-indigo-500/30 to-purple-600/40", href: "#products" },
  { title: "تخفیف ویژه خرید عمده", subtitle: "بهترین قیمت برای همکاران و فروشندگان", gradient: "from-emerald-500/30 via-cyan-500/30 to-sky-600/40", href: "#products" },
  { title: "گلس مات، پرایوسی، نانو", subtitle: "تنوع کامل برای هر سلیقه و نیاز", gradient: "from-fuchsia-500/30 via-purple-500/30 to-indigo-600/40", href: "#products" },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  const [settings, setSettings] = useState<SiteSettings>(() => getSettings());
  const [lib, setLib] = useState<LibraryImage[]>(() => getLibrary());

  useEffect(() => {
    const r = () => {
      setSettings(getSettings());
      setLib(getLibrary());
    };
    window.addEventListener("admin-updated", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("admin-updated", r);
      window.removeEventListener("storage", r);
    };
  }, []);

  const adminBanners = settings.banners
    .map((b) => {
      const img = lib.find((x) => x.id === b.imageId);
      return img ? { image: img.dataUrl, link: b.link } : null;
    })
    .filter(Boolean) as { image: string; link: string }[];

  const slides = adminBanners.length > 0 ? adminBanners : null;
  const count = slides ? slides.length : fallbackBanners.length;

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % count), 4500);
    return () => clearInterval(t);
  }, [count]);

  return (
    <section id="home" className="mx-auto mt-4 max-w-7xl px-4">
      <div className="relative overflow-hidden rounded-3xl glass-strong">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(${i * 100}%)` }}
        >
          {slides
            ? slides.map((b, idx) => (
                <a
                  key={idx}
                  href={b.link || "#products"}
                  target={/^https?:/i.test(b.link) ? "_blank" : undefined}
                  rel={/^https?:/i.test(b.link) ? "noreferrer" : undefined}
                  className="relative block w-full shrink-0"
                >
                  <img src={b.image} alt="" className="h-56 w-full object-cover md:h-80" />
                </a>
              ))
            : fallbackBanners.map((b, idx) => (
                <a key={idx} href={b.href} className="relative block w-full shrink-0">
                  <div className={`relative h-56 w-full bg-gradient-to-br ${b.gradient} md:h-80`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-white drop-shadow md:text-4xl">
                        {b.title}
                      </h2>
                      <p className="mt-3 max-w-xl text-sm text-white/85 md:text-lg">{b.subtitle}</p>
                    </div>
                  </div>
                </a>
              ))}
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {Array.from({ length: count }).map((_, idx) => (
            <button
              key={idx}
              aria-label={`اسلاید ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-2 bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
