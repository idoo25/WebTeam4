/**
 * Alert-related type definitions
 */

export type AlertSeverity = "green" | "yellow" | "red";
export type EmailStatus = "pending" | "sent" | "failed";

export interface Alert {
  _id: string;
  teamId: string;
  severity: AlertSeverity;
  message: string;
  emailTo: string;
  emailStatus: EmailStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AlertBasic {
  teamId: string;
  severity: AlertSeverity;
}
