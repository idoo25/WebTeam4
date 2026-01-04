import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true, _id: false }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, unique: true, index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.ChatSession ||
  mongoose.model("ChatSession", ChatSessionSchema);
