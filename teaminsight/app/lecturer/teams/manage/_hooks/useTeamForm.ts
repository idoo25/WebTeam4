import { useState, useCallback } from "react";
import type { TeamMember } from "@/types";

interface UseTeamFormResult {
  teamId: string;
  setTeamId: (value: string) => void;
  projectName: string;
  setProjectName: (value: string) => void;
  accessCode: string;
  setAccessCode: (value: string) => void;
  contactEmail: string;
  setContactEmail: (value: string) => void;
  memberId: string;
  setMemberId: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  members: TeamMember[];
  addMember: () => { success: boolean; error?: string };
  removeMember: (id: string) => void;
  resetForm: () => void;
}

export function useTeamForm(): UseTeamFormResult {
  const [teamId, setTeamId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [memberId, setMemberId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);

  const addMember = useCallback(() => {
    const id = memberId.trim();
    const name = displayName.trim();

    if (!id || !name) {
      return { success: false, error: "Please fill Member ID and Name." };
    }

    if (members.some((m) => m.memberId === id)) {
      return {
        success: false,
        error: "Member ID must be unique within the team.",
      };
    }

    setMembers((prev) => [...prev, { memberId: id, displayName: name }]);
    setMemberId("");
    setDisplayName("");

    return { success: true };
  }, [memberId, displayName, members]);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.memberId !== id));
  }, []);

  const resetForm = useCallback(() => {
    setTeamId("");
    setProjectName("");
    setAccessCode("");
    setContactEmail("");
    setMembers([]);
    setMemberId("");
    setDisplayName("");
  }, []);

  return {
    teamId,
    setTeamId,
    projectName,
    setProjectName,
    accessCode,
    setAccessCode,
    contactEmail,
    setContactEmail,
    memberId,
    setMemberId,
    displayName,
    setDisplayName,
    members,
    addMember,
    removeMember,
    resetForm,
  };
}
