import { useState, useCallback } from "react";
import type { Team, TeamMember } from "@/types";

interface UseTeamOperationsResult {
  saving: boolean;
  error: string | null;
  okMsg: string | null;
  setError: (error: string | null) => void;
  setOkMsg: (msg: string | null) => void;
  clearMessages: () => void;
  addStudentToTeam: (teamId: string, onSuccess: () => void) => Promise<void>;
  removeStudentFromTeam: (teamId: string, onSuccess: () => void) => Promise<void>;
  deleteTeam: (teamId: string, onSuccess: () => void) => Promise<void>;
}

export function useTeamOperations(): UseTeamOperationsResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setOkMsg(null);
  }, []);

  const addStudentToTeam = useCallback(
    async (teamId: string, onSuccess: () => void) => {
      clearMessages();
      setSaving(true);

      try {
        const memberId = prompt("Enter Member ID:");
        if (!memberId?.trim()) return;

        const displayName = prompt("Enter Display Name:");
        if (!displayName?.trim()) return;

        const resTeam = await fetch(`/api/teams/${encodeURIComponent(teamId)}`);
        const teamData = await resTeam.json();

        if (!teamData?.ok) {
          setError(teamData?.error || "Failed to load team.");
          return;
        }

        const currentMembers: TeamMember[] = teamData.team.members ?? [];

        if (currentMembers.some((m) => m.memberId === memberId.trim())) {
          setError("Member ID must be unique within the team.");
          return;
        }

        const updatedMembers = [
          ...currentMembers,
          { memberId: memberId.trim(), displayName: displayName.trim() },
        ];

        const resPut = await fetch(
          `/api/teams/${encodeURIComponent(teamId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ members: updatedMembers }),
          }
        );

        const putData = await resPut.json();
        if (!putData?.ok) {
          setError(putData?.error || "Failed to add student.");
          return;
        }

        setOkMsg("Student added successfully.");
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add student");
      } finally {
        setSaving(false);
      }
    },
    [clearMessages]
  );

  const removeStudentFromTeam = useCallback(
    async (teamId: string, onSuccess: () => void) => {
      clearMessages();
      setSaving(true);

      try {
        const memberId = prompt("Enter Member ID to remove:");
        if (!memberId?.trim()) return;

        const resTeam = await fetch(`/api/teams/${encodeURIComponent(teamId)}`);
        const teamData = await resTeam.json();

        if (!teamData?.ok) {
          setError(teamData?.error || "Failed to load team.");
          return;
        }

        const currentMembers: TeamMember[] = teamData.team.members ?? [];
        const updatedMembers = currentMembers.filter(
          (m) => m.memberId !== memberId.trim()
        );

        if (updatedMembers.length === currentMembers.length) {
          setError("Member ID not found in this team.");
          return;
        }

        const resPut = await fetch(
          `/api/teams/${encodeURIComponent(teamId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ members: updatedMembers }),
          }
        );

        const putData = await resPut.json();
        if (!putData?.ok) {
          setError(putData?.error || "Failed to remove student.");
          return;
        }

        setOkMsg("Student removed successfully.");
        onSuccess();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove student"
        );
      } finally {
        setSaving(false);
      }
    },
    [clearMessages]
  );

  const deleteTeam = useCallback(
    async (teamId: string, onSuccess: () => void) => {
      const ok = confirm(
        `Delete team ${teamId}? This cannot be undone.`
      );
      if (!ok) return;

      clearMessages();
      setSaving(true);

      try {
        const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (!data?.ok) {
          setError(data?.error || "Failed to delete team.");
          return;
        }

        setOkMsg("Team deleted successfully.");
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete team");
      } finally {
        setSaving(false);
      }
    },
    [clearMessages]
  );

  return {
    saving,
    error,
    okMsg,
    setError,
    setOkMsg,
    clearMessages,
    addStudentToTeam,
    removeStudentFromTeam,
    deleteTeam,
  };
}
