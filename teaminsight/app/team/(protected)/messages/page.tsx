"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MessageRole = "team" | "lecturer";

type ThreadMessage = {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
};

type ThreadListItem = {
  id: string;
  subject: string;
  updatedAt: string;
  unreadForTeam: number;
  lastMessageAt?: string | null;
  lastMessageText?: string;
  lastMessageRole?: MessageRole;
  status?: "open" | "closed";
};

type ThreadDetails = {
  id: string;
  subject: string;
  updatedAt: string;
  unreadForTeam: number;
  status?: "open" | "closed";
  messages: ThreadMessage[];
};

type TeamMe = {
  teamId: string;
  projectName?: string;
  status?: string;
  members?: Array<{ memberId: string; displayName: string }>;
  contactEmail?: string;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function CreateThreadModal({
  open,
  onClose,
  onCreate,
  creating,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (subject: string, firstMessage: string) => void;
  creating: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [first, setFirst] = useState("");

  function handleClose() {
    setSubject("");
    setFirst("");
    onClose();
  }

  function submit() {
    const s = subject.trim();
    const f = first.trim();
    if (!s || !f) return;
    if (creating) return;
    onCreate(s, f);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
        role="button"
        tabIndex={0}
      />
      <div className="relative w-full max-w-lg rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <div className="text-sm text-gray-600">New thread</div>
            <div className="text-lg font-semibold text-gray-900">
              Message the lecturer
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            disabled={creating}
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Deliverables format"
              className="w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
              disabled={creating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              First message
            </label>
            <textarea
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Write your message..."
              className="min-h-[120px] w-full resize-none rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
              disabled={creating}
            />
            <div className="mt-1 text-xs text-gray-600">Ctrl/⌘ + Enter to send</div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              disabled={creating || !subject.trim() || !first.trim()}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamMessagesPage() {
  const [team, setTeam] = useState<TeamMe | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState<string>("");

  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [selectedThread, setSelectedThread] = useState<ThreadDetails | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string>("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [composeOpen, setComposeOpen] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadTeam() {
    setTeamLoading(true);
    try {
      const res = await fetch("/api/team/me", { method: "GET" });
      if (!res.ok) throw new Error("Failed to load team");
      const data = (await res.json()) as { ok?: boolean; team?: TeamMe };
      setTeam(data?.team || null);
    } catch {
      setTeam(null);
    } finally {
      setTeamLoading(false);
    }
  }

  async function loadThreads(preserveSelection = true) {
    setThreadsLoading(true);
    setThreadsError("");

    try {
      const res = await fetch("/api/team/messages", { method: "GET" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Failed to load threads");

      const list = (data?.threads || []) as Array<Partial<ThreadListItem>>;
      const mapped: ThreadListItem[] = list.map((t) => ({
        id: String(t.id),
        subject: String(t.subject || ""),
        updatedAt: String(t.updatedAt || t.lastMessageAt || new Date().toISOString()),
        unreadForTeam: Number(t.unreadForTeam || 0),
        lastMessageAt: t.lastMessageAt ? String(t.lastMessageAt) : null,
        lastMessageText: t.lastMessageText ? String(t.lastMessageText) : "",
        lastMessageRole: t.lastMessageRole === "lecturer" ? "lecturer" : "team",
        status: t.status === "closed" ? "closed" : "open",
      }));

      setThreads(mapped);

      if (!preserveSelection) return;

      if (!selectedThreadId && mapped[0]?.id) {
        setSelectedThreadId(mapped[0].id);
      }
    } catch (e) {
      const error = e as Error;
      setThreadsError(String(error?.message || "Failed to load threads"));
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }

  async function loadThread(threadId: string) {
    if (!threadId) return;

    setThreadLoading(true);
    setThreadError("");

    try {
      const res = await fetch(`/api/team/messages/${threadId}`, { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load thread");

      const t = data?.thread;
      const mapped: ThreadDetails = {
        id: String(t?.id || threadId),
        subject: String(t?.subject || ""),
        updatedAt: String(t?.updatedAt || new Date().toISOString()),
        unreadForTeam: Number(t?.unreadForTeam || 0),
        status: t?.status === "closed" ? "closed" : "open",
        messages: Array.isArray(t?.messages)
          ? t.messages.map((m: Partial<ThreadMessage>) => ({
              id: String(m?.id),
              role: m?.role === "lecturer" ? "lecturer" : "team",
              text: String(m?.text || ""),
              createdAt: String(m?.createdAt || new Date().toISOString()),
            }))
          : [],
      };

      setSelectedThread(mapped);

      setThreads((prev) =>
        prev.map((x) => (x.id === threadId ? { ...x, unreadForTeam: 0 } : x))
      );
    } catch (e) {
      const error = e as Error;
      setThreadError(String(error?.message || "Failed to load thread"));
      setSelectedThread(null);
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadTeam();
      if (cancelled) return;
      await loadThreads(true);
      if (cancelled) return;
    }

    init();
    return () => {
      cancelled = true;
    };
    // loadTeam and loadThreads are stable functions that don't depend on props/state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedThreadId) return;
    loadThread(selectedThreadId);
    // loadThread is a stable function that doesn't depend on props/state
     
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadId, selectedThread?.messages.length]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((t) => (filter === "unread" ? t.unreadForTeam > 0 : true))
      .filter((t) => {
        if (!q) return true;
        const inSubject = t.subject.toLowerCase().includes(q);
        const inLast = (t.lastMessageText || "").toLowerCase().includes(q);
        return inSubject || inLast;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [threads, query, filter]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unreadForTeam || 0), 0),
    [threads]
  );

  function selectThread(id: string) {
    setSelectedThreadId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unreadForTeam: 0 } : t)));
  }

  async function createThread(subject: string, firstMessage: string) {
    setCreatingThread(true);
    setThreadsError("");

    try {
      const res = await fetch("/api/team/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, text: firstMessage }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Failed to create thread");

      const newId = String(data?.threadId || "");
      setComposeOpen(false);

      await loadThreads(false);

      if (newId) {
        setSelectedThreadId(newId);
      } else {
        await loadThreads(true);
      }
    } catch (e) {
      const error = e as Error;
      setThreadsError(String(error?.message || "Failed to create thread"));
    } finally {
      setCreatingThread(false);
    }
  }

  async function sendMessage() {
    if (!selectedThreadId) return;

    const text = draft.trim();
    if (!text) return;
    if (sending) return;

    setSending(true);
    setThreadError("");

    try {
      const res = await fetch(`/api/team/messages/${selectedThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Failed to send message");

      setDraft("");
      await Promise.all([loadThread(selectedThreadId), loadThreads(true)]);
    } catch (e) {
      const error = e as Error;
      setThreadError(String(error?.message || "Failed to send message"));
    } finally {
      setSending(false);
    }
  }

  function onDraftKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <CreateThreadModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onCreate={createThread}
        creating={creatingThread}
      />

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>

            <div className="inline-flex items-center rounded-full border bg-gray-50 px-3 py-1 text-sm text-gray-900">
              <span className="font-medium">Unread:</span>
              <span className="ml-2">{unreadTotal}</span>
            </div>
          </div>

          <p className="text-gray-600">
            {teamLoading ? (
              "Loading team..."
            ) : team?.teamId ? (
              <>
                Signed in as <span className="font-medium">{team.teamId}</span>
                {team.projectName ? (
                  <>
                    {" "}
                    · <span className="font-medium">{team.projectName}</span>
                  </>
                ) : null}
              </>
            ) : (
              "Signed in"
            )}
          </p>
        </div>

        {/* Errors */}
        {threadsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="text-sm font-medium text-red-800">Error</div>
            <div className="mt-1 text-sm text-red-700">{threadsError}</div>
          </div>
        ) : null}

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Threads list */}
          <aside className="lg:col-span-1 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">Threads</div>
                <div className="text-sm text-gray-600">Pick a subject</div>
              </div>

              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-60"
                disabled={creatingThread}
              >
                New
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subject or last message..."
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-xl px-3 py-2 text-sm border transition ${
                    filter === "all"
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("unread")}
                  className={`rounded-xl px-3 py-2 text-sm border transition ${
                    filter === "unread"
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {threadsLoading ? (
                <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                  Loading threads...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                  No threads found.
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const active = t.id === selectedThreadId;
                  const stamp = t.lastMessageAt || t.updatedAt;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectThread(t.id)}
                      className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                        active ? "bg-gray-50 border-gray-300" : "bg-white hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {t.subject}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs text-gray-600">
                            {t.lastMessageText || "—"}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-[11px] text-gray-500">
                            {formatDate(stamp)}
                          </div>

                          {t.unreadForTeam > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
                              {t.unreadForTeam}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right: Thread view */}
          <section className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
            {threadError ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="text-sm font-medium text-red-800">Error</div>
                <div className="mt-1 text-sm text-red-700">{threadError}</div>
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {threadLoading ? "Loading..." : selectedThread ? selectedThread.subject : "No thread selected"}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {selectedThread ? `Updated: ${formatDate(selectedThread.updatedAt)}` : "Select a thread from the list"}
                </div>
              </div>
            </div>

            <div className="mt-5">
              {selectedThread ? (
                <>
                  <div className="h-[420px] overflow-y-auto rounded-2xl border bg-gray-50 p-3">
                    <div className="space-y-3">
                      {selectedThread.messages.map((m) => {
                        const isTeam = m.role === "team";
                        return (
                          <div key={m.id} className={`flex ${isTeam ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm border ${
                                isTeam
                                  ? "bg-white text-gray-900 border-gray-200"
                                  : "bg-white text-gray-900 border-gray-200"
                              }`}
                            >
                              <div className="whitespace-pre-wrap">{m.text}</div>
                              <div className="mt-1 text-[11px] text-gray-500">
                                {m.role === "team" ? "Team" : "Lecturer"} · {formatDate(m.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">Reply</div>
                      <div className="text-xs text-gray-600">Ctrl/⌘ + Enter to send</div>
                    </div>

                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onDraftKeyDown}
                      placeholder="Write a message..."
                      className="mt-2 min-h-[96px] w-full resize-none rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                      disabled={sending}
                    />

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDraft("")}
                        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                        disabled={sending}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={sendMessage}
                        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-60"
                        disabled={sending || !draft.trim()}
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
                  No thread selected.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
              Data source: <span className="font-medium">/api/team/messages</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
