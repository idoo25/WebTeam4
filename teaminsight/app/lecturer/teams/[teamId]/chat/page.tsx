"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type ReflectionMsg = { role: "user" | "assistant"; text: string; createdAt?: string };

type SessionListItem = {
  sessionId: string;
  status: "in_progress" | "ready_to_submit" | "submitted";
  createdAt?: string;
  updatedAt?: string;
  aiSummary?: string;
  currentIndex?: number;
  messagesCount?: number;
};

type ActiveSession = {
  sessionId: string;
  status: "in_progress" | "ready_to_submit" | "submitted";
  createdAt?: string;
  updatedAt?: string;
  aiSummary?: string;
  currentIndex?: number;
  messages: ReflectionMsg[];
};

export default function LecturerTeamChatPage() {
  const { teamId } = useParams() as { teamId: string };

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(sessionId?: string) {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/reflections/chat${qs}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setError(data?.error || "Failed to load reflection chat.");
      setSessions([]);
      setActive(null);
      setLoading(false);
      return;
    }

    setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    setActive(data.active ?? null);

    // keep select in sync
    const sid = data?.active?.sessionId || "";
    setSelectedSessionId(sid);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  function onChangeSession(nextId: string) {
    setSelectedSessionId(nextId);
    load(nextId);
  }

  const title = useMemo(() => `Team ${teamId} — Reflection History`, [teamId]);

  return (
    <main className="min-h-screen bg-gray-100 w-full py-10">
      <div className="w-full px-4 md:px-8 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-gray-600 mt-1 text-sm">
              צפייה למרצה (read-only) בשיחת הרפלקציה השמורה ב־DB.
            </p>
          </div>

          <Link
            href={`/lecturer/teams/${teamId}`}
            className="text-blue-600 hover:underline text-sm whitespace-nowrap"
          >
            ← Back to Team
          </Link>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Session:</div>
            <select
              value={selectedSessionId}
              onChange={(e) => onChangeSession(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
              disabled={loading || sessions.length === 0}
            >
              {sessions.length === 0 ? (
                <option value="">No sessions</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.sessionId.slice(0, 8)}… • {statusLabel(s.status)} • {s.messagesCount ?? 0} msgs
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => load(selectedSessionId || undefined)}
            className="text-sm px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="font-semibold">Conversation</div>
            <div className="text-sm text-gray-600">
              {active ? (
                <>
                  {statusLabel(active.status)} • Messages: {active.messages?.length ?? 0}
                </>
              ) : (
                "—"
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-gray-600">Loading…</div>
          ) : error ? (
            <div className="p-6 text-red-700 bg-red-50">{error}</div>
          ) : !active ? (
            <div className="p-6 text-gray-600">No reflection session found for this team.</div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Optional summary */}
              {active.aiSummary ? (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="font-semibold mb-2">AI Summary</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{active.aiSummary}</div>
                </div>
              ) : null}

              {/* Chat timeline */}
              <div className="space-y-3">
                {active.messages.map((m, i) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%]">
                        <div className={`text-xs mb-1 ${isUser ? "text-right" : "text-left"} text-gray-500`}>
                          {isUser ? "סטודנט/ים" : "AI"}
                          {m.createdAt ? ` • ${new Date(m.createdAt).toLocaleString()}` : ""}
                        </div>

                        <div
                          className={`rounded-2xl border px-4 py-3 whitespace-pre-wrap ${
                            isUser
                              ? "bg-blue-50 border-blue-100 text-gray-900"
                              : "bg-gray-50 border-gray-200 text-gray-900"
                          }`}
                          dir="auto"
                          style={{ unicodeBidi: "plaintext" }}
                        >
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-gray-500">
                מקור הנתונים: <code className="px-1 py-0.5 bg-gray-100 rounded">ReflectionChatSession</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function statusLabel(s: "in_progress" | "ready_to_submit" | "submitted") {
  if (s === "in_progress") return "In progress";
  if (s === "ready_to_submit") return "Ready to submit";
  return "Submitted";
}
