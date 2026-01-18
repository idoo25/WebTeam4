import React from "react";
import type { TeamMember } from "@/types";

interface MemberListProps {
  members: TeamMember[];
  onRemove: (memberId: string) => void;
}

export function MemberList({ members, onRemove }: MemberListProps) {
  if (members.length === 0) return null;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 border-b text-sm font-semibold text-gray-700">
              Member ID
            </th>
            <th className="text-left px-4 py-3 border-b text-sm font-semibold text-gray-700">
              Name
            </th>
            <th className="text-right px-4 py-3 border-b text-sm font-semibold text-gray-700">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.memberId} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 border-b text-sm font-medium text-gray-900">
                {m.memberId}
              </td>
              <td className="px-4 py-3 border-b text-sm text-gray-700">
                {m.displayName}
              </td>
              <td className="px-4 py-3 border-b text-right">
                <button
                  type="button"
                  onClick={() => onRemove(m.memberId)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
