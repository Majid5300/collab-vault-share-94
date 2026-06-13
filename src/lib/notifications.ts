// Notification model (localStorage). Stores notifications for all users in one array.
import type { Order } from "@/lib/orders";

export type NotifTopic = "order" | "discount" | "message";
export type NotifKind =
  | "approved"
  | "processing"
  | "shipping"
  | "rejected"
  | "discount"
  | "message";

export type OrderKind = "approved" | "processing" | "shipping" | "rejected";

export type AppNotification = {
  id: string;
  userPhone: string;
  topic: NotifTopic;
  kind: NotifKind;
  /** اسم اعلان، مثل «اعلان تایید سفارش» */
  title: string;
  /** متن کامل اعلان */
  text: string;
  date: string; // ISO
  read: boolean;
  invoice?: string;
};

const KEY = "parsglass_notifications_v1";

export const TOPIC_LABEL: Record<NotifTopic, string> = {
  order: "پیگیری سفارش",
  discount: "کد تخفیف",
  message: "پیام ویژه",
};

export const ORDER_KIND_TITLE: Record<OrderKind, string> = {
  approved: "اعلان تایید سفارش",
  processing: "اعلان در حال انجام",
  shipping: "اعلان در حال ارسال",
  rejected: "اعلان سفارش رد شده",
};

function readAll(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function getNotifications(): AppNotification[] {
  return readAll();
}

export function saveNotifications(list: AppNotification[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("notifications-updated"));
}

export function getUserNotifications(phone: string): AppNotification[] {
  return readAll()
    .filter((n) => n.userPhone === phone)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function addNotification(
  n: Omit<AppNotification, "id" | "date" | "read">
) {
  if (!n.userPhone) return;
  const list = readAll();
  list.unshift({
    ...n,
    id: "ntf_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    date: new Date().toISOString(),
    read: false,
  });
  saveNotifications(list);
}

export function markRead(id: string) {
  saveNotifications(
    readAll().map((n) => (n.id === id ? { ...n, read: true } : n))
  );
}

export function markAllRead(phone: string, topic?: NotifTopic) {
  saveNotifications(
    readAll().map((n) =>
      n.userPhone === phone && (!topic || n.topic === topic)
        ? { ...n, read: true }
        : n
    )
  );
}

export function unreadCount(phone: string, topic?: NotifTopic): number {
  return readAll().filter(
    (n) => n.userPhone === phone && !n.read && (!topic || n.topic === topic)
  ).length;
}

export function latestUnread(phone: string): AppNotification | null {
  const list = getUserNotifications(phone).filter((n) => !n.read);
  return list.length ? list[0] : null;
}

function orderText(kind: OrderKind, order: Order): string {
  const inv = order.invoice;
  switch (kind) {
    case "approved":
      return `سفارش شما با شماره فاکتور ${inv} تایید شد و در دست انجام قرار گرفت.`;
    case "processing":
      return `سفارش شما با شماره فاکتور ${inv} هم‌اکنون در حال انجام است.`;
    case "shipping":
      return `سفارش شما با شماره فاکتور ${inv} ارسال شد${
        order.postalCode ? `. کد رهگیری پستی: ${order.postalCode}` : "."
      }`;
    case "rejected":
      return `متأسفانه سفارش شما با شماره فاکتور ${inv} رد شد. برای پیگیری با ما در تماس باشید.`;
  }
}

export function notifyOrder(order: Order, kind: OrderKind) {
  if (!order.userPhone) return;
  addNotification({
    userPhone: order.userPhone,
    topic: "order",
    kind,
    title: ORDER_KIND_TITLE[kind],
    text: orderText(kind, order),
    invoice: order.invoice,
  });
}

/** ارسال پیام خاص به یک کاربر */
export function notifyMessage(userPhone: string, title: string, text: string) {
  if (!userPhone) return;
  addNotification({
    userPhone,
    topic: "message",
    kind: "message",
    title: title || "پیام ویژه",
    text,
  });
}
