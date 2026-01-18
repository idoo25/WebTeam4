import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";

export async function GET(_req, context) {
  try {
    await connectDB();
    const { teamId } = await context.params;
    const session = await ReflectionChatSession.findOne({ teamId }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ ok: true, messages: session?.messages || [] });
  } catch (err) {
    return NextResponse.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}
