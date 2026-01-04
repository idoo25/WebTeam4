"use client";

/*
  Lecturer – Announcements Page (FINAL)
  ====================================
  ✔ Consistent with Dashboard / Teams pages
  ✔ Back button on the right
  ✔ POST works
  ✔ Auto-refresh after publish (NO manual refresh)
  ✔ Defensive rendering (no runtime errors)
  ✔ Tailwind CSS
*/

import { useEffect, useState } from "react";
import Link from "next/link";

type Announcement = {
  _id: string;
  title?: string;
  body?: string;
  targetTeams: string[] | "all";
  createdAt: string;
};

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function loadAnnouncements() {
      setLoading(true);
      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (mounted && data.ok) setAnnouncements(data.announcements);
      if (mounted) setLoading(false);
    }

    loadAnnouncements();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function publishAnnouncement() {
    if (!title.trim() || !body.trim()) return;

    setPublishing(true);

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        targetTeams: "all",
      }),
    });

    const data = await res.json();

    if (data.ok) {
      setTitle("");
      setBody("");
      // Reload announcements after publishing
      const reloadRes = await fetch("/api/announcements");
      const reloadData = await reloadRes.json();
      if (reloadData.ok) setAnnouncements(reloadData.announcements);
    }

    setPublishing(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 px-8 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Announcements</h1>

        <Link
          href="/lecturer/dashboard"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Publish Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-10 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">
          Publish New Announcement
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded px-4 py-2"
          />

          <textarea
            placeholder="Message / Task description"
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full border rounded px-4 py-2 h-32"
          />

          <button
            onClick={publishAnnouncement}
            disabled={publishing}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">
          Published Announcements
        </h2>

        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-gray-500">No announcements yet</div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div
                key={a._id}
                className="bg-white rounded-lg shadow p-5"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">
                    {a.title ?? "Untitled"}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700">
                  {a.body ?? ""}
                </p>

                <div className="mt-3 text-sm text-gray-500">
                  Target:{" "}
                  {a.targetTeams === "all"
                    ? "All Teams"
                    : a.targetTeams.join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
