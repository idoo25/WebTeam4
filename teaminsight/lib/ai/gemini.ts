import Cerebras from "@cerebras/cerebras_cloud_sdk";
import {
  REFLECTION_CONTROLLER_PROMPT,
  REFLECTION_INTERVIEWER_PROMPT,
  REFLECTION_FINAL_SUMMARY_PROMPT,
  REFLECTION_EVALUATION_PROMPT,
} from "./reflectionPrompts";
import { REFLECTION_TOPICS } from "@/lib/reflection/topics";
import {
  ChatMsg, ReflectionAnswer, ControllerAnalysis, NextDirective, NextIntent,
  ReflectionPolicy, ControllerInput, ControllerResult, THSComponents, ReflectionEval,
  TUCKMAN_STAGES, DETECTED_PATTERNS, REFLECTIVE_DEPTHS, SENTIMENT_TONES,
  DIRECTIVE_STRATEGIES, DIRECTIVE_TONES, INTENT_KINDS, ANOMALY_FLAGS,
  TuckmanStage, DirectiveStrategy, ReflectiveDepth,
} from "@/lib/types";
import { validateEnum, validateNumber, validateString, validateArray, isString } from "@/lib/apiUtils";

// Re-export types for backward compatibility
export type {
  ChatMsg, ReflectionAnswer, ControllerAnalysis, NextDirective, NextIntent,
  ReflectionPolicy, ControllerInput, ControllerResult, THSComponents, ReflectionEval,
  TuckmanStage, ReflectiveDepth,
} from "@/lib/types";
export type { DetectedPattern, SentimentTone, DirectiveStrategy, DirectiveTone, AnomalyFlag, THSComponent } from "@/lib/types";

const apiKey = process.env.CEREBRAS_API_KEY;
if (!apiKey) throw new Error("Missing CEREBRAS_API_KEY");

const client = new Cerebras({ apiKey });

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function stripCodeFences(s: string): string {
  const t = (s || "").trim();
  return t.startsWith("```") ? t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```[\s]*$/, "").trim() : t;
}

const clamp0to10 = (x: unknown) => validateNumber(x, 0, 10, 5);
const clamp0to100 = (x: unknown) => validateNumber(x, 0, 100, 50);

function defaultPolicy(): ReflectionPolicy {
  return { profile: { key: "default", title: "Default", controllerAddendum: "", evaluatorAddendum: "" }, weeklyInstructions: "" };
}

function defaultAnalysis(): ControllerAnalysis {
  return {
    tuckmanStage: "forming", tuckmanReasoning: "Initial assessment",
    psychologicalSafety: 5, safetyIndicators: [], detectedPatterns: [],
    patternEvidence: "", reflectiveDepth: "descriptive",
    sentimentTone: "neutral", participationEquity: "Unknown",
  };
}

function defaultNextDirective(): NextDirective {
  return {
    strategy: "probe_deeper", tone: "warm", targetUser: null,
    keyQuestion: "ספרו לי על שיתוף הפעולה בצוות השבוע - מה עבד טוב?",
    questionRationale: "Starting conversation", anchor: "בואו נתחיל לדבר על איך עבדתם יחד",
    historyReference: "", avoidTopics: [], urgentTopics: ["collaboration"],
  };
}

function directiveToIntent(d: NextDirective): NextIntent {
  const strategyToKind: Record<DirectiveStrategy, NextIntent["kind"]> = {
    probe_deeper: "clarify_current", mediate_conflict: "clarify_current",
    break_silence: "advance_topic", challenge_groupthink: "clarify_current",
    address_loafer: "clarify_current", elevate_reflection: "advance_topic", wrap_up: "wrap_up",
  };
  return {
    kind: strategyToKind[d.strategy] || "advance_topic",
    topicId: d.urgentTopics[0] || null, anchor: d.anchor, styleNote: d.tone,
    questionGoal: d.keyQuestion, missingInfo: d.urgentTopics,
    userContext: d.questionRationale, historyReference: d.historyReference,
  };
}

// ============================================================================
// PARSERS
// ============================================================================

function safeParseController(raw: string, fallback: ControllerResult): ControllerResult {
  try {
    const obj = JSON.parse(stripCodeFences(raw));
    if (!obj || typeof obj !== "object") return fallback;

    const ar = obj.analysis || {};
    const analysis: ControllerAnalysis = {
      tuckmanStage: validateEnum(ar.tuckmanStage, TUCKMAN_STAGES, fallback.analysis.tuckmanStage),
      tuckmanReasoning: validateString(ar.tuckmanReasoning, fallback.analysis.tuckmanReasoning),
      psychologicalSafety: clamp0to10(ar.psychologicalSafety) || fallback.analysis.psychologicalSafety,
      safetyIndicators: validateArray(ar.safetyIndicators, isString),
      detectedPatterns: validateArray(ar.detectedPatterns, (p): p is typeof DETECTED_PATTERNS[number] => DETECTED_PATTERNS.includes(p as any)),
      patternEvidence: validateString(ar.patternEvidence, ""),
      reflectiveDepth: validateEnum(ar.reflectiveDepth, REFLECTIVE_DEPTHS, fallback.analysis.reflectiveDepth),
      sentimentTone: validateEnum(ar.sentimentTone, SENTIMENT_TONES, fallback.analysis.sentimentTone),
      participationEquity: validateString(ar.participationEquity, fallback.analysis.participationEquity),
    };

    const nd = obj.nextDirective || {};
    const nextDirective: NextDirective = {
      strategy: validateEnum(nd.strategy, DIRECTIVE_STRATEGIES, fallback.nextDirective.strategy),
      tone: validateEnum(nd.tone, DIRECTIVE_TONES, fallback.nextDirective.tone),
      targetUser: typeof nd.targetUser === "string" ? nd.targetUser : null,
      keyQuestion: validateString(nd.keyQuestion, fallback.nextDirective.keyQuestion),
      questionRationale: validateString(nd.questionRationale, ""),
      anchor: validateString(nd.anchor, fallback.nextDirective.anchor),
      historyReference: validateString(nd.historyReference, ""),
      avoidTopics: validateArray(nd.avoidTopics, isString),
      urgentTopics: validateArray(nd.urgentTopics, isString),
    };

    const ni = obj.nextIntent;
    const nextIntent: NextIntent = ni && typeof ni === "object" ? {
      kind: validateEnum(ni.kind, INTENT_KINDS, "advance_topic"),
      topicId: typeof ni.topicId === "string" ? ni.topicId : null,
      anchor: validateString(ni.anchor, nextDirective.anchor),
      styleNote: validateString(ni.styleNote, nextDirective.tone),
      questionGoal: validateString(ni.questionGoal, nextDirective.keyQuestion),
      missingInfo: validateArray(ni.missingInfo, isString),
      userContext: validateString(ni.userContext, ""),
      historyReference: validateString(ni.historyReference, nextDirective.historyReference),
    } : directiveToIntent(nextDirective);

    return {
      thinking: validateString(obj.thinking, fallback.thinking),
      analysis, runningSummary: validateString(obj.runningSummary, fallback.runningSummary),
      answers: Array.isArray(obj.answers) ? obj.answers : fallback.answers,
      nextDirective, nextIntent, readyToSubmit: obj.readyToSubmit === true,
      clarifyCount: Number.isFinite(obj.clarifyCount) ? obj.clarifyCount : fallback.clarifyCount,
      turnCount: Number.isFinite(obj.turnCount) ? obj.turnCount : fallback.turnCount,
    };
  } catch {
    return fallback;
  }
}

function safeParseEvaluation(raw: string): ReflectionEval {
  const defaultEval: ReflectionEval = {
    teamHealthScore: 50,
    components: {
      participationEquity: { score: 50, breakdown: "לא זמין" },
      constructiveSentiment: { score: 50, breakdown: "לא זמין" },
      reflectiveDepth: { score: 50, level: "descriptive", breakdown: "לא זמין" },
      conflictResolution: { score: 50, breakdown: "לא זמין" },
    },
    riskLevel: 5, riskExplanation: "לא זמין", tuckmanStage: "forming",
    tuckmanExplanation: "לא זמין", anomalyFlags: [], strengths: [],
    concerns: [], recommendations: [], quality: 5, risk: 5, compliance: 5,
    qualityBreakdown: "לא הצלחתי לנתח — ברירת מחדל.",
    riskBreakdown: "לא הצלחתי לנתח — ברירת מחדל.",
    complianceBreakdown: "לא הצלחתי לנתח — ברירת מחדל.",
    reasons: ["לא הצלחתי לנתח בוודאות — הוחזר סיווג ברירת מחדל."],
  };

  try {
    const obj = JSON.parse(stripCodeFences(raw));
    if (!obj || typeof obj !== "object") return defaultEval;

    const comps = obj.components || {};
    const parseComp = (c: any, def: { score: number; breakdown: string }) => ({
      score: clamp0to100(c?.score) || def.score,
      breakdown: validateString(c?.breakdown, def.breakdown),
    });

    const components: THSComponents = {
      participationEquity: parseComp(comps.participationEquity, defaultEval.components.participationEquity),
      constructiveSentiment: parseComp(comps.constructiveSentiment, defaultEval.components.constructiveSentiment),
      reflectiveDepth: {
        ...parseComp(comps.reflectiveDepth, defaultEval.components.reflectiveDepth),
        level: validateEnum(comps.reflectiveDepth?.level, REFLECTIVE_DEPTHS, "descriptive"),
      },
      conflictResolution: parseComp(comps.conflictResolution, defaultEval.components.conflictResolution),
    };

    const calculatedTHS = (0.25 * components.participationEquity.score) +
      (0.15 * components.constructiveSentiment.score) +
      (0.40 * components.reflectiveDepth.score) +
      (0.20 * components.conflictResolution.score);

    const teamHealthScore = clamp0to100(obj.teamHealthScore) || Math.round(calculatedTHS);
    const parseStrArr = (arr: unknown, max = 5) => validateArray(arr, isString, max).map(s => s.trim()).filter(Boolean);

    const strengths = parseStrArr(obj.strengths);
    const concerns = parseStrArr(obj.concerns);
    const reasons = parseStrArr(obj.reasons);

    return {
      teamHealthScore, components,
      riskLevel: clamp0to10(obj.riskLevel) || clamp0to10(obj.risk) || 5,
      riskExplanation: validateString(obj.riskExplanation, obj.riskBreakdown || "לא זמין"),
      tuckmanStage: validateEnum(obj.tuckmanStage, TUCKMAN_STAGES, "forming"),
      tuckmanExplanation: validateString(obj.tuckmanExplanation, "לא זמין"),
      anomalyFlags: validateArray(obj.anomalyFlags, (f): f is typeof ANOMALY_FLAGS[number] => ANOMALY_FLAGS.includes(f as any)),
      strengths, concerns, recommendations: parseStrArr(obj.recommendations),
      quality: clamp0to10(obj.quality) || Math.round(components.reflectiveDepth.score / 10),
      risk: clamp0to10(obj.risk) || clamp0to10(obj.riskLevel) || 5,
      compliance: clamp0to10(obj.compliance) || 5,
      qualityBreakdown: validateString(obj.qualityBreakdown, components.reflectiveDepth.breakdown),
      riskBreakdown: validateString(obj.riskBreakdown, obj.riskExplanation || "לא זמין"),
      complianceBreakdown: validateString(obj.complianceBreakdown, "לא זמין"),
      reasons: reasons.length > 0 ? reasons : [...strengths, ...concerns].slice(0, 5) || defaultEval.reasons,
    };
  } catch {
    return defaultEval;
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function callCerebras(systemPrompt: string, payload: object): Promise<string> {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [
      { role: "user", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

export async function runReflectionController(input: ControllerInput): Promise<ControllerResult> {
  const policy = input.policy ?? defaultPolicy();
  const payload = { ...input, topics: REFLECTION_TOPICS, policy };
  const raw = await callCerebras(REFLECTION_CONTROLLER_PROMPT, payload);

  const fallback: ControllerResult = {
    thinking: "Starting reflection. Assessing team dynamics.",
    analysis: defaultAnalysis(), runningSummary: input.runningSummary || "",
    answers: input.answers || [], nextDirective: defaultNextDirective(),
    nextIntent: directiveToIntent(defaultNextDirective()), readyToSubmit: false,
    clarifyCount: input.clarifyCount || 0, turnCount: input.turnCount || 0,
  };
  return safeParseController(raw, fallback);
}

export async function runReflectionInterviewer(args: {
  messages: ChatMsg[];
  nextIntent?: NextIntent;
  nextDirective?: NextDirective;
}): Promise<string> {
  const payload = { messages: args.messages, nextIntent: args.nextIntent, nextDirective: args.nextDirective, topics: REFLECTION_TOPICS };
  const result = await callCerebras(REFLECTION_INTERVIEWER_PROMPT, payload);
  return result.trim() || "קיבלתי. אפשר לשתף עוד קצת?";
}

export async function runReflectionFinalSummary(input: {
  answers: ReflectionAnswer[];
  runningSummary: string;
  messages?: ChatMsg[];
}): Promise<string> {
  return (await callCerebras(REFLECTION_FINAL_SUMMARY_PROMPT, input)).trim();
}

export async function runReflectionEvaluation(input: {
  summary: string;
  answers: ReflectionAnswer[];
  messages?: ChatMsg[];
  policy?: ReflectionPolicy;
}): Promise<ReflectionEval> {
  const policy = input.policy ?? defaultPolicy();
  const raw = await callCerebras(REFLECTION_EVALUATION_PROMPT, { ...input, policy });
  return safeParseEvaluation(raw);
}
