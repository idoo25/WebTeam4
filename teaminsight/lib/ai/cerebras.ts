import Cerebras from "@cerebras/cerebras_cloud_sdk";
import {
  REFLECTION_CONTROLLER_PROMPT,
  REFLECTION_INTERVIEWER_PROMPT,
  REFLECTION_FINAL_SUMMARY_PROMPT,
} from "./reflectionPrompts";
import { REFLECTION_TOPICS } from "@/lib/reflection/topics";

const apiKey = process.env.CEREBRAS_API_KEY;
if (!apiKey) throw new Error("Missing CEREBRAS_API_KEY");

const client = new Cerebras({ apiKey });

export type ChatMsg = { role: "user" | "assistant"; text: string };

export type ReflectionAnswer = {
  topicId: string;
  prompt: string;
  answer: string;
};

export type NextIntent = {
  kind: "clarify_current" | "advance_topic" | "wrap_up";
  topicId: string | null;
  anchor: string;
  styleNote: string;
  questions: string[];
};

export type ControllerInput = {
  messages: ChatMsg[];
  answers: ReflectionAnswer[];
  runningSummary: string;
  clarifyCount: number;
  turnCount: number;
  maxTurns: number;
  recentSummaries: string[];
};

export type ControllerResult = {
  runningSummary: string;
  answers: ReflectionAnswer[];
  nextIntent: NextIntent;
  readyToSubmit: boolean;
  clarifyCount: number;
  turnCount: number;
};

function stripCodeFences(s: string) {
  const t = (s || "").trim();
  if (t.startsWith("```")) {
    return t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }
  return t;
}

function safeParseController(raw: string, fallback: ControllerResult): ControllerResult {
  const cleaned = stripCodeFences(raw);

  try {
    const obj = JSON.parse(cleaned);
    if (!obj || typeof obj !== "object") return fallback;

    const ni = (obj as any).nextIntent;
    if (!ni || typeof ni !== "object") return fallback;

    const questionsRaw = Array.isArray(ni.questions) ? ni.questions : [];
    const questions = questionsRaw
      .filter((q: any) => typeof q === "string")
      .map((q: string) => q.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (questions.length === 0) return fallback;

    const kind = ni.kind;
    const validKind: NextIntent["kind"] =
      kind === "clarify_current" || kind === "advance_topic" || kind === "wrap_up"
        ? kind
        : fallback.nextIntent.kind;

    return {
      runningSummary:
        typeof (obj as any).runningSummary === "string"
          ? (obj as any).runningSummary.trim()
          : fallback.runningSummary,
      answers: Array.isArray((obj as any).answers) ? (obj as any).answers : fallback.answers,
      nextIntent: {
        kind: validKind,
        topicId: typeof ni.topicId === "string" ? ni.topicId : null,
        anchor: typeof ni.anchor === "string" ? ni.anchor.trim() : fallback.nextIntent.anchor,
        styleNote: typeof ni.styleNote === "string" ? ni.styleNote.trim() : "",
        questions,
      },
      readyToSubmit: (obj as any).readyToSubmit === true,
      clarifyCount: Number.isFinite((obj as any).clarifyCount) ? (obj as any).clarifyCount : fallback.clarifyCount,
      turnCount: Number.isFinite((obj as any).turnCount) ? (obj as any).turnCount : fallback.turnCount,
    };
  } catch {
    return fallback;
  }
}

export async function runReflectionController(input: ControllerInput): Promise<ControllerResult> {
  const payload = JSON.stringify({ ...input, topics: REFLECTION_TOPICS });

  const response = await client.chat.completions.create({
    model: "llama3.1-8b",
    messages: [
      { role: "system", content: REFLECTION_CONTROLLER_PROMPT },
      { role: "user", content: payload },
    ],
  });

  const fallback: ControllerResult = {
    runningSummary: input.runningSummary || "",
    answers: input.answers || [],
    nextIntent: {
      kind: "advance_topic",
      topicId: "achievements",
      anchor: "יאללה נתחיל מהשבוע שלכם",
      styleNote: "short open question",
      questions: ["מה התוצר הכי משמעותי שהשלמתם השבוע?"],
    },
    readyToSubmit: false,
    clarifyCount: input.clarifyCount || 0,
    turnCount: input.turnCount || 0,
  };

  const text = response.choices[0]?.message?.content ?? "{}";
  return safeParseController(text, fallback);
}

export async function runReflectionInterviewer(args: {
  messages: ChatMsg[];
  nextIntent: NextIntent;
}): Promise<string> {
  const payload = JSON.stringify(args);

  const response = await client.chat.completions.create({
    model: "llama3.1-8b",
    messages: [
      { role: "system", content: REFLECTION_INTERVIEWER_PROMPT },
      { role: "user", content: payload },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || "קיבלתי. אפשר לשתף עוד קצת?";
}

export async function runReflectionFinalSummary(input: {
  answers: ReflectionAnswer[];
  runningSummary: string;
}): Promise<string> {
  const payload = JSON.stringify(input);

  const response = await client.chat.completions.create({
    model: "llama3.1-8b",
    messages: [
      { role: "system", content: REFLECTION_FINAL_SUMMARY_PROMPT },
      { role: "user", content: payload },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
