import { elevenlabs } from "@ai-sdk/elevenlabs";
import { experimental_transcribe as transcribe } from "ai";

export async function transcribeAudio(
  audioUrl: string,
  language: string = "nl"
) {
  try {
    const result = await transcribe({
      model: elevenlabs.transcription("scribe_v1"),
      audio: new URL(audioUrl),
      providerOptions: {
        elevenlabs: {
          languageCode: language,
          diarize: true, // Enable speaker separation
          tagAudioEvents: true, // Tag audio events like laughter, etc.
          timestampsGranularity: "word", // Get word-level timestamps
        },
      },
    });

    return {
      success: true,
      transcription: result.text,
      segments: result.segments || [],
      language: result.language || language,
      warnings: result.warnings || [],
    };
  } catch (error) {
    console.error("ElevenLabs transcription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcription failed",
    };
  }
}

export function formatTranscriptionWithSpeakers(
  segments: Array<{ speaker_id?: string; text: string }>
): string {
  if (!segments || segments.length === 0) return "";

  let formattedText = "";
  let currentSpeaker = "";

  for (const word of segments) {
    const speaker = word.speaker_id || "unknown";

    // Add speaker label when speaker changes
    if (speaker !== currentSpeaker) {
      if (currentSpeaker !== "") {
        formattedText += "\n\n";
      }

      // Map speaker IDs to readable names
      const speakerName = mapSpeakerIdToName(speaker);
      formattedText += `${speakerName}: `;
      currentSpeaker = speaker;
    }

    formattedText += word.text + " ";
  }

  return formattedText.trim();
}

function mapSpeakerIdToName(speakerId: string): string {
  // This is a simple mapping - in a real app, you might want to make this more sophisticated
  if (speakerId === "speaker_1") return "Veterinarian";
  if (speakerId === "speaker_2") return "Speaker 1";
  if (speakerId === "speaker_3") return "Speaker 2";

  // Default fallback
  return speakerId.replace("speaker_", "Speaker ");
}
