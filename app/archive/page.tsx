"use client";

import { useEffect, useMemo, useState } from "react";
import { CURRENT_EVENT, getActiveEvent, isEventLocked, readManifest } from "../lib/events";

type SavedArchiveEvent = {
  id: string;
  ts: number;
  name: string;
  partner: string;
  accent: string;
  soldOut: boolean;
  capsuleTotal: number;
  manifestCount: number;
};

const ARCHIVE_KEY = "capsule_archive_v1";

function readArchive(): SavedArchiveEvent[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ArchivePage() {
  const [active, setActive] = useState(CURRENT_EVENT);
  const [locked, setLocked] = useState(false);
  const [manifestCount, setManifestCount] = useState(0);
  const [saved, setSaved] = useState<SavedArchiveEvent[]>([]);

  useEffect(() => {
    const ev = getActiveEvent();
    setActive(ev);
    setLocked(isEventLocked());
    setManifestCount(readManifest().length);
    setSaved(readArchive());
  }, []);

  const accent = active.accent;

  const fallbackPastEvents = useMemo(
    () => [
      {
        id: "drop-001",
        name: "Moonlight Idol Drop",
        partner: "Sponsored by Anime Partner",
        accent: "#F5A3C7",
        soldOut: true,
        dateLabel: "Nov 2025",
        capsuleCount: 500,
        highlight: "Ultra rares sealed · Vault Verified",
      },
      {
        id: "drop-002",
        name: "Neon Shrine Collab",
        partner: "Sponsored by Streamer Partner",
        accent: "#7C4DFF",
        soldOut: true,
        dateLabel: "Oct 2025",
        capsuleCount: 320,
        highlight: "Limited physical slabs · Tracked fulfillment",
      },
      {
        id: "drop-003",
        name: "Cosmic Waifu Festival",
        partner: "Sponsored by Studio Partner",
        accent: "#00D4FF",
        soldOut: true,
        dateLabel: "Sep 2025",
        capsuleCount: 800,
        highlight: "High demand · Sold out fast",
      },
      {
        id: "drop-004",
        name: "Midnight Arcana Drop",
        partner: "Sponsored by Brand Partner",
        accent: "#FFB020",
        soldOut: true,
        dateLabel: "Aug 2025",
        capsuleCount: 250,
        highlight: "Premium rarity curve · No rerolls",
      },
      {
        id: "drop-005",
        name: "Tokyo Afterglow",
        partner: "Sponsored by Creator Partner",
        accent: "#2DE37A",
        soldOut: true,
        dateLabel: "Jul 2025",
        capsuleCount: 400,
        highlight: "Manifest-backed pool · Fairness caps",
      },
      {
        id: "drop-006",
        name: "Cherry Blossom Nights",
        partner: "Sponsored by Community Partner",
        accent: "#FF4DA6",
        soldOut: true,
        dateLabel: "Jun 2025",
        capsuleCount: 600,
        highlight: "High engagement · Strong conversion",
      },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white pb-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="/" className="text-sm font-semibold tracking-wide text-white/90 hover:text-white transition">
          ← Back
        </a>
        <div className="text-sm text-white/75">Archive</div>
      </header>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
          <div className="text-xs tracking-[0.18em] uppercase text-white/70">Past Events</div>
          <h1 className="mt-3 text-3xl font-extrabold leading-[0.95] tracking-tight sm:text-4xl">
            Museum Wall
            <span className="block text-white/80">Sold-out drops build trust for sponsors</span>
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/85">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
              {locked ? "Vault Verified" : "Unverified (Unlock in Admin)"}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/70">
              Current manifest: <span className="text-white/85 font-semibold">{manifestCount}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/70">
              Sponsor-ready format
            </div>
          </div>

          {/* Dynamic saved archive (from Admin Close Event) */}
          <div className="mt-8">
            <div className="text-xs tracking-[0.18em] uppercase text-white/60">
              Archived drops (real)
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {saved.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
                  No archived events yet. Close an event from <span className="text-white/85 font-semibold">/admin</span> to add it here.
                </div>
              ) : (
                saved.map((e) => (
                  <div key={e.id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-5">
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-black/70" />
                      <div
                        className="absolute -left-16 top-10 h-36 w-36 rounded-full blur-3xl opacity-30"
                        style={{ backgroundColor: e.accent }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/70" />
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] tracking-[0.18em] uppercase text-white/80">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.accent }} />
                          {new Date(e.ts).toLocaleDateString()}
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] tracking-[0.18em] uppercase text-white/80">
                          {e.soldOut ? "Sold Out" : "Closed"}
                        </div>
                      </div>

                      <div className="mt-4 text-lg font-semibold">{e.name}</div>
                      <div className="mt-1 text-sm text-white/75">{e.partner}</div>

                      <div className="mt-4 text-xs tracking-[0.16em] uppercase text-white/65">
                        Capsules · <span className="text-white/85 font-semibold">{e.capsuleTotal}</span>
                      </div>

                      <div className="mt-2 text-xs tracking-[0.16em] uppercase text-white/65">
                        Manifest · <span className="text-white/85 font-semibold">{e.manifestCount}</span>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                        Vault Verified archive snapshot · {e.soldOut ? "Demand exceeded inventory" : "Event closed"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fallback sponsor wall (static examples) */}
          <div className="mt-10">
            <div className="text-xs tracking-[0.18em] uppercase text-white/60">
              Sponsor wall (examples)
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackPastEvents.map((e) => (
                <div key={e.id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-5">
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-black/70" />
                    <div
                      className="absolute -left-16 top-10 h-36 w-36 rounded-full blur-3xl opacity-30"
                      style={{ backgroundColor: e.accent }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/70" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] tracking-[0.18em] uppercase text-white/80">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.accent }} />
                        {e.dateLabel}
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] tracking-[0.18em] uppercase text-white/80">
                        {e.soldOut ? "Sold Out" : "Closed"}
                      </div>
                    </div>

                    <div className="mt-4 text-lg font-semibold">{e.name}</div>
                    <div className="mt-1 text-sm text-white/75">{e.partner}</div>

                    <div className="mt-4 text-xs tracking-[0.16em] uppercase text-white/65">
                      Capsules · <span className="text-white/85 font-semibold">{e.capsuleCount}</span>
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                      {e.highlight}
                    </div>

                    <button
                      className="mt-4 w-full rounded-2xl border border-white/12 bg-black/35 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/85 hover:text-white transition"
                      onClick={() => alert("v1: event details coming next")}
                    >
                      View Drop Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80">
            Next: archive items come from Admin “Close Event” snapshots stored in this browser.
          </div>
        </div>
      </section>
    </main>
  );
}
