import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, X } from "lucide-react";
import { toast } from "sonner";
import {
  getOrders,
  getPendingInvoices,
  removePendingInvoice,
  STATUS_COLOR,
  STATUS_LABEL,
  persianDateTime,
  type Order,
  type PendingInvoice,
} from "@/lib/orders";
import type { CartItem } from "@/hooks/use-cart";

export const Route = createFileRoute("/profile_/orders")({
  head: () => ({
    meta: [
      { title: "پیگیری سفارشات | پارس گلس" },
      { name: "description", content: "لیست سفارشات و سبدهای در انتظار پرداخت." },
    ],
  }),
  component: OrdersPage,
});


const ACTIVE_INVOICE_KEY = "parsglass_active_invoice";

type Inv = Order | PendingInvoice;

function groupItems(items: CartItem[]) {
  const map = new Map<string, { productId: string; productName: string; productImage?: string; items: CartItem[] }>();
  for (const it of items) {
    if (!map.has(it.productId)) {
      map.set(it.productId, {
        productId: it.productId,
        productName: it.productName,
        productImage: it.productImage,
        items: [],
      });
    }
    map.get(it.productId)!.items.push(it);
  }
  return Array.from(map.values());
}

function OrdersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"placed" | "pending">("placed");
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendings, setPendings] = useState<PendingInvoice[]>([]);
  const [detail, setDetail] = useState<Inv | null>(null);

  function refresh() {
    setOrders(getOrders());
    setPendings(getPendingInvoices());
  }

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("orders-updated", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("orders-updated", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  function payPending(p: PendingInvoice) {
    localStorage.setItem(ACTIVE_INVOICE_KEY, p.invoice);
    window.dispatchEvent(new Event("orders-updated"));
    navigate({ to: "/payment" });
  }

  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10" aria-label="بازگشت">
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Link>
            <h1 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>پیگیری سفارش</h1>
            <div className="w-9" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        <div className="mb-4 border-b border-dashed border-white/20" />

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setTab("placed")}
            className={`rounded-lg py-2 text-xs font-extrabold transition ${
              tab === "placed" ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            سفارشات ثبت‌شده
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`rounded-lg py-2 text-xs font-extrabold transition ${
              tab === "pending" ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            سبد در انتظار پرداخت
          </button>
        </div>

        {tab === "placed" ? (
          <section className="rounded-2xl glass-strong p-2">
            {orders.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">هنوز سفارشی ثبت نکرده‌اید</p>
            ) : (
              <ul>
                {orders.map((o, i) => (
                  <li key={o.id}>
                    <div className="flex items-center justify-between gap-3 px-2 py-3">
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_COLOR[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                      <button
                        onClick={() => setDetail(o)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-white/10"
                      >
                        جزئیات سفارش
                      </button>
                      <span className="flex-1 text-center text-[11px] text-muted-foreground tabular-nums">
                        {persianDateTime(o.date)}
                      </span>
                      <span className="text-xs font-extrabold tabular-nums" style={{ color: "#0ea5e9" }}>
                        {o.invoice}
                      </span>
                    </div>
                    {i < orders.length - 1 && <div className="h-px bg-white/10" />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="rounded-2xl glass-strong p-2">
            {pendings.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">سبد پرداخت نشده‌ای ندارید</p>
            ) : (
              <ul>
                {pendings.map((p, i) => (
                  <li key={p.id}>
                    <div className="flex items-center justify-between gap-2 px-2 py-3">
                      <button
                        onClick={() => payPending(p)}
                        className="rounded-lg btn-primary-gradient px-3 py-1.5 text-[11px] font-extrabold"
                      >
                        پرداخت فاکتور
                      </button>
                      <button
                        onClick={() => setDetail(p)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-white/10"
                      >
                        جزئیات سفارش
                      </button>
                      <span className="flex-1 text-center text-[11px] text-muted-foreground tabular-nums">
                        {persianDateTime(p.date)}
                      </span>
                      <span className="text-xs font-extrabold tabular-nums" style={{ color: "#0ea5e9" }}>
                        {p.invoice}
                      </span>
                    </div>
                    {i < pendings.length - 1 && <div className="h-px bg-white/10" />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {detail && (
        <InvoiceModal
          inv={detail}
          onClose={() => setDetail(null)}
          onRemovePending={(invoice) => {
            removePendingInvoice(invoice);
            setDetail(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function InvoiceModal({
  inv,
  onClose,
}: {
  inv: Inv;
  onClose: () => void;
  onRemovePending?: (invoice: string) => void;
}) {
  const groups = useMemo(() => groupItems(inv.items), [inv]);
  const total = inv.totalPrice;
  const units = inv.totalUnits;

  function downloadPdf() {
    // Lightweight HTML-to-print approach (no extra deps): open a new window with invoice HTML, then trigger print → save as PDF.
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("امکان باز کردن پنجره وجود ندارد");
      return;
    }
    const rows = groups
      .map(
        (g) => `
          <tr><td colspan="3" style="padding-top:10px;font-weight:800">${g.productName}</td></tr>
          ${g.items
            .map(
              (it) => `
            <tr>
              <td>${it.modelName}</td>
              <td style="text-align:center">${it.qty}</td>
              <td style="text-align:left">${(it.qty * it.unitPrice).toLocaleString("en-US")} تومان</td>
            </tr>`,
            )
            .join("")}
        `,
      )
      .join("");
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>فاکتور ${inv.invoice}</title>
      <style>body{font-family:Tahoma,sans-serif;padding:24px;color:#111}h1{color:#0ea5e9;text-align:center}table{width:100%;border-collapse:collapse}td{padding:6px;border-bottom:1px solid #eee;font-size:13px}.tot{margin-top:16px;font-weight:800;text-align:left}</style>
      </head><body><h1>پارس گلس</h1>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px">
        <div>${inv.invoice}</div><div>${persianDateTime(inv.date)}</div>
      </div>
      <table>${rows}</table>
      <div class="tot">تعداد کل: ${units}</div>
      <div class="tot">مجموع کل: ${total.toLocaleString("en-US")} تومان</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl glass-strong border border-white/10 p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>پارس گلس</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg glass hover:bg-white/10"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span style={{ color: "#0ea5e9" }} className="font-extrabold">{inv.invoice}</span>
          <span>{persianDateTime(inv.date)}</span>
        </div>
        {"postalCode" in inv && (inv as Order).postalCode && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
            <button
              onClick={() => {
                navigator.clipboard.writeText((inv as Order).postalCode!);
                toast.success("کپی شد");
              }}
              className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20"
            >
              کپی
            </button>
            <span>
              کد پستی: <span dir="ltr" className="font-mono">{(inv as Order).postalCode}</span>
            </span>
          </div>
        )}
        <div className="h-px bg-white/10" />

        <div className="space-y-4 py-3">
          {groups.map((g) => (
            <div key={g.productId}>
              <div className="flex items-center gap-3 py-1.5">
                <div className={`h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br ${g.productImage ?? "from-sky-500/40 to-indigo-500/40"} border border-white/10`} />
                <p className="text-sm font-extrabold">{g.productName}</p>
              </div>
              <div className="divide-y divide-white/5">
                {g.items.map((it) => (
                  <div key={it.modelName} dir="ltr" className="flex items-center justify-between gap-2 py-1.5">
                    <p className="flex-1 truncate text-xs text-left">{it.modelName}</p>
                    <span className="text-[11px] tabular-nums text-muted-foreground">×{it.qty}</span>
                    <span className="text-[11px] font-bold text-price tabular-nums">
                      {(it.qty * it.unitPrice).toLocaleString("en-US")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">تعداد کل</span>
            <span className="text-sm font-extrabold tabular-nums">{units}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">مجموع کل</span>
            <span className="text-lg font-extrabold text-price tabular-nums">
              {total.toLocaleString("en-US")} <span className="text-[11px] text-muted-foreground">تومان</span>
            </span>
          </div>
        </div>

        <button
          onClick={downloadPdf}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl btn-primary-gradient py-2.5 text-sm font-extrabold shadow-lg shadow-primary/30 hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          دانلود فاکتور
        </button>
      </div>
    </div>
  );
}
