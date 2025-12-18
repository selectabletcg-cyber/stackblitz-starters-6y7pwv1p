"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CURRENT_EVENT,
  generatePool,
  readPool,
  clearPool,
  isEventLocked,
  setEventLocked,
  readManifest,
  writeManifest,
} from "../lib/events";

const ADMIN_EVENT_KEY = "capsule_admin_event_v1";
const ARCHIVE_KEY = "capsule_archive_v1";

/**
 * Makes CURRENT_EVENT editable:
 * - removes readonly
 * - widens string/number/boolean literals to string/number/boolean
 */
type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type DeepEditable<T> = T extends Primitive
  ? T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T
  : T extends readonly (infer U)[]
    ? DeepEditable<U>[]
    : T extends object
      ? { -readonly [K in keyof T]: DeepEditable<T[K]> }
      : T;

type AdminEvent = DeepEditable<typeof CURRENT_EVENT>;

type ArchiveItem = {
  id: string;
  ts: number;
  name: string;
  partner: string;
  accent: string;
  soldOut: boolean;
  capsuleTotal: number;
  manifestCount: number;
};

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function safeReadAdminEvent(): AdminEvent {
  try {
    const raw = localStorage.getItem(ADMIN_EVENT_KEY);
    if (!raw) return clone(CURRENT_EVENT) as AdminEvent;
    const parsed = JSON.parse(raw);
    return (parsed ?? clone(CURRENT_EVENT)) as AdminEvent;
  } catch {
    return clone(CURRENT_EVENT) as AdminEvent;
  }
}

function safeWriteAdminEvent(ev: AdminEvent) {
  localStorage.setItem(ADMIN_EVENT_KEY, JSON.stringify(ev));
}

function readArchive(): ArchiveItem[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArchive(items: ArchiveItem[]) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));
}

export default function AdminPage() {
  const [ev, setEv] = useState<AdminEvent>(() => clone(CURRENT_EVENT) as AdminEvent);
  const accent = ev.accent;

  const [poolRemaining, setPoolRemaining] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);

  // IMPORTANT: do not call readManifest() in useState init (hydration issues)
  const [manifest, setManifest] = useState<any[]>([]);

  const [archiveCount, setArchiveCount] = useState<number>(0);

  useEffect(() => {
    setEv(safeReadAdminEvent());

    try {
      setPoolRemaining(readPool().length);
    } catch {
      setPoolRemaining(0);
    }

    try {
      setLocked(isEventLocked());
    } catch {
      setLocked(false);
    }

    try {
      setManifest(readManifest());
    } catch {
      setManifest([]);
    }

    try {
      setArchiveCount(readArchive().length);
    } catch {
      setArchiveCount(0);
    }
  }, []);

  const canSave = useMemo(() => {
    return (
      ev.name.trim().length > 0 &&
      ev.hero.titleTop.trim().length > 0 &&
      ev.hero.titleBottom.trim().length > 0 &&
      ev.pricing.price > 0 &&
      ev.pricing.maxPerUser > 0 &&
      ev.inventory.total > 0 &&
      ev.inventory.remaining >= 0 &&
      ev.inventory.remaining <= ev.inventory.total
    );
  }, [ev]);

  function saveEvent() {
    if (!canSave) return;
    safeWriteAdminEvent(ev);
    alert("Saved! Refresh pages to see changes (colors/titles).");
  }

  function resetEvent() {
    localStorage.removeItem(ADMIN_EVENT_KEY);
    setEv(clone(CURRENT_EVENT) as AdminEvent);
    alert("Reset to defaults.");
  }

  function refreshPoolCount() {
    try {
      setPoolRemaining(readPool().length);
    } catch {
      setPoolRemaining(0);
    }
  }

  function handleGeneratePool() {
    generatePool(ev.inventory.total);
    refreshPoolCount();
    alert("Pool generated! Refresh /pull.");
  }

  function handleClearPool() {
    clearPool();
    setPoolRemaining(0);
    alert("Pool cleared.");
  }

  function toggleLock() {
    const next = !locked;
    setEventLocked(next);
    setLocked(next);
    alert(next ? "Event locked (Vault Verified)." : "Event unlocked.");
  }

  function saveManifestNow(nextManifest?: any[]) {
    const m = nextManifest ?? manifest;
    writeManifest(m);
    alert("Manifest saved.");
  }

  function addPrize() {
    if (locked) return;
    const next = [
      ...manifest,
      {
        id: `${Date.now()}-${Math.random()}`,
        name: "New Prize",
        type: "PHYSICAL",
        rarity: "RARE",
      },
    ];
    setManifest(next);
    writeManifest(next);
  }

  function removePrize(id: string) {
    if (locked) return;
    const next = manifest.filter((x) => x.id !== id);
    setManifest(next);
    writeManifest(next);
  }

  function closeEventToArchive() {
    if (!locked) {
      alert("Lock the event first (Vault Verified), then close it.");
      return;
    }

    const soldOutNow = readPool().length <= 0;
    const manifestNow = readManifest();

    const snapshot: ArchiveItem = {
      id: `${Date.now()}-${Math.random()}`,
      ts: Date.now(),
      name: ev.name,
      partner: ev.hero.partner,
      accent: ev.accent,
      soldOut: soldOutNow,
      capsuleTotal: ev.inventory.total,
      manifestCount: manifestNow.length,
    };

    const existing = readArchive();
    writeArchive([snapshot, ...existing]);
    setArchiveCount(existing.length + 1);

    clearPool();
    setPoolRemaining(0);

    alert("Event archived! Go to /archive to view it. Pool cleared for next drop.");
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white pb-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a
          href="/"
          className="text-sm font-semibold tracking-wide text-white/90 hover:text-white transition"
        >
          ← Back
        </a>
        <div className="text-sm text-white/75">Admin</div>
      </header>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
          <div className="text-xs tracking-[0.18em] uppercase text-white/70">
            Operator Console (v1)
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-[0.95] tracking-tight sm:text-4xl">
            Event Settings
            <span className="block text-white/80">Single source of truth (local)</span>
          </h1>

          {/* Vault Verified */}
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/35 p-5">
            <div className="text-xs tracking-[0.18em] uppercase text-white/70">
              Vault Verified
            </div>
            <div className="mt-2 text-sm text-white/80">
              Locking prevents edits during a live drop. Sponsors love this.
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={toggleLock}
                className="rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-wide"
                style={{ backgroundColor: locked ? "#222" : accent }}
              >
                {locked ? "Unlock Event" : "Lock Event"}
              </button>

              <div className="text-xs text-white/65">
                Status:{" "}
                <span className="text-white/85 font-semibold">
                  {locked ? "LOCKED (Vault Verified)" : "UNLOCKED"}
                </span>
              </div>

              <div className="text-xs text-white/60 sm:ml-auto">
                Pool remaining:{" "}
                <span className="text-white/85 font-semibold">{poolRemaining}</span>
              </div>
            </div>
          </div>

          {/* Close Event */}
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/35 p-5">
            <div className="text-xs tracking-[0.18em] uppercase text-white/70">
              Close Event (Archive Snapshot)
            </div>
            <div className="mt-2 text-sm text-white/80">
              Saves a sponsor-proof snapshot to{" "}
              <span className="text-white/90 font-semibold">/archive</span>. Recommended: lock first, then close.
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={closeEventToArchive}
                className="rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-wide"
                style={{ backgroundColor: accent }}
              >
                Close Event
              </button>

              <a
                href="/archive"
                className="rounded-2xl border border-white/12 bg-black/35 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/85 hover:text-white transition text-center"
              >
                View Archive ({archiveCount})
              </a>

              <div className="text-xs text-white/60 sm:ml-auto">
                Closing clears the pool for the next drop.
              </div>
            </div>
          </div>

          {/* Manifest */}
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/35 p-5">
            <div className="text-xs tracking-[0.18em] uppercase text-white/70">
              Event Manifest
            </div>
            <div className="mt-2 text-sm text-white/80">
              List what can be won. This is your “proof” for brands and users.
            </div>

            <div className="mt-4 space-y-3">
              {manifest.length === 0 && (
                <div className="text-sm text-white/60">
                  No manifest items yet. Add your first prize below.
                </div>
              )}

              {manifest.map((it, idx) => (
                <div key={it.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      disabled={locked}
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                      value={it.name}
                      onChange={(e) => {
                        const next = [...manifest];
                        next[idx] = { ...it, name: e.target.value };
                        setManifest(next);
                      }}
                      placeholder="Prize name"
                    />

                    <select
                      disabled={locked}
                      className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                      value={it.rarity}
                      onChange={(e) => {
                        const next = [...manifest];
                        next[idx] = { ...it, rarity: e.target.value as any };
                        setManifest(next);
                      }}
                    >
                      <option>DIGITAL</option>
                      <option>RARE</option>
                      <option>SUPER RARE</option>
                      <option>ULTRA RARE</option>
                    </select>

                    <select
                      disabled={locked}
                      className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                      value={it.type}
                      onChange={(e) => {
                        const next = [...manifest];
                        next[idx] = { ...it, type: e.target.value as any };
                        setManifest(next);
                      }}
                    >
                      <option>DIGITAL</option>
                      <option>PHYSICAL</option>
                    </select>

                    <button
                      disabled={locked}
                      onClick={() => removePrize(it.id)}
                      className="rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-sm font-semibold text-white/80 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                disabled={locked}
                onClick={addPrize}
                className="rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-wide disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                Add Prize
              </button>

              <button
                disabled={locked}
                onClick={() => saveManifestNow()}
                className="rounded-2xl border border-white/12 bg-black/35 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/85 disabled:opacity-40"
              >
                Save Manifest
              </button>

              <div className="text-xs text-white/60 sm:ml-auto">
                Manifest items:{" "}
                <span className="text-white/85 font-semibold">{manifest.length}</span>
              </div>
            </div>
          </div>

          {/* Capsule Pool */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/35 p-5">
            <div className="text-xs tracking-[0.18em] uppercase text-white/70">
              Capsule Pool
            </div>
            <div className="mt-2 text-sm text-white/80">
              Pool is finite. When it’s empty, the event is sold out.
            </div>

            <div className="mt-4 text-xs tracking-[0.16em] uppercase text-white/60">
              Current pool remaining:{" "}
              <span className="text-white/85 font-semibold">{poolRemaining}</span>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleGeneratePool}
                className="rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-wide"
                style={{ backgroundColor: accent }}
              >
                Generate Pool
              </button>

              <button
                onClick={handleClearPool}
                className="rounded-2xl border border-white/12 bg-black/35 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/85 hover:text-white transition"
              >
                Clear Pool
              </button>

              <div className="text-xs text-white/60 sm:ml-auto">
                Tip: Generate after setting{" "}
                <span className="text-white/80 font-semibold">Total capsules</span>.
              </div>
            </div>
          </div>

          {/* Event fields */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
              <div className="text-xs tracking-[0.18em] uppercase text-white/70">Basics</div>

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Event Name
              </label>
              <input
                disabled={locked}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.name}
                onChange={(e) => setEv({ ...ev, name: e.target.value })}
              />

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Partner
              </label>
              <input
                disabled={locked}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.hero.partner}
                onChange={(e) => setEv({ ...ev, hero: { ...ev.hero, partner: e.target.value } })}
              />

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Accent Color
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  disabled={locked}
                  className="h-12 w-16 rounded-xl border border-white/10 bg-black/40 disabled:opacity-50"
                  type="color"
                  value={ev.accent}
                  onChange={(e) => setEv({ ...ev, accent: e.target.value })}
                />
                <div className="text-sm text-white/75">{ev.accent}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
              <div className="text-xs tracking-[0.18em] uppercase text-white/70">Hero Copy</div>

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Title Top
              </label>
              <input
                disabled={locked}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.hero.titleTop}
                onChange={(e) => setEv({ ...ev, hero: { ...ev.hero, titleTop: e.target.value } })}
              />

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Title Bottom
              </label>
              <input
                disabled={locked}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.hero.titleBottom}
                onChange={(e) => setEv({ ...ev, hero: { ...ev.hero, titleBottom: e.target.value } })}
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
              <div className="text-xs tracking-[0.18em] uppercase text-white/70">Pricing & Caps</div>

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Price (USD)
              </label>
              <input
                disabled={locked}
                type="number"
                step="0.01"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.pricing.price}
                onChange={(e) =>
                  setEv({ ...ev, pricing: { ...ev.pricing, price: Number(e.target.value) } })
                }
              />

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Max pulls per user
              </label>
              <input
                disabled={locked}
                type="number"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.pricing.maxPerUser}
                onChange={(e) =>
                  setEv({ ...ev, pricing: { ...ev.pricing, maxPerUser: Number(e.target.value) } })
                }
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
              <div className="text-xs tracking-[0.18em] uppercase text-white/70">Inventory</div>

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Total capsules
              </label>
              <input
                disabled={locked}
                type="number"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.inventory.total}
                onChange={(e) =>
                  setEv({ ...ev, inventory: { ...ev.inventory, total: Number(e.target.value) } })
                }
              />

              <label className="mt-4 block text-xs tracking-[0.16em] uppercase text-white/60">
                Remaining capsules
              </label>
              <input
                disabled={locked}
                type="number"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                value={ev.inventory.remaining}
                onChange={(e) =>
                  setEv({
                    ...ev,
                    inventory: { ...ev.inventory, remaining: Number(e.target.value) },
                  })
                }
              />

              <div className="mt-4 text-xs text-white/60">Remaining must be between 0 and total.</div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs tracking-[0.16em] uppercase text-white/60">
              v1 saves to this browser only
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetEvent}
                className="rounded-2xl border border-white/12 bg-black/35 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/85 hover:text-white transition"
              >
                Reset
              </button>

              <button
                onClick={saveEvent}
                disabled={!canSave || locked}
                className="rounded-2xl px-6 py-3 text-sm font-semibold uppercase tracking-wide disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                Save
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80">
            After saving, refresh the homepage/pull/wins to see changes.
            {locked && (
              <div className="mt-1 text-xs text-white/60">Locked events disable editing (Vault Verified).</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
