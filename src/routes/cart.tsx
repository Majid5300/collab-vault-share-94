import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, X, MapPin, Truck, Package, Send } from "lucide-react";
import { useCart, type CartItem, openCartPanel } from "@/hooks/use-cart";
import { getOrCreateActiveInvoice, upsertPendingInvoice } from "@/lib/orders";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});


const ADDRESSES_KEY = "parsglass_addresses_v1";
const DEFAULT_ADDR_KEY = "parsglass_default_address_v1";
const USER_KEY = "parsglass_user";

function getInvoiceNumber(): string {
  if (typeof window === "undefined") return "#0000";
  return getOrCreateActiveInvoice();
}

function persianDateTime(): string {
  const d = new Date();
  const date = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date} - ${time}`;
}

const DISCOUNT_CODES: Record<string, { amount: number; remaining: number }> = {
  PARS10: { amount: 50000, remaining: 3 },
  GLASS20: { amount: 120000, remaining: 1 },
};

function CartPage() {
  const navigate = useNavigate();
  const { items, clear, totalPrice, totalUnits, distinctProducts } = useCart();


  const [invoice] = useState(getInvoiceNumber);
  const [dt, setDt] = useState(persianDateTime);
  const [user, setUser] = useState<{ name?: string; family?: string; phone?: string }>({});

  const [modelsOpen, setModelsOpen] = useState(false);

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ amount: number; remaining: number } | null>(null);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [codeError, setCodeError] = useState("");
  const finalTotal = Math.max(0, totalPrice - (discountApplied && discount ? discount.amount : 0));

  const [addresses, setAddresses] = useState<string[]>([]);
  const [defaultAddr, setDefaultAddr] = useState<string>("");
  const [newAddr, setNewAddr] = useState("");

  const [shipping, setShipping] = useState<"post" | "tipax" | "mahex" | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    const id = setInterval(() => setDt(persianDateTime()), 30_000);
    try {
      const u = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
      setUser(u);
    } catch {}
    try {
      const list = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || "[]");
      if (Array.isArray(list)) setAddresses(list);
    } catch {}
    const def = localStorage.getItem(DEFAULT_ADDR_KEY) || "";
    setDefaultAddr(def);

    return () => clearInterval(id);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { productId: string; productName: string; productImage?: string; unitPrice: number; items: CartItem[] }
    >();
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

  function checkCode() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    const found = DISCOUNT_CODES[c];
    if (!found || found.remaining <= 0) {
      setDiscount(null);
      setDiscountApplied(false);
      setCodeError("کد تخفیف نامعتبر است");
      return;
    }
    setCodeError("");
    setDiscount(found);
    setDiscountApplied(false);
  }

  function saveNewAddress() {
    const v = newAddr.trim();
    if (!v) return;
    const list = Array.from(new Set([...addresses, v]));
    setAddresses(list);
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
    if (!defaultAddr) {
      setDefaultAddr(v);
      localStorage.setItem(DEFAULT_ADDR_KEY, v);
    }
    setNewAddr("");
  }

  function chooseAddress(a: string) {
    setDefaultAddr(a);
    localStorage.setItem(DEFAULT_ADDR_KEY, a);
    setError("");
  }

  function proceedCardToCard() {
    if (!defaultAddr) {
      setError("لطفاً آدرس خود را وارد کنید");
      return;
    }
    if (!shipping) {
      setError("لطفاً روش ارسال را انتخاب کنید");
      return;
    }
    setError("");
    // Snapshot pending invoice before going to payment
    upsertPendingInvoice({
      id: invoice,
      invoice,
      date: new Date().toISOString(),
      items,
      totalPrice: finalTotal,
      totalUnits,
      address: defaultAddr,
      shipping,
    });
    // Remove items from the active shopping cart — they now live in the pending invoice
    clear();
    navigate({ to: "/payment" as any });
  }

  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10"
              aria-label="بازگشت"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Link>
            <h1 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>
              فاکتور نهایی
            </h1>
            <div className="w-9" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        {/* Unified invoice card */}
        {items.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">سبد خرید شما خالی است</p>
        ) : (
          <section className="rounded-2xl glass-strong p-4">
            {/* Top: brand center */}
            <div className="text-center">
              <h2 className="text-lg font-extrabold" style={{ color: "#0ea5e9" }}>
                پارس گلس
              </h2>
            </div>

            {/* User / Invoice row */}
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="text-left">
                <div className="text-[11px] text-muted-foreground">شماره فاکتور</div>
                <div className="text-base font-extrabold tabular-nums" style={{ color: "#0ea5e9" }}>
                  {invoice}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{dt}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">
                  {user.name || user.family
                    ? `${user.name ?? ""} ${user.family ?? ""}`.trim()
                    : "مهمان"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums" dir="ltr">
                  {user.phone || "—"}
                </div>
              </div>
            </div>

            <div className="my-4 h-px bg-white/10" />

            {/* Grouped summary (always visible) */}
            <div className="space-y-2">
              {groups.map((g) => {
                const gQty = g.items.reduce((s, i) => s + i.qty, 0);
                const gPrice = g.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                return (
                  <div
                    key={g.productId}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5"
                  >
                    <div
                      className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${g.productImage ?? "from-sky-500/40 to-indigo-500/40"} border border-white/10`}
                    />
                    <div className="flex-1 text-right">
                      <p className="text-sm font-extrabold">گلس {g.productName}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold tabular-nums">{gQty}</div>
                      <div className="text-[10px] text-muted-foreground">عدد</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-extrabold text-price tabular-nums">
                        {gPrice.toLocaleString("en-US")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">تومان</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Toggle + Edit */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setModelsOpen(true)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-sky-300 hover:bg-white/10"
              >
                مشاهده مدل‌های انتخابی
              </button>
              <button
                onClick={() => {
                  navigate({ to: "/products", search: { cat: "all", type: "clear" } as any });
                  setTimeout(() => openCartPanel(), 80);
                }}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-sky-300 hover:bg-white/10"
              >
                ویرایش سبد
              </button>
            </div>

            {/* Totals */}
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">تعداد کل</span>
                <span className="text-base font-extrabold tabular-nums">{totalUnits}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">مجموع کل</span>
                <div>
                  <span className="text-xl font-extrabold text-price tabular-nums">
                    {finalTotal.toLocaleString("en-US")}
                  </span>
                  <span className="mr-1 text-[11px] text-muted-foreground">تومان</span>
                </div>
              </div>
              {discountApplied && discount && (
                <div className="mt-1 flex items-baseline justify-between text-[11px] text-emerald-300">
                  <span>تخفیف اعمال شده</span>
                  <span className="tabular-nums">-{discount.amount.toLocaleString("en-US")}</span>
                </div>
              )}
              <div className="mt-1 text-[11px] text-muted-foreground">
                {distinctProducts} نوع گلس
              </div>
            </div>
          </section>
        )}

        {/* Discount */}
        <section className="rounded-2xl glass-strong p-4">
          <h3 className="mb-3 text-sm font-extrabold">کد تخفیف</h3>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="کد تخفیف را وارد کنید"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
            <button
              onClick={checkCode}
              className="rounded-xl btn-primary-gradient px-4 py-2 text-xs font-extrabold"
            >
              استعلام
            </button>
          </div>
          {codeError && <p className="mt-2 text-xs text-destructive">{codeError}</p>}
          {discount && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <button
                onClick={() => setDiscountApplied(true)}
                disabled={discountApplied}
                className="rounded-lg btn-primary-gradient px-3 py-1.5 text-[11px] font-extrabold disabled:opacity-60"
              >
                {discountApplied ? "اعمال شد" : "اعمال تخفیف"}
              </button>
              <div className="flex-1 text-right">
                <p className="text-xs text-price">
                  سود شما از این خرید:{" "}
                  <span className="font-extrabold tabular-nums">
                    {discount.amount.toLocaleString("en-US")}
                  </span>{" "}
                  تومان
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  استفاده باقیمانده: <span className="tabular-nums">{discount.remaining}</span>
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Address */}
        <section className="rounded-2xl glass-strong p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <MapPin className="h-4 w-4 text-sky-400" />
            آدرس ارسال
          </h3>

          {addresses.length === 0 ? (
            <div className="space-y-2">
              <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-right text-xs text-muted-foreground">
                هنوز آدرسی ثبت نکرده‌اید
              </p>
              <textarea
                value={newAddr}
                onChange={(e) => setNewAddr(e.target.value)}
                onBlur={saveNewAddress}
                rows={3}
                placeholder="آدرس کامل خود را وارد کنید"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-right text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((a) => {
                const active = a === defaultAddr;
                return (
                  <label
                    key={a}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-right text-xs leading-6 transition ${
                      active
                        ? "border-sky-400 bg-sky-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="addr"
                      checked={active}
                      onChange={() => chooseAddress(a)}
                      className="mt-1 accent-sky-500"
                    />
                    <span className="flex-1">{a}</span>
                  </label>
                );
              })}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-bold text-sky-300">
                  افزودن آدرس جدید
                </summary>
                <textarea
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  onBlur={saveNewAddress}
                  rows={3}
                  placeholder="آدرس کامل خود را وارد کنید"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-right text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </details>
            </div>
          )}
        </section>

        {/* Shipping */}
        <section className="rounded-2xl glass-strong p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <Truck className="h-4 w-4 text-sky-400" />
            نحوه ارسال بسته - پس کرایه
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "post", label: "پست", Icon: Send },
              { id: "tipax", label: "تیپاکس", Icon: Package },
              { id: "mahex", label: "ماهکس", Icon: Truck },
            ] as const).map((opt) => {
              const active = shipping === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setShipping(opt.id);
                    setError("");
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition ${
                    active
                      ? "border-sky-400 bg-sky-500/15 text-sky-300"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <opt.Icon className="h-5 w-5" />
                  <span>{opt.label}</span>
                  <span
                    className={`mt-1 inline-block h-3 w-3 rounded-full border ${
                      active ? "border-sky-400 bg-sky-400" : "border-white/30"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-center text-[11px] leading-6 text-muted-foreground">
            سفارش شما پس از تأیید پرداخت، حداکثر ظرف ۴۸ تا ۷۲ ساعت کاری ارسال خواهد شد
          </p>
        </section>

        {/* Payment */}
        <section className="rounded-2xl glass-strong p-4">
          <h3 className="mb-3 text-sm font-extrabold">روش پرداخت</h3>
          {error && (
            <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-center text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              disabled
              className="flex-1 cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-muted-foreground"
            >
              درگاه پرداخت / به زودی
            </button>
            <button
              onClick={proceedCardToCard}
              className="flex-1 rounded-xl btn-primary-gradient py-3 text-sm font-extrabold shadow-lg shadow-primary/30 hover:opacity-90"
            >
              کارت به کارت
            </button>
          </div>
        </section>
      </main>

      {/* Models detail modal — read only */}
      {modelsOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setModelsOpen(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl glass-strong border border-white/10 p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <button
                aria-label="بستن"
                onClick={() => setModelsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="flex-1 text-right text-base font-extrabold">مدل‌های انتخابی</h3>
            </div>

            <div className="mt-3 space-y-4">
              {groups.map((g) => {
                const gQty = g.items.reduce((s, i) => s + i.qty, 0);
                const gPrice = g.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                return (
                  <div key={g.productId} className="rounded-xl border border-white/10 bg-white/5">
                    {/* Summary row */}
                    <div className="flex items-center gap-3 p-2.5">
                      <div
                        className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${g.productImage ?? "from-sky-500/40 to-indigo-500/40"} border border-white/10`}
                      />
                      <div className="flex-1 text-right">
                        <p className="text-sm font-extrabold">گلس {g.productName}</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold tabular-nums">{gQty}</div>
                        <div className="text-[10px] text-muted-foreground">عدد</div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-extrabold text-price tabular-nums">
                          {gPrice.toLocaleString("en-US")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">تومان</div>
                      </div>
                    </div>
                    <div className="h-px bg-white/10" />
                    {/* Models (read-only) */}
                    <div className="divide-y divide-white/5 px-2.5">
                      {g.items.map((it) => (
                        <div key={it.modelName} dir="ltr" className="flex items-center gap-2 py-2">
                          <p
                            className="min-w-0 flex-1 truncate text-xs font-bold text-left"
                            title={it.modelName}
                          >
                            {it.modelName}
                          </p>
                          <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-bold tabular-nums">
                            {it.qty}
                          </div>
                          <div className="text-[11px] font-bold text-price tabular-nums">
                            {(it.qty * it.unitPrice).toLocaleString("en-US")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
