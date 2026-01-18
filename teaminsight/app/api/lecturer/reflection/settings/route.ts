import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { jsonError } from "@/lib/apiUtils";
import ReflectionProfile from "@/models/ReflectionProfile";
import ReflectionSettings from "@/models/ReflectionSettings";

export const runtime = "nodejs";

async function ensureDefaults() {
  await ReflectionSettings.updateOne(
    { singletonKey: "global" },
    { $setOnInsert: { singletonKey: "global", selectedProfileKey: "default", weeklyInstructions: "" } },
    { upsert: true }
  );
}

export async function GET() {
  try {
    await connectDB();
    await ensureDefaults();

    const settings = await ReflectionSettings.findOne({ singletonKey: "global" }).lean();
    return NextResponse.json({
      ok: true,
      selectedProfileKey: settings?.selectedProfileKey || "default",
      weeklyInstructions: settings?.weeklyInstructions || "",
    });
  } catch (err: any) {
    console.error("GET /api/lecturer/reflection/settings error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    await ensureDefaults();

    const body = (await req.json().catch(() => null)) as { selectedProfileKey?: string; weeklyInstructions?: string } | null;
    const selectedProfileKey = (body?.selectedProfileKey || "default").trim() || "default";
    const weeklyInstructions = (body?.weeklyInstructions || "").trim();

    const exists = await ReflectionProfile.findOne({ key: selectedProfileKey }).select({ _id: 1 });
    if (!exists) return jsonError(400, "Invalid profile key", `Unknown profile: ${selectedProfileKey}`);

    await ReflectionSettings.updateOne(
      { singletonKey: "global" },
      { $set: { selectedProfileKey, weeklyInstructions } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PUT /api/lecturer/reflection/settings error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
