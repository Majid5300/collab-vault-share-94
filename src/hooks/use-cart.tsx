import { useEffect, useState, useCallback } from "react";

export type CartItem = {
  productId: string;
  productName: string;
  productImage?: string; // gradient classes for thumbnail
  modelName: string;
  qty: number;
  unitPrice: number;
};

const KEY = "parsglass_cart_v1";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function openCartPanel() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-open"));
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onUpdate = () => setItems(read());
    window.addEventListener("cart-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("cart-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const addItem = useCallback((item: CartItem) => {
    const cur = read();
    const idx = cur.findIndex(
      (x) => x.productId === item.productId && x.modelName === item.modelName,
    );
    if (idx >= 0) cur[idx] = { ...cur[idx], qty: item.qty };
    else cur.push(item);
    write(cur);
  }, []);

  const updateQty = useCallback((productId: string, modelName: string, qty: number) => {
    const cur = read();
    const idx = cur.findIndex((x) => x.productId === productId && x.modelName === modelName);
    if (idx >= 0) {
      cur[idx] = { ...cur[idx], qty: Math.max(5, qty) };
      write(cur);
    }
  }, []);

  const removeItem = useCallback((productId: string, modelName: string) => {
    const cur = read().filter((x) => !(x.productId === productId && x.modelName === modelName));
    write(cur);
  }, []);

  const clear = useCallback(() => write([]), []);

  const activeProductId = items.length > 0 ? items[0].productId : null;
  const distinctProducts = new Set(items.map((i) => i.productId)).size;
  const distinctCount = items.length;
  const totalUnits = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  return {
    items,
    addItem,
    updateQty,
    removeItem,
    clear,
    activeProductId,
    distinctCount,
    distinctProducts,
    totalUnits,
    totalPrice,
  };
}
