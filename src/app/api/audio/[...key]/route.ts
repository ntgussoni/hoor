import { NextRequest, NextResponse } from "next/server";
import { generateSignedDownloadUrl } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;

    if (!key || key.length === 0) {
      return NextResponse.json(
        { error: "No audio key provided" },
        { status: 400 }
      );
    }

    // Join the key segments back together
    // e.g., ["recordings", "1757270063860-3ltl0fr4izt.webm"] -> "recordings/1757270063860-3ltl0fr4izt.webm"
    const fullKey = key.join("/");

    // Generate signed download URL with longer expiration for audio playback
    const downloadUrlResult = await generateSignedDownloadUrl(fullKey, 7200); // 2 hours

    if (!downloadUrlResult.success) {
      return NextResponse.json(
        { error: "Failed to generate audio URL" },
        { status: 500 }
      );
    }

    // Redirect to the signed URL so the browser can play the audio directly
    return NextResponse.redirect(downloadUrlResult.signedUrl!);
  } catch (error) {
    console.error("Audio serving error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
