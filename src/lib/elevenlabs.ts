import { elevenlabs } from "@ai-sdk/elevenlabs";
import { experimental_transcribe as transcribe } from "ai";
import { z } from "zod/v3";

const elevenlabsTranscriptionResponseSchema = z.object({
  language_code: z.string(),
  language_probability: z.number(),
  text: z.string(),
  words: z
    .array(
      z.object({
        text: z.string(),
        type: z.enum(["word", "spacing", "audio_event"]),
        start: z.number().nullish(),
        end: z.number().nullish(),
        speaker_id: z.string().nullish(),
        characters: z
          .array(
            z.object({
              text: z.string(),
              start: z.number().nullish(),
              end: z.number().nullish(),
            })
          )
          .nullish(),
      })
    )
    .nullish(),
});

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
        },
      },
    });

    const response = elevenlabsTranscriptionResponseSchema.parse(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result.responses[0]! as any).body
    );

    return {
      success: true,
      transcription: response.text,
      segments: response.words || [],
      language: response.language_code || language,
    };
  } catch (error) {
    console.error("ElevenLabs transcription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcription failed",
    };
  }
}
