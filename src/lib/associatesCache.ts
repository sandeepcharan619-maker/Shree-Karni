import { AssociateItem } from "@/components/AssociatesManager";

export const ASSOCIATES_CACHE_KEY = "shreekarni_created_associates_cache_v1";
export const DELETED_ASSOCIATES_KEY = "shreekarni_deleted_associates_set_v1";

export function getDeletedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_ASSOCIATES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function addToDeletedSet(id?: string | null, memberId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const set = getDeletedSet();
    if (id) set.add(id.toUpperCase());
    if (memberId) set.add(memberId.toUpperCase());
    localStorage.setItem(DELETED_ASSOCIATES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function mergeWithLocalCache(serverList: AssociateItem[]): AssociateItem[] {
  if (typeof window === "undefined") return serverList;
  try {
    const deletedSet = getDeletedSet();
    const raw = localStorage.getItem(ASSOCIATES_CACHE_KEY);
    const cached: AssociateItem[] = raw ? JSON.parse(raw) : [];

    const map = new Map<string, AssociateItem>();

    // 1. Add server list (filtering out anything marked deleted by admin)
    if (Array.isArray(serverList)) {
      serverList.forEach((item) => {
        if (!item) return;
        const key = (item.memberId || item.id || "").toUpperCase();
        if (key && !deletedSet.has(key) && !deletedSet.has((item.id || "").toUpperCase())) {
          map.set(key, item);
        }
      });
    }

    // 2. Add cached items that might have been wiped by Vercel serverless /tmp resets
    if (Array.isArray(cached)) {
      cached.forEach((item) => {
        if (!item) return;
        const key = (item.memberId || item.id || "").toUpperCase();
        if (key && !deletedSet.has(key) && !deletedSet.has((item.id || "").toUpperCase())) {
          if (!map.has(key)) {
            map.set(key, item);
          }
        }
      });
    }

    return Array.from(map.values());
  } catch {
    return serverList;
  }
}

export function saveToLocalCache(newAssoc: AssociateItem | any) {
  if (typeof window === "undefined" || !newAssoc) return;
  try {
    const raw = localStorage.getItem(ASSOCIATES_CACHE_KEY);
    const cached: AssociateItem[] = raw ? JSON.parse(raw) : [];
    const cleanKey = (newAssoc.memberId || newAssoc.id || "").toUpperCase();

    // If it was in deleted set previously, remove it from deleted set
    const deletedSet = getDeletedSet();
    if (deletedSet.has(cleanKey) || deletedSet.has((newAssoc.id || "").toUpperCase())) {
      deletedSet.delete(cleanKey);
      if (newAssoc.id) deletedSet.delete(newAssoc.id.toUpperCase());
      localStorage.setItem(DELETED_ASSOCIATES_KEY, JSON.stringify(Array.from(deletedSet)));
    }

    const updated = [
      newAssoc,
      ...cached.filter(
        (a) => (a.memberId || a.id || "").toUpperCase() !== cleanKey
      ),
    ];
    localStorage.setItem(ASSOCIATES_CACHE_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeFromLocalCache(id: string, memberId: string) {
  if (typeof window === "undefined") return;
  try {
    addToDeletedSet(id, memberId);
    const raw = localStorage.getItem(ASSOCIATES_CACHE_KEY);
    if (!raw) return;
    const cached: AssociateItem[] = JSON.parse(raw);
    const cleanMemberId = (memberId || "").toUpperCase();
    const cleanId = (id || "").toUpperCase();
    const updated = cached.filter(
      (a) =>
        (a.id || "").toUpperCase() !== cleanId &&
        (a.memberId || "").toUpperCase() !== cleanMemberId
    );
    localStorage.setItem(ASSOCIATES_CACHE_KEY, JSON.stringify(updated));
  } catch {}
}

export function updateInLocalCache(id: string, updates: Partial<AssociateItem>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ASSOCIATES_CACHE_KEY);
    if (!raw) return;
    const cached: AssociateItem[] = JSON.parse(raw);
    const updated = cached.map((a) => (a.id === id ? { ...a, ...updates } : a));
    localStorage.setItem(ASSOCIATES_CACHE_KEY, JSON.stringify(updated));
  } catch {}
}
