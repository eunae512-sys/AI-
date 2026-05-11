import { NextResponse } from "next/server";
import { isPlaceholderKey } from "@/lib/api/demo-images";

export const runtime = "nodejs";

export async function GET() {
  const openai = process.env.OPENAI_API_KEY;
  const pexels = process.env.PEXELS_API_KEY;
  return NextResponse.json({
    ok: true,
    openai: {
      configured: !isPlaceholderKey(openai),
      length: openai ? openai.length : 0,
    },
    pexels: {
      configured: Boolean(pexels && pexels.trim() && pexels !== "YOUR_PEXELS_KEY"),
    },
  });
}
