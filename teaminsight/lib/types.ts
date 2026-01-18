// ============================================================================
// SHARED TYPES FOR REFLECTION SYSTEM
// ============================================================================

// Basic message type
export type ChatMsg = { role: "user" | "model"; text: string };

export type ReflectionAnswer = {
  topicId: string;
  prompt: string;
  answer: string;
};

// ============================================================================
// TUCKMAN'S STAGES & ENUMS
// ============================================================================

export const TUCKMAN_STAGES = ["forming", "storming", "norming", "performing", "adjourning"] as const;
export type TuckmanStage = (typeof TUCKMAN_STAGES)[number];

export const DETECTED_PATTERNS = [
  "social_loafer", "passive_aggressive", "groupthink",
  "blame_game", "silence", "potential_loafer"
] as const;
export type DetectedPattern = (typeof DETECTED_PATTERNS)[number];

export const REFLECTIVE_DEPTHS = ["descriptive", "comparative", "critical", "transformative"] as const;
export type ReflectiveDepth = (typeof REFLECTIVE_DEPTHS)[number];

export const SENTIMENT_TONES = ["tense", "apathetic", "enthusiastic", "frustrated", "neutral", "defensive"] as const;
export type SentimentTone = (typeof SENTIMENT_TONES)[number];

export const DIRECTIVE_STRATEGIES = [
  "probe_deeper", "mediate_conflict", "break_silence",
  "challenge_groupthink", "address_loafer", "elevate_reflection", "wrap_up"
] as const;
export type DirectiveStrategy = (typeof DIRECTIVE_STRATEGIES)[number];

export const DIRECTIVE_TONES = ["warm", "curious", "firm", "playful", "empathetic", "mediator"] as const;
export type DirectiveTone = (typeof DIRECTIVE_TONES)[number];

export const INTENT_KINDS = ["clarify_current", "advance_topic", "wrap_up"] as const;
export type IntentKind = (typeof INTENT_KINDS)[number];

export const ANOMALY_FLAGS = ["red_zone", "silent_dropout", "toxic_spike", "chronic_issue"] as const;
export type AnomalyFlag = (typeof ANOMALY_FLAGS)[number];

// ============================================================================
// CONTROLLER TYPES
// ============================================================================

export type ControllerAnalysis = {
  tuckmanStage: TuckmanStage;
  tuckmanReasoning: string;
  psychologicalSafety: number;
  safetyIndicators: string[];
  detectedPatterns: DetectedPattern[];
  patternEvidence: string;
  reflectiveDepth: ReflectiveDepth;
  sentimentTone: SentimentTone;
  participationEquity: string;
};

export type NextDirective = {
  strategy: DirectiveStrategy;
  tone: DirectiveTone;
  targetUser: string | null;
  keyQuestion: string;
  questionRationale: string;
  anchor: string;
  historyReference: string;
  avoidTopics: string[];
  urgentTopics: string[];
};

export type NextIntent = {
  kind: IntentKind;
  topicId: string | null;
  anchor: string;
  styleNote: string;
  questionGoal: string;
  missingInfo: string[];
  userContext: string;
  historyReference: string;
};

export type ReflectionPolicy = {
  profile: {
    key: string;
    title?: string;
    controllerAddendum?: string;
    evaluatorAddendum?: string;
  };
  weeklyInstructions: string;
};

export type ControllerInput = {
  messages: ChatMsg[];
  answers: ReflectionAnswer[];
  runningSummary: string;
  clarifyCount: number;
  turnCount: number;
  maxTurns: number;
  recentSummaries: string[];
  policy?: ReflectionPolicy;
};

export type ControllerResult = {
  thinking: string;
  analysis: ControllerAnalysis;
  runningSummary: string;
  answers: ReflectionAnswer[];
  nextDirective: NextDirective;
  nextIntent: NextIntent;
  readyToSubmit: boolean;
  clarifyCount: number;
  turnCount: number;
};

// ============================================================================
// THS (TEAM HEALTH SCORE) TYPES
// ============================================================================

export type THSComponent = {
  score: number;
  breakdown: string;
};

export type THSComponents = {
  participationEquity: THSComponent;
  constructiveSentiment: THSComponent;
  reflectiveDepth: THSComponent & { level: ReflectiveDepth };
  conflictResolution: THSComponent;
};

export type ReflectionEval = {
  teamHealthScore: number;
  components: THSComponents;
  riskLevel: number;
  riskExplanation: string;
  tuckmanStage: TuckmanStage;
  tuckmanExplanation: string;
  anomalyFlags: AnomalyFlag[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  // Legacy fields
  quality: number;
  risk: number;
  compliance: number;
  qualityBreakdown: string;
  riskBreakdown: string;
  complianceBreakdown: string;
  reasons: string[];
};
