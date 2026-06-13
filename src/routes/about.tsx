import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Phone } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getSettings, getLibrary, type SiteSettings, type LibraryImage } from "@/lib/admin-store";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "درباره ما | پارس گلس" },
      { name: "description", content: "درباره پارس گلس، چرا ما را انتخاب کنید و پاسخ به پرسش‌های متداول." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const [s, setS] = useState<SiteSettings>(() => getSettings());
  const [lib, setLib] = useState<LibraryImage[]>(() => getLibrary());
  const [openFaq, setOpenFaq] = useState<string | null>(null);

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

  const a = s.about;
  const c = s.contact;
  const imgUrl = (id: string) => lib.find((x) => x.id === id)?.dataUrl;

  const socials: { key: "telegram" | "whatsapp" | "instagram" | "rubika"; label: string }[] = [
    { key: "telegram", label: "تلگرام" },
    { key: "whatsapp", label: "واتساپ" },
    { key: "instagram", label: "اینستاگرام" },
    { key: "rubika", label: "روبیکا" },
  ];

  return (
    <div dir="rtl" className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold" style={{ color: "#0ea5e9" }}>
            درباره ما
          </h1>
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10"
            aria-label="بازگشت"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </Link>
        </div>

        <section className="rounded-2xl glass-strong p-5">
          <p className="whitespace-pre-line text-sm leading-7 text-foreground/90">
            {a.mainText || "متن معرفی پارس گلس به زودی از طریق پنل مدیریت اضافه می‌شود."}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-extrabold">چرا پارس گلس</h2>
          <div className="grid grid-cols-3 gap-3">
            {a.whyUs.map((w, i) => {
              const src = imgUrl(w.imageId);
              return (
                <div key={i} className="flex flex-col items-center gap-2 text-center">
                  {src ? (
                    <img src={src} alt="" className="h-16 w-16 object-contain" />
                  ) : (
                    <div className="h-16 w-16" />
                  )}
                  <p className="text-xs leading-6 text-foreground/85">{w.text || "—"}</p>
                </div>
              );
            })}
          </div>
        </section>

        {a.faq.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-extrabold">پرسش‌های متداول</h2>
            <div className="space-y-2">
              {a.faq.map((f) => {
                const open = openFaq === f.id;
                return (
                  <div key={f.id} className="rounded-xl glass-strong">
                    <button
                      onClick={() => setOpenFaq(open ? null : f.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right text-sm font-bold"
                    >
                      <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
                      <span className="flex-1">{f.q}</span>
                    </button>
                    {open && (
                      <div className="border-t border-white/10 px-4 py-3 text-xs leading-7 text-foreground/80">
                        {f.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl glass-strong p-5">
          <h2 className="mb-4 text-lg font-extrabold">ارتباط با ما</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {socials.map(({ key, label }) => {
              const link = c[key].link;
              if (!link) return null;
              const src = imgUrl(c[key].imageId);
              return (
                <a
                  key={key}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-12 w-12 items-center justify-center transition hover:opacity-80"
                >
                  {src ? (
                    <img src={src} alt={label} className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="text-[10px]">{label}</span>
                  )}
                </a>
              );
            })}
            {c.phones.map((p) => (
              <a
                key={p}
                href={`tel:${p}`}
                className="flex h-12 items-center justify-center gap-2 rounded-xl glass px-4 hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                <span dir="ltr" className="text-sm tabular-nums">{p}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
