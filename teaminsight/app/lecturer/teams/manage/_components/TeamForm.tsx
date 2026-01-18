import React from "react";
import type { TeamMember } from "@/types";
import { MemberList } from "./MemberList";

interface TeamFormProps {
  teamId: string;
  onTeamIdChange: (value: string) => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  accessCode: string;
  onAccessCodeChange: (value: string) => void;
  contactEmail: string;
  onContactEmailChange: (value: string) => void;
  memberId: string;
  onMemberIdChange: (value: string) => void;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  members: TeamMember[];
  onAddMember: () => void;
  onRemoveMember: (id: string) => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
  okMsg: string | null;
}

export function TeamForm({
  teamId,
  onTeamIdChange,
  projectName,
  onProjectNameChange,
  accessCode,
  onAccessCodeChange,
  contactEmail,
  onContactEmailChange,
  memberId,
  onMemberIdChange,
  displayName,
  onDisplayNameChange,
  members,
  onAddMember,
  onRemoveMember,
  onSubmit,
  saving,
  error,
  okMsg,
}: TeamFormProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Add Team</h2>

      {(error || okMsg) && (
        <div
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
            error
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {error ?? okMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Team ID">
          <input
            value={teamId}
            onChange={(e) => onTeamIdChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="e.g., 1"
          />
        </Field>

        <Field label="Project Name">
          <input
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="e.g., TeamInsight"
          />
        </Field>

        <Field label="Access Code">
          <input
            value={accessCode}
            onChange={(e) => onAccessCodeChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="e.g., ABC123"
          />
        </Field>

        <Field label="Contact Email">
          <input
            value={contactEmail}
            onChange={(e) => onContactEmailChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="team@email.com"
          />
        </Field>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Members</h3>
          <div className="text-sm text-gray-600">Count: {members.length}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={memberId}
            onChange={(e) => onMemberIdChange(e.target.value)}
            placeholder="Member ID"
            className="border rounded-md px-3 py-2 text-sm"
          />
          <input
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Display Name"
            className="border rounded-md px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={onAddMember}
            className="border rounded-md px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
          >
            + Add Member
          </button>
        </div>

        <MemberList members={members} onRemove={onRemoveMember} />
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Create Team"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}
