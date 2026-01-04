/**
 * Shared TypeScript type definitions used across the application
 */

/**
 * Reflection answer structure
 */
export type ReflectionAnswer = {
  questionId: string;
  prompt: string;
  answer: string;
  createdAt?: Date;
};

/**
 * Chat message structure used in AI interactions
 */
export type ChatMessage = {
  role: "user" | "model";
  text: string;
  createdAt?: Date;
};

/**
 * Team status levels
 */
export type TeamStatus = "green" | "yellow" | "red";

/**
 * Alert severity levels
 */
export type AlertSeverity = "yellow" | "red";

/**
 * Message role in thread conversations
 */
export type MessageRole = "team" | "lecturer";

/**
 * Reflection session status
 */
export type ReflectionStatus = "in_progress" | "ready_to_submit" | "submitted";

/**
 * Thread status
 */
export type ThreadStatus = "open" | "closed";
