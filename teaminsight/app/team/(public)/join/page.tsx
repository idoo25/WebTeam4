"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TeamLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teamId, setTeamId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const qTeamId = searchParams.get("teamId");
    if (qTeamId) setTeamId(qTeamId);
  }, [searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    const tid = teamId.trim();
    const code = accessCode.trim();

    if (!tid || !code) {
      setErrorMsg("Please enter Team ID and Access Code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: tid, accessCode: code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data?.error || "Invalid credentials or server error.");
        return;
      }

      router.push("/team");
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Team Login</h1>
        <p className="text-sm text-gray-600 mb-6">
          Use the Team ID and Access Code provided by the lecturer.
        </p>

        {errorMsg ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team ID</label>
            <input
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="e.g., T-001"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Access Code</label>
            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Enter your access code"
              type="password"
              autoComplete="off"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
