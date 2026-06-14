// Merge admin-defined AdminProduct overrides over the static GLASS_TYPES catalog.
// If an admin product's `id` matches a GlassType `id` we use its salePrice and name
// as overrides. Visual fields (hue, desc, brands) stay from GLASS_TYPES so the site
// keeps its consistent look.
import { useEffect, useState } from "react";
import { GLASS_TYPES, type GlassType } from "@/data/glass-types";
import { getAdminProducts } from "@/lib/admin-store";

export function getMergedGlassTypes(): GlassType[] {
  const overrides = new Map(getAdminProducts().map((p) => [p.id, p]));
  return GLASS_TYPES.map((t) => {
    const o = overrides.get(t.id);
    if (!o) return t;
    return {
      ...t,
      label: o.name?.trim() || t.label,
      price: typeof o.salePrice === "number" && o.salePrice > 0 ? o.salePrice : t.price,
    };
  });
}

export function getMergedGlassType(id: string): GlassType {
  return getMergedGlassTypes().find((t) => t.id === id) ?? GLASS_TYPES[0];
}

export function useMergedGlassTypes(): GlassType[] {
  const [list, setList] = useState<GlassType[]>(() => getMergedGlassTypes());
  useEffect(() => {
    const r = () => setList(getMergedGlassTypes());
    window.addEventListener("admin-updated", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("admin-updated", r);
      window.removeEventListener("storage", r);
    };
  }, []);
  return list;
}
