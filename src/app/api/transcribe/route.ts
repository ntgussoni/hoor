import { NextRequest, NextResponse } from "next/server";
import {
  transcribeAudio,
  formatTranscriptionWithSpeakers,
} from "@/lib/elevenlabs";
import { filterTranscriptionContent } from "@/lib/openai-filter";
import { generateSignedDownloadUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const { key, language = "nl" } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: "No audio key provided" },
        { status: 400 }
      );
    }

    // Generate signed download URL for the audio file
    const downloadUrlResult = await generateSignedDownloadUrl(key);

    if (!downloadUrlResult.success) {
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    // Transcribe using ElevenLabs with signed URL (no need to download)
    const transcriptionResult = await transcribeAudio(
      downloadUrlResult.signedUrl!,
      language
    );

    if (!transcriptionResult.success) {
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: 500 }
      );
    }

    // Format transcription with speaker labels
    const formattedTranscription = formatTranscriptionWithSpeakers(
      transcriptionResult.segments || []
    );

    // Filter content using OpenAI
    const filteredTranscription = await filterTranscriptionContent(
      formattedTranscription
    );

    return NextResponse.json({
      success: true,
      transcription: filteredTranscription,
      originalTranscription: formattedTranscription,
      language: transcriptionResult.language,
      audioKey: key,
      warnings: transcriptionResult.warnings,
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
