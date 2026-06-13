import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  Boxes,
  Database,
  Users,
  Settings,
  Tag,
  Check,
  X,
  Copy,
  Trash2,
  ChevronDown,
  Plus,
  Search,
  Upload,
  GripVertical,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Wallet,
  UserPlus,
  Mail,
  Bell,
  Send,
} from "lucide-react";
import {
  getOrders,
  getPendingInvoices,
  removePendingInvoice,
  saveOrders,
  STATUS_LABEL,
  STATUS_COLOR,
  persianDateTime,
  type Order,
  type OrderStatus,
  type PendingInvoice,
} from "@/lib/orders";
import {
  notifyOrder,
  getNotifications,
  ORDER_KIND_TITLE,
  notifyMessage,
  type AppNotification,
  type NotifKind,
  type OrderKind,
} from "@/lib/notifications";
import {
  ADMIN_PHONE,
  MODEL_CATEGORIES,
  applyProductOrder,
  getAdminProducts,
  getDiscounts,
  getLibrary,
  getModels,
  getSettings,
  getUsers,
  getRedemptionsForCode,
  saveAdminProducts,
  saveDiscounts,
  saveLibrary,
  saveModels,
  saveSettings,
  setUserBlocked,
  type AdminProduct,
  type AboutSettings,
  type BannerEntry,
  type ContactSettings,
  type DiscountCode,
  type DiscountRedemption,
  type FaqItem,
  type LibraryImage,
  type ModelEntry,
  type NewModelsRow,
  type RegisteredUser,
  type SiteSettings,
} from "@/lib/admin-store";
import { GLASS_TYPES } from "@/data/glass-types";
import { CropperModal, readFileAsDataUrl, type AspectKey } from "@/components/admin/CropperModal";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "پنل مدیریت | پارس گلس" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type SectionId =
  | "dashboard"
  | "orders"
  | "manage-orders"
  | "groups"
  | "products"
  | "display-order"
  | "models"
  | "partners"
  | "settings"
  | "discounts"
  | "special-messages"
  | "notifications-admin";

const SECTIONS: { id: SectionId; label: string; icon: any }[] = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "orders", label: "پیگیری سفارشات", icon: ListChecks },
  { id: "manage-orders", label: "مدیریت سفارشات", icon: ClipboardList },
  { id: "groups", label: "مدیریت گروه‌ها", icon: Tag },
  { id: "products", label: "مدیریت محصولات", icon: Boxes },
  { id: "display-order", label: "ترتیب نمایش", icon: GripVertical },
  { id: "models", label: "دیتابیس مدل‌ها", icon: Database },
  { id: "partners", label: "مدیریت همکاران", icon: Users },
  { id: "settings", label: "تنظیمات سایت", icon: Settings },
];

const COLLAB_SECTIONS: { id: SectionId; label: string; icon: any }[] = [
  { id: "special-messages", label: "پیام‌های خاص", icon: Mail },
  { id: "discounts", label: "کدهای تخفیف", icon: Tag },
  { id: "notifications-admin", label: "مدیریت اعلان‌ها", icon: Bell },
];

function AdminPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("parsglass_user") || "null");
      if (!u || u.phone !== ADMIN_PHONE) {
        navigate({ to: "/auth" });
      }
    } catch {
      navigate({ to: "/auth" });
    }
  }, [navigate]);

  return (
    <div dir="rtl" className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 w-full">
        <div className="glass-strong border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Link>
            <h1 className="text-base font-extrabold" style={{ color: "#0ea5e9" }}>
              پنل مدیریت
            </h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl glass px-3 py-1.5 text-xs font-bold hover:bg-white/10 lg:hidden"
            >
              منو
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-4 px-3 py-4 lg:px-4">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-20 rounded-2xl border border-white/10 bg-slate-950/90 p-2 backdrop-blur">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  section === s.id
                    ? "bg-sky-500/20 text-sky-300"
                    : "text-foreground/80 hover:bg-white/5"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
            <CollabGroup
              section={section}
              setSection={setSection}
              open={collabOpen}
              setOpen={setCollabOpen}
            />
          </nav>
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-72 border-l border-white/10 bg-slate-950/95 p-3 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-extrabold">پنل مدیریت</span>
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSection(s.id);
                    setSidebarOpen(false);
                  }}
                  className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                    section === s.id
                      ? "bg-sky-500/20 text-sky-300"
                      : "text-foreground/80 hover:bg-white/5"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              ))}
              <CollabGroup
                section={section}
                setSection={(id) => {
                  setSection(id);
                  setSidebarOpen(false);
                }}
                open={collabOpen}
                setOpen={setCollabOpen}
              />
            </aside>
          </div>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1">
          {section === "dashboard" && <DashboardSection />}
          {section === "orders" && <OrdersTrackingSection />}
          {section === "manage-orders" && <ManageOrdersSection />}
          {section === "groups" && <GroupsSection />}
          {section === "products" && <ProductsSection />}
          {section === "display-order" && <DisplayOrderSection />}
          {section === "models" && <ModelsSection />}
          {section === "partners" && <PartnersSection />}
          {section === "settings" && <SettingsSection />}
          {section === "discounts" && <DiscountsSection />}
          {section === "special-messages" && <SpecialMessagesSection />}
          {section === "notifications-admin" && <NotificationsAdminSection />}
        </main>
      </div>
    </div>
  );
}

function CollabGroup({
  section,
  setSection,
  open,
  setOpen,
}: {
  section: SectionId;
  setSection: (id: SectionId) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const childActive = COLLAB_SECTIONS.some((s) => s.id === section);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`mb-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
          childActive ? "bg-sky-500/10 text-sky-300" : "text-foreground/80 hover:bg-white/5"
        }`}
      >
        <span className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          ارتباط با همکاران
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mb-1 mr-2 space-y-1 border-r border-white/10 pr-2">
          {COLLAB_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-xs font-bold transition ${
                section === s.id
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-foreground/80 hover:bg-white/5"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Utils ───────────────────────── */

function useOrdersLive() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const r = () => setOrders(getOrders());
    r();
    window.addEventListener("orders-updated", r);
    window.addEventListener("admin-updated", r);
    return () => {
      window.removeEventListener("orders-updated", r);
      window.removeEventListener("admin-updated", r);
    };
  }, []);
  return [orders, setOrders] as const;
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function useSettingsLive() {
  const [s, setS] = useState<SiteSettings>(() => getSettings());
  useEffect(() => {
    const r = () => setS(getSettings());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);
  return s;
}

function todayFa(): string {
  return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/* ───────────────────────── Groups Section ───────────────────────── */

function GroupsSection() {
  const s = useSettingsLive();
  const [draft, setDraft] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (s.groups.includes(v)) {
      toast.error("این گروه قبلاً اضافه شده");
      return;
    }
    saveSettings({ ...s, groups: [...s.groups, v] });
    setDraft("");
  }
  function del(name: string) {
    saveSettings({ ...s, groups: s.groups.filter((g) => g !== name) });
  }
  function saveEdit() {
    if (editIdx === null) return;
    const v = editVal.trim();
    if (!v) return;
    const arr = [...s.groups];
    arr[editIdx] = v;
    saveSettings({ ...s, groups: arr });
    setEditIdx(null);
  }

  return (
    <div className="space-y-4 text-xs">
      <h2 className="text-lg font-extrabold">مدیریت گروه‌ها</h2>
      <p className="text-muted-foreground">
        گروه‌ها قبل از محصولات تعریف می‌شوند. هر محصول هنگام تعریف به یک گروه اختصاص می‌یابد.
      </p>
      <div className="flex gap-2 rounded-2xl glass-strong p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="نام گروه (مثلاً: شفاف)"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        />
        <button onClick={add} className="flex items-center gap-1 rounded-lg btn-primary-gradient px-3 py-2 font-extrabold">
          <Plus className="h-3.5 w-3.5" /> افزودن
        </button>
      </div>
      <ul className="space-y-2">
        {s.groups.length === 0 && (
          <li className="py-8 text-center text-muted-foreground">گروهی ثبت نشده</li>
        )}
        {s.groups.map((g, i) => (
          <li key={g + i} className="flex items-center gap-2 rounded-2xl glass-strong p-3">
            {editIdx === i ? (
              <>
                <input
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5"
                />
                <button onClick={saveEdit} className="rounded-lg btn-primary-gradient px-3 py-1.5 font-extrabold">
                  ذخیره
                </button>
                <button onClick={() => setEditIdx(null)} className="rounded-lg bg-white/5 px-3 py-1.5 hover:bg-white/10">
                  انصراف
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-bold">گلس {g}</span>
                <button
                  onClick={() => {
                    setEditIdx(i);
                    setEditVal(g);
                  }}
                  className="rounded-lg bg-white/5 px-3 py-1.5 hover:bg-white/10"
                >
                  ویرایش
                </button>
                <button onClick={() => del(g)} className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── Section 1: Dashboard ───────────────────────── */

type Range = "day" | "week" | "month" | "year";

function DashboardSection() {
  const [orders] = useOrdersLive();
  const [range, setRange] = useState<Range>("month");
  const [showUnits, setShowUnits] = useState(false);
  const [drilldownType, setDrilldownType] = useState<string | null>(null);

  const confirmed = orders.filter((o) => o.status !== "pending" && !o.rejected);

  const { buckets, totalUnits, totalSales, unitsByType, modelsByType } = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; sales: number }[] = [];
    const fmtNum = (n: number) => String(n).padStart(2, "0");
    if (range === "day") {
      for (let h = 0; h < 24; h += 2) buckets.push({ label: fmtNum(h), sales: 0 });
    } else if (range === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets.push({ label: fmtNum(d.getDate()), sales: 0 });
      }
    } else if (range === "month") {
      for (let i = 0; i < 4; i++) buckets.push({ label: `هفته ${i + 1}`, sales: 0 });
    } else {
      const months = ["فر", "ار", "خر", "تی", "مر", "شه", "مه", "آب", "آذ", "دی", "به", "اس"];
      for (const m of months) buckets.push({ label: m, sales: 0 });
    }

    let totalUnits = 0;
    let totalSales = 0;
    const unitsByType: Record<string, number> = {};
    const modelsByType: Record<string, Record<string, number>> = {};

    for (const o of confirmed) {
      const d = new Date(o.date);
      let idx = -1;
      if (range === "day") {
        if (d.toDateString() === now.toDateString()) idx = Math.floor(d.getHours() / 2);
      } else if (range === "week") {
        const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diff >= 0 && diff < 7) idx = 6 - diff;
      } else if (range === "month") {
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
          idx = Math.min(3, Math.floor((d.getDate() - 1) / 7));
      } else {
        if (d.getFullYear() === now.getFullYear()) idx = d.getMonth();
      }
      if (idx >= 0 && idx < buckets.length) buckets[idx].sales += o.totalPrice;
      totalSales += o.totalPrice;
      totalUnits += o.totalUnits;
      for (const it of o.items) {
        const type = it.productName;
        unitsByType[type] = (unitsByType[type] || 0) + it.qty;
        modelsByType[type] = modelsByType[type] || {};
        modelsByType[type][it.modelName] = (modelsByType[type][it.modelName] || 0) + it.qty;
      }
    }
    return { buckets, totalUnits, totalSales, unitsByType, modelsByType };
  }, [confirmed, range]);

  const max = Math.max(1, ...buckets.map((b) => b.sales));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">داشبورد</h2>
      <DashboardKpiCards orders={orders} />
      <DashboardLowStock />
      <DashboardTopModels orders={confirmed} />
      <DashboardRecentOrders orders={orders} />
      <div className="border-t border-white/10 pt-3">
        <h3 className="mb-2 text-sm font-extrabold">نمودار فروش</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["day", "week", "month", "year"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              range === r
                ? "bg-sky-500/20 text-sky-300"
                : "glass text-foreground/70 hover:bg-white/10"
            }`}
          >
            {r === "day" ? "روزانه" : r === "week" ? "هفتگی" : r === "month" ? "ماهانه" : "سالانه"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl glass-strong p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">مجموع فروش</span>
          <span className="text-lg font-extrabold text-price tabular-nums">
            {fmt(totalSales)} <span className="text-[10px] text-muted-foreground">تومان</span>
          </span>
        </div>
        <div className="mt-4 flex h-44 items-end gap-1.5">
          {buckets.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-sky-500 to-indigo-400"
                style={{ height: `${(b.sales / max) * 100}%`, minHeight: 2 }}
                title={fmt(b.sales)}
              />
              <span className="text-[9px] text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowUnits((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl glass-strong p-4 text-right hover:bg-white/5"
      >
        <span className="text-xs text-muted-foreground">مجموع گلس‌های فروخته شده</span>
        <span className="flex items-center gap-2 text-lg font-extrabold tabular-nums">
          {fmt(totalUnits)}
          <ChevronDown className={`h-4 w-4 transition ${showUnits ? "rotate-180" : ""}`} />
        </span>
      </button>

      {showUnits && (
        <div className="space-y-2 rounded-2xl glass p-3">
          {Object.keys(unitsByType).length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">داده‌ای موجود نیست</p>
          )}
          {Object.entries(unitsByType).map(([type, count]) => (
            <div key={type} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setDrilldownType(drilldownType === type ? null : type)}
                  className="rounded-lg bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-300 hover:bg-sky-500/25"
                >
                  ریز جزئیات
                </button>
                <div className="text-right">
                  <div className="text-sm font-extrabold">{type}</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">{fmt(count)} عدد</div>
                </div>
              </div>
              {drilldownType === type && (
                <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
                  {Object.entries(modelsByType[type] || {}).map(([m, c]) => (
                    <div key={m} className="flex items-center justify-between text-xs">
                      <span className="tabular-nums text-muted-foreground">×{c}</span>
                      <span dir="ltr">{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Section 2: Orders tracking ───────────────────────── */

function OrdersTrackingSection() {
  const [orders, setOrders] = useOrdersLive();
  const [pendings, setPendings] = useState<PendingInvoice[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "awaiting">("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [approvedFilter, setApprovedFilter] = useState<OrderStatus>("approved");
  const [postalEditId, setPostalEditId] = useState<string | null>(null);
  const [postal, setPostal] = useState("");

  useEffect(() => {
    const r = () => setPendings(getPendingInvoices());
    r();
    window.addEventListener("orders-updated", r);
    return () => window.removeEventListener("orders-updated", r);
  }, []);

  const pending = orders.filter((o) => o.status === "pending" && !o.rejected);
  const approved = orders.filter((o) => o.status !== "pending" && !o.rejected);
  const rejected = orders.filter((o) => o.rejected);
  const approvedFiltered = approved.filter((o) => o.status === approvedFilter);

  function update(updated: Order[]) {
    saveOrders(updated);
    setOrders(updated);
  }
  function approve(id: string) {
    const target = orders.find((o) => o.id === id);
    const next = { ...(target as Order), status: "approved" as OrderStatus };
    update(orders.map((o) => (o.id === id ? next : o)));
    if (target) {
      notifyOrder(next, "approved");
      notifyOrder(next, "processing");
    }
    toast.success("تایید شد");
  }
  function reject(id: string) {
    const target = orders.find((o) => o.id === id);
    update(orders.map((o) => (o.id === id ? { ...o, rejected: true } : o)));
    if (target) notifyOrder({ ...target, rejected: true }, "rejected");
    toast.success("رد شد");
  }
  function del(id: string) {
    update(orders.filter((o) => o.id !== id));
  }
  function patch(o: Order, p: Partial<Order>) {
    update(orders.map((x) => (x.id === o.id ? { ...x, ...p } : x)));
  }
  function progress(o: Order) {
    if (o.status === "approved") {
      setPostalEditId(o.id);
      setPostal(o.postalCode || "");
    } else if (o.status === "shipping") {
      patch(o, { status: "delivered" });
      toast.success("تحویل داده شد");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">پیگیری سفارشات</h2>
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {(
          [
            ["pending", "در انتظار تایید"],
            ["approved", "تایید شده"],
            ["rejected", "رد شده"],
            ["awaiting", "در انتظار پرداخت"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`rounded-lg py-2 text-[10px] font-extrabold ${
              tab === id ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <ul className="space-y-2">
          {pending.length === 0 && (
            <li className="py-8 text-center text-xs text-muted-foreground">موردی نیست</li>
          )}
          {pending.map((o) => (
            <li key={o.id} className="rounded-2xl glass-strong">
              <button
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                className="grid w-full grid-cols-4 items-center gap-2 px-3 py-3 text-right text-[11px]"
              >
                <span className="font-extrabold tabular-nums text-sky-300">{o.invoice}</span>
                <span className="tabular-nums">{fmt(o.totalPrice)} ت</span>
                <span className="tabular-nums">{o.totalUnits} عدد</span>
                <span className="text-muted-foreground">{persianDateTime(o.date)}</span>
              </button>
              {expanded === o.id && (
                <div className="space-y-3 border-t border-white/10 p-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => approve(o.id)}
                      className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      تایید
                    </button>
                    <button
                      onClick={() => reject(o.id)}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/30"
                    >
                      رد کردن
                    </button>
                  </div>
                  {o.receipt && (
                    <img src={o.receipt} alt="رسید" className="max-h-80 w-full rounded-xl object-contain bg-black/30" />
                  )}
                  <InvoiceBreakdown order={o} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === "approved" && (
        <div className="flex gap-3">
          <aside className="w-32 shrink-0 space-y-2">
            {(
              [
                ["approved", "در حال انجام", "bg-sky-500/20 text-sky-300"],
                ["shipping", "در حال ارسال", "bg-orange-500/20 text-orange-300"],
                ["delivered", "تحویل داده شده", "bg-emerald-500/20 text-emerald-300"],
              ] as const
            ).map(([s, l, c]) => (
              <button
                key={s}
                onClick={() => setApprovedFilter(s as OrderStatus)}
                className={`w-full rounded-xl px-2 py-2 text-[10px] font-bold transition ${
                  approvedFilter === s ? c : "glass text-muted-foreground hover:bg-white/10"
                }`}
              >
                {l}
              </button>
            ))}
          </aside>
          <ul className="flex-1 space-y-2">
            {approvedFiltered.length === 0 && (
              <li className="py-8 text-center text-xs text-muted-foreground">موردی نیست</li>
            )}
            {approvedFiltered.map((o) => (
              <li key={o.id} className="rounded-2xl glass-strong">
                <button
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  className="grid w-full grid-cols-3 items-center gap-2 px-3 py-3 text-right text-[11px]"
                >
                  <span className="font-extrabold tabular-nums text-sky-300">{o.invoice}</span>
                  <span className="tabular-nums">{fmt(o.totalPrice)} ت</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </button>
                {expanded === o.id && (
                  <div className="space-y-3 border-t border-white/10 p-3">
                    {o.postalCode && (
                      <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
                        کد پستی: <span dir="ltr" className="font-mono">{o.postalCode}</span>
                      </div>
                    )}
                    {postalEditId === o.id ? (
                      <div className="flex gap-2">
                        <input
                          value={postal}
                          onChange={(e) => setPostal(e.target.value)}
                          placeholder="کد پستی"
                          dir="ltr"
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            if (!postal.trim()) {
                              toast.error("کد پستی را وارد کنید");
                              return;
                            }
                            patch(o, { status: "shipping", postalCode: postal.trim() });
                            notifyOrder({ ...o, status: "shipping", postalCode: postal.trim() }, "shipping");
                            setPostalEditId(null);
                            toast.success("ذخیره شد");
                          }}
                          className="rounded-lg bg-orange-500/20 px-3 py-2 text-[11px] font-bold text-orange-300"
                        >
                          ذخیره و ارسال
                        </button>
                      </div>
                    ) : (
                      o.status !== "delivered" && (
                        <button
                          onClick={() => progress(o)}
                          className="w-full rounded-lg btn-primary-gradient py-2 text-[11px] font-extrabold"
                        >
                          {o.status === "approved" ? "→ در حال ارسال" : "→ تحویل داده شده"}
                        </button>
                      )
                    )}
                    <InvoiceBreakdown order={o} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "rejected" && (
        <ul className="space-y-2">
          {rejected.length === 0 && (
            <li className="py-8 text-center text-xs text-muted-foreground">موردی نیست</li>
          )}
          {rejected.map((o) => (
            <li key={o.id} className="flex items-center justify-between rounded-2xl glass-strong px-3 py-3">
              <button
                onClick={() => del(o.id)}
                className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/30"
              >
                <Trash2 className="h-3.5 w-3.5" /> حذف فاکتور
              </button>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="tabular-nums">{fmt(o.totalPrice)} ت</span>
                <span className="tabular-nums">{o.totalUnits} عدد</span>
                <span className="font-extrabold text-sky-300">{o.invoice}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "awaiting" && (
        <ul className="space-y-2">
          <li className="grid grid-cols-4 gap-2 px-3 py-2 text-[10px] text-muted-foreground border-b border-white/10">
            <span>شماره فاکتور</span>
            <span>مبلغ</span>
            <span>تعداد گلس</span>
            <span>تاریخ</span>
          </li>
          {pendings.length === 0 && (
            <li className="py-8 text-center text-xs text-muted-foreground">موردی نیست</li>
          )}
          {pendings.map((p) => (
            <li key={p.id} className="rounded-2xl glass-strong">
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="grid w-full grid-cols-4 items-center gap-2 px-3 py-3 text-right text-[11px]"
              >
                <span className="font-extrabold tabular-nums text-sky-300">{p.invoice}</span>
                <span className="tabular-nums">{fmt(p.totalPrice)} ت</span>
                <span className="tabular-nums">{p.totalUnits} عدد</span>
                <span className="text-muted-foreground">{persianDateTime(p.date)}</span>
              </button>
              {expanded === p.id && (
                <div className="space-y-3 border-t border-white/10 p-3">
                  {(p.userName || p.userPhone) && (
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span dir="ltr">{p.userPhone}</span>
                      <span>{p.userName}</span>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        removePendingInvoice(p.invoice);
                        setPendings(getPendingInvoices());
                        toast.success("حذف شد");
                      }}
                      className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </button>
                  </div>
                  <InvoiceBreakdown order={{ items: p.items } as Order} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InvoiceBreakdown({ order }: { order: Order }) {
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number; items: typeof order.items }>();
    for (const it of order.items) {
      const k = it.productName;
      if (!map.has(k)) map.set(k, { name: k, total: 0, count: 0, items: [] });
      const g = map.get(k)!;
      g.total += it.qty * it.unitPrice;
      g.count += it.qty;
      g.items.push(it);
    }
    return Array.from(map.values());
  }, [order]);
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.name} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="tabular-nums text-price font-extrabold">{fmt(g.total)} ت</span>
            <span className="font-extrabold">
              {g.name} <span className="text-muted-foreground">({g.count})</span>
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {g.items.map((it) => (
              <div key={it.modelName} className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
                <span className="tabular-nums text-price">{fmt(it.qty * it.unitPrice)}</span>
                <span className="tabular-nums text-muted-foreground">×{it.qty}</span>
                <span className="flex-1 truncate text-left" dir="ltr">{it.modelName}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Section 3: Manage orders ───────────────────────── */

function ManageOrdersSection() {
  const [orders, setOrders] = useOrdersLive();
  const [mode, setMode] = useState<"phone" | "invoice">("phone");
  const [q, setQ] = useState("");
  const [postalEditId, setPostalEditId] = useState<string | null>(null);
  const [postal, setPostal] = useState("");

  const results = q
    ? mode === "phone"
      ? orders.filter((o) => o.userPhone?.includes(q))
      : orders.filter((o) => o.invoice.includes(q))
    : [];

  function update(o: Order, patch: Partial<Order>) {
    const list = orders.map((x) => (x.id === o.id ? { ...x, ...patch } : x));
    saveOrders(list);
    setOrders(list);
  }

  function nextStatus(o: Order) {
    if (o.status === "approved") {
      setPostalEditId(o.id);
      setPostal(o.postalCode || "");
    } else if (o.status === "shipping") {
      update(o, { status: "delivered" });
      toast.success("تحویل داده شد");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">مدیریت سفارشات</h2>
      <div className="rounded-2xl glass-strong p-3">
        <div className="mb-2 flex gap-2">
          {(
            [
              ["phone", "شماره خریدار"],
              ["invoice", "شماره فاکتور"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMode(id as any)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                mode === id ? "bg-sky-500/20 text-sky-300" : "glass text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={mode === "phone" ? "09xxxxxxxxx" : "#1234"}
            className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
            dir="ltr"
          />
        </div>
      </div>

      <ul className="space-y-2">
        {q && results.length === 0 && (
          <li className="py-8 text-center text-xs text-muted-foreground">نتیجه‌ای یافت نشد</li>
        )}
        {results.map((o) => (
          <li key={o.id} className="rounded-2xl glass-strong p-3 text-[11px]">
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-full border px-2 py-0.5 ${STATUS_COLOR[o.status]}`}>
                {STATUS_LABEL[o.status]}
              </span>
              <span className="font-extrabold text-sky-300">{o.invoice}</span>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2 text-muted-foreground">
              <span>{o.userName}</span>
              <span dir="ltr">{o.userPhone}</span>
              <span className="col-span-2">{persianDateTime(o.date)}</span>
            </div>
            {o.receipt && (
              <img src={o.receipt} alt="رسید" className="mb-2 max-h-56 w-full rounded-xl object-contain bg-black/30" />
            )}
            <details className="mb-2">
              <summary className="cursor-pointer rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-bold text-sky-300">
                ریز جزئیات
              </summary>
              <div className="mt-2"><InvoiceBreakdown order={o} /></div>
            </details>
            {o.postalCode && (
              <div className="mb-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
                کد پستی: <span dir="ltr" className="font-mono">{o.postalCode}</span>
              </div>
            )}
            {postalEditId === o.id ? (
              <div className="flex gap-2">
                <input
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  placeholder="کد پستی"
                  dir="ltr"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs focus:outline-none"
                />
                <button
                  onClick={() => {
                    update(o, { status: "shipping", postalCode: postal });
                    notifyOrder({ ...o, status: "shipping", postalCode: postal }, "shipping");
                    setPostalEditId(null);
                    toast.success("ذخیره شد");
                  }}
                  className="rounded-lg bg-orange-500/20 px-3 py-2 text-[11px] font-bold text-orange-300"
                >
                  ذخیره و ارسال
                </button>
              </div>
            ) : (
              o.status !== "delivered" &&
              !o.rejected && (
                <button
                  onClick={() => nextStatus(o)}
                  className="w-full rounded-lg btn-primary-gradient py-2 text-[11px] font-extrabold"
                >
                  {o.status === "approved" ? "→ در حال ارسال" : "→ تحویل داده شده"}
                </button>
              )
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── Section 4: Products ───────────────────────── */

function ProductsSection() {
  const s = useSettingsLive();
  const [list, setList] = useState<AdminProduct[]>([]);
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  useEffect(() => {
    setList(getAdminProducts());
    setModels(getModels());
    const r = () => {
      setList(getAdminProducts());
      setModels(getModels());
    };
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  function save(p: AdminProduct) {
    const cur = getAdminProducts();
    const idx = cur.findIndex((x) => x.id === p.id);
    if (idx >= 0) cur[idx] = p;
    else cur.unshift(p);
    saveAdminProducts(cur);
    setEditing(null);
  }
  function del(id: string) {
    saveAdminProducts(getAdminProducts().filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">مدیریت محصولات</h2>
        <button
          onClick={() => {
            if (s.groups.length === 0) {
              toast.error("ابتدا یک گروه در «مدیریت گروه‌ها» تعریف کنید");
              return;
            }
            setEditing({
              id: "p_" + Date.now(),
              group: s.groups[0],
              name: "",
              purchasePrice: 0,
              salePrice: 0,
              displayImage: "",
              images: [],
              description: "",
              models: [],
            });
          }}
          className="flex items-center gap-1 rounded-xl btn-primary-gradient px-3 py-1.5 text-xs font-extrabold"
        >
          <Plus className="h-3.5 w-3.5" /> افزودن محصول
        </button>
      </div>

      <ul className="space-y-2">
        {list.length === 0 && (
          <li className="py-8 text-center text-xs text-muted-foreground">محصولی ثبت نشده</li>
        )}
        {list.map((p) => {
          const thumb = p.displayImage || p.images[0];
          const totalInv = (p.models || []).reduce((s, m) => s + (m.inventory || 0), 0);
          const lowStock = (p.models || []).some((m) => m.inventory < 5);
          const on = p.displayOn !== false;
          function toggleOn() {
            const cur = getAdminProducts();
            saveAdminProducts(cur.map((x) => (x.id === p.id ? { ...x, displayOn: !on } : x)));
          }
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl glass-strong p-3">
              {thumb ? (
                <img src={thumb} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-white/5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-extrabold">{p.name || "بی‌نام"}</span>
                  {lowStock && (
                    <span className="shrink-0 rounded-md bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-300">
                      کم‌موجودی
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {p.group} · موجودی <span className="tabular-nums text-foreground/80">{fmt(totalInv)}</span> · {fmt(p.salePrice)} ت
                </div>
              </div>
              <button
                onClick={toggleOn}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition ${
                  on ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-muted-foreground"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${on ? "bg-emerald-400" : "bg-white/30"}`} />
                {on ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => setEditing(p)}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10"
              >
                ویرایش
              </button>
              <button onClick={() => del(p.id)} className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );

        })}
      </ul>

      {editing && (
        <ProductEditor
          product={editing}
          models={models}
          groups={s.groups}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function CroppedImageUploader({
  aspectKey,
  label,
  onCropped,
}: {
  aspectKey: AspectKey;
  label: string;
  onCropped: (dataUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setSrc(await readFileAsDataUrl(f));
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/15 py-3 text-xs text-muted-foreground hover:bg-white/5"
      >
        <Upload className="h-4 w-4" /> {label} ({aspectKey})
      </button>
      {src && (
        <CropperModal
          src={src}
          aspectKey={aspectKey}
          onCancel={() => setSrc(null)}
          onSave={(d) => {
            onCropped(d);
            setSrc(null);
          }}
        />
      )}
    </>
  );
}

function ProductEditor({
  product,
  models,
  groups,
  onClose,
  onSave,
}: {
  product: AdminProduct;
  models: ModelEntry[];
  groups: string[];
  onClose: () => void;
  onSave: (p: AdminProduct) => void;
}) {
  const [p, setP] = useState<AdminProduct>(product);
  const [tab, setTab] = useState<ModelEntry["category"]>("iphone");

  function toggleModel(modelId: string) {
    const exists = p.models.find((m) => m.modelId === modelId);
    if (exists) setP({ ...p, models: p.models.filter((m) => m.modelId !== modelId) });
    else setP({ ...p, models: [...p.models, { modelId, inventory: 0 }] });
  }
  function setInv(modelId: string, inv: number) {
    setP({ ...p, models: p.models.map((m) => (m.modelId === modelId ? { ...m, inventory: inv } : m)) });
  }

  const inCat = models.filter((m) => m.category === tab);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl glass-strong border border-white/10 p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-extrabold">ویرایش محصول</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block text-muted-foreground">گروه</label>
            <select
              value={p.group}
              onChange={(e) => setP({ ...p, group: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-muted-foreground">نام</label>
            <input
              value={p.name}
              onChange={(e) => setP({ ...p, name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-muted-foreground">قیمت خرید</label>
              <input
                type="number"
                value={p.purchasePrice}
                onChange={(e) => setP({ ...p, purchasePrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-muted-foreground">قیمت فروش</label>
              <input
                type="number"
                value={p.salePrice}
                onChange={(e) => setP({ ...p, salePrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-muted-foreground">حداقل سفارش</label>
              <input
                type="number"
                value={p.minOrder ?? 5}
                onChange={(e) => setP({ ...p, minOrder: Math.max(1, Number(e.target.value) || 1) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-muted-foreground">نمایش در سایت</label>
              <button
                type="button"
                onClick={() => setP({ ...p, displayOn: p.displayOn === false })}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 font-extrabold ${
                  p.displayOn !== false
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${p.displayOn !== false ? "bg-emerald-400" : "bg-white/30"}`} />
                {p.displayOn !== false ? "روشن" : "خاموش"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-muted-foreground">مجموع موجودی</span>
            <span className="font-extrabold tabular-nums">
              {fmt((p.models || []).reduce((s, m) => s + (m.inventory || 0), 0))}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-muted-foreground">توضیحات (۲ خط)</label>
            <textarea
              value={p.description}
              rows={2}
              onChange={(e) => setP({ ...p, description: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-muted-foreground">تصویر نمایش محصول (۱:۱)</label>
            {p.displayImage ? (
              <div className="relative inline-block">
                <img src={p.displayImage} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <button
                  onClick={() => setP({ ...p, displayImage: "" })}
                  className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <CroppedImageUploader
                aspectKey="1:1"
                label="آپلود تصویر نمایش"
                onCropped={(d) => setP({ ...p, displayImage: d })}
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-muted-foreground">تصاویر اسلایدشو (۳:۴)</label>
            <CroppedImageUploader
              aspectKey="3:4"
              label="افزودن تصویر اسلایدشو"
              onCropped={(d) => setP({ ...p, images: [...p.images, d] })}
            />
            {p.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {p.images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-20 w-16 rounded-lg object-cover" />
                    <button
                      onClick={() => setP({ ...p, images: p.images.filter((_, j) => j !== i) })}
                      className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-muted-foreground">انتخاب مدل‌ها از دیتابیس</label>
            {models.length === 0 ? (
              <p className="text-center text-muted-foreground py-3">ابتدا مدل‌ها را در دیتابیس مدل‌ها اضافه کنید</p>
            ) : (
              <>
                <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                  {MODEL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setTab(cat.id)}
                      className={`rounded-lg py-2 text-[11px] font-extrabold ${
                        tab === cat.id ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {inCat.length === 0 ? (
                  <p className="text-center text-muted-foreground py-3">مدلی در این دسته نیست</p>
                ) : (
                  <div className="space-y-1">
                    {inCat.map((m) => {
                      const sel = p.models.find((x) => x.modelId === m.id);
                      return (
                        <div key={m.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                          <button
                            onClick={() => toggleModel(m.id)}
                            className={`h-4 w-4 rounded-full border-2 ${sel ? "border-sky-400 bg-sky-400" : "border-white/30"}`}
                          />
                          <span className="flex-1" dir="ltr">{m.name}</span>
                          {sel && (
                            <>
                              {sel.inventory < 5 && (
                                <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-300">
                                  کم
                                </span>
                              )}
                              <input
                                type="number"
                                value={sel.inventory}
                                onChange={(e) => setInv(m.id, Number(e.target.value))}
                                placeholder="موجودی"
                                className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1 text-center"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="rounded-lg bg-white/5 px-4 py-2 hover:bg-white/10">
              انصراف
            </button>
            <button onClick={() => onSave(p)} className="rounded-lg btn-primary-gradient px-4 py-2 font-extrabold">
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Section 5: Models DB ───────────────────────── */

function ModelsSection() {
  const [list, setList] = useState<ModelEntry[]>([]);
  const [openCat, setOpenCat] = useState<ModelEntry["category"] | null>("iphone");
  const [editing, setEditing] = useState<ModelEntry | null>(null);
  const [addInCat, setAddInCat] = useState<ModelEntry["category"] | null>(null);
  const [addName, setAddName] = useState("");

  useEffect(() => {
    setList(getModels());
    const r = () => setList(getModels());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  function saveOne(m: ModelEntry) {
    const cur = getModels();
    const idx = cur.findIndex((x) => x.id === m.id);
    if (idx >= 0) cur[idx] = m;
    else cur.unshift(m);
    saveModels(cur);
    setEditing(null);
  }
  function del(id: string) {
    saveModels(getModels().filter((m) => m.id !== id));
  }
  function addModel(cat: ModelEntry["category"]) {
    const v = addName.trim();
    if (!v) return;
    saveModels([{ id: "m_" + Date.now(), name: v, brand: "", category: cat, similar: [] }, ...getModels()]);
    setAddName("");
    setAddInCat(null);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">دیتابیس مدل‌ها</h2>

      <div className="space-y-2">
        {MODEL_CATEGORIES.map((cat) => {
          const inCat = list.filter((m) => m.category === cat.id);
          const open = openCat === cat.id;
          return (
            <section key={cat.id} className="rounded-2xl glass-strong">
              <button
                onClick={() => setOpenCat(open ? null : cat.id)}
                className="flex w-full items-center justify-between gap-2 p-3 text-right"
              >
                <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
                <span className="flex-1 text-sm font-extrabold text-sky-300">{cat.label}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {inCat.length}
                </span>
              </button>
              {open && (
                <div className="border-t border-white/10 p-3 space-y-2">
                  {addInCat === cat.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addModel(cat.id)}
                        placeholder="نام مدل"
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                        dir="ltr"
                      />
                      <button
                        onClick={() => addModel(cat.id)}
                        className="rounded-lg btn-primary-gradient px-3 py-2 text-xs font-extrabold"
                      >
                        ذخیره
                      </button>
                      <button
                        onClick={() => {
                          setAddInCat(null);
                          setAddName("");
                        }}
                        className="rounded-lg bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                      >
                        انصراف
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddInCat(cat.id)}
                      className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-white/15 py-2 text-xs text-muted-foreground hover:bg-white/5"
                    >
                      <Plus className="h-3.5 w-3.5" /> افزودن مدل
                    </button>
                  )}
                  {inCat.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">مدلی ثبت نشده</p>
                  ) : (
                    <ul className="space-y-1">
                      {inCat.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                          <span className="flex-1" dir="ltr">{m.name}</span>
                          <button onClick={() => setEditing(m)} className="rounded bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10">
                            ویرایش
                          </button>
                          <button onClick={() => del(m.id)} className="rounded bg-red-500/20 p-1 text-red-300 hover:bg-red-500/30">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3" onClick={() => setEditing(null)}>
          <div dir="rtl" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl glass-strong p-4 text-xs">
            <h3 className="mb-3 font-extrabold">ویرایش مدل</h3>
            <label className="mb-1 block text-muted-foreground">نام مدل</label>
            <input
              placeholder="نام مدل"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              dir="ltr"
            />
            <label className="mb-1 block text-muted-foreground">برند</label>
            <input
              placeholder="مثلاً Apple / Samsung / Xiaomi"
              value={editing.brand || ""}
              onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
              className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              dir="ltr"
            />
            <label className="mb-1 block text-muted-foreground">مدل‌های سازگار (با ویرگول جدا کنید)</label>
            <textarea
              rows={3}
              value={(editing.similar || []).join(", ")}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  similar: e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              dir="ltr"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg bg-white/5 px-4 py-2">انصراف</button>
              <button onClick={() => saveOne(editing)} className="rounded-lg btn-primary-gradient px-4 py-2 font-extrabold">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Section 6: Partners ───────────────────────── */

function PartnersSection() {
  const [users, setUsers] = useState(getUsers());
  const [orders] = useOrdersLive();
  const [filter, setFilter] = useState<"all" | "oldest" | "newest" | "top" | "blocked">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const r = () => setUsers(getUsers());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  const enriched = useMemo(() => {
    return users.map((u) => {
      const userOrders = orders.filter((o) => o.userPhone === u.phone && !o.rejected && o.status !== "pending");
      const confirmedCount = userOrders.length;
      const totalSpent = userOrders.reduce((s, o) => s + o.totalPrice, 0);
      const allOrders = orders.filter((o) => o.userPhone === u.phone);
      return { u, confirmedCount, totalSpent, allOrders };
    });
  }, [users, orders]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    if (filter === "oldest") arr.sort((a, b) => +new Date(a.u.joinedAt) - +new Date(b.u.joinedAt));
    else if (filter === "newest") arr.sort((a, b) => +new Date(b.u.joinedAt) - +new Date(a.u.joinedAt));
    else if (filter === "top") arr.sort((a, b) => b.totalSpent - a.totalSpent);
    return arr;
  }, [enriched, filter]);

  function copy(t: string) {
    navigator.clipboard.writeText(t).then(() => toast.success("کپی شد"));
  }
  function toggleBlock(phone: string, blocked: boolean) {
    setUserBlocked(phone, !blocked);
    setUsers(getUsers());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">مدیریت همکاران</h2>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "همه همکاران"],
              ["oldest", "قدیمی‌ترین"],
              ["newest", "جدیدترین"],
              ["top", "بیشترین خرید"],
            ] as const
          ).map(([id, l]) => (
            <button
              key={id}
              onClick={() => setFilter(id as any)}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                filter === id ? "bg-sky-500/20 text-sky-300" : "glass text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {sorted.length === 0 && (
          <li className="py-8 text-center text-xs text-muted-foreground">همکاری ثبت نشده</li>
        )}
        {sorted.map(({ u, confirmedCount, totalSpent, allOrders }) => (
          <li key={u.phone} className="rounded-2xl glass-strong">
            <div className="grid grid-cols-2 gap-2 p-3 text-[11px] md:grid-cols-5">
              <span className="font-extrabold">{u.name} {u.family}</span>
              <span className="tabular-nums">{confirmedCount} فاکتور</span>
              <span className="tabular-nums text-price">{fmt(totalSpent)} ت</span>
              <span className="text-muted-foreground">{persianDateTime(u.joinedAt).split(" - ")[0]}</span>
              <button
                onClick={() => setExpanded(expanded === u.phone ? null : u.phone)}
                className="rounded-lg bg-sky-500/15 px-2 py-1 text-sky-300"
              >
                جزئیات بیشتر
              </button>
            </div>
            {expanded === u.phone && (
              <div className="space-y-3 border-t border-white/10 p-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <button onClick={() => copy(u.phone)} className="rounded bg-white/5 p-1 hover:bg-white/10">
                    <Copy className="h-3 w-3" />
                  </button>
                  <span dir="ltr">{u.phone}</span>
                </div>
                {u.address && (
                  <div className="flex items-start gap-2">
                    <button onClick={() => copy(u.address!)} className="mt-0.5 rounded bg-white/5 p-1 hover:bg-white/10">
                      <Copy className="h-3 w-3" />
                    </button>
                    <span className="flex-1">{u.address}</span>
                  </div>
                )}
                <button
                  onClick={() => toggleBlock(u.phone, !!u.blocked)}
                  className={`rounded-lg px-3 py-1.5 font-bold ${
                    u.blocked ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {u.blocked ? "رفع بلاک" : "بلاک کردن"}
                </button>
                <div className="rounded-xl border border-white/10 bg-white/5">
                  <div className="grid grid-cols-5 gap-1 border-b border-white/10 px-2 py-1.5 text-[10px] text-muted-foreground">
                    <span>فاکتور</span><span>مبلغ</span><span>تعداد</span><span>تاریخ</span><span>وضعیت</span>
                  </div>
                  {allOrders.map((o) => (
                    <details key={o.id} className="border-b border-white/5 last:border-0">
                      <summary className="grid cursor-pointer grid-cols-5 gap-1 px-2 py-1.5 text-[10px]">
                        <span className="text-sky-300">{o.invoice}</span>
                        <span className="tabular-nums">{fmt(o.totalPrice)}</span>
                        <span className="tabular-nums">{o.totalUnits}</span>
                        <span>{persianDateTime(o.date).split(" - ")[0]}</span>
                        <span>{o.rejected ? "رد شده" : STATUS_LABEL[o.status]}</span>
                      </summary>
                      <div className="p-2">
                        {o.status !== "pending" && o.receipt && (
                          <img src={o.receipt} alt="" className="mb-2 max-h-48 w-full rounded object-contain bg-black/30" />
                        )}
                        <InvoiceBreakdown order={o} />
                      </div>
                    </details>
                  ))}
                  {allOrders.length === 0 && (
                    <div className="py-3 text-center text-muted-foreground">فاکتوری ندارد</div>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── Section 7: Settings ───────────────────────── */


type SettingsTab =
  | "library"
  | "banners"
  | "bank"
  | "contact"
  | "about"
  | "newmodels";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "library", label: "کتابخانه تصاویر" },
  { id: "banners", label: "بنرهای صفحه اصلی" },
  { id: "newmodels", label: "مدل‌های به‌روز" },
  { id: "bank", label: "شماره کارت و شبا" },
  { id: "contact", label: "اطلاعات تماس" },
  { id: "about", label: "درباره ما" },
];

function useLibraryLive() {
  const [lib, setLib] = useState<LibraryImage[]>([]);
  useEffect(() => {
    const r = () => setLib(getLibrary());
    r();
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);
  return lib;
}

function ImagePicker({
  value,
  onChange,
  label = "انتخاب از کتابخانه",
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const lib = useLibraryLive();
  const cur = lib.find((x) => x.id === value);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] hover:bg-white/10"
      >
        {cur ? (
          <>
            <img src={cur.dataUrl} alt="" className="h-7 w-7 rounded object-cover" />
            <span className="max-w-[120px] truncate">{cur.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{label}</span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3" onClick={() => setOpen(false)}>
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-extrabold">کتابخانه تصاویر</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            {lib.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                هنوز تصویری در کتابخانه نیست. ابتدا از بخش «کتابخانه تصاویر» تصویر اضافه کنید
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {lib.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    onChange(img.id);
                    setOpen(false);
                  }}
                  className={`rounded-lg border p-1 text-right text-[10px] hover:bg-white/5 ${
                    img.id === value ? "border-sky-400" : "border-white/10"
                  }`}
                >
                  <img src={img.dataUrl} alt="" className="mb-1 h-20 w-full rounded object-cover" />
                  <div className="truncate">{img.name}</div>
                </button>
              ))}
            </div>
            {value && (
              <button
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="mt-3 w-full rounded-lg bg-white/5 py-2 text-xs hover:bg-white/10"
              >
                حذف انتخاب
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ImagePreview({ id, className = "h-10 w-10" }: { id: string; className?: string }) {
  const lib = useLibraryLive();
  const img = lib.find((x) => x.id === id);
  if (!img) return <div className={`${className} rounded bg-white/5`} />;
  return <img src={img.dataUrl} alt="" className={`${className} rounded object-cover`} />;
}

function SettingsSection() {
  const [tab, setTab] = useState<SettingsTab>("library");
  const [s, setS] = useState<SiteSettings>(getSettings());

  useEffect(() => {
    const r = () => setS(getSettings());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  function persist(next: SiteSettings) {
    setS(next);
    saveSettings(next);
  }

  return (
    <div className="space-y-4 text-xs">
      <h2 className="text-lg font-extrabold">تنظیمات سایت</h2>
      <div className="flex flex-col gap-3 md:flex-row-reverse">
        <aside className="md:w-48 shrink-0">
          <nav className="rounded-2xl border border-white/10 bg-slate-900/80 p-2">
            {SETTINGS_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`mb-1 flex w-full items-center justify-end gap-2 rounded-xl px-3 py-2 text-right text-[11px] font-bold transition ${
                  tab === t.id
                    ? "bg-sky-500/25 text-sky-200"
                    : "text-foreground/80 hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 space-y-3">
          {tab === "library" && <LibraryTab />}
          {tab === "banners" && <BannersTab s={s} persist={persist} />}
          {tab === "newmodels" && <NewModelsTab s={s} persist={persist} />}
          {tab === "bank" && <BankTab s={s} persist={persist} />}
          {tab === "contact" && <ContactTab s={s} persist={persist} />}
          {tab === "about" && <AboutTab s={s} persist={persist} />}
        </div>
      </div>
    </div>
  );
}

function LibraryTab() {
  const lib = useLibraryLive();
  const fileRef = useRef<HTMLInputElement>(null);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    Promise.all(
      files.map(
        (f) =>
          new Promise<LibraryImage>((res) => {
            const r = new FileReader();
            r.onload = () =>
              res({
                id: "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
                name: f.name.replace(/\.[^.]+$/, ""),
                dataUrl: String(r.result),
              });
            r.readAsDataURL(f);
          }),
      ),
    ).then((items) => {
      saveLibrary([...items, ...getLibrary()]);
      if (fileRef.current) fileRef.current.value = "";
    });
  }
  function rename(id: string, name: string) {
    saveLibrary(getLibrary().map((x) => (x.id === id ? { ...x, name } : x)));
  }
  function del(id: string) {
    saveLibrary(getLibrary().filter((x) => x.id !== id));
  }

  return (
    <section className="rounded-2xl glass-strong p-4">
      <h3 className="mb-3 font-extrabold">کتابخانه تصاویر</h3>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
      <button
        onClick={() => fileRef.current?.click()}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/15 py-3 text-muted-foreground hover:bg-white/5"
      >
        <Upload className="h-4 w-4" /> آپلود تصویر جدید
      </button>
      {lib.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">تصویری وجود ندارد</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {lib.map((img) => (
            <div key={img.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
              <img src={img.dataUrl} alt="" className="mb-2 h-24 w-full rounded object-cover" />
              <input
                value={img.name}
                onChange={(e) => rename(img.id, e.target.value)}
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
              />
              <button
                onClick={() => del(img.id)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-red-500/20 py-1 text-[11px] text-red-300 hover:bg-red-500/30"
              >
                <Trash2 className="h-3 w-3" /> حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BannersTab({ s, persist }: { s: SiteSettings; persist: (n: SiteSettings) => void }) {
  return (
    <>
      <section className="rounded-2xl glass-strong p-4">
        <h3 className="mb-3 font-extrabold">لوگوی سایت</h3>
        <ImagePicker
          value={s.logoImageId}
          onChange={(id) => persist({ ...s, logoImageId: id })}
          label="انتخاب لوگو"
        />
      </section>
      <section className="rounded-2xl glass-strong p-4">
        <h3 className="mb-3 font-extrabold">بنرهای صفحه اصلی</h3>
        <button
          onClick={() =>
            persist({
              ...s,
              banners: [...s.banners, { id: "b_" + Date.now(), imageId: "", link: "" }],
            })
          }
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/15 py-3 text-muted-foreground hover:bg-white/5"
        >
          <Plus className="h-4 w-4" /> افزودن بنر
        </button>
        <div className="space-y-2">
          {s.banners.map((b, i) => (
            <div key={b.id} className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="flex items-center gap-2">
                <ImagePreview id={b.imageId} className="h-12 w-20" />
                <ImagePicker
                  value={b.imageId}
                  onChange={(id) => {
                    const arr = [...s.banners];
                    arr[i] = { ...arr[i], imageId: id };
                    persist({ ...s, banners: arr });
                  }}
                  label="انتخاب تصویر"
                />
                <button
                  onClick={() => persist({ ...s, banners: s.banners.filter((_, j) => j !== i) })}
                  className="ml-auto rounded bg-red-500/20 p-1.5 text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <input
                value={b.link}
                onChange={(e) => {
                  const arr = [...s.banners];
                  arr[i] = { ...arr[i], link: e.target.value };
                  persist({ ...s, banners: arr });
                }}
                placeholder="لینک (محصول داخلی یا URL خارجی)"
                dir="ltr"
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NewModelsTab({ s, persist }: { s: SiteSettings; persist: (n: SiteSettings) => void }) {
  function update(rows: NewModelsRow[], touchDate = true) {
    persist({
      ...s,
      newModelsRows: rows,
      newModelsUpdatedAt: touchDate ? todayFa() : s.newModelsUpdatedAt,
    });
  }
  function addRow() {
    update([
      ...s.newModelsRows,
      { id: "row_" + Date.now(), groups: [], models: [""] },
    ]);
  }
  function delRow(id: string) {
    update(s.newModelsRows.filter((r) => r.id !== id));
  }
  function patchRow(id: string, patch: Partial<NewModelsRow>) {
    update(s.newModelsRows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function toggleGroup(row: NewModelsRow, g: string) {
    const has = row.groups.includes(g);
    patchRow(row.id, { groups: has ? row.groups.filter((x) => x !== g) : [...row.groups, g] });
  }

  return (
    <section className="rounded-2xl glass-strong p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={s.newModelsHeading}
            onChange={(e) => persist({ ...s, newModelsHeading: e.target.value })}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold"
            placeholder="عنوان بخش"
          />
          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            تاریخ به‌روزرسانی: <span dir="ltr">{s.newModelsUpdatedAt || "—"}</span>
          </span>
        </div>
      </div>

      <button
        onClick={addRow}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/15 py-3 text-xs font-bold text-sky-300 hover:bg-white/5"
      >
        <Plus className="h-4 w-4" /> افزودن سطر
      </button>

      <div className="space-y-3">
        {s.newModelsRows.length === 0 && (
          <p className="py-4 text-center text-[11px] text-muted-foreground">هنوز سطری اضافه نشده</p>
        )}
        {s.newModelsRows.map((row, idx) => (
          <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">سطر {idx + 1}</span>
              <button
                onClick={() => delRow(row.id)}
                className="rounded bg-red-500/20 p-1.5 text-red-300 hover:bg-red-500/30"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            <div>
              <div className="mb-1 text-[11px] text-muted-foreground">گروه‌ها (چند انتخابی)</div>
              <div className="flex flex-wrap gap-2">
                {s.groups.length === 0 && (
                  <span className="text-[11px] text-muted-foreground">گروهی تعریف نشده</span>
                )}
                {s.groups.map((g) => {
                  const sel = row.groups.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleGroup(row, g)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                        sel
                          ? "border-sky-400 bg-sky-500/15 text-sky-300"
                          : "border-white/15 text-muted-foreground hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`h-3 w-3 rounded-full border ${sel ? "border-sky-400 bg-sky-400" : "border-white/30"}`}
                      />
                      گلس {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">مدل‌ها</span>
                <button
                  onClick={() => patchRow(row.id, { models: [...row.models, ""] })}
                  className="flex items-center gap-1 rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300"
                >
                  <Plus className="h-3 w-3" /> افزودن مدل
                </button>
              </div>
              <div className="space-y-1.5">
                {row.models.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-2">
                    <input
                      value={m}
                      onChange={(e) => {
                        const arr = [...row.models];
                        arr[mi] = e.target.value;
                        patchRow(row.id, { models: arr });
                      }}
                      placeholder={`مدل ${mi + 1}`}
                      dir="ltr"
                      className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
                    />
                    <button
                      onClick={() =>
                        patchRow(row.id, { models: row.models.filter((_, j) => j !== mi) })
                      }
                      className="rounded bg-red-500/20 p-1.5 text-red-300 hover:bg-red-500/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BankTab({ s, persist }: { s: SiteSettings; persist: (n: SiteSettings) => void }) {
  return (
    <section className="rounded-2xl glass-strong p-4 space-y-3">
      <div>
        <label className="mb-1 block text-muted-foreground">شماره کارت</label>
        <input
          value={s.card}
          dir="ltr"
          onChange={(e) => persist({ ...s, card: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono"
        />
      </div>
      <div>
        <label className="mb-1 block text-muted-foreground">شماره شبا</label>
        <input
          value={s.iban}
          dir="ltr"
          onChange={(e) => persist({ ...s, iban: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono"
        />
      </div>
    </section>
  );
}

function ContactTab({ s, persist }: { s: SiteSettings; persist: (n: SiteSettings) => void }) {
  const c = s.contact;
  function setC(patch: Partial<ContactSettings>) {
    persist({ ...s, contact: { ...c, ...patch } });
  }
  const social: { key: keyof Omit<ContactSettings, "phones">; label: string }[] = [
    { key: "telegram", label: "تلگرام" },
    { key: "whatsapp", label: "واتساپ" },
    { key: "instagram", label: "اینستاگرام" },
    { key: "rubika", label: "روبیکا" },
  ];
  return (
    <section className="rounded-2xl glass-strong p-4 space-y-4">
      {social.map(({ key, label }) => (
        <div key={key} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <ImagePicker
              value={c[key].imageId}
              onChange={(id) => setC({ [key]: { ...c[key], imageId: id } } as any)}
              label="آیکون"
            />
            <span className="font-bold">{label}</span>
          </div>
          <input
            value={c[key].link}
            onChange={(e) => setC({ [key]: { ...c[key], link: e.target.value } } as any)}
            placeholder="لینک"
            dir="ltr"
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5"
          />
        </div>
      ))}
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setC({ phones: [...c.phones, ""] })}
            className="flex items-center gap-1 rounded bg-sky-500/20 px-2 py-1 text-[11px] font-bold text-sky-300"
          >
            <Plus className="h-3 w-3" /> افزودن
          </button>
          <span className="font-bold">تماس</span>
        </div>
        {c.phones.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => setC({ phones: c.phones.filter((_, j) => j !== i) })}
              className="rounded bg-red-500/20 p-1.5 text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <input
              value={p}
              onChange={(e) => {
                const arr = [...c.phones];
                arr[i] = e.target.value;
                setC({ phones: arr });
              }}
              placeholder="09xxxxxxxxx"
              dir="ltr"
              className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutTab({ s, persist }: { s: SiteSettings; persist: (n: SiteSettings) => void }) {
  const a = s.about;
  function setA(patch: Partial<AboutSettings>) {
    persist({ ...s, about: { ...a, ...patch } });
  }
  return (
    <section className="rounded-2xl glass-strong p-4 space-y-4">
      <div>
        <label className="mb-1 block text-muted-foreground">متن اصلی صفحه درباره ما</label>
        <textarea
          value={a.mainText}
          rows={5}
          onChange={(e) => setA({ mainText: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        />
      </div>
      <div>
        <h4 className="mb-2 font-bold">چرا پارس گلس</h4>
        <div className="space-y-2">
          {a.whyUs.map((w, i) => (
            <div key={i} className="rounded border border-white/10 bg-white/5 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <ImagePicker
                  value={w.imageId}
                  onChange={(id) => {
                    const arr = [...a.whyUs];
                    arr[i] = { ...arr[i], imageId: id };
                    setA({ whyUs: arr });
                  }}
                />
                <span className="text-[11px] text-muted-foreground">مورد {i + 1}</span>
              </div>
              <textarea
                value={w.text}
                rows={2}
                onChange={(e) => {
                  const arr = [...a.whyUs];
                  arr[i] = { ...arr[i], text: e.target.value };
                  setA({ whyUs: arr });
                }}
                placeholder="متن"
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5"
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() =>
              setA({
                faq: [
                  ...a.faq,
                  { id: "f_" + Date.now(), q: "", a: "" },
                ],
              })
            }
            className="flex items-center gap-1 rounded bg-sky-500/20 px-2 py-1 text-[11px] font-bold text-sky-300"
          >
            <Plus className="h-3 w-3" /> افزودن
          </button>
          <h4 className="font-bold">پرسش‌های متداول</h4>
        </div>
        <div className="space-y-2">
          {a.faq.map((f, i) => (
            <div key={f.id} className="rounded border border-white/10 bg-white/5 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setA({ faq: a.faq.filter((x) => x.id !== f.id) })}
                  className="rounded bg-red-500/20 p-1.5 text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <span className="text-[11px] text-muted-foreground">سؤال {i + 1}</span>
              </div>
              <input
                value={f.q}
                onChange={(e) => {
                  const arr = a.faq.map((x) => (x.id === f.id ? { ...x, q: e.target.value } : x));
                  setA({ faq: arr });
                }}
                placeholder="پرسش"
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5"
              />
              <textarea
                value={f.a}
                rows={2}
                onChange={(e) => {
                  const arr = a.faq.map((x) => (x.id === f.id ? { ...x, a: e.target.value } : x));
                  setA({ faq: arr });
                }}
                placeholder="پاسخ"
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ───────────────────────── Section 8: Discounts ───────────────────────── */

const DISCOUNT_KIND_LABEL: Record<DiscountCode["kind"], string> = {
  fixed: "مبلغی",
  percent: "درصدی",
  percent_by_amount: "درصد بر اساس مبلغ",
};

const TARGET_GROUP_LABEL: Record<NonNullable<DiscountCode["targetGroup"]>, string> = {
  all: "همه کاربران",
  active: "کاربران فعال",
  new: "کاربران جدید",
};

function discountStatus(d: DiscountCode): "active" | "inactive" | "expired" {
  if (new Date(d.expiry) < new Date()) return "expired";
  return d.active === false ? "inactive" : "active";
}

function DiscountsSection() {
  const [tab, setTab] = useState<"define" | "track">("define");

  return (
    <div className="space-y-4 text-xs">
      <h2 className="text-lg font-extrabold">کدهای تخفیف</h2>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        {(
          [
            ["define", "تعریف کد تخفیف"],
            ["track", "پیگیری کدها"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg py-2 text-[11px] font-extrabold transition ${
              tab === id ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "define" ? <DiscountDefineTab /> : <DiscountTrackTab />}
    </div>
  );
}

function emptyDiscount(): DiscountCode {
  return {
    id: "",
    code: "",
    kind: "fixed",
    amount: 10,
    expiry: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    limit: 100,
    used: 0,
    targetGroup: "all",
    active: true,
  };
}

function DiscountDefineTab() {
  const [list, setList] = useState<DiscountCode[]>([]);
  const [draft, setDraft] = useState<DiscountCode>(emptyDiscount);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "expired">("all");

  useEffect(() => {
    setList(getDiscounts());
    const r = () => setList(getDiscounts());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  function add() {
    if (!draft.code.trim()) return toast.error("کد را وارد کنید");
    const d: DiscountCode = { ...draft, id: "d_" + Date.now(), code: draft.code.trim().toUpperCase() };
    saveDiscounts([d, ...list]);
    setDraft(emptyDiscount());
    toast.success("کد تخفیف ثبت شد");
  }
  function del(id: string) {
    saveDiscounts(list.filter((d) => d.id !== id));
  }
  function toggleActive(id: string) {
    saveDiscounts(
      list.map((d) => (d.id === id ? { ...d, active: discountStatus(d) === "active" ? false : true } : d))
    );
  }

  const filtered = list.filter((d) => statusFilter === "all" || discountStatus(d) === statusFilter);

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl glass-strong p-3">
        <div className="font-extrabold">تعریف کد جدید</div>
        <input
          placeholder="کد تخفیف"
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          dir="ltr"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={draft.kind}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value as DiscountCode["kind"] })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          >
            <option value="fixed">مبلغی</option>
            <option value="percent">درصدی</option>
            <option value="percent_by_amount">درصد بر اساس مبلغ</option>
          </select>
          <input
            type="number"
            placeholder="مبلغ / درصد"
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={draft.expiry}
            onChange={(e) => setDraft({ ...draft, expiry: e.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          />
          <input
            type="number"
            placeholder="محدودیت استفاده"
            value={draft.limit}
            onChange={(e) => setDraft({ ...draft, limit: Number(e.target.value) })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
          />
        </div>
        <select
          value={draft.targetGroup}
          onChange={(e) => setDraft({ ...draft, targetGroup: e.target.value as DiscountCode["targetGroup"] })}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        >
          <option value="all">همه کاربران</option>
          <option value="active">کاربران فعال</option>
          <option value="new">کاربران جدید</option>
        </select>
        <div className="flex justify-end">
          <button onClick={add} className="flex items-center gap-1 rounded-lg btn-primary-gradient px-4 py-2 font-extrabold">
            <Plus className="h-3.5 w-3.5" /> ذخیره کد
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <aside className="w-28 shrink-0 space-y-2">
          {(
            [
              ["all", "همه"],
              ["active", "فعال"],
              ["inactive", "غیرفعال"],
              ["expired", "منقضی شده"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`w-full rounded-xl px-2 py-2 text-[10px] font-bold transition ${
                statusFilter === id ? "bg-sky-500/20 text-sky-300" : "glass text-muted-foreground hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </aside>
        <ul className="min-w-0 flex-1 space-y-2">
          {filtered.length === 0 && <li className="py-8 text-center text-muted-foreground">کدی ثبت نشده</li>}
          {filtered.map((d) => {
            const st = discountStatus(d);
            const badge =
              st === "expired"
                ? "border-red-400/30 bg-red-500/15 text-red-300"
                : st === "inactive"
                  ? "border-white/20 bg-white/5 text-muted-foreground"
                  : "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
            return (
              <li key={d.id} className="flex items-center gap-2 rounded-2xl glass-strong p-3">
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge}`}>
                  {st === "expired" ? "منقضی شده" : st === "inactive" ? "غیرفعال" : "فعال"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-extrabold" dir="ltr">{d.code}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {DISCOUNT_KIND_LABEL[d.kind]} ·{" "}
                    {d.kind === "fixed" ? `${fmt(d.amount)} ت` : `${d.amount}٪`} ·{" "}
                    {TARGET_GROUP_LABEL[d.targetGroup ?? "all"]} · {d.used}/{d.limit}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(d.id)}
                  disabled={st === "expired"}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-extrabold transition disabled:opacity-40 ${
                    st === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${st === "active" ? "bg-emerald-400" : "bg-white/30"}`} />
                  {st === "active" ? "روشن" : "خاموش"}
                </button>
                <button onClick={() => del(d.id)} className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function DiscountTrackTab() {
  const [list, setList] = useState<DiscountCode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setList(getDiscounts());
    const r = () => setList(getDiscounts());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  const redemptions = useMemo<DiscountRedemption[]>(
    () => (selected ? getRedemptionsForCode(selected) : []),
    [selected, list]
  );

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {list.length === 0 && <li className="py-8 text-center text-muted-foreground">کدی ثبت نشده</li>}
        {list.map((d) => (
          <li key={d.id}>
            <button
              onClick={() => setSelected(selected === d.code ? null : d.code)}
              className={`flex w-full items-center justify-between gap-2 rounded-2xl glass-strong p-3 text-right transition ${
                selected === d.code ? "ring-1 ring-sky-400/50" : "hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="font-mono font-extrabold" dir="ltr">{d.code}</span>
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-300 tabular-nums">
                  {d.used}/{d.limit}
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 transition ${selected === d.code ? "rotate-180" : ""}`} />
            </button>
            {selected === d.code && (
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                {redemptions.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-muted-foreground">هنوز استفاده نشده است</p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {redemptions.map((r) => (
                      <li key={r.id} className="grid grid-cols-3 items-center gap-2 py-2 text-[11px]">
                        <span className="font-bold">{r.userName || r.userPhone}</span>
                        <span className="text-muted-foreground">{persianDateTime(r.date)}</span>
                        <span className="justify-self-end tabular-nums">{fmt(r.invoiceAmount)} ت</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── Dashboard add-ons ───────────────────────── */

function DashboardKpiCards({ orders }: { orders: Order[] }) {
  const [users, setUsers] = useState(() => getUsers());
  useEffect(() => {
    const r = () => setUsers(getUsers());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = users.filter((u) => {
    const d = new Date(u.joinedAt);
    return d >= startMonth && d <= now;
  }).length;

  const isToday = (iso: string) => new Date(iso).toDateString() === now.toDateString();
  const confirmed = orders.filter((o) => !o.rejected && o.status !== "pending");
  const todays = confirmed.filter((o) => isToday(o.date));
  const todaySales = todays.reduce((s, o) => s + o.totalPrice, 0);

  const cards = [
    { label: "مجموع کاربران", value: fmt(users.length), icon: Users, color: "text-sky-300 bg-sky-500/15" },
    { label: "کاربران جدید این ماه", value: fmt(newThisMonth), icon: UserPlus, color: "text-emerald-300 bg-emerald-500/15" },
    { label: "سفارش‌های امروز", value: fmt(todays.length), icon: ShoppingBag, color: "text-orange-300 bg-orange-500/15" },
    { label: "فروش امروز (ت)", value: fmt(todaySales), icon: Wallet, color: "text-violet-300 bg-violet-500/15" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl glass-strong p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </span>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">{c.label}</div>
              <div className="text-base font-extrabold tabular-nums">{c.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardLowStock() {
  const [products, setProducts] = useState<AdminProduct[]>(() => getAdminProducts());
  const [models, setModels] = useState<ModelEntry[]>(() => getModels());
  useEffect(() => {
    const r = () => {
      setProducts(getAdminProducts());
      setModels(getModels());
    };
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  const rows = useMemo(() => {
    const out: { product: AdminProduct; modelName: string; inv: number }[] = [];
    for (const p of products) {
      for (const m of p.models) {
        if (m.inventory < 5) {
          const mod = models.find((x) => x.id === m.modelId);
          out.push({ product: p, modelName: mod?.name || m.modelId, inv: m.inventory });
        }
      }
    }
    return out.sort((a, b) => a.inv - b.inv).slice(0, 8);
  }, [products, models]);

  return (
    <div className="rounded-2xl glass-strong p-3">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <AlertTriangle className="h-4 w-4 text-yellow-300" />
        <span className="font-extrabold">کم‌موجودی (کمتر از ۵)</span>
        <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] text-yellow-300 tabular-nums">
          {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-muted-foreground">موردی نیست</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-2 py-2 text-[11px]">
              <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-red-300 tabular-nums">
                موجودی: {r.inv}
              </span>
              <span className="flex-1 truncate text-left" dir="ltr">{r.modelName}</span>
              <span className="font-bold">{r.product.name || "بی‌نام"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DashboardTopModels({ orders }: { orders: Order[] }) {
  const top = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      for (const it of o.items) {
        map.set(it.modelName, (map.get(it.modelName) || 0) + it.qty);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders]);
  const max = Math.max(1, ...top.map(([, c]) => c));

  return (
    <div className="rounded-2xl glass-strong p-3">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <TrendingUp className="h-4 w-4 text-emerald-300" />
        <span className="font-extrabold">پرفروش‌ترین مدل‌ها</span>
      </div>
      {top.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-muted-foreground">داده‌ای موجود نیست</p>
      ) : (
        <ul className="space-y-2">
          {top.map(([name, count]) => (
            <li key={name} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="tabular-nums text-muted-foreground">×{count}</span>
                <span className="truncate" dir="ltr">{name}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-sky-400"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DashboardRecentOrders({ orders }: { orders: Order[] }) {
  const recent = orders.slice(0, 5);
  return (
    <div className="rounded-2xl glass-strong p-3">
      <div className="mb-2 text-xs font-extrabold">آخرین سفارش‌ها</div>
      {recent.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-muted-foreground">سفارشی ثبت نشده</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {recent.map((o) => (
            <li key={o.id} className="grid grid-cols-4 items-center gap-2 py-2 text-[11px]">
              <span className="font-extrabold text-sky-300">{o.invoice}</span>
              <span className="tabular-nums">{fmt(o.totalPrice)} ت</span>
              <span className="text-muted-foreground">{persianDateTime(o.date).split(" - ")[0]}</span>
              <span
                className={`justify-self-end rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  o.rejected
                    ? "bg-red-500/15 text-red-300 border-red-400/30"
                    : STATUS_COLOR[o.status]
                }`}
              >
                {o.rejected ? "رد شده" : STATUS_LABEL[o.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── Display Order Section ───────────────────────── */

function DisplayOrderSection() {
  const [settings, setSettings] = useState<SiteSettings>(() => getSettings());
  useEffect(() => {
    const r = () => setSettings(getSettings());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  const allIds = GLASS_TYPES.map((t) => t.id);
  const orderedIds = applyProductOrder(allIds, settings.productOrder);
  const hidden = new Set(settings.productHidden || []);

  function persist(nextOrder: string[], nextHidden?: Set<string>) {
    saveSettings({
      ...settings,
      productOrder: nextOrder,
      productHidden: Array.from(nextHidden ?? hidden),
    });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= orderedIds.length || from === to) return;
    const arr = [...orderedIds];
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    persist(arr);
  }
  function toggle(id: string) {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persist(orderedIds, next);
  }

  const [drag, setDrag] = useState<number | null>(null);

  return (
    <div className="space-y-4 text-xs">
      <h2 className="text-lg font-extrabold">ترتیب نمایش محصولات</h2>
      <p className="text-muted-foreground">
        با کشیدن و رها کردن، ترتیب نمایش را تغییر دهید. در صفحه اصلی از چپ به راست، و در صفحه محصولات از راست به چپ نمایش داده می‌شوند. مورد ۱ همیشه اول است.
      </p>
      <ul className="space-y-2">
        {orderedIds.map((id, i) => {
          const t = GLASS_TYPES.find((x) => x.id === id);
          if (!t) return null;
          const on = !hidden.has(id);
          return (
            <li
              key={id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag !== null) move(drag, i);
                setDrag(null);
              }}
              className={`flex items-center gap-3 rounded-2xl glass-strong p-3 ${
                drag === i ? "opacity-50" : ""
              }`}
            >
              <span className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg bg-white/5 text-muted-foreground active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 tabular-nums">
                #{i + 1}
              </span>
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${t.hue}`} />
              <span className="flex-1 truncate font-bold">گلس {t.label}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  className="rounded bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10 disabled:opacity-30"
                >
                  بالا
                </button>
                <button
                  onClick={() => move(i, i + 1)}
                  disabled={i === orderedIds.length - 1}
                  className="rounded bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10 disabled:opacity-30"
                >
                  پایین
                </button>
              </div>
              <button
                onClick={() => toggle(id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-extrabold transition ${
                  on
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${on ? "bg-emerald-400" : "bg-white/30"}`} />
                {on ? "ON" : "OFF"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────────────────────── Collab: Special messages ───────────────────────── */

function SpecialMessagesSection() {
  const [mode, setMode] = useState<"all" | "single">("all");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [users, setUsers] = useState<RegisteredUser[]>([]);

  useEffect(() => {
    setUsers(getUsers());
    const r = () => setUsers(getUsers());
    window.addEventListener("admin-updated", r);
    return () => window.removeEventListener("admin-updated", r);
  }, []);

  function send() {
    if (!topic.trim()) return toast.error("موضوع پیام را وارد کنید");
    if (!text.trim()) return toast.error("متن پیام را وارد کنید");
    if (mode === "single") {
      const p = phone.trim();
      if (!p) return toast.error("شماره کاربر را وارد کنید");
      if (!users.some((u) => u.phone === p)) return toast.error("کاربری با این شماره یافت نشد");
      notifyMessage(p, topic.trim(), text.trim());
      toast.success("پیام ارسال شد");
    } else {
      if (users.length === 0) return toast.error("کاربری ثبت نشده است");
      for (const u of users) notifyMessage(u.phone, topic.trim(), text.trim());
      toast.success(`پیام برای ${fmt(users.length)} کاربر ارسال شد`);
    }
    setTopic("");
    setText("");
    setPhone("");
  }

  return (
    <div className="space-y-4 text-xs">
      <h2 className="text-lg font-extrabold">پیام‌های خاص</h2>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        {(
          [
            ["all", "ارسال به همه"],
            ["single", "ارسال به کاربر خاص"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`rounded-lg py-2 text-[11px] font-extrabold transition ${
              mode === id ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl glass-strong p-3">
        {mode === "single" && (
          <input
            placeholder="شماره موبایل کاربر"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            dir="ltr"
          />
        )}
        <input
          placeholder="موضوع"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        />
        <textarea
          placeholder="متن کامل پیام"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {mode === "all" ? `گیرندگان: ${fmt(users.length)} کاربر` : "ارسال به یک کاربر"}
          </span>
          <button
            onClick={send}
            className="flex items-center gap-1 rounded-lg btn-primary-gradient px-4 py-2 font-extrabold"
          >
            <Send className="h-3.5 w-3.5" /> ارسال پیام
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Collab: Notifications management ───────────────────────── */

function useNotificationsLive() {
  const [list, setList] = useState<AppNotification[]>([]);
  useEffect(() => {
    const r = () => setList(getNotifications());
    r();
    window.addEventListener("notifications-updated", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("notifications-updated", r);
      window.removeEventListener("storage", r);
    };
  }, []);
  return list;
}

const ORDER_KINDS: OrderKind[] = [
  "approved",
  "processing",
  "shipping",
  "rejected",
];

function NotificationsAdminSection() {
  const all = useNotificationsLive();
  const [tab, setTab] = useState<"order" | "discount">("order");
  const [kindFilter, setKindFilter] = useState<OrderKind | "all">("all");

  const userNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of getUsers()) map.set(u.phone, `${u.name ?? ""} ${u.family ?? ""}`.trim());
    return map;
  }, [all]);

  const byTopic = all.filter((n) => n.topic === tab);
  const filtered =
    tab === "order" && kindFilter !== "all"
      ? byTopic.filter((n) => n.kind === kindFilter)
      : byTopic;

  const sent = filtered.length;
  const seen = filtered.filter((n) => n.read).length;
  const unseen = sent - seen;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold">مدیریت اعلان‌ها</h2>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        {(
          [
            ["order", "اعلان سفارشات"],
            ["discount", "اعلان کد تخفیف"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg py-2 text-[11px] font-extrabold transition ${
              tab === id ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {tab === "order" && (
          <aside className="w-36 shrink-0 space-y-2">
            <button
              onClick={() => setKindFilter("all")}
              className={`w-full rounded-xl px-2 py-2 text-[10px] font-bold transition ${
                kindFilter === "all" ? "bg-sky-500/20 text-sky-300" : "glass text-muted-foreground hover:bg-white/10"
              }`}
            >
              همه
            </button>
            {ORDER_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`w-full rounded-xl px-2 py-2 text-[10px] font-bold transition ${
                  kindFilter === k ? "bg-sky-500/20 text-sky-300" : "glass text-muted-foreground hover:bg-white/10"
                }`}
              >
                {ORDER_KIND_TITLE[k]}
              </button>
            ))}
          </aside>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["تعداد ارسال شده", sent, "text-sky-300"],
                ["مشاهده شده", seen, "text-emerald-300"],
                ["باز نشده", unseen, "text-yellow-300"],
              ] as const
            ).map(([label, val, color]) => (
              <div key={label} className="rounded-xl glass-strong p-3 text-center">
                <div className={`text-lg font-extrabold tabular-nums ${color}`}>{val}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <ul className="space-y-2">
            {filtered.length === 0 && (
              <li className="py-8 text-center text-xs text-muted-foreground">موردی نیست</li>
            )}
            {filtered.map((n) => (
              <li
                key={n.id}
                className="grid grid-cols-1 gap-1 rounded-2xl glass-strong p-3 text-[11px] sm:grid-cols-4 sm:items-center"
              >
                <span className="font-extrabold text-sky-300">{n.title}</span>
                <span className="text-muted-foreground">{userNames.get(n.userPhone) || n.userPhone}</span>
                <span className="text-muted-foreground">{persianDateTime(n.date)}</span>
                <span
                  className={`justify-self-start rounded-full border px-2 py-0.5 text-[10px] font-bold sm:justify-self-end ${
                    n.read
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                      : "border-yellow-400/30 bg-yellow-500/15 text-yellow-300"
                  }`}
                >
                  {n.read ? "مشاهده شده" : "باز نشده"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
