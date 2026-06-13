import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart, type CartItem } from "@/hooks/use-cart";
import {
  clearAllPendingInvoices,
  getLatestPendingInvoice,
  hasPendingInvoice,
  type PendingInvoice,
} from "@/lib/orders";

type Props = {
  item: Omit<CartItem, "qty">;
  qty: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  onAdded?: () => void;
};

export function AddToCartButton({
  item,
  qty,
  disabled,
  className = "",
  label = "افزودن به سبد",
  onAdded,
}: Props) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [step, setStep] = useState<"none" | "choose" | "confirm">("none");
  const [pending, setPending] = useState<PendingInvoice | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const reallyAdd = () => {
    addItem({ ...item, qty });
    setDone(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDone(false), 2000);
    onAdded?.();
  };

  const handle = () => {
    if (hasPendingInvoice()) {
      setPending(getLatestPendingInvoice());
      setStep("choose");
      return;
    }
    reallyAdd();
  };

  const goToPending = () => {
    setStep("none");
    navigate({ to: "/profile/orders" });
  };

  const startNewFlow = () => setStep("confirm");

  const confirmStartNew = () => {
    clearAllPendingInvoices();
    setStep("none");
    reallyAdd();
  };

  return (
    <>
      <button
        onClick={handle}
        disabled={disabled || done}
        className={`rounded-xl px-3 py-2 text-[11px] font-bold shadow-md transition-all ${
          done
            ? "bg-green-600 text-white shadow-green-600/30"
            : "btn-primary-gradient shadow-primary/20 hover:opacity-90"
        } disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        {done ? "✓ انجام شد" : label}
      </button>

      {step !== "none" && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setStep("none")}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl glass-strong border border-white/10 p-5 shadow-2xl"
          >
            {step === "choose" && (
              <>
                <h3 className="text-center text-base font-extrabold">
                  شما یک فاکتور در انتظار پرداخت دارید
                </h3>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  امکان ثبت همزمان دو فاکتور وجود ندارد
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={goToPending}
                    className="w-full rounded-xl btn-primary-gradient py-2.5 text-sm font-bold"
                  >
                    ادامه فاکتور قبلی
                  </button>
                  <button
                    onClick={startNewFlow}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold hover:bg-white/10"
                  >
                    شروع سبد جدید
                  </button>
                </div>
              </>
            )}

            {step === "confirm" && pending && (
              <>
                <h3 className="text-center text-sm font-extrabold" style={{ color: "#0ea5e9" }}>
                  فاکتور {pending.invoice}
                </h3>
                <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
                  {pending.items.map((it) => (
                    <div
                      key={it.productId + it.modelName}
                      className="flex items-center justify-between gap-2 border-b border-white/5 py-1.5 last:border-0"
                    >
                      <span className="flex-1 truncate text-[11px] font-bold" dir="ltr">
                        {it.modelName}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        ×{it.qty}
                      </span>
                      <span className="text-[11px] font-bold text-price tabular-nums">
                        {(it.qty * it.unitPrice).toLocaleString("en-US")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">مجموع کل</span>
                  <span className="font-extrabold text-price tabular-nums">
                    {pending.totalPrice.toLocaleString("en-US")}
                    <span className="mr-1 text-[10px] text-muted-foreground">تومان</span>
                  </span>
                </div>
                <p className="mt-4 text-center text-xs text-foreground/80">
                  فاکتور قبلی حذف بشه و سبد جدیدی رو شروع میکنین؟
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={goToPending}
                    className="w-full rounded-xl btn-primary-gradient py-2.5 text-sm font-bold"
                  >
                    ادامه فاکتور قبلی
                  </button>
                  <button
                    onClick={confirmStartNew}
                    className="w-full rounded-xl border border-destructive/40 bg-destructive/10 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/15"
                  >
                    شروع سبد جدید
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
