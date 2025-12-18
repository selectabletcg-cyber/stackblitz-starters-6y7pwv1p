"use client";

import { useEffect, useMemo, useState } from "react";
import { CURRENT_EVENT, getActiveEvent, isEventLocked } from "../lib/events";

type Rarity = "DIGITAL" | "RARE" | "SUPER RARE" | "ULTRA RARE";

type StoredWin = {
  id: string;
  ts: number;
  rarity: Rarity;
  title: string;
  subtitle: string;
  event: string;
  type: "DIGITAL" | "PHYSICAL";
  status: "Reserved" | "Delivered";
};

const WINS_KEY = "capsule_wins_v1";

function readWins(): StoredWin[] {
  try {
    const raw = localStorage.getItem(WINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWins(wins: StoredWin[]) {
  localStorage.setItem(WINS_KEY, JSON.stringify(wins));
}

export default function WinsPage() {
  const [event, setEvent] = useState(CURRENT_EVENT);
  const [locked, setLocked] = useState(false);
  const [wins, setWins] = useState<StoredWin[]>([]);

  useEffect(() => {
    setEvent(getActiveEvent());
    setLocked(isEventLocked());
    setWins(readWins());
  }, []);

  const accent = event.accent;

  const totals = useMemo(() => {
    const physical = wins.filter((w) => w.type === "PHYSICAL").length;
    const digital = wins.filter((w) => w.type === "DIGITAL").length;
    return { total: wins.length, physical, digital };
  }, [wins]);

  function clearWins() {
    writeWins([]);
    setWins([]);
  }

  const badgeStyle = (rarity: string) => {
    const base =
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs tracking-[0.18em] uppercase";
    if (rarity === "ULTRA RARE") return `${base} border-white/25 bg-black/45 text-white`;
    if (rarity === "SUPER RARE") return `${base} border-white/20 bg-black/40 text-white/90`;
    if (rarity === "RARE") return `${base} border-white/15 bg-black/35 text-white/85`;
    return `${base} border-white/15 bg-black/35 text-white/80`;
  };

  const statusPill = (status: string) => {
    const base = "rounded-full border px-3 py-1 text-xs tracking-[0.14em] uppercase";
    if (status === "Delivered") return `${base} border-white/15 bg-black/30 text-white/80`;
    return `${base} border-white/15 bg-black/35 text-white/85`;
  };

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white pb-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a
          href="/"
          className="text-sm font-semibold tracking-wide text-white/90 hover:text-white transition"
        >
          ← Back
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={clearWins}
            className="rounded-xl border border-white/12 bg-black/35 px-4 py-2 text-xs tracking-[0.16em] uppercase text-white/80 hover:text-white transition"
          >
            Clear
          </button>
          <div className="text-sm text-white/75">My Wins</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
          <div className="text-xs tracking-[0.18em] uppercase text-white/70">Collection</div>
          <h1 className="mt-3 text-3xl font-extrabold leading-[0.95] tracking-tight sm:text-4xl">
            Your Wins
            <span className="block text-white/80">Reserved & delivered rewards</span>
          </h1>

          {/* Optional: show Vault Verified context (doesn't change layout) */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/85">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
              {locked ? "Vault Verified" : "Unverified (Unlock in Admin)"}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="text-xs tracking-[0.16em] uppercase text-white/65">Total items</div>
              <div className="mt-1 text-2xl font-semibold">{totals.total}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="text-xs tracking-[0.16em] uppercase text-white/65">Physical</div>
              <div className="mt-1 text-2xl font-semibold">{totals.physical}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="text-xs tracking-[0.16em] uppercase text-white/65">Digital</div>
              <div className="mt-1 text-2xl font-semibold">{totals.digital}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs tracking-[0.16em] uppercase text-white/80">
            PHYSICAL PRIZES SHIP AFTER EVENT · STATUS UPDATES APPEAR HERE
            <div className="mt-1 text-white/65 normal-case tracking-normal">
              Address collection starts when the event ends. You’ll be notified.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {wins.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-white/80">
              No wins yet. Go to{" "}
              <a className="underline" href="/pull">
                /pull
              </a>{" "}
              and open a capsule.
            </div>
          ) : (
            wins.map((w) => (
              <div key={w.id} className="rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={badgeStyle(w.rarity)}>
                      <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
                      {w.rarity}
                    </div>
                    <div className={statusPill(w.status)}>{w.status}</div>
                  </div>

                  <div className="text-xs tracking-[0.16em] uppercase text-white/60">
                    Event · {w.event}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="text-lg font-semibold">{w.title}</div>
                    <div className="mt-1 text-sm text-white/75">{w.subtitle}</div>
                  </div>

                  <button
                    className="w-full sm:w-auto rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-wide transition active:scale-[0.99]"
                    style={{ backgroundColor: accent }}
                  >
                    View Details
                  </button>
                </div>

                {w.type === "PHYSICAL" && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/85">
                    ✅ Reserved for you
                    <div className="mt-1 text-xs text-white/60">
                      Shipping begins after the event ends. Tracking will appear here.
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
