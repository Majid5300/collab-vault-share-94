export type GlassModel = { name: string; inStock: boolean };
export type GlassBrand = { id: "apple" | "android"; label: string; models: GlassModel[] };
export type GlassType = {
  id: string;
  label: string;
  price: number;
  hue: string;
  desc: string;
  brands: GlassBrand[];
};

export const GLASS_TYPES: GlassType[] = [
  {
    id: "clear",
    label: "شفاف",
    price: 55000,
    hue: "from-sky-500/40 to-indigo-500/40",
    desc: "گلس شفاف با سختی ۹H و چسبندگی کامل به صفحه.",
    brands: [
      {
        id: "apple",
        label: "اپل",
        models: [
          { name: "iPhone 15 Pro Max", inStock: true },
          { name: "iPhone 15 Pro", inStock: true },
          { name: "iPhone 15", inStock: true },
          { name: "iPhone 14 Pro Max", inStock: false },
          { name: "iPhone 14", inStock: true },
          { name: "iPhone 13 / 13 Pro", inStock: true },
        ],
      },
      {
        id: "android",
        label: "سامسونگ / شیائومی",
        models: [
          { name: "Samsung Galaxy S24 Ultra", inStock: true },
          { name: "Samsung Galaxy A15 / A16 / A25", inStock: true },
          { name: "Samsung Galaxy Note 8 Pro", inStock: false },
          { name: "Xiaomi Redmi Note 13 Pro Plus 5G", inStock: true },
          { name: "Xiaomi Poco X6 / X3 / X3 Pro", inStock: true },
          { name: "Xiaomi Redmi 13C / Poco C65", inStock: false },
        ],
      },
    ],
  },
  {
    id: "matte",
    label: "مات",
    price: 65000,
    hue: "from-slate-500/40 to-zinc-600/40",
    desc: "گلس مات ضد اثر انگشت با کیفیت بالا.",
    brands: [
      {
        id: "apple",
        label: "اپل",
        models: [
          { name: "iPhone 15 Pro Max", inStock: true },
          { name: "iPhone 15", inStock: true },
          { name: "iPhone 14 Pro", inStock: false },
          { name: "iPhone 13", inStock: true },
        ],
      },
      {
        id: "android",
        label: "سامسونگ / شیائومی",
        models: [
          { name: "Samsung Galaxy S24", inStock: true },
          { name: "Samsung Galaxy A54", inStock: true },
          { name: "Xiaomi Redmi Note 13", inStock: true },
          { name: "Xiaomi Poco X6", inStock: false },
        ],
      },
    ],
  },
  {
    id: "uv",
    label: "UV",
    price: 85000,
    hue: "from-violet-500/40 to-blue-500/40",
    desc: "گلس UV با چسب مایع و پوشش کامل صفحات منحنی.",
    brands: [
      {
        id: "apple",
        label: "اپل",
        models: [
          { name: "iPhone 15 Pro Max", inStock: true },
          { name: "iPhone 14 Pro Max", inStock: true },
        ],
      },
      {
        id: "android",
        label: "سامسونگ / شیائومی",
        models: [
          { name: "Samsung Galaxy S24 Ultra", inStock: true },
          { name: "Samsung Galaxy S23 Ultra", inStock: true },
          { name: "Samsung Galaxy Note 20 Ultra", inStock: false },
        ],
      },
    ],
  },
  {
    id: "privacy",
    label: "پرایوسی",
    price: 75000,
    hue: "from-purple-500/40 to-fuchsia-500/40",
    desc: "گلس پرایوسی برای حفاظت از حریم شخصی.",
    brands: [
      {
        id: "apple",
        label: "اپل",
        models: [
          { name: "iPhone 15 Pro Max", inStock: true },
          { name: "iPhone 15", inStock: true },
          { name: "iPhone 14", inStock: true },
          { name: "iPhone 13", inStock: false },
        ],
      },
      {
        id: "android",
        label: "سامسونگ / شیائومی",
        models: [
          { name: "Samsung Galaxy S24", inStock: true },
          { name: "Samsung Galaxy A54", inStock: false },
        ],
      },
    ],
  },
  {
    id: "ceramic",
    label: "سرامیکی",
    price: 90000,
    hue: "from-amber-500/40 to-orange-500/40",
    desc: "گلس سرامیکی منعطف و مقاوم در برابر شکستگی.",
    brands: [
      {
        id: "apple",
        label: "اپل",
        models: [
          { name: "iPhone 15 Pro Max", inStock: true },
          { name: "iPhone 14 Pro", inStock: true },
          { name: "iPhone 13", inStock: false },
        ],
      },
      {
        id: "android",
        label: "سامسونگ / شیائومی",
        models: [
          { name: "Samsung Galaxy S24 Ultra", inStock: true },
          { name: "Xiaomi Redmi Note 13", inStock: true },
        ],
      },
    ],
  },
  {
    id: "nano",
    label: "نانو",
    price: 70000,
    hue: "from-emerald-500/40 to-cyan-500/40",
    desc: "محافظ نانو منعطف با چسبندگی عالی.",
    brands: [
      {
        id: "apple",
        label: "اپل",
        models: [
          { name: "iPhone 15", inStock: true },
          { name: "iPhone 14", inStock: true },
        ],
      },
      {
        id: "android",
        label: "سامسونگ / شیائومی",
        models: [
          { name: "Samsung Galaxy A15 / A25", inStock: true },
          { name: "Xiaomi Redmi Note 13 Pro", inStock: true },
          { name: "Honor X9", inStock: false },
        ],
      },
    ],
  },
];

export function getGlassType(id: string | undefined | null): GlassType {
  return GLASS_TYPES.find((t) => t.id === id) ?? GLASS_TYPES[0];
}

export function findSimilarTypes(currentId: string, n = 2): GlassType[] {
  const cur = getGlassType(currentId);
  return GLASS_TYPES.filter((t) => t.id !== cur.id)
    .map((t) => ({ t, d: Math.abs(t.price - cur.price) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.t);
}
