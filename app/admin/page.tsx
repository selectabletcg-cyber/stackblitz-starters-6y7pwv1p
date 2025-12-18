"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let unsub: (() => void) | null = null;

    async function boot() {
      // If env vars aren't present, don't crash — just show demo mode.
      if (!supabaseReady) return;

      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      });

      unsub = () => sub.subscription.unsubscribe();
    }

    boot();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  async function sendMagicLink() {
    setStatus("");

    if (!supabaseReady) {
      setStatus("Supabase env vars not detected on this build. (Still demo mode)");
      return;
    }

    const e = email.trim();
    if (!e) {
      setStatus("Type your email first.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        // When the user clicks the email link, they come back to your site.
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin + "/admin" : undefined,
      },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Magic link sent. Check your email.");
  }

  async function signOut() {
    setStatus("");

    if (!supabaseReady) {
      setStatus("Supabase not active.");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Signed out.");
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-6">
      {/* Phase 1 Auth Box */}
      <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="text-sm font-semibold tracking-wide">ADMIN</div>

        <div className="mt-2 text-xs text-white/70">
          Phase 1: Supabase Auth foundation. If Supabase is missing, the app stays in demo mode.
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/70">Supabase:</div>
          <div className="mt-1 text-sm">
            {supabaseReady ? (
              <span className="text-green-300">Connected ✅</span>
            ) : (
              <span className="text-yellow-300">Not active — demo mode</span>
            )}
          </div>

          <div className="mt-3 text-sm">
            {userEmail ? (
              <>
                Logged in as <b>{userEmail}</b>
              </>
            ) : (
              <>Not logged in</>
            )}
          </div>

          {!userEmail ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-72 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={sendMagicLink}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Send magic link
              </button>
            </div>
          ) : (
            <button
              onClick={signOut}
              className="mt-3 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Sign out
            </button>
          )}

          {status ? <div className="mt-3 text-xs text-white/80">{status}</div> : null}
        </div>
      </section>

      {/* Keep your existing Admin UI below (we’ll wire it to auth next) */}
      <section className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs text-white/60">
          Your existing Admin controls stay here. Next step we’ll lock them behind login.
        </div>
      </section>
    </main>
  );
}
