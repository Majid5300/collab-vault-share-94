import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { useCart, type CartItem } from "@/hooks/use-cart";
import { hasPendingInvoice, restoreLatestPendingToCart } from "@/lib/orders";

function truncate(s: string, n = 20) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function CartPanel() {
  const [open, setOpen] = useState(false);
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const navigate = useNavigate();
  const {
    items,
    updateQty,
    removeItem,
    distinctProducts,
    totalUnits,
    totalPrice,
  } = useCart();



  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("cart-open", onOpen);
    return () => window.removeEventListener("cart-open", onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const groups = useMemo(() => {
    const map = new Map<string, { productId: string; productName: string; productImage?: string; unitPrice: number; items: CartItem[] }>();
    for (const it of items) {
      if (!map.has(it.productId)) {
        map.set(it.productId, {
          productId: it.productId,
          productName: it.productName,
          productImage: it.productImage,
          unitPrice: it.unitPrice,
          items: [],
        });
      }
      map.get(it.productId)!.items.push(it);
    }
    return Array.from(map.values());
  }, [items]);

  return (
    <div
      className={`fixed inset-0 z-[60] transition ${open ? "visible" : "invisible"}`}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />

      {/* Panel slides from LEFT */}
      <aside
        dir="rtl"
        className={`absolute left-0 top-0 flex h-full w-[92vw] max-w-md flex-col glass-strong border-r border-white/10 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <button
            aria-label="بستن"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 text-right">
            <h2 className="text-lg font-extrabold">سبد خرید</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {distinctProducts} نوع گلس | {totalUnits} عدد کل
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">سبد خرید شما خالی است</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => {
                const subtotal = g.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                return (
                  <div key={g.productId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    {/* Group header */}
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <div className="text-sm font-extrabold text-price">
                          {g.unitPrice.toLocaleString("en-US")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">تومان / واحد</div>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-extrabold">{g.productName}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          جمع: <span className="text-price font-bold">{subtotal.toLocaleString("en-US")}</span> تومان
                        </p>
                      </div>
                      <div
                        className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${g.productImage ?? "from-sky-500/40 to-indigo-500/40"} border border-white/10`}
                      />
                    </div>

                    <div className="my-2 h-px bg-white/10" />

                    {/* Model rows */}
                    <div className="divide-y divide-white/5">
                      {g.items.map((it) => {
                        const rowTotal = it.qty * it.unitPrice;
                        return (
                          <div
                            key={it.modelName}
                            dir="ltr"
                            className="flex items-center gap-2 py-2"
                          >
                            <p
                              className="min-w-0 flex-1 truncate text-left text-xs font-bold"
                              title={it.modelName}
                            >
                              {truncate(it.modelName, 20)}
                            </p>

                            <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
                              <button
                                aria-label="کاهش"
                                onClick={() => updateQty(it.productId, it.modelName, it.qty - 5)}
                                disabled={it.qty <= 5}
                                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-30"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold tabular-nums">
                                {it.qty}
                              </span>
                              <button
                                aria-label="افزایش"
                                onClick={() => updateQty(it.productId, it.modelName, it.qty + 5)}
                                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="text-[11px] font-bold text-price tabular-nums">
                              {rowTotal.toLocaleString("en-US")}
                            </div>

                            <button
                              aria-label="حذف"
                              onClick={() => removeItem(it.productId, it.modelName)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">مجموع کل</span>
              <div className="text-right">
                <span className="text-lg font-extrabold text-price tabular-nums">
                  {totalPrice.toLocaleString("en-US")}
                </span>
                <span className="mr-1 text-[11px] text-muted-foreground">تومان</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (items.length === 0) {
                  setEmptyOpen(true);
                  return;
                }
                if (hasPendingInvoice()) {
                  setPendingOpen(true);
                  return;
                }
                setOpen(false);
                let loggedIn = false;
                try {
                  loggedIn = !!JSON.parse(localStorage.getItem("parsglass_user") || "null");
                } catch {}
                if (loggedIn) {
                  navigate({ to: "/cart" });
                } else {
                  navigate({ to: "/auth", search: { redirect: "cart" } as any });
                }
              }}
              className="w-full rounded-xl btn-primary-gradient py-3 text-sm font-extrabold shadow-lg shadow-primary/30 hover:opacity-90"
            >
              نهایی کردن فاکتور
            </button>
          </div>
        )}
      </aside>

      {/* Empty cart popup */}
      {emptyOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setEmptyOpen(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl glass-strong border border-white/10 p-5 text-center shadow-2xl"
          >
            <h3 className="text-base font-extrabold">فاکتور شما خالی می‌باشد</h3>
            <button
              onClick={() => setEmptyOpen(false)}
              className="mt-5 w-full rounded-xl btn-primary-gradient py-2.5 text-sm font-bold"
            >
              باشه
            </button>
          </div>
        </div>
      )}

      {/* Pending invoice exists popup */}
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
                  setOpen(false);
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
