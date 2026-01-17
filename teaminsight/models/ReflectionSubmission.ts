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

export type ReflectionSubmissionDoc = {
  teamId: string;
  sessionId: string;
  summary: string;
  messages: ChatMsgDoc[];
  answers: ReflectionAnswerDoc[];
  submittedAt: Date;
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

const ReflectionSubmissionSchema = new Schema<ReflectionSubmissionDoc>(
  {
    teamId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },

    summary: { type: String, required: true },

    messages: { type: [MessageSchema], default: [] },
    answers: { type: [AnswerSchema], default: [] },

    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ReflectionSubmissionSchema.index({ teamId: 1, submittedAt: -1 });

const ModelRef =
  (mongoose.models.ReflectionSubmission as Model<ReflectionSubmissionDoc>) ||
  mongoose.model<ReflectionSubmissionDoc>("ReflectionSubmission", ReflectionSubmissionSchema);

export default ModelRef;
