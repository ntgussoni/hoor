import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/elevenlabs";
import { filterTranscriptionContent } from "@/lib/openai-filter";
import { generateSignedDownloadUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const { key, audioKey, language = "nl" } = await request.json();

    // Accept both 'key' and 'audioKey' for backward compatibility
    const audioFileKey = key || audioKey;

    if (!audioFileKey) {
      return NextResponse.json(
        { error: "No audio key provided" },
        { status: 400 }
      );
    }

    // Generate signed download URL for the audio file
    const downloadUrlResult = await generateSignedDownloadUrl(audioFileKey);

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

    function collectSegmentsBySpeaker(
      segments: NonNullable<typeof transcriptionResult.segments>
    ) {
      const speakerSegments: { speaker_id: string; text: string }[] = [];
      let currentSpeaker = segments[0]?.speaker_id || "Unknown";
      let currentText = "";

      segments.forEach((segment) => {
        const speaker = segment.speaker_id || "Unknown";
        if (speaker !== currentSpeaker) {
          speakerSegments.push({
            speaker_id: currentSpeaker,
            text: currentText.trim(),
          });
          currentSpeaker = speaker;
          currentText = segment.text;
        } else {
          currentText += `${segment.text}`;
        }
      });

      // Push the last accumulated segment
      if (currentText) {
        speakerSegments.push({
          speaker_id: currentSpeaker,
          text: currentText.trim(),
        });
      }

      return speakerSegments;
    }
    const parsedSegments = collectSegmentsBySpeaker(
      transcriptionResult.segments || []
    );

    // Filter content using OpenAI
    const filteredTranscription = await filterTranscriptionContent(
      parsedSegments
        .map((segment) => `${segment.speaker_id}: ${segment.text}`)
        .join("\n")
    );

    // Generate audio URL through our API route for proper access
    const audioUrl = `/api/audio/${audioFileKey}`;

    return NextResponse.json({
      success: true,
      transcription: filteredTranscription,
      originalTranscription: parsedSegments
        .map((segment) => `${segment.speaker_id}: ${segment.text}`)
        .join("\n"),
      audioUrl: audioUrl,
      language: transcriptionResult.language,
      audioKey: audioFileKey,
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
