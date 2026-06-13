import { useEffect, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { findSimilarTypes, type GlassType } from "@/data/glass-types";
import { AddToCartButton } from "./AddToCartButton";

type Props = {
  open: boolean;
  onClose: () => void;
  fromTypeId: string;
  modelName: string;
};

export function SimilarStockDialog({ open, onClose, fromTypeId, modelName }: Props) {
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setSelectedId(null);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  const similar = findSimilarTypes(fromTypeId, 2);
  const selected = similar.find((t) => t.id === selectedId) ?? null;

  const q = (id: string) => qtyMap[id] ?? 10;
  const setQ = (id: string, v: number) =>
    setQtyMap((p) => ({ ...p, [id]: Math.max(5, v) }));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl glass-strong border border-white/10 p-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-extrabold">گلس مشابه برای {modelName}</h3>
          <button
            aria-label="بستن"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {similar.map((t: GlassType) => {
            const isSelected = selectedId === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`flex flex-col gap-3 rounded-2xl border p-3 text-right transition ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br ${t.hue}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.35),transparent_55%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-3/5 w-2/5 rounded-lg border border-white/40 bg-white/30 backdrop-blur" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">{t.label}</span>
                  <span className="text-sm font-extrabold text-price tabular-nums">
                    {t.price.toLocaleString("en-US")}
                  </span>
                </div>
                <div
                  className="flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setQ(t.id, q(t.id) - 5)}
                      disabled={q(t.id) <= 5}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-30"
                      aria-label="کاهش"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold tabular-nums">{q(t.id)}</span>
                    <button
                      type="button"
                      onClick={() => setQ(t.id, q(t.id) + 5)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10"
                      aria-label="افزایش"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center">
          {selected ? (
            <AddToCartButton
              item={{
                productId: selected.id,
                productName: selected.label,
                productImage: selected.hue,
                modelName: modelName,
                unitPrice: selected.price,
              }}
              qty={q(selected.id)}
              onAdded={() => setTimeout(onClose, 700)}
            />
          ) : (
            <button
              type="button"
              disabled
              className="rounded-xl bg-white/5 px-6 py-2 text-sm font-extrabold text-white/40 cursor-not-allowed"
            >
              ابتدا یک گلس انتخاب کنید
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
