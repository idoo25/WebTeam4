import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";

/* =========================
   GET /api/teams/[teamId]/chat
   ========================= */
export async function GET(_req, context) {
  try {
    await connectDB();
    const { teamId } = await context.params;

    const session = await ReflectionChatSession.findOne({ teamId }).lean();

    return NextResponse.json(
      { ok: true, messages: session?.messages || [] },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}

/* =========================
   POST /api/teams/[teamId]/chat
   ========================= */
export async function POST(request, context) {
  try {
    await connectDB();
    const { teamId } = await context.params;
    const { role, text } = await request.json();

    if (!role || !text) {
      return NextResponse.json(
        { error: "role and text are required" },
        { status: 400 }
      );
    }

    await ChatSession.findOneAndUpdate(
      { teamId },
      { $push: { messages: { role, text } } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
