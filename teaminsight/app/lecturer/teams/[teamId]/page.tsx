"use client";

/*
  Lecturer – Team Details Page
  ===========================
  Course-aligned page:
  - Next.js App Router (dynamic route)
  - React Hooks
  - Tailwind CSS
  - Clear separation: summary, insights, navigation

  Data sources:
  - GET /api/teams/[teamId]
*/

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { TeamWithMembers } from "@/types";

export default function TeamDetailsPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsTab, setInsightsTab] = useState<"strengths" | "risks">("strengths");

  useEffect(() => {
    fetch(`/api/teams/${teamId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setTeam(data.team);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading team data...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Team not found
      </div>
    );
  }

  const headerStyle = {
    green: { bg: "bg-green-50", border: "border-green-200" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200" },
    red: { bg: "bg-red-50", border: "border-red-200" },
  }[team.status];

  return (
    <main className="min-h-screen bg-gray-100 px-4 md:px-8 py-10">
      <div className="w-full">
        {/* Header */}
        <div
          className={`rounded-lg border ${headerStyle.border} ${headerStyle.bg} px-6 py-5 mb-8`}
        >
          <div className="flex items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Team: {team.teamId}</h1>
                <StatusBadge status={team.status} />
              </div>
              <p className="text-gray-600 mt-1 text-sm">{team.projectName}</p>
            </div>

            <Link
              href="/lecturer/teams"
              className="text-blue-600 hover:underline text-sm whitespace-nowrap"
            >
              ← Back to Teams
            </Link>
          </div>
        </div>

    {/* Summary Card */}
<div className="bg-white rounded-lg shadow p-6 mb-6">
  <h2 className="text-xl font-semibold mb-4">Project Overview</h2>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <InfoBlock label="Project Name" value={team.projectName} />
    <InfoBlock label="Status" value={<StatusBadge status={team.status} />} />
    <InfoBlock label="Members" value={team.members?.length ?? 0} />
    <InfoBlock
      label="AI Chat"
      value={
        <Link
          href={`/lecturer/teams/${team.teamId}/chat`}
          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          💬 View conversation
        </Link>
      }
    />
  </div>
</div>



        {/* Members List */}
        <SectionCard title={`Team Members (${team.members?.length ?? 0})`}>
          {team.members && team.members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 border-b text-sm font-semibold text-gray-700">
                      Member ID
                    </th>
                    <th className="text-left px-4 py-3 border-b text-sm font-semibold text-gray-700">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((m) => (
                    <tr key={m.memberId} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 border-b text-sm text-gray-900 font-medium">
                        {m.memberId}
                      </td>
                      <td className="px-4 py-3 border-b text-sm text-gray-700">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-gray-400">👤</span>
                          {m.displayName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              No members found for this team.
            </div>
          )}
        </SectionCard>


        {/* Insights Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Insights</h2>

            {/* Tabs */}
            <div className="inline-flex rounded-lg border bg-white p-1">
              <button
                type="button"
                onClick={() => setInsightsTab("strengths")}
                className={`px-3 py-1.5 text-sm rounded-md transition ${insightsTab === "strengths"
                    ? "bg-gray-100 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Strengths
              </button>

              <button
                type="button"
                onClick={() => setInsightsTab("risks")}
                className={`px-3 py-1.5 text-sm rounded-md transition ${insightsTab === "risks"
                    ? "bg-gray-100 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Risks
              </button>
            </div>
          </div>

          {insightsTab === "strengths" ? (
            <SectionCard title="Strengths">
              <ul className="list-disc pl-5 text-gray-700">
                <li>Team communication is active</li>
                <li>Regular task updates</li>
              </ul>
            </SectionCard>
          ) : (
            <SectionCard title="Risks">
              <ul className="list-disc pl-5 text-gray-700">
                {team.status !== "green" ? (
                  <li>Status indicates potential issues</li>
                ) : (
                  <li>No significant risks detected</li>
                )}
              </ul>
            </SectionCard>
          )}
        </div>

      </div>
    </main>
  );
}

/* =========================
   Reusable Components
   ========================= */

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">
        {label}
      </div>
      <div className="text-lg font-medium">
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: Team["status"] }) {
  const config = {
    green: {
      dot: "bg-green-500",
      text: "OK",
      textColor: "text-green-700",
      bg: "bg-green-50",
    },
    yellow: {
      dot: "bg-yellow-400",
      text: "Warning",
      textColor: "text-yellow-700",
      bg: "bg-yellow-50",
    },
    red: {
      dot: "bg-red-500",
      text: "Risk",
      textColor: "text-red-700",
      bg: "bg-red-50",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.textColor}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
}

