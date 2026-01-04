import { GoogleGenAI } from "@google/genai";
import {
  TEAM_FEEDBACK_SYSTEM_PROMPT,
  TEAM_FREE_CHAT_SYSTEM_PROMPT,
  TEAM_REFLECTION_SYSTEM_PROMPT,
  TEAM_REFLECTION_TURN_PROMPT,
  TEAM_REFLECTION_SUMMARY_PROMPT,
} from "./prompts";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });

export type ChatMsg = { role: "user" | "model"; text: string };

/**
 * Internal helper to run a chat with Gemini AI
 * @param systemPrompt - The system prompt to set context for the AI
 * @param messages - Array of chat messages
 * @returns The AI response text
 */
async function runChat(systemPrompt: string, messages: ChatMsg[]) {
  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    ...messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });

  return response.text ?? "";
}

/**
 * Run team feedback chat with Gemini AI
 * @param messages - Array of chat messages
 * @returns The AI response text
 */
export async function runTeamFeedbackChat(messages: ChatMsg[]) {
  return runChat(TEAM_FEEDBACK_SYSTEM_PROMPT, messages);
}

/**
 * Run team free chat with Gemini AI for general collaboration topics
 * @param messages - Array of chat messages
 * @returns The AI response text
 */
export async function runTeamFreeChat(messages: ChatMsg[]) {
  return runChat(TEAM_FREE_CHAT_SYSTEM_PROMPT, messages);
}

/**
 * Run team reflection chat with Gemini AI (Method B: Model-driven)
 * NOTE: This function corresponds to "model-driven" reflection (Method B).
 * For DB-driven reflection (Method A), use runReflectionTurn/runReflectionSummary below.
 * 
 * @param messages - Array of chat messages
 * @returns The AI response text
 */
export async function runTeamReflectionChat(messages: ChatMsg[]) {
  return runChat(TEAM_REFLECTION_SYSTEM_PROMPT, messages);
}

// =========================
// Reflection (Method A): DB/server controls order
// =========================

export type ReflectionTurnInput = {
  currentQuestion: string;
  nextQuestion: string | null;
  userAnswer: string;
};

export type ReflectionTurnResult = {
  assistantText: string;
  advance: boolean;
};

/**
 * Strip markdown code fences from a string
 * @param s - String potentially wrapped in code fences
 * @returns Cleaned string without code fences
 */
function stripCodeFences(s: string) {
  const t = (s || "").trim();
  if (t.startsWith("```")) {
    return t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }
  return t;
}

/**
 * Safely parse reflection turn result from AI response
 * Provides fallback if parsing fails
 * 
 * @param raw - Raw response from AI
 * @returns Parsed reflection turn result with assistantText and advance flag
 */
function safeParseTurnResult(raw: string): ReflectionTurnResult {
  const cleaned = stripCodeFences(raw);

  try {
    const obj = JSON.parse(cleaned);
    const assistantText =
      typeof obj?.assistantText === "string" ? obj.assistantText.trim() : "";
    const advance = obj?.advance === true;

    if (!assistantText) {
      return { assistantText: "קיבלתי. אפשר לפרט קצת יותר?", advance: false };
    }

    return { assistantText, advance };
  } catch {
    // Fallback: keep the app running even if the model returns bad JSON
    return { assistantText: "קיבלתי. אפשר לפרט קצת יותר?", advance: false };
  }
}

/**
 * Run a single turn of guided reflection
 * Asks Gemini to evaluate the user's answer and decide whether to advance to the next question
 * 
 * @param input - Reflection turn input with current question, next question, and user answer
 * @returns Promise resolving to reflection turn result with AI response and advance decision
 */
export async function runReflectionTurn(input: ReflectionTurnInput): Promise<ReflectionTurnResult> {
  const payload = JSON.stringify(input);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user" as const, parts: [{ text: TEAM_REFLECTION_TURN_PROMPT }] },
      { role: "user" as const, parts: [{ text: payload }] },
    ],
  });

  return safeParseTurnResult(response.text ?? "{}");
}

/**
 * Generate a summary of reflection answers using Gemini AI
 * 
 * @param answers - Array of question-answer pairs from the reflection session
 * @returns Promise resolving to AI-generated summary in Hebrew
 */
export async function runReflectionSummary(
  answers: Array<{ prompt: string; answer: string }>
): Promise<string> {
  const payload = JSON.stringify(answers);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user" as const, parts: [{ text: TEAM_REFLECTION_SUMMARY_PROMPT }] },
      { role: "user" as const, parts: [{ text: payload }] },
    ],
  });

  return (response.text ?? "").trim();
}
