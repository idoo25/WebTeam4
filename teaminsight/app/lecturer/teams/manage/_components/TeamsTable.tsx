import React from "react";
import Link from "next/link";
import type { TeamWithMembers } from "@/types";
import { StatusBadge } from "./StatusBadge";

interface TeamsTableProps {
  teams: TeamWithMembers[];
  loading: boolean;
  saving: boolean;
  onRefresh: () => void;
  onAddStudent: (teamId: string) => void;
  onRemoveStudent: (teamId: string) => void;
  onDelete: (teamId: string) => void;
}

export function TeamsTable({
  teams,
  loading,
  saving,
  onRefresh,
  onAddStudent,
  onRemoveStudent,
  onDelete,
}: TeamsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Existing Teams</h2>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-gray-600">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">
                  Team ID
                </th>
                <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">
                  Project Name
                </th>
                <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">
                  Contact Email
                </th>
                <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">
                  Members
                </th>
                <th className="text-left px-6 py-3 border-b text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-right px-6 py-3 border-b text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.teamId} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 border-b text-sm font-medium text-blue-600">
                    <Link
                      href={`/lecturer/teams/${t.teamId}`}
                      className="hover:underline"
                    >
                      {t.teamId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 border-b text-sm text-gray-700">
                    {t.projectName}
                  </td>
                  <td className="px-6 py-4 border-b text-sm text-gray-700">
                    {t.contactEmail}
                  </td>
                  <td className="px-6 py-4 border-b text-sm text-gray-700">
                    {t.members?.length ?? 0}
                  </td>
                  <td className="px-6 py-4 border-b">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4 border-b text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/lecturer/teams/${t.teamId}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View →
                      </Link>

                      <button
                        type="button"
                        onClick={() => onAddStudent(t.teamId)}
                        disabled={saving}
                        className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-60"
                      >
                        + Student
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveStudent(t.teamId)}
                        disabled={saving}
                        className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-gray-50 disabled:opacity-60"
                      >
                        − Student
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(t.teamId)}
                        disabled={saving}
                        className="text-sm px-3 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center px-6 py-10 text-gray-500"
                  >
                    No teams found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
