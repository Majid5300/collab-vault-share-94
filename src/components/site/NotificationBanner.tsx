import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, X } from "lucide-react";
import { latestUnread, markRead, TOPIC_LABEL, type AppNotification } from "@/lib/notifications";

const USER_KEY = "parsglass_user";

function readPhone(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return u?.phone ?? null;
  } catch {
    return null;
  }
}

export function NotificationBanner() {
  const navigate = useNavigate();
  const [notif, setNotif] = useState<AppNotification | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const phone = readPhone();
      setNotif(phone ? latestUnread(phone) : null);
    };
    refresh();
    window.addEventListener("notifications-updated", refresh);
    window.addEventListener("user-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("notifications-updated", refresh);
      window.removeEventListener("user-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // trigger slide-in after notif appears
  useEffect(() => {
    if (notif) {
      const t = setTimeout(() => setShown(true), 30);
      return () => clearTimeout(t);
    }
    setShown(false);
  }, [notif?.id]);

  if (!notif) return null;

  function close() {
    if (!notif) return;
    setShown(false);
    markRead(notif.id);
  }

  function view() {
    if (!notif) return;
    markRead(notif.id);
    navigate({ to: notif.topic === "order" ? "/profile/orders" : "/profile" });
  }

  return (
    <div
      dir="rtl"
      className={`fixed left-3 top-20 z-50 w-[min(22rem,calc(100vw-1.5rem))] transition-transform duration-500 ease-out ${
        shown ? "translate-x-0" : "translate-x-[120%]"
      }`}
    >
      <div className="border border-emerald-400/40 bg-emerald-600/95 text-white shadow-2xl shadow-emerald-900/40 backdrop-blur">
        <div className="flex items-center justify-between gap-2 border-b border-white/20 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <Bell className="h-4 w-4" />
            {TOPIC_LABEL[notif.topic]}
          </div>
          <button
            aria-label="بستن"
            onClick={close}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-3 py-3">
          <p className="text-xs leading-6">{notif.text}</p>
          <button
            onClick={view}
            className="w-full bg-white/15 py-2 text-xs font-extrabold transition hover:bg-white/25"
          >
            {notif.topic === "order" ? "مشاهده سفارش" : "مشاهده"}
          </button>
        </div>
      </div>
    </div>
  );
}
