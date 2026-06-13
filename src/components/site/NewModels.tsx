import { useEffect, useState } from "react";
import { getSettings, type SiteSettings } from "@/lib/admin-store";

const fallbackRows = [
  { types: ["گلس معمولی"], models: ["Redmi 13C / Poco C65", "A15 / A16 / A25", "Poco X3 / Poco X6"] },
  { types: ["گلس مات"], models: ["iPhone 15 / 15 Pro", "Galaxy S24 / S24+", "Pixel 8 / 8 Pro"] },
  { types: ["گلس پرایوسی"], models: ["iPhone 14 / 14 Pro", "Galaxy A54 / A34", "Honor X9 / X8"] },
];

export function NewModels() {
  const [s, setS] = useState<SiteSettings>(() => getSettings());

  useEffect(() => {
    const r = () => setS(getSettings());
    window.addEventListener("admin-updated", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("admin-updated", r);
      window.removeEventListener("storage", r);
    };
  }, []);

  const merged = s.newModelsRows
    .filter((r) => (r.groups?.length || 0) > 0 && (r.models?.length || 0) > 0)
    .map((r) => ({
      types: r.groups.map((g) => `گلس ${g}`),
      models: r.models.filter((m) => m.trim()),
    }));

  const rows = merged.length > 0 ? merged : fallbackRows;

  return (
    <section id="finder" className="mx-auto mt-16 max-w-7xl px-4">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-extrabold leading-snug md:text-2xl">
          {s.newModelsHeading || "مشابه و به‌روزترین مدل‌های گلس را از ما بخواهید"}
        </h2>
        {s.newModelsUpdatedAt && (
          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            تاریخ به‌روزرسانی: <span dir="ltr">{s.newModelsUpdatedAt}</span>
          </span>
        )}
      </div>

      <div className="rounded-3xl glass-strong border border-primary/30 p-5 md:p-8 shadow-xl shadow-primary/10">
        <ul className="space-y-6">
          {rows.map((r, idx) => (
            <li key={idx}>
              <div className="flex flex-wrap items-center justify-start gap-2" dir="rtl">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                {r.types.map((t, i) => (
                  <span key={t} className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-primary md:text-base">{t}</h3>
                    {i < r.types.length - 1 && <span className="text-foreground/40">|</span>}
                  </span>
                ))}
              </div>
              <ul className="mt-2 ml-2 space-y-1.5" dir="ltr">
                {r.models.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-xs text-foreground/85 md:text-sm">
                    <span className="inline-block h-1.5 w-1.5 rounded-sm bg-foreground/40" />
                    {m}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex justify-center md:mt-8">
          <button className="rounded-xl btn-primary-gradient px-10 py-3 text-sm font-bold shadow-lg shadow-primary/40 hover:opacity-90 md:text-base">
            گلس مشابه
          </button>
        </div>
      </div>
    </section>
  );
}
