"use client";

import { useEffect, useState } from "react";
import {
  CURRENT_EVENT,
  getActiveEvent,
  readPool,
  isEventLocked,
  readManifest,
} from "./lib/events";

export default function HomePage() {
  const [event, setEvent] = useState(CURRENT_EVENT);
  const [locked, setLocked] = useState(false);
  const [manifestCount, setManifestCount] = useState(0);
  const [poolRemaining, setPoolRemaining] = useState(0);

  useEffect(() => {
    const ev = getActiveEvent();
    setEvent(ev);

    setLocked(isEventLocked());
    setManifestCount(readManifest().length);
    setPoolRemaining(readPool().length);
  }, []);

  const accent = event.accent;
  const soldOut = poolRemaining <= 0;

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white pb-28">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="text-sm font-semibold tracking-wide">CAPSULE STAGE — VERCEL TEST</div>
        <div className="flex items-center gap-4">
          <a className="text-sm text-white/85 hover:text-white transition" href="/wins">
            My Wins
          </a>
          <a className="text-sm text-white/85 hover:text-white transition" href="/admin">
            Admin
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 min-h-[640px]">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: "url('/capsule-bg.jpg')" }}
          />
          {/* Overlays for readability */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/80" />
          <div
            className="absolute -left-24 top-24 h-40 w-40 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: accent }}
          />

          <div className="relative z-10 flex h-full flex-col justify-center px-6 py-12 sm:px-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs tracking-[0.18em] uppercase">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
              Live Capsule Event
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
              {event.hero.titleTop}
              <span className="block text-white/90">{event.hero.titleBottom}</span>
            </h1>

            <p className="mt-4 text-sm text-white/75">{event.hero.partner}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/85">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                {locked ? "Vault Verified" : "Unverified (Unlock in Admin)"}
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/70">
                Manifest: <span className="text-white/85 font-semibold">{manifestCount}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/70">
                Remaining: <span className="text-white/85 font-semibold">{poolRemaining}</span>
              </div>
            </div>

            <div className="mt-8">
              <a
                href={soldOut ? "/archive" : "/pull"}
                className="w-full sm:w-auto rounded-2xl px-8 py-4 text-base font-semibold uppercase tracking-wide transition active:scale-[0.99] inline-flex items-center justify-center"
                style={{ backgroundColor: soldOut ? "#222" : accent }}
              >
                {soldOut ? "Sold Out" : "Pull a Capsule"}
              </a>

              <div className="mt-5">
                <div className="text-sm font-semibold tracking-wide">
                  {poolRemaining} CAPSULES REMAINING
                </div>
                <div className="mt-1 text-xs tracking-[0.16em] uppercase text-white/70">
                  Ends when sold out
                </div>
              </div>
            </div>

            <div className="mt-10 max-w-xl rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs tracking-[0.16em] uppercase text-white/80">
              {event.rules.fairness}
              <div className="mt-1 text-white/70">{event.rules.shippingNote}</div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs tracking-[0.16em] uppercase text-white/70">
                  Next capsule event
                </div>
                <div className="mt-2 text-lg font-semibold">Reveals in 6 days</div>
                <button className="mt-3 text-sm text-white/80 underline underline-offset-4 hover:text-white">
                  Notify me
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs tracking-[0.16em] uppercase text-white/70">
                  Past events
                </div>
                <div className="mt-2 text-sm text-white/80">
                  Museum wall of sold-out drops. Builds trust for sponsors.
                </div>
                <a
                  href="/archive"
                  className="mt-3 inline-block text-sm text-white/80 underline underline-offset-4 hover:text-white"
                >
                  View archive
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mobile bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div>
            <div className="text-xs text-white/70">Per capsule</div>
            <div className="text-base font-semibold">${event.pricing.price.toFixed(2)}</div>
          </div>

          <a
            href={soldOut ? "/archive" : "/pull"}
            className="rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide inline-flex items-center justify-center"
            style={{ backgroundColor: soldOut ? "#222" : accent }}
          >
            {soldOut ? "Sold Out" : "Pull"}
          </a>
        </div>
      </div>
    </main>
  );
}
