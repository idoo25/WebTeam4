import mongoose, { Model, Schema } from "mongoose";

export type ChatMsgDoc = {
  role: "user" | "assistant";
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReflectionAnswerDoc = {
  topicId: string;
  prompt: string;
  answer: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReflectionChatSessionDoc = {
  teamId: string;
  sessionId: string;
  status: "in_progress" | "ready_to_submit" | "submitted";
  currentIndex: number;
  clarifyCount: number;
  messages: ChatMsgDoc[];
  answers: ReflectionAnswerDoc[];
  aiSummary: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const MessageSchema = new Schema<ChatMsgDoc>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true, _id: false }
);

const AnswerSchema = new Schema<ReflectionAnswerDoc>(
  {
    topicId: { type: String, required: true },
    prompt: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true, _id: false }
);

const ReflectionChatSessionSchema = new Schema<ReflectionChatSessionDoc>(
  {
    teamId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: ["in_progress", "ready_to_submit", "submitted"],
      default: "in_progress",
    },

    currentIndex: { type: Number, default: 0 },
    clarifyCount: { type: Number, default: 0 },

    messages: { type: [MessageSchema], default: [] },
    answers: { type: [AnswerSchema], default: [] },

    aiSummary: { type: String, default: "" },
  },
  { timestamps: true }
);

ReflectionChatSessionSchema.index({ teamId: 1, sessionId: 1 }, { unique: true });

const ModelRef =
  (mongoose.models.ReflectionChatSession as Model<ReflectionChatSessionDoc>) ||
  mongoose.model<ReflectionChatSessionDoc>("ReflectionChatSession", ReflectionChatSessionSchema);

export default ModelRef;
