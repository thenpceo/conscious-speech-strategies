"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [userName, setUserName] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const onSessionReady = useCallback((user: { user_metadata?: Record<string, string>; email?: string }) => {
    const name = user.user_metadata?.name || user.email || "";
    setUserName(name);
    setHasSession(true);
    setVerifying(false);
  }, []);

  useEffect(() => {
    async function exchangeToken() {
      // 1. Check if there's already a session (e.g., page refresh)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        onSessionReady(session.user);
        return;
      }

      // 2. Try to extract token from URL hash (Supabase invite links use hash fragments)
      //    Format: #access_token=...&refresh_token=...&type=invite
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (data?.session?.user) {
            // Clean up the URL hash
            window.history.replaceState(null, "", window.location.pathname);
            onSessionReady(data.session.user);
            return;
          }

          if (sessionError) {
            console.error("[setup] Token exchange failed:", sessionError.message);
          }
        }
      }

      // 3. Try query params (some Supabase versions use ?token=...&type=invite)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const type = urlParams.get("type");

      if (token && type) {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as "invite" | "signup" | "recovery",
        });

        if (data?.session?.user) {
          onSessionReady(data.session.user);
          return;
        }

        if (verifyError) {
          console.error("[setup] OTP verification failed:", verifyError.message);
        }
      }

      // 4. Listen for auth state changes as a fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          onSessionReady(session.user);
        }
      });

      // 5. Timeout — show the form anyway but with a warning
      setTimeout(() => {
        setVerifying(false);
        subscription.unsubscribe();
      }, 5000);
    }

    exchangeToken();
  }, []);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!hasSession) {
      setError("Auth session missing! Please click the invite link from your email again.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-slate-100 -z-10" />
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Verifying your invite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50" style={{ fontFamily: "var(--font-admin)" }}>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-slate-100 -z-10" />
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Welcome{userName ? `, ${userName}` : ""}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">Set your password to get started</p>
        </div>

        {!hasSession && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <strong>Invite link expired or invalid.</strong> Please ask your administrator to send a new invite from the Staff page.
          </div>
        )}

        <form onSubmit={handleSetPassword} className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/60 p-7 space-y-5">
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={!hasSession}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!hasSession}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
              placeholder="Re-enter your password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !hasSession}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-teal-500/20 cursor-pointer text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Setting up...
              </span>
            ) : (
              "Set Password & Continue"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">Conscious Speech Strategies Admin Portal</p>
      </div>
    </div>
  );
}
