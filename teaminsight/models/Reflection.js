import mongoose from "mongoose";

const ReflectionSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, index: true },
    memberId: { type: String, required: true },
    answers: [
      {
        questionId: { type: String, required: true },
        prompt: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    freeText: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for unique reflection per team member
ReflectionSchema.index({ teamId: 1, memberId: 1 });

export default mongoose.models.Reflection ||
  mongoose.model("Reflection", ReflectionSchema);
