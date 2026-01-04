import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runTeamFeedbackChat } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("team_session")?.value;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  const valid =
    messages.length > 0 &&
    messages.every(
      (m: unknown): m is { role: string; text: string } =>
        typeof m === "object" &&
        m !== null &&
        "role" in m &&
        "text" in m &&
        (m.role === "user" || m.role === "model") &&
        typeof m.text === "string"
    );

  if (!valid) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  const text = await runTeamFeedbackChat(messages);
  return NextResponse.json({ text });
}
