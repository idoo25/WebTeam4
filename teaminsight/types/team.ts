/**
 * Team-related type definitions
 */

export type TeamStatus = "green" | "yellow" | "red";

export interface TeamMember {
  memberId: string;
  displayName: string;
}

export interface Team {
  _id?: string;
  teamId: string;
  projectName: string;
  accessCode: string;
  contactEmail: string;
  members: TeamMember[];
  status: TeamStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TeamBasic {
  teamId: string;
  projectName: string;
  status: TeamStatus;
}

export interface TeamWithMembers extends TeamBasic {
  members: TeamMember[];
  contactEmail?: string;
}
