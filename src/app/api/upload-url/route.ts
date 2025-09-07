import { NextRequest, NextResponse } from "next/server";
import { generateSignedUploadUrl, generateUniqueKey } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    // Generate unique key for the file
    const key = generateUniqueKey(fileName);

    // Generate signed upload URL
    const result = await generateSignedUploadUrl(key, contentType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      signedUrl: result.signedUrl,
      key: result.key,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
