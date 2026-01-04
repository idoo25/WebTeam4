import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";
import { REFLECTION_QUESTIONS } from "@/lib/reflection/questions";
import { runReflectionTurn, runReflectionSummary } from "@/lib/ai/gemini";
import { getTeamIdFromSession } from "@/lib/auth";
import type { ReflectionAnswer } from "@/lib/types";

export const runtime = "nodejs";

function wantsSummary(text: string) {
  const t = (text || "").trim();
  return t.includes("סכם") || t.includes("סיכום");
}

function isClearlyNonAnswer(text: string) {
  const t = (text || "").trim().toLowerCase();
  return (
    t === "" ||
    t === "לא יודע" ||
    t === "לא יודעת" ||
    t === "אין" ||
    t === "לא" ||
    t === "אין לי" ||
    t === "אין לנו"
  );
}

function isSufficientMinimalAnswer(text: string) {
  const t = (text || "").trim();
  if (isClearlyNonAnswer(t)) return false;

  // Minimal, but meaningful answers like "אב טיפוס" should pass
  // Feel free to tweak threshold to 1 if you want ultra-permissive:
  return t.length >= 2;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("team_session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getTeamIdFromSession(req);
  if (!teamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!sessionId || !text) {
    return NextResponse.json({ error: "Missing sessionId/text" }, { status: 400 });
  }

  await connectDB();

  const doc = await ReflectionChatSession.findOne({ teamId, sessionId });
  if (!doc) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (doc.status === "submitted") {
  const assistantText =
    "הרפלקציה כבר הוגשה ונשמרה ✅ כדי להתחיל רפלקציה חדשה, חזרו למסך הבית והיכנסו שוב ל״רפלקציה״ (או צרו Session חדש בטאב הזה).";
  return NextResponse.json({ text: assistantText, status: doc.status }, { status: 200 });
}

  doc.messages.push({ role: "user", text });

  // Explicit summary request
  if (wantsSummary(text) && doc.answers.length > 0) {
    const summary = await runReflectionSummary(
      (doc.answers as ReflectionAnswer[]).map((a) => ({ prompt: a.prompt, answer: a.answer }))
    );

    doc.aiSummary = summary;
    doc.status = "ready_to_submit";

    const assistantText = `${summary}\n\nהאם תרצו להגיש את הרפלקציה עכשיו? (כן/לא)`;
    doc.messages.push({ role: "model", text: assistantText });
    await doc.save();

    return NextResponse.json({ text: assistantText, status: doc.status, aiSummary: summary });
  }

  // Submit confirmation state
  if (doc.status === "ready_to_submit") {
    const yes = ["כן", "מאשר", "מאשרת", "להגיש", "הגש", "הגיש"].some((w) => text.includes(w));
    const no = ["לא", "עוד לא", "לא כרגע"].some((w) => text.includes(w));

    let assistantText = "";
    if (yes) {
      doc.status = "submitted";
      assistantText = "סגור ✅ הרפלקציה הוגשה ונשמרה. תרצו להתחיל רפלקציה חדשה בטאב הזה?";
    } else if (no) {
      doc.status = "in_progress";
      assistantText = "אין בעיה. מה תרצו לשפר/להוסיף לפני שנגיש?";
    } else {
      assistantText = "רק כדי לוודא: להגיש את הרפלקציה עכשיו? (כן/לא)";
    }

    doc.messages.push({ role: "model", text: assistantText });
    await doc.save();

    return NextResponse.json({ text: assistantText, status: doc.status });
  }

  const current = REFLECTION_QUESTIONS[doc.currentIndex] ?? null;
  const next = REFLECTION_QUESTIONS[doc.currentIndex + 1] ?? null;

  if (!current) {
    doc.status = "ready_to_submit";
    const assistantText = "נראה שסיימנו את כל השאלות. כתבו “סכם” כדי לקבל סיכום ולהגיש.";
    doc.messages.push({ role: "model", text: assistantText });
    await doc.save();
    return NextResponse.json({ text: assistantText, status: doc.status });
  }

  // Ask Gemini for phrasing + advance suggestion (but server controls progression)
  const raw = await runReflectionTurn({
    currentQuestion: current.prompt,
    nextQuestion: next ? next.prompt : null,
    userAnswer: text,
  });

  // Support both implementations:
  // 1) raw is string JSON
  // 2) raw is already an object { assistantText, advance }
  let parsed: { assistantText?: string; advance?: boolean } | null = null;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw as { assistantText?: string; advance?: boolean };
  }

  let assistantText =
    typeof parsed?.assistantText === "string" && parsed.assistantText.trim()
      ? parsed.assistantText.trim()
      : `קיבלתי. ${current.prompt}`;

  let advance = parsed?.advance === true;

  // ===== Server-first progression (DB controls order) =====
  // If the user gave a minimal meaningful answer, we progress even if the model was strict.
  const autoAdvance = isSufficientMinimalAnswer(text);
  if (autoAdvance) {
    advance = true;
  }

  if (advance) {
    // Reset clarification counter if you added it to schema
    doc.clarifyCount = 0;

    doc.answers.push({ questionId: current.id, prompt: current.prompt, answer: text });
    doc.currentIndex += 1;

    // Decide what to ask next (server decides)
    if (doc.currentIndex >= REFLECTION_QUESTIONS.length) {
      const summary = await runReflectionSummary(
        (doc.answers as ReflectionAnswer[]).map((a) => ({ prompt: a.prompt, answer: a.answer }))
      );

      doc.aiSummary = summary;
      doc.status = "ready_to_submit";

      const finalText = `${summary}\n\nהאם תרצו להגיש את הרפלקציה עכשיו? (כן/לא)`;
      doc.messages.push({ role: "model", text: finalText });
      await doc.save();

      return NextResponse.json({ text: finalText, status: doc.status, aiSummary: summary });
    } else {
      const nextQ = REFLECTION_QUESTIONS[doc.currentIndex]?.prompt ?? "";
      assistantText = `קיבלתי. ${nextQ}`;
    }
  } else {
    // If you keep clarification logic, it only matters when autoAdvance is false
    doc.clarifyCount = (doc.clarifyCount ?? 0) + 1;
  }

  doc.messages.push({ role: "model", text: assistantText });
  await doc.save();

  return NextResponse.json({
    text: assistantText,
    status: doc.status,
    currentIndex: doc.currentIndex,
  });
}
