"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { TeamWithMembers } from "@/types";
import { useTeamForm } from "./_hooks/useTeamForm";
import { useTeamOperations } from "./_hooks/useTeamOperations";
import { TeamForm } from "./_components/TeamForm";
import { TeamsTable } from "./_components/TeamsTable";

export default function TeamsManagePage() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  const formState = useTeamForm();
  const operations = useTeamOperations();

  function loadTeams() {
    setLoading(true);
    operations.clearMessages();

    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) setTeams(data.teams);
        else operations.setError(data?.error || "Failed to load teams");
      })
      .catch((err) => {
        operations.setError(
          err instanceof Error ? err.message : "Network error"
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTeams();
  }, []);

  function handleAddMember() {
    const result = formState.addMember();
    if (!result.success) {
      operations.setError(result.error || null);
    } else {
      operations.clearMessages();
    }
  }

  async function createTeam() {
    operations.clearMessages();

    const payload = {
      teamId: formState.teamId.trim(),
      projectName: formState.projectName.trim(),
      accessCode: formState.accessCode.trim(),
      contactEmail: formState.contactEmail.trim(),
      members: formState.members,
    };

    if (
      !payload.teamId ||
      !payload.projectName ||
      !payload.accessCode ||
      !payload.contactEmail
    ) {
      operations.setError(
        "Please fill Team ID, Project Name, Access Code, and Contact Email."
      );
      return;
    }

    operations.clearMessages();

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data?.ok) {
        operations.setError(data?.error || "Failed to create team.");
        return;
      }

      operations.setOkMsg("Team created successfully.");
      formState.resetForm();
      loadTeams();
    } catch (err) {
      operations.setError(
        err instanceof Error ? err.message : "Failed to create team"
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 md:px-8 py-10">
      <div className="w-full max-w-screen-xl mx-auto space-y-6">
        <div className="flex items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Teams Management</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Create teams and manage their core details.
            </p>
          </div>

          <Link
            href="/lecturer/teams"
            className="text-blue-600 hover:underline text-sm whitespace-nowrap"
          >
            ← Back to Teams
          </Link>
        </div>

        <TeamForm
          teamId={formState.teamId}
          onTeamIdChange={formState.setTeamId}
          projectName={formState.projectName}
          onProjectNameChange={formState.setProjectName}
          accessCode={formState.accessCode}
          onAccessCodeChange={formState.setAccessCode}
          contactEmail={formState.contactEmail}
          onContactEmailChange={formState.setContactEmail}
          memberId={formState.memberId}
          onMemberIdChange={formState.setMemberId}
          displayName={formState.displayName}
          onDisplayNameChange={formState.setDisplayName}
          members={formState.members}
          onAddMember={handleAddMember}
          onRemoveMember={formState.removeMember}
          onSubmit={createTeam}
          saving={operations.saving}
          error={operations.error}
          okMsg={operations.okMsg}
        />

        <TeamsTable
          teams={teams}
          loading={loading}
          saving={operations.saving}
          onRefresh={loadTeams}
          onAddStudent={(teamId) => operations.addStudentToTeam(teamId, loadTeams)}
          onRemoveStudent={(teamId) =>
            operations.removeStudentFromTeam(teamId, loadTeams)
          }
          onDelete={(teamId) => operations.deleteTeam(teamId, loadTeams)}
        />
      </div>
    </main>
  );
}
