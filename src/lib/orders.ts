import type { CartItem } from "@/hooks/use-cart";

export type OrderStatus = "pending" | "approved" | "shipping" | "delivered";

export type Order = {
  id: string;
  invoice: string;
  date: string; // ISO
  items: CartItem[];
  totalPrice: number;
  totalUnits: number;
  status: OrderStatus;
  address?: string;
  shipping?: string;
  receipt?: string;
  userPhone?: string;
  userName?: string;
  userAddress?: string;
  postalCode?: string;
  rejected?: boolean;
};

export type PendingInvoice = {
  id: string;
  invoice: string;
  date: string;
  items: CartItem[];
  totalPrice: number;
  totalUnits: number;
  address?: string;
  shipping?: string;
  userPhone?: string;
  userName?: string;
};

const ORDERS_KEY = "parsglass_orders_v1";
const PENDING_KEY = "parsglass_pending_invoices_v1";
const ACTIVE_INVOICE_KEY = "parsglass_active_invoice";
const INVOICE_COUNTER = "parsglass_invoice_counter";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getOrders(): Order[] {
  return safeRead<Order[]>(ORDERS_KEY, []);
}

export function getPendingInvoices(): PendingInvoice[] {
  return safeRead<PendingInvoice[]>(PENDING_KEY, []);
}

export function getLatestPendingInvoice(): PendingInvoice | null {
  const list = getPendingInvoices();
  return list.length > 0 ? list[0] : null;
}

export function getPendingByInvoice(invoice: string): PendingInvoice | null {
  return getPendingInvoices().find((p) => p.invoice === invoice) ?? null;
}

export function clearAllPendingInvoices() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_KEY);
  localStorage.removeItem(ACTIVE_INVOICE_KEY);
  window.dispatchEvent(new Event("orders-updated"));
}

export function saveOrders(list: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("orders-updated"));
}

export function savePendingInvoices(list: PendingInvoice[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("orders-updated"));
}

export function nextInvoiceNumber(): string {
  let n = parseInt(localStorage.getItem(INVOICE_COUNTER) || "0", 10);
  if (!n) n = Math.floor(1000 + Math.random() * 9000);
  else n += 1;
  localStorage.setItem(INVOICE_COUNTER, String(n));
  return "#" + String(n).padStart(4, "0");
}

export function getOrCreateActiveInvoice(): string {
  const cur = localStorage.getItem(ACTIVE_INVOICE_KEY);
  if (cur) return cur;
  const inv = nextInvoiceNumber();
  localStorage.setItem(ACTIVE_INVOICE_KEY, inv);
  return inv;
}

export function clearActiveInvoice() {
  localStorage.removeItem(ACTIVE_INVOICE_KEY);
}

export function hasPendingInvoice(): boolean {
  return getPendingInvoices().length > 0;
}

export function restoreLatestPendingToCart(): boolean {
  const list = getPendingInvoices();
  if (list.length === 0) return false;
  const p = list[0];
  localStorage.setItem("parsglass_cart_v1", JSON.stringify(p.items));
  window.dispatchEvent(new Event("cart-updated"));
  // Remove pending so only one invoice state exists at a time
  const rest = list.slice(1);
  localStorage.setItem("parsglass_pending_invoices_v1", JSON.stringify(rest));
  window.dispatchEvent(new Event("orders-updated"));
  clearActiveInvoice();
  return true;
}

export function upsertPendingInvoice(p: PendingInvoice) {
  const list = getPendingInvoices().filter((x) => x.invoice !== p.invoice);
  list.unshift(p);
  savePendingInvoices(list);
}

export function removePendingInvoice(invoice: string) {
  savePendingInvoices(getPendingInvoices().filter((x) => x.invoice !== invoice));
}

export function addOrder(o: Order) {
  const list = getOrders();
  list.unshift(o);
  saveOrders(list);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "در انتظار تایید",
  approved: "تایید شده",
  shipping: "در حال ارسال",
  delivered: "تحویل داده شده",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-400/30",
  approved: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  shipping: "bg-orange-500/15 text-orange-300 border-orange-400/30",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
};

export function persianDateTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
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
