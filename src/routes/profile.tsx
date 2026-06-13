import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, User, MapPin, Plus, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "داشبورد کاربری | پارس گلس" },
      { name: "description", content: "مدیریت اطلاعات کاربری، آدرس‌ها و سفارشات." },
    ],
  }),
  component: ProfilePage,
});

const USER_KEY = "parsglass_user";
const ADDRESSES_KEY = "parsglass_addresses_v1";
const DEFAULT_ADDR_KEY = "parsglass_default_address_v1";

type StoredUser = { phone: string; name: string; family: string; role?: string; createdAt?: string };

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [name, setName] = useState("");
  const [family, setFamily] = useState("");

  const [addresses, setAddresses] = useState<string[]>([]);
  const [defaultAddr, setDefaultAddr] = useState("");
  const [adding, setAdding] = useState(false);
  const [newAddr, setNewAddr] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) {
        navigate({ to: "/auth" });
        return;
      }
      const u = JSON.parse(raw) as StoredUser;
      setUser(u);
      setName(u.name || "");
      setFamily(u.family || "");
    } catch {}
    try {
      const list = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || "[]");
      if (Array.isArray(list)) setAddresses(list);
    } catch {}
    setDefaultAddr(localStorage.getItem(DEFAULT_ADDR_KEY) || "");
  }, [navigate]);

  function saveProfile() {
    if (!user) return;
    if (!name.trim() || !family.trim()) {
      toast.error("نام و نام خانوادگی الزامی است");
      return;
    }
    const updated = { ...user, name: name.trim(), family: family.trim() };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
    window.dispatchEvent(new Event("user-updated"));
    toast.success("✓ انجام شد");
  }

  function chooseDefault(a: string) {
    setDefaultAddr(a);
    localStorage.setItem(DEFAULT_ADDR_KEY, a);
    toast.success("✓ انجام شد");
  }

  function addAddress() {
    const v = newAddr.trim();
    if (!v) return;
    const list = Array.from(new Set([...addresses, v]));
    setAddresses(list);
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
    if (!defaultAddr) {
      setDefaultAddr(v);
      localStorage.setItem(DEFAULT_ADDR_KEY, v);
    }
    setNewAddr("");
    setAdding(false);
    toast.success("✓ انجام شد");
  }

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10" aria-label="بازگشت">
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Link>
            <h1 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>داشبورد</h1>
            <div className="w-9" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        {/* User info */}
        <section className="rounded-2xl glass-strong p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
            <User className="h-4 w-4 text-sky-400" />
            اطلاعات کاربری
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-foreground/70">نام</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/70">نام خانوادگی</label>
              <input
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/70">شماره موبایل</label>
              <input
                readOnly
                value={user.phone}
                dir="ltr"
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center font-mono text-sm text-foreground/60"
              />
            </div>
            <button
              onClick={saveProfile}
              className="w-full rounded-xl btn-primary-gradient py-3 text-sm font-extrabold shadow-lg shadow-primary/30 hover:opacity-90"
            >
              ذخیره تغییرات
            </button>
          </div>
        </section>

        {/* Addresses */}
        <section className="rounded-2xl glass-strong p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
            <MapPin className="h-4 w-4 text-sky-400" />
            آدرس‌های من
          </h3>
          {addresses.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-xs text-muted-foreground">
              هنوز آدرسی ثبت نکرده‌اید
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((a) => {
                const active = a === defaultAddr;
                return (
                  <label
                    key={a}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-right text-xs leading-6 transition ${
                      active ? "border-sky-400 bg-sky-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="default-addr"
                      checked={active}
                      onChange={() => chooseDefault(a)}
                      className="mt-1 accent-sky-500"
                    />
                    <span className="flex-1">{a}</span>
                  </label>
                );
              })}
            </div>
          )}

          {adding ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={newAddr}
                onChange={(e) => setNewAddr(e.target.value)}
                rows={3}
                placeholder="آدرس کامل خود را وارد کنید"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-right text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={addAddress}
                  className="flex-1 rounded-xl btn-primary-gradient py-2.5 text-xs font-extrabold"
                >
                  ثبت آدرس
                </button>
                <button
                  onClick={() => { setAdding(false); setNewAddr(""); }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold hover:bg-white/10"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-2.5 text-xs font-bold text-sky-300 hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              افزودن آدرس جدید
            </button>
          )}
        </section>

        {/* Orders shortcut */}
        <section className="rounded-2xl glass-strong p-4">
          <button
            onClick={() => navigate({ to: "/profile/orders" })}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
          >
            <span className="flex items-center gap-2 text-sm font-extrabold">
              <Package className="h-4 w-4 text-sky-400" />
              سفارشات من
            </span>
            <ArrowRight className="h-4 w-4 rotate-180 text-muted-foreground" />
          </button>
        </section>
      </main>
    </div>
  );
}
