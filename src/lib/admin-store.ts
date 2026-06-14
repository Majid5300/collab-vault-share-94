// Admin-side localStorage models.
export type RegisteredUser = {
  phone: string;
  name: string;
  family: string;
  joinedAt: string;
  address?: string;
  blocked?: boolean;
};

export type ModelEntry = {
  id: string;
  name: string;
  brand: string;
  category: "iphone" | "samsung_xiaomi" | "curved";
  similar: string[];
};

export type AdminProduct = {
  id: string;
  group: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  displayImage?: string;
  images: string[];
  description: string;
  models: { modelId: string; inventory: number }[];
  /** حداقل تعداد سفارش */
  minOrder?: number;
  /** نمایش روی سایت */
  displayOn?: boolean;
  /** ترتیب نمایش (کمتر = اول) */
  sortIndex?: number;
};


export type DiscountTier = { minAmount: number; percent: number };

export type DiscountCode = {
  id: string;
  code: string;
  kind: "percent" | "fixed" | "percent_by_amount";
  amount: number;
  expiry: string;
  limit: number;
  used: number;
  /** گروه هدف */
  targetGroup?: "all" | "active" | "new";
  /** روشن / خاموش */
  active?: boolean;
  /** سطح‌های «درصد بر اساس مبلغ» */
  tiers?: DiscountTier[];
};

/**
 * Resolve a typed discount code by user-input string (case-insensitive),
 * compute its monetary value against a cart total, and return null when
 * invalid / expired / exhausted / inactive.
 */
export function resolveDiscount(
  rawCode: string,
  cartTotal: number,
): { code: DiscountCode; amount: number } | null {
  const c = (rawCode || "").trim().toUpperCase();
  if (!c) return null;
  const found = getDiscounts().find((d) => d.code.trim().toUpperCase() === c);
  if (!found) return null;
  if (found.active === false) return null;
  if (new Date(found.expiry) < new Date()) return null;
  if (found.limit > 0 && found.used >= found.limit) return null;

  let amount = 0;
  if (found.kind === "fixed") {
    amount = Math.max(0, found.amount);
  } else if (found.kind === "percent") {
    amount = Math.floor((cartTotal * Math.max(0, found.amount)) / 100);
  } else if (found.kind === "percent_by_amount") {
    const tiers = (found.tiers || [])
      .filter((t) => t.minAmount > 0 && t.percent > 0)
      .sort((a, b) => a.minAmount - b.minAmount);
    let pct = 0;
    for (const t of tiers) if (cartTotal >= t.minAmount) pct = t.percent;
    amount = Math.floor((cartTotal * pct) / 100);
  }
  if (amount <= 0) return null;
  return { code: found, amount };
}

export type DiscountRedemption = {
  id: string;
  code: string;
  userPhone: string;
  userName: string;
  date: string; // ISO
  invoiceAmount: number;
  invoice?: string;
};

export type LibraryImage = {
  id: string;
  name: string;
  dataUrl: string;
};

export type BannerEntry = {
  id: string;
  imageId: string;
  link: string;
};

export type NewModelsRow = {
  id: string;
  groups: string[];
  models: string[];
};

export type ContactSettings = {
  telegram: { link: string; imageId: string };
  whatsapp: { link: string; imageId: string };
  instagram: { link: string; imageId: string };
  rubika: { link: string; imageId: string };
  phones: string[];
};

export type WhyUsItem = { imageId: string; text: string };
export type FaqItem = { id: string; q: string; a: string };

export type AboutSettings = {
  mainText: string;
  whyUs: WhyUsItem[];
  faq: FaqItem[];
};

export type SiteSettings = {
  logoImageId: string;
  banners: BannerEntry[];
  card: string;
  iban: string;
  contact: ContactSettings;
  about: AboutSettings;
  groups: string[];
  newModelsRows: NewModelsRow[];
  newModelsHeading: string;
  newModelsUpdatedAt: string;
  /** ترتیب نمایش محصولات (glass-type id ها به‌ترتیب) */
  productOrder?: string[];
  /** id محصولاتی که در سایت مخفی هستند */
  productHidden?: string[];
};


const USERS_KEY = "parsglass_users_v1";
const MODELS_KEY = "parsglass_models_v1";
const PRODUCTS_KEY = "parsglass_admin_products_v1";
const DISCOUNTS_KEY = "parsglass_discounts_v1";
const SETTINGS_KEY = "parsglass_site_settings_v2";
const LIBRARY_KEY = "parsglass_image_library_v1";
const REDEMPTIONS_KEY = "parsglass_discount_redemptions_v1";

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new Event("admin-updated"));
}

export function getUsers(): RegisteredUser[] {
  return read<RegisteredUser[]>(USERS_KEY, []);
}
export function saveUsers(list: RegisteredUser[]) {
  write(USERS_KEY, list);
}
export function upsertUser(u: RegisteredUser) {
  const list = getUsers();
  const idx = list.findIndex((x) => x.phone === u.phone);
  if (idx >= 0) list[idx] = { ...list[idx], ...u };
  else list.unshift(u);
  saveUsers(list);
}
export function setUserBlocked(phone: string, blocked: boolean) {
  saveUsers(getUsers().map((u) => (u.phone === phone ? { ...u, blocked } : u)));
}
export function isPhoneBlocked(phone: string): boolean {
  return !!getUsers().find((u) => u.phone === phone && u.blocked);
}

export function getModels(): ModelEntry[] {
  return read<ModelEntry[]>(MODELS_KEY, []);
}
export function saveModels(list: ModelEntry[]) {
  write(MODELS_KEY, list);
}

export function getAdminProducts(): AdminProduct[] {
  return read<AdminProduct[]>(PRODUCTS_KEY, []);
}
export function saveAdminProducts(list: AdminProduct[]) {
  write(PRODUCTS_KEY, list);
}

export function getDiscounts(): DiscountCode[] {
  return read<DiscountCode[]>(DISCOUNTS_KEY, []);
}
export function saveDiscounts(list: DiscountCode[]) {
  write(DISCOUNTS_KEY, list);
}

export function getDiscountRedemptions(): DiscountRedemption[] {
  return read<DiscountRedemption[]>(REDEMPTIONS_KEY, []);
}
export function saveDiscountRedemptions(list: DiscountRedemption[]) {
  write(REDEMPTIONS_KEY, list);
}
export function getRedemptionsForCode(code: string): DiscountRedemption[] {
  return getDiscountRedemptions()
    .filter((r) => r.code.toUpperCase() === code.toUpperCase())
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getLibrary(): LibraryImage[] {
  return read<LibraryImage[]>(LIBRARY_KEY, []);
}
export function saveLibrary(list: LibraryImage[]) {
  write(LIBRARY_KEY, list);
}
export function getLibraryImage(id: string): LibraryImage | undefined {
  return getLibrary().find((x) => x.id === id);
}

const DEFAULT_CONTACT: ContactSettings = {
  telegram: { link: "", imageId: "" },
  whatsapp: { link: "", imageId: "" },
  instagram: { link: "", imageId: "" },
  rubika: { link: "", imageId: "" },
  phones: [],
};

const DEFAULT_ABOUT: AboutSettings = {
  mainText: "",
  whyUs: [
    { imageId: "", text: "" },
    { imageId: "", text: "" },
    { imageId: "", text: "" },
  ],
  faq: [],
};

export const GLASS_GROUPS = ["شفاف", "مات", "UV", "پرایوسی", "سرامیکی", "نانو"] as const;

const DEFAULT_SETTINGS: SiteSettings = {
  logoImageId: "",
  banners: [],
  card: "6037-7015-0245-3282",
  iban: "IR201160000000000226953672",
  contact: DEFAULT_CONTACT,
  about: DEFAULT_ABOUT,
  groups: [...GLASS_GROUPS],
  newModelsRows: [],
  newModelsHeading: "مشابه و به‌روزترین مدل‌های گلس را از ما بخواهید",
  newModelsUpdatedAt: "",
};

// Migrate old NewModelsRow shape {group, enabled, models:[3]} → {id, groups[], models[]}
function migrateRows(rows: any[]): NewModelsRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r, i): NewModelsRow | null => {
      if (!r) return null;
      if (Array.isArray(r.groups) && Array.isArray(r.models)) {
        return { id: r.id || "row_" + i, groups: r.groups, models: r.models };
      }
      if (r.enabled && r.group) {
        return {
          id: "row_" + i,
          groups: [r.group],
          models: (r.models || []).filter((m: string) => m && m.trim()),
        };
      }
      return null;
    })
    .filter(Boolean) as NewModelsRow[];
}

export function getSettings(): SiteSettings {
  const stored = read<Partial<SiteSettings>>(SETTINGS_KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    contact: { ...DEFAULT_CONTACT, ...(stored.contact || {}) },
    about: { ...DEFAULT_ABOUT, ...(stored.about || {}) },
    groups: stored.groups && stored.groups.length > 0 ? stored.groups : [...GLASS_GROUPS],
    banners: stored.banners || [],
    newModelsRows: migrateRows(stored.newModelsRows as any),
    newModelsHeading: stored.newModelsHeading || DEFAULT_SETTINGS.newModelsHeading,
    newModelsUpdatedAt: stored.newModelsUpdatedAt || "",
    productOrder: stored.productOrder || [],
    productHidden: stored.productHidden || [],
  };
}

/**
 * مرتب‌سازی فهرست id محصولات سایت بر اساس تنظیمات ترتیب.
 * id هایی که در productOrder نباشند به انتها اضافه می‌شوند تا محصولات جدید گم نشوند.
 */
export function applyProductOrder(allIds: string[], order: string[] = []): string[] {
  const known = new Set(allIds);
  const ordered = order.filter((id) => known.has(id));
  const rest = allIds.filter((id) => !ordered.includes(id));
  return [...ordered, ...rest];
}

export function saveSettings(s: SiteSettings) {
  write(SETTINGS_KEY, s);
}

export const ADMIN_PHONE = "09352703505";
export const ADMIN_PASSWORD = "5300";

export const MODEL_CATEGORIES: { id: ModelEntry["category"]; label: string }[] = [
  { id: "iphone", label: "ایفون" },
  { id: "samsung_xiaomi", label: "سامسونگ و شیائومی" },
  { id: "curved", label: "گلس خمیده" },
];
