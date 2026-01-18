/**
 * Reflection-related type definitions
 */

export type ReflectionStatus = "in_progress" | "ready_to_submit" | "submitted";
export type ReflectionColor = "green" | "yellow" | "red";
export type MessageRole = "user" | "model";

export interface ChatMessage {
  role: MessageRole;
  text: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ReflectionAnswer {
  topicId: string;
  prompt: string;
  answer: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ReflectionChatSession {
  _id?: string;
  teamId: string;
  sessionId: string;
  status: ReflectionStatus;
  currentIndex: number;
  clarifyCount: number;
  messages: ChatMessage[];
  answers: ReflectionAnswer[];
  aiSummary: string;
  profileKey: string;
  weeklyInstructionsSnapshot: string;
  reflectionScore: number | null;
  reflectionColor: ReflectionColor | null;
  reflectionReasons: string[];
  submittedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
