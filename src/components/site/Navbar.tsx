import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, ShoppingCart, X, User, LogOut, Bell } from "lucide-react";
import { openCartPanel, useCart } from "@/hooks/use-cart";
import { unreadCount } from "@/lib/notifications";

type StoredUser = { phone?: string; name?: string; family?: string };

const USER_KEY = "parsglass_user";

const baseMenu = [
  { label: "خانه", href: "/" },
  { label: "محصولات ما", href: "/#products" },
  { label: "گلس فایندر", href: "/#finder" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/#contact" },
];

function readUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function Navbar({ cartCount }: { cartCount?: number }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const { distinctCount } = useCart();
  const count = cartCount ?? distinctCount;

  useEffect(() => {
    const onChange = () => {
      const u = readUser();
      setUser(u);
      setUnread(u?.phone ? unreadCount(u.phone) : 0);
    };
    onChange();
    window.addEventListener("storage", onChange);
    window.addEventListener("user-updated", onChange);
    window.addEventListener("notifications-updated", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("user-updated", onChange);
      window.removeEventListener("notifications-updated", onChange);
    };
  }, []);

  function logout() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
    window.dispatchEvent(new Event("user-updated"));
    setUser(null);
    setOpen(false);
    navigate({ to: "/" });
  }

  const fullName = user ? `${user.name ?? ""} ${user.family ?? ""}`.trim() : "";

  return (
    <>
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-black/10">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-lg shadow-primary/30">
                لوگو
              </div>
            </div>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-extrabold tracking-tight md:text-xl" style={{ color: "#0ea5e9" }}>
              پارس گلس
            </h1>

            <div className="flex items-center gap-2">
              <button
                aria-label="سبد خرید"
                onClick={() => openCartPanel()}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl glass transition hover:bg-black/5"
              >
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </button>
              <button
                aria-label="منو"
                onClick={() => setOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl glass transition hover:bg-black/5"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-50 transition ${open ? "visible" : "invisible"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] glass-strong border-r border-black/10 p-6 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} flex flex-col`}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="text-lg font-bold">منو</span>
            <button
              aria-label="بستن"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg glass hover:bg-black/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {user && (
            <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                <User className="h-7 w-7 text-white" />
              </div>
              <div className="text-sm font-extrabold">{fullName || "کاربر"}</div>
            </div>
          )}

          <nav className="flex flex-col gap-1 overflow-y-auto">
            {baseMenu.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-black/5"
              >
                {item.label}
              </a>
            ))}

            {user && (
              <>
                <div className="my-2 h-px bg-white/10" />
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: "/profile" });
                  }}
                  className="rounded-xl px-4 py-3 text-right text-sm font-medium transition hover:bg-black/5"
                >
                  داشبورد
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: "/profile/orders" });
                  }}
                  className="rounded-xl px-4 py-3 text-right text-sm font-medium transition hover:bg-black/5"
                >
                  پیگیری سفارشات
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: "/profile/notifications" });
                  }}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-right text-sm font-medium transition hover:bg-black/5"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    اعلان‌ها
                  </span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-extrabold text-black">
                      {unread}
                    </span>
                  )}
                </button>
                {user.phone === "09352703505" && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: "/admin" as any });
                    }}
                    className="rounded-xl px-4 py-3 text-right text-sm font-bold text-sky-300 transition hover:bg-sky-500/10"
                  >
                    پنل مدیریت
                  </button>
                )}
                <button
                  disabled
                  className="cursor-not-allowed rounded-xl px-4 py-3 text-right text-sm font-medium text-foreground/40"
                  title="به زودی"
                >
                  گلس‌های مشابه
                </button>
                <div className="my-2 h-px bg-white/10" />
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-right text-sm font-bold text-destructive transition hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  خروج از حساب
                </button>
              </>
            )}
          </nav>

          {!user && (
            <div className="mt-auto pt-6">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/auth" });
                }}
                className="w-full rounded-xl btn-primary-gradient py-3 text-base font-bold shadow-lg shadow-primary/30 hover:opacity-90"
              >
                ورود / ثبت‌نام
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
