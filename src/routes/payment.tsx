import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Copy, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import {
  addOrder,
  clearActiveInvoice,
  getOrCreateActiveInvoice,
  getPendingByInvoice,
  removePendingInvoice,
} from "@/lib/orders";
import type { CartItem } from "@/hooks/use-cart";

export const Route = createFileRoute("/payment")({
  component: PaymentPage,
});

const CARD = "6037-7015-0245-3282";
const IBAN = "IR201160000000000226953672";
const HOLDER = "برومند";

function PaymentPage() {
  const navigate = useNavigate();
  const [invoice] = useState<string>(() =>
    typeof window === "undefined" ? "#0000" : getOrCreateActiveInvoice(),
  );
  const [pendingItems, setPendingItems] = useState<CartItem[]>([]);
  const [pendingTotalPrice, setPendingTotalPrice] = useState(0);
  const [pendingTotalUnits, setPendingTotalUnits] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const p = getPendingByInvoice(invoice);
      if (p) {
        setPendingItems(p.items);
        setPendingTotalPrice(p.totalPrice);
        setPendingTotalUnits(p.totalUnits);
      }
    };
    refresh();
    window.addEventListener("orders-updated", refresh);
    return () => window.removeEventListener("orders-updated", refresh);
  }, [invoice]);

  const items = pendingItems;
  const totalPrice = pendingTotalPrice;
  const totalUnits = pendingTotalUnits;

  const [receipt, setReceipt] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const rial = useMemo(() => totalPrice * 10, [totalPrice]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("کپی شد ✓");
    } catch {
      toast.error("خطا در کپی");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setReceipt(String(reader.result));
    reader.readAsDataURL(f);
  }

  function confirmPayment() {
    if (!receipt) {
      toast.error("لطفاً تصویر رسید را آپلود کنید");
      return;
    }
    if (items.length === 0) {
      toast.error("سبد خرید خالی است");
      return;
    }
    let userPhone: string | undefined;
    let userName: string | undefined;
    let userAddress: string | undefined;
    try {
      const u = JSON.parse(localStorage.getItem("parsglass_user") || "null");
      if (u) {
        userPhone = u.phone;
        userName = `${u.name ?? ""} ${u.family ?? ""}`.trim();
      }
      userAddress = localStorage.getItem("parsglass_default_address_v1") || undefined;
    } catch {}
    addOrder({
      id: invoice + "-" + Date.now(),
      invoice,
      date: new Date().toISOString(),
      items,
      totalPrice,
      totalUnits,
      status: "pending",
      receipt,
      userPhone,
      userName,
      userAddress,
    });
    removePendingInvoice(invoice);
    clearActiveInvoice();
    setOrderCode(invoice.replace("#", ""));
    setSuccess(true);
  }

  function finalize() {
    navigate({ to: "/profile/orders" as any });
  }




  if (success) {
    return (
      <div dir="rtl" className="min-h-screen pb-24">
        <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 pt-20">
          <div className="success-check mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white">
            <Check className="check-icon h-14 w-14 text-emerald-500" strokeWidth={3} />
          </div>
          <p className="mb-2 text-center text-base font-extrabold">
            سفارش شما با کد #{orderCode} ثبت شد، در انتظار تایید مدیر
          </p>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            برای پیگیری سفارش: پنل کاربری ← پیگیری سفارشات
          </p>
          <button
            onClick={finalize}
            className="rounded-xl btn-primary-gradient px-10 py-3 text-sm font-extrabold shadow-lg shadow-primary/30 hover:opacity-90"
          >
            تایید
          </button>
        </main>
        <style>{`
          .success-check { animation: pop .35s ease-out; }
          .check-icon { animation: draw .5s ease-out .2s both; }
          @keyframes pop { 0% { transform: scale(.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes draw { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link
              to="/cart"
              className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10"
              aria-label="بازگشت"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Link>
            <h1 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>
              پرداخت کارت به کارت
            </h1>
            <div className="w-9" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {/* Section 1 — Instructions */}
        <div className="rounded-2xl glass p-4">
          <p className="text-xs leading-7 text-muted-foreground">
            بعد از عملیات انتقال وجه (کارت به کارت یا شبا) تصویر وجه انتقالی رو توی فیلد پایین آپلود کنین و دکمه تایید رو کلیک کنین، تا با بررسی مدیر تایید و ادامه فرایند ارسال انجام بشه
          </p>
        </div>

        {/* Section 2 — Payment card */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/15 p-5 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(99,102,241,0.35) 60%, rgba(168,85,247,0.3))",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-wide" style={{ color: "#e0f2fe" }}>
              پارس گلس
            </h2>
            <div className="h-8 w-12 rounded-md bg-gradient-to-br from-yellow-200/80 to-yellow-500/80" />
          </div>

          {/* Row 1: Holder + Card */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => copy(CARD.replaceAll("-", ""))}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
            >
              <Copy className="h-3.5 w-3.5" /> کپی
            </button>
            <div className="flex-1 text-left">
              <div className="font-mono text-sm font-bold tracking-wider" dir="ltr">
                {CARD}
              </div>
              <div className="mt-0.5 text-[11px] text-white/70">{HOLDER}</div>
            </div>
          </div>

          {/* Row 2: IBAN */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => copy(IBAN)}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
            >
              <Copy className="h-3.5 w-3.5" /> کپی
            </button>
            <div className="flex-1 text-left">
              <div className="font-mono text-xs font-bold tracking-wider" dir="ltr">
                {IBAN}
              </div>
              <div className="mt-0.5 text-[11px] text-white/70">شماره شبا</div>
            </div>
          </div>

          {/* Row 3: Amount */}
          <div className="flex items-center gap-2 border-t border-white/15 pt-3">
            <button
              onClick={() => copy(String(rial))}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30"
            >
              <Copy className="h-3.5 w-3.5" /> کپی به ریال
            </button>
            <div className="flex-1 text-left">
              <div className="text-base font-extrabold tabular-nums" dir="ltr">
                {totalPrice.toLocaleString("en-US")}
              </div>
              <div className="mt-0.5 text-[11px] text-white/70">مبلغ فاکتور (تومان)</div>
            </div>
          </div>
        </div>

        {/* Section 3 — Upload */}
        <div className="rounded-2xl glass p-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10"
          >
            {receipt ? (
              <img src={receipt} alt="رسید" className="h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span className="text-xs font-bold">محل آپلود تصویر</span>
              </div>
            )}
          </button>

          <p className="mt-4 text-[11px] leading-6 text-muted-foreground">
            فاکتور شما بعد از حداکثر ۸ ساعت تایید و شروع به فرایند ارسال میکنه، برای پیگیری میتونین از پنل کاربری بخش ← پیگیری سفارش چک کنین
          </p>

          <div className="mt-4 flex justify-end">
            <button
              onClick={confirmPayment}
              className="rounded-xl btn-primary-gradient px-8 py-2.5 text-sm font-extrabold shadow-lg shadow-primary/30 hover:opacity-90"
            >
              تایید
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
