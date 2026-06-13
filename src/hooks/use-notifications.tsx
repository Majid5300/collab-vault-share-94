import { useEffect, useState } from "react";
import {
  getNotifications,
  getUserNotifications,
  type AppNotification,
} from "@/lib/notifications";

/** Returns notifications for a given phone, or all when phone omitted. Live-updates. */
export function useNotifications(phone?: string): AppNotification[] {
  const [list, setList] = useState<AppNotification[]>([]);
  useEffect(() => {
    const refresh = () =>
      setList(phone ? getUserNotifications(phone) : getNotifications());
    refresh();
    window.addEventListener("notifications-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("notifications-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [phone]);
  return list;
}
