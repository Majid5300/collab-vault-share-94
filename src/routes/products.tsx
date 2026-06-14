import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { z } from "zod";
import { type GlassType } from "@/data/glass-types";
import { applyProductOrder, getSettings } from "@/lib/admin-store";
import { useMergedGlassTypes, getMergedGlassType } from "@/lib/products-merged";
import { openCartPanel, useCart } from "@/hooks/use-cart";
import { AddToCartButton } from "@/components/site/AddToCartButton";
import { SimilarStockDialog } from "@/components/site/SimilarStockDialog";
import { hasPendingInvoice, restoreLatestPendingToCart } from "@/lib/orders";

const search = z.object({
  type: z.string().optional(),
  cat: z.string().optional(),
});

export const Route = createFileRoute("/products")({
  validateSearch: (s) => search.parse(s),
  component: ProductsPage,
});

function truncate(s: string, n = 22) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// Category list built from merged glass types (admin can rename labels)
function buildCategories(merged: GlassType[]) {
  return [
    { id: "all", label: "همه محصولات" },
    ...merged.map((t) => ({ id: t.id, label: `گلس ${t.label}` })),
  ];
}

function ProductCard({
  t,
  selected,
  onSelect,
}: {
  t: GlassType;
  selected: boolean;
  onSelect: () => void;
}) {
  const brandsLabel = "(ایفون،شیایومی-سامسونگ)";
  return (
    <button
      onClick={onSelect}
      className={`snap-start shrink-0 w-32 overflow-hidden rounded-2xl glass text-right transition hover:-translate-y-0.5 ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className={`relative aspect-square w-full bg-gradient-to-br ${t.hue}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3/5 w-2/5 rounded-lg border border-white/40 bg-white/30 backdrop-blur" />
        </div>
      </div>
      <div className="p-2">
        <div className="text-xs font-extrabold truncate">گلس {t.label}</div>
        <div className="mt-1 text-[11px] font-bold text-emerald-400 tabular-nums">
          {t.price.toLocaleString("en-US")}
        </div>
        <div className="mt-1 text-[9px] text-muted-foreground truncate">{brandsLabel}</div>
        <div className="mt-1 flex justify-center">
          <span
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${
              selected ? "border-primary" : "border-foreground/40"
            }`}
          >
            {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </span>
        </div>
      </div>
    </button>
  );
}

function Gallery({ t }: { t: GlassType }) {
  // Build 4 gallery "images" by varying gradient overlay positions
  const slides = useMemo(
    () => [
      { hue: t.hue, pos: "40%_30%" },
      { hue: t.hue, pos: "70%_40%" },
      { hue: t.hue, pos: "30%_70%" },
      { hue: t.hue, pos: "60%_60%" },
    ],
    [t.hue],
  );
  const [idx, setIdx] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIdx(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [t.id]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    setIdx(Math.round(el.scrollLeft / w));
  };

  return (
    <div className="overflow-hidden rounded-2xl glass">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className={`relative aspect-[16/9] w-full shrink-0 snap-start bg-gradient-to-br ${s.hue}`}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${s.pos.replace("_", " ")}, rgba(255,255,255,0.4), transparent 55%)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-3/5 w-1/3 rounded-xl border border-white/40 bg-white/30 backdrop-blur" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 py-2">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-4 bg-primary" : "w-1.5 bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ProductsPage() {
  const { type, cat } = Route.useSearch();
  const navigate = useNavigate();
  const { distinctCount } = useCart();

  const activeCat = cat && CATEGORIES.some((c) => c.id === cat) ? cat : "all";
  const activeId = useMemo(() => getGlassType(type).id, [type]);
  const active = useMemo(() => getGlassType(activeId), [activeId]);

  const [brand, setBrand] = useState<"apple" | "android" | null>(null);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [similarFor, setSimilarFor] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState(false);

  useEffect(() => {
    setBrand(null);
    setQtyMap({});
  }, [activeId]);

  useEffect(() => {
    if (hasPendingInvoice()) setPendingOpen(true);
  }, []);

  const setCat = (id: string) => {
    // when switching category, set type to first product of that category (or first overall for "all")
    const first =
      id === "all" ? GLASS_TYPES[0] : GLASS_TYPES.find((g) => g.id === id) ?? GLASS_TYPES[0];
    navigate({ to: "/products", search: { cat: id, type: first.id } });
  };

  const setType = (id: string) => {
    navigate({ to: "/products", search: { cat: activeCat, type: id } });
  };

  const productList = useMemo(() => {
    const base = activeCat === "all" ? GLASS_TYPES : GLASS_TYPES.filter((g) => g.id === activeCat);
    const s = getSettings();
    const hidden = new Set(s.productHidden || []);
    const visible = base.filter((t) => !hidden.has(t.id));
    const orderedIds = applyProductOrder(visible.map((t) => t.id), s.productOrder);
    return orderedIds.map((id) => visible.find((t) => t.id === id)!).filter(Boolean);
  }, [activeCat]);


  const visibleModels = useMemo(() => {
    const flat = active.brands.flatMap((b) =>
      b.models.map((m) => ({ ...m, brandId: b.id })),
    );
    return brand ? flat.filter((m) => m.brandId === brand) : flat;
  }, [active, brand]);

  const getQty = (m: string) => qtyMap[m] ?? 10;
  const setQty = (m: string, v: number) =>
    setQtyMap((p) => ({ ...p, [m]: Math.max(5, v) }));

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-black/10">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-black/5"
              aria-label="بازگشت"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
            <h1 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>
              پارس گلس
            </h1>
            <button
              aria-label="سبد خرید"
              onClick={() => openCartPanel()}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-black/5"
            >
              <ShoppingCart className="h-5 w-5" />
              {distinctCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary px-1 text-[10px] font-bold text-white">
                  {distinctCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        {/* TOP BAR: left = product slider, right = category filter */}
        <div className="mt-4 flex gap-3">
          {/* LEFT: product cards horizontal scroller */}
          <div className="min-w-0 flex-1 order-2 rounded-2xl glass-strong p-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
              {productList.map((t) => (
                <ProductCard
                  key={t.id}
                  t={t}
                  selected={t.id === activeId}
                  onSelect={() => setType(t.id)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: category filter, max-height ≈ 4 items, vertical scroll */}
          <aside className="order-1 w-36 shrink-0 rounded-2xl glass-strong p-3">
            <ul
              className="space-y-1 overflow-y-auto no-scrollbar pr-0.5"
              style={{ maxHeight: "13.5rem" }}
            >
              {CATEGORIES.map((c) => {
                const isActive = c.id === activeCat;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setCat(c.id)}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs transition ${
                        isActive
                          ? "bg-primary/15 font-extrabold text-primary"
                          : "text-foreground/80 hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isActive ? "border-primary" : "border-foreground/40"
                        }`}
                      >
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </span>
                      <span className="whitespace-nowrap">{c.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        {/* GALLERY of selected product */}
        <div className="mt-5">
          <Gallery t={active} />
        </div>

        {/* Title + price + 2-line description */}
        <div className="mt-4 flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">گلس {active.label}</h2>
          <div className="text-left">
            <span className="text-base font-extrabold text-emerald-400 tabular-nums">
              {active.price.toLocaleString("en-US")}
            </span>
            <span className="mr-1 text-[11px] text-muted-foreground">تومان</span>
          </div>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground line-clamp-2">
          {active.desc}
        </p>

        {/* Brand toggle */}
        <div className="mt-4 flex gap-2">
          {(["apple", "android"] as const).map((b) => {
            const isOn = brand === b;
            const label = b === "apple" ? "اپل" : "سامسونگ / شیائومی";
            return (
              <button
                key={b}
                onClick={() => setBrand(isOn ? null : b)}
                className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                  isOn
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 glass text-foreground/70 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Models */}
        <div className="mt-4 overflow-hidden rounded-2xl glass-strong">
          <div className="divide-y divide-black/5">
            {visibleModels.map((m) => {
              const q = getQty(m.name);
              return (
                <div
                  key={m.brandId + m.name}
                  className="flex flex-row-reverse items-center gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold md:text-sm" title={m.name}>
                      {truncate(m.name, 24)}
                    </p>
                    {!m.inStock && (
                      <span className="mt-1 inline-block rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        ناموجود
                      </span>
                    )}
                  </div>

                  {m.inStock && (
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                      <button
                        aria-label="کاهش"
                        onClick={() => setQty(m.name, q - 5)}
                        disabled={q <= 5}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums">
                        {q}
                      </span>
                      <button
                        aria-label="افزایش"
                        onClick={() => setQty(m.name, q + 5)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {m.inStock ? (
                    <AddToCartButton
                      item={{
                        productId: active.id,
                        productName: active.label,
                        productImage: active.hue,
                        modelName: m.name,
                        unitPrice: active.price,
                      }}
                      qty={q}
                    />
                  ) : (
                    <button
                      onClick={() => setSimilarFor(m.name)}
                      className="rounded-xl bg-orange-500 px-3 py-2 text-[11px] font-bold text-white shadow-md shadow-orange-500/30 hover:bg-orange-600"
                    >
                      جنس مشابه
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <SimilarStockDialog
        open={!!similarFor}
        onClose={() => setSimilarFor(null)}
        fromTypeId={active.id}
        modelName={similarFor ?? ""}
      />

      {pendingOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPendingOpen(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl glass-strong border border-white/10 p-5 shadow-2xl"
          >
            <h3 className="text-center text-base font-extrabold">
              شما یک فاکتور در انتظار پرداخت دارید
            </h3>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              امکان ثبت همزمان دو فاکتور وجود ندارد
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  setPendingOpen(false);
                  navigate({ to: "/cart" });
                }}
                className="w-full rounded-xl btn-primary-gradient py-2.5 text-sm font-bold"
              >
                ادامه فرایند پرداخت
              </button>
              <button
                onClick={() => {
                  restoreLatestPendingToCart();
                  setPendingOpen(false);
                  openCartPanel();
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold hover:bg-white/10"
              >
                افزودن به سبد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
