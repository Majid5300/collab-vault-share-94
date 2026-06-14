import { ShoppingCart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { applyProductOrder, getSettings, type SiteSettings } from "@/lib/admin-store";
import { useMergedGlassTypes } from "@/lib/products-merged";

export function Products() {
  const [settings, setSettings] = useState<SiteSettings>(() => getSettings());
  const merged = useMergedGlassTypes();

  useEffect(() => {
    const r = () => setSettings(getSettings());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  const showcase = useMemo(() => {
    const hidden = new Set(settings.productHidden || []);
    const visible = merged.filter((t) => !hidden.has(t.id));
    const orderedIds = applyProductOrder(
      visible.map((t) => t.id),
      settings.productOrder,
    );
    return orderedIds
      .map((id) => visible.find((t) => t.id === id)!)
      .filter(Boolean)
      .slice(0, 5);
  }, [settings, merged]);

  return (
    <section id="products" className="mx-auto mt-14 max-w-7xl px-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-extrabold md:text-2xl">محصولات ما</h2>
        <div className="h-px flex-1 mx-4 bg-gradient-to-l from-primary/40 to-transparent" />
      </div>

      {/* صفحه اصلی: چپ به راست — مورد ۱ سمت چپ */}
      <div dir="ltr" className="grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-5">
        {showcase.map((p) => (
          <article
            key={p.id}
            dir="rtl"
            className="group flex flex-col overflow-hidden rounded-2xl glass transition hover:-translate-y-1 hover:border-black/20"
          >
            <Link
              to="/products"
              search={{ type: p.id }}
              className={`relative block aspect-square w-full bg-gradient-to-br ${p.hue}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.35),transparent_55%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3/5 w-2/5 rounded-lg border border-white/40 bg-white/30 backdrop-blur" />
              </div>
            </Link>
            <div className="flex flex-1 flex-col p-3 md:p-4">
              <Link to="/products" search={{ type: p.id }}>
                <h3 className="text-xs font-bold hover:text-primary md:text-sm">گلس {p.label}</h3>
              </Link>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-sm font-extrabold text-price md:text-base">
                  {p.price.toLocaleString("en-US")}
                </span>
                <span className="text-[10px] text-muted-foreground md:text-xs">تومان</span>
              </div>
              <Link
                to="/products"
                search={{ type: p.id }}
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl btn-primary-gradient px-2 py-2 text-[11px] font-bold shadow-lg shadow-primary/20 hover:opacity-90 md:text-sm"
              >
                <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>افزودن به سبد خرید</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
