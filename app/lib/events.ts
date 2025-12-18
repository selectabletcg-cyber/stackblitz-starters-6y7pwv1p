export const CURRENT_EVENT = {
  id: "pastel-goddess-drop",
  name: "PASTEL GODDESS DROP",
  hero: {
    titleTop: "ANIME VAULT CAPSULE",
    titleBottom: "FEATURED GODDESS DROP",
    partner: "Hosted with Creator / Brand",
  },
  pricing: {
    price: 4.99,
    maxPerUser: 20,
  },
  inventory: {
    total: 500,
    remaining: 214,
  },
  accent: "#F5A3C7",
  rules: {
    shippingNote: "Physical prizes ship after the event ends",
    fairness: "Fixed inventory · Fair capsule rules · Pull limits apply",
  },
} as const;

const ADMIN_EVENT_KEY = "capsule_admin_event_v1";

export function getActiveEvent() {
  if (typeof window === "undefined") return CURRENT_EVENT;

  try {
    const raw = localStorage.getItem(ADMIN_EVENT_KEY);
    if (!raw) return CURRENT_EVENT;
    const parsed = JSON.parse(raw);
    // If parsed is not an object, fall back
    if (!parsed || typeof parsed !== "object") return CURRENT_EVENT;
    return parsed;
  } catch {
    return CURRENT_EVENT;
  }
}
const POOL_KEY = "capsule_pool_v1";

export type PoolItem = {
  id: string;
  rarity: "DIGITAL" | "RARE" | "SUPER RARE" | "ULTRA RARE";
  title: string;
  subtitle: string;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generatePool(total: number) {
  // Simple default distribution (you can tune later)
  const ultra = Math.max(1, Math.floor(total * 0.006));     // ~0.6%
  const superRare = Math.max(2, Math.floor(total * 0.03));  // ~3%
  const rare = Math.max(10, Math.floor(total * 0.10));      // ~10%
  const digital = Math.max(0, total - ultra - superRare - rare);

  const pool: PoolItem[] = [];

  for (let i = 0; i < ultra; i++) {
    pool.push({
      id: `UR-${i}-${Date.now()}`,
      rarity: "ULTRA RARE",
      title: "Exclusive Figure Variant",
      subtitle: "Reserved for you · Ships after event ends",
    });
  }
  for (let i = 0; i < superRare; i++) {
    pool.push({
      id: `SR-${i}-${Date.now()}`,
      rarity: "SUPER RARE",
      title: "Premium Merch Bundle",
      subtitle: "Reserved for you · Ships after event ends",
    });
  }
  for (let i = 0; i < rare; i++) {
    pool.push({
      id: `R-${i}-${Date.now()}`,
      rarity: "RARE",
      title: "Poster + Collectible Pack",
      subtitle: "Reserved for you · Ships after event ends",
    });
  }
  for (let i = 0; i < digital; i++) {
    pool.push({
      id: `D-${i}-${Date.now()}`,
      rarity: "DIGITAL",
      title: "Digital Capsule Reward",
      subtitle: "Added to your collection instantly",
    });
  }

  const shuffled = shuffle(pool);
  localStorage.setItem(POOL_KEY, JSON.stringify(shuffled));
  return shuffled;
}

export function readPool(): PoolItem[] {
  try {
    const raw = localStorage.getItem(POOL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function popFromPool(n: number) {
  const pool = readPool();
  if (pool.length === 0) return { taken: [], remaining: 0 };

  const taken = pool.slice(0, n);
  const rest = pool.slice(n);

  localStorage.setItem(POOL_KEY, JSON.stringify(rest));
  return { taken, remaining: rest.length };
}

export function clearPool() {
  localStorage.removeItem(POOL_KEY);
}
const LOCK_KEY = "capsule_event_locked_v1";
const MANIFEST_KEY = "capsule_manifest_v1";

export type ManifestItem = {
  id: string;
  name: string;
  type: "DIGITAL" | "PHYSICAL";
  rarity: "DIGITAL" | "RARE" | "SUPER RARE" | "ULTRA RARE";
  note?: string;
};

export function isEventLocked() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCK_KEY) === "1";
}

export function setEventLocked(next: boolean) {
  localStorage.setItem(LOCK_KEY, next ? "1" : "0");
}

export function readManifest(): ManifestItem[] {
  try {
    const raw = localStorage.getItem(MANIFEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeManifest(items: ManifestItem[]) {
  localStorage.setItem(MANIFEST_KEY, JSON.stringify(items));
}
