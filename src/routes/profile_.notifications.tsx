import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, Eye } from "lucide-react";
import {
  getUserNotifications,
  markRead,
  TOPIC_LABEL,
  type AppNotification,
  type NotifTopic,
} from "@/lib/notifications";
import { persianDateTime } from "@/lib/orders";

export const Route = createFileRoute("/profile_/notifications")({
  head: () => ({
    meta: [
      { title: "اعلان‌ها | پارس گلس" },
      { name: "description", content: "اعلان‌های سفارشات و کدهای تخفیف." },
    ],
  }),
  component: NotificationsPage,
});

const USER_KEY = "parsglass_user";

function NotificationsPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string | null>(null);
  const [list, setList] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"all" | NotifTopic>("all");

  function refresh(p: string) {
    setList(getUserNotifications(p));
  }

  useEffect(() => {
    let p: string | null = null;
    try {
      const u = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      p = u?.phone ?? null;
    } catch {}
    if (!p) {
      navigate({ to: "/auth" });
      return;
    }
    setPhone(p);
    refresh(p);
    const r = () => refresh(p!);
    window.addEventListener("notifications-updated", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("notifications-updated", r);
      window.removeEventListener("storage", r);
    };
  }, [navigate]);

  const counts = useMemo(() => {
    const c: Record<NotifTopic, number> = { order: 0, discount: 0, message: 0 };
    for (const n of list) if (!n.read) c[n.topic]++;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const f = filter === "all" ? list : list.filter((n) => n.topic === filter);
    // unread first, then by date (already date-sorted)
    return [...f].sort((a, b) => Number(a.read) - Number(b.read));
  }, [list, filter]);

  function open(n: AppNotification) {
    markRead(n.id);
    if (phone) refresh(phone);
    navigate({ to: n.topic === "order" ? "/profile/orders" : "/profile" });
  }

  if (!phone) return null;

  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10" aria-label="بازگشت">
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Link>
            <h1 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>اعلان‌ها</h1>
            <div className="w-9" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        {/* Filter tabs */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {(
            [
              ["all", "همه", counts.order + counts.discount + counts.message],
              ["order", "سفارشات", counts.order],
              ["discount", "کد تخفیف", counts.discount],
            ] as const
          ).map(([id, label, badge]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-extrabold transition ${
                filter === id ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              {label}
              {badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-extrabold text-black">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {filtered.length === 0 && (
            <li className="py-12 text-center text-xs text-muted-foreground">اعلانی وجود ندارد</li>
          )}
          {filtered.map((n) => {
            const firstLine = n.text.split("\n")[0];
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-2xl border p-3 ${
                  n.read ? "border-white/10 bg-white/[0.03]" : "border-yellow-400/30 bg-yellow-400/[0.06]"
                }`}
              >
                <Bell
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    n.read ? "text-muted-foreground" : "text-yellow-400 animate-bell-ring"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold">{n.title}</span>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-muted-foreground">
                      {TOPIC_LABEL[n.topic]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{firstLine} ...</p>
                  <div className="mt-1 text-[9px] text-muted-foreground/70">{persianDateTime(n.date)}</div>
                  <button
                    onClick={() => open(n)}
                    className="mt-2 flex items-center gap-1 rounded-lg bg-sky-500/20 px-3 py-1.5 text-[10px] font-bold text-sky-300 hover:bg-sky-500/30"
                  >
                    <Eye className="h-3.5 w-3.5" /> مشاهده
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
