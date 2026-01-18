import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import Team from "@/models/Team";

export async function GET(_req, { params }) {
  try {
    await connectDB();
    const { teamId } = params;

    const teamExists = await Team.exists({ teamId });
    if (!teamExists) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const reflections = await ReflectionChatSession.find({ teamId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, reflections }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
