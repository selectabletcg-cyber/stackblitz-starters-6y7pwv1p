"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CURRENT_EVENT,
  getActiveEvent,
  popFromPool,
  readPool,
  isEventLocked,
  readManifest,
} from "../lib/events";

type Rarity = "DIGITAL" | "RARE" | "SUPER RARE" | "ULTRA RARE";
type Result = { rarity: Rarity; title: string; subtitle: string };

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

export default function PullPage() {
  const [event, setEvent] = useState(CURRENT_EVENT);

  const [poolRemaining, setPoolRemaining] = useState<number>(0);
  const [soldOut, setSoldOut] = useState<boolean>(false);
  const [locked, setLocked] = useState(false);
  const [manifestCount, setManifestCount] = useState(0);

  const [step, setStep] = useState<"ready" | "confirm" | "opening" | "result">("ready");
  const [count, setCount] = useState<number>(1);
  const [result, setResult] = useState<Result | null>(null);

  // ✅ This replaces the undefined `win`
  const [lastWin, setLastWin] = useState<StoredWin | null>(null);

  useEffect(() => {
    const ev = getActiveEvent();
    setEvent(ev);

    const rem = readPool().length;
    setPoolRemaining(rem);
    setSoldOut(rem <= 0);

    setLocked(isEventLocked());
    setManifestCount(readManifest().length);
  }, []);

  const accent = event.accent;
  const eventName = event.name;

  const price = event.pricing.price;
  const maxPerUser = event.pricing.maxPerUser;

  const total = useMemo(() => (price * count).toFixed(2), [price, count]);

  async function startPull() {
    if (soldOut) return;

    setStep("opening");
    await new Promise((res) => setTimeout(res, 850));

    const currentPoolLen = readPool().length;
    if (currentPoolLen <= 0) {
      setPoolRemaining(0);
      setSoldOut(true);
      setStep("ready");
      return;
    }

    const { taken, remaining } = popFromPool(count);

    if (!taken || taken.length === 0) {
      setPoolRemaining(0);
      setSoldOut(true);
      setStep("ready");
      return;
    }

    setPoolRemaining(remaining);
    if (remaining <= 0) setSoldOut(true);

    const results: Result[] = taken.map((t) => ({
      rarity: t.rarity,
      title: t.title,
      subtitle: t.subtitle,
    }));

    const rank = (x: Rarity) =>
      x === "ULTRA RARE" ? 4 : x === "SUPER RARE" ? 3 : x === "RARE" ? 2 : 1;

    const best = results.reduce(
      (a, b) => (rank(b.rarity) > rank(a.rarity) ? b : a),
      results[0]
    );

    await new Promise((res) => setTimeout(res, 1400));

    const existing = readWins();
    const newWins: StoredWin[] = results.map((r) => {
      const isPhysical = r.rarity !== "DIGITAL";
      return {
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        ts: Date.now(),
        rarity: r.rarity,
        title: r.title,
        subtitle: r.subtitle,
        event: eventName,
        type: isPhysical ? "PHYSICAL" : "DIGITAL",
        status: isPhysical ? "Reserved" : "Delivered",
      };
    });

    writeWins([...newWins, ...existing]);

    // ✅ pick the StoredWin matching the “best” result so we can show PHYSICAL/DIGITAL text safely
    const bestWin =
      newWins.find(
        (w) => w.rarity === best.rarity && w.title === best.title && w.subtitle === best.subtitle
      ) ?? newWins[0];

    setLastWin(bestWin);
    setResult(best);
    setStep("result");
  }

  function resetToReady() {
    setResult(null);
    setLastWin(null);
    setStep("ready");
  }

  const disableControls = soldOut || step !== "ready";

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white pb-28">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a
          href="/"
          className="text-sm font-semibold tracking-wide text-white/90 hover:text-white transition"
        >
          ← Back
        </a>
        <a href="/wins" className="text-sm text-white/85 hover:text-white transition">
          My Wins
        </a>
      </header>

      <section className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/70" />
            <div className="absolute inset-0 opacity-80 [background:radial-gradient(900px_circle_at_30%_20%,rgba(255,255,255,0.10),transparent_55%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/70" />
            <div
              className="absolute -left-24 top-20 h-44 w-44 rounded-full blur-3xl opacity-35"
              style={{ backgroundColor: accent }}
            />
          </div>

          <div className="relative px-6 py-10 sm:px-10 sm:py-14">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs tracking-[0.18em] uppercase text-white/70">
                  Capsule Pull
                </div>
                <h1 className="mt-3 text-3xl font-extrabold leading-[0.95] tracking-tight sm:text-4xl">
                  Open the Capsule
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/85">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                      {locked ? "Vault Verified" : "Unverified (Unlock in Admin)"}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/70">
                      Manifest:{" "}
                      <span className="text-white/85 font-semibold">{manifestCount}</span> items
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/70">
                      Remaining:{" "}
                      <span className="text-white/85 font-semibold">{poolRemaining}</span>
                    </div>
                  </div>

                  <span className="block text-white/80">Reveal your reward</span>
                </h1>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-right">
                <div className="text-xs tracking-[0.16em] uppercase text-white/60">Remaining</div>
                <div className="text-lg font-semibold">{poolRemaining}</div>
              </div>
            </div>

            {soldOut && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs tracking-[0.16em] uppercase text-white/80">
                SOLD OUT · WAIT FOR THE NEXT CAPSULE DROP
                <div className="mt-1 text-white/60 normal-case tracking-normal">
                  The pool is finite. When it’s empty, the event is sold out.
                </div>
              </div>
            )}

            <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-center">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                <div className="relative mx-auto aspect-[4/5] max-w-[340px] overflow-hidden rounded-[44px] border border-white/10 bg-black/40">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/70" />
                  <div className="absolute inset-0 opacity-70 [background:radial-gradient(500px_circle_at_50%_25%,rgba(255,255,255,0.16),transparent_60%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={[
                        "h-32 w-32 rounded-full border border-white/15 bg-white/5",
                        step === "opening" ? "animate-[pulse_1.2s_ease-in-out_infinite]" : "",
                      ].join(" ")}
                      style={{
                        boxShadow:
                          step === "opening" ? `0 0 70px 8px rgba(245,163,199,0.22)` : "none",
                      }}
                    />
                  </div>
                  {step === "opening" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-1 w-44 rounded-full bg-white/40 blur-[0.5px]" />
                    </div>
                  )}
                </div>

                <div className="mt-5 text-center text-xs tracking-[0.16em] uppercase text-white/70">
                  Fixed inventory · Fair capsule rules
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                  <div className="text-xs tracking-[0.18em] uppercase text-white/70">Pull amount</div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white transition disabled:opacity-40"
                      onClick={() => setCount((c) => Math.max(1, c - 1))}
                      disabled={disableControls}
                    >
                      −
                    </button>

                    <div className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center">
                      <div className="text-xs tracking-[0.16em] uppercase text-white/60">Capsules</div>
                      <div className="text-lg font-semibold">{count}</div>
                    </div>

                    <button
                      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white transition disabled:opacity-40"
                      onClick={() => setCount((c) => Math.min(maxPerUser, c + 1))}
                      disabled={disableControls}
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-white/65">Per capsule</div>
                      <div className="text-base font-semibold">${price.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/65">Total</div>
                      <div className="text-base font-semibold">${total}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-white/60">
                    Max <span className="text-white/80 font-semibold">{maxPerUser}</span> capsules per user
                    (fairness cap).
                  </div>
                </div>

                {step === "ready" && (
                  <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                    <button
                      className="w-full rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-wide transition active:scale-[0.99] disabled:opacity-40"
                      style={{ backgroundColor: accent }}
                      onClick={() => setStep("confirm")}
                      disabled={soldOut}
                    >
                      {soldOut ? "Sold Out" : "Confirm Pull"}
                    </button>

                    <div className="mt-3 text-xs tracking-[0.16em] uppercase text-white/65">
                      {soldOut
                        ? "Event sold out · wait for the next drop"
                        : "Capsules are final · Results are instant"}
                    </div>
                  </div>
                )}

                {step === "confirm" && (
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                    <div className="text-xs tracking-[0.18em] uppercase text-white/70">Confirm</div>
                    <div className="mt-2 text-sm text-white/85">
                      You’re about to pull <span className="font-semibold">{count}</span> capsule
                      {count > 1 ? "s" : ""}. Pulls are final.
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        className="flex-1 rounded-2xl border border-white/12 bg-black/35 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white transition"
                        onClick={() => setStep("ready")}
                      >
                        Cancel
                      </button>
                      <button
                        className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-wide transition active:scale-[0.99] disabled:opacity-40"
                        style={{ backgroundColor: accent }}
                        onClick={startPull}
                        disabled={soldOut}
                      >
                        {soldOut ? "Sold Out" : "Pull Now"}
                      </button>
                    </div>
                  </div>
                )}

                {step === "opening" && (
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                    <div className="text-xs tracking-[0.18em] uppercase text-white/70">Opening capsule…</div>
                    <div className="mt-2 text-sm text-white/80">Preparing reveal. No edits. No rerolls.</div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: accent }} />
                    </div>
                  </div>
                )}

                {step === "result" && result && (
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] tracking-[0.18em] uppercase text-white/80">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                      {locked ? "Vault Verified" : "Unverified"}
                      <span className="text-white/50">·</span>
                      {lastWin?.type === "PHYSICAL" ? "Ships After Event" : "Instant Digital"}
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/85">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                      {result.rarity}
                    </div>

                    <h2 className="mt-4 text-xl font-semibold">{result.title}</h2>
                    <p className="mt-2 text-sm text-white/80">{result.subtitle}</p>

                    <div className="mt-5 flex gap-3">
                      <button
                        className="flex-1 rounded-2xl border border-white/12 bg-black/35 px-4 py-3 text-sm font-semibold text-white/85 hover:text-white transition"
                        onClick={resetToReady}
                      >
                        Pull Again
                      </button>
                      <a
                        className="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition active:scale-[0.99]"
                        style={{ backgroundColor: accent }}
                        href="/wins"
                      >
                        View My Wins
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs tracking-[0.18em] uppercase text-white/70">Fairness</div>
                <div className="mt-2 text-sm text-white/80">Pull caps apply. Inventory is fixed before launch.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs tracking-[0.18em] uppercase text-white/70">Fulfillment</div>
                <div className="mt-2 text-sm text-white/80">Physical prizes ship after event ends. Digital is instant.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div>
            <div className="text-xs text-white/70">Total</div>
            <div className="text-base font-semibold">${total}</div>
          </div>

          <button
            className="rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide disabled:opacity-40"
            style={{ backgroundColor: accent }}
            onClick={() => setStep("confirm")}
            disabled={soldOut || step !== "ready"}
          >
            {soldOut ? "Sold Out" : "Pull"}
          </button>
        </div>
      </div>
    </main>
  );
}
