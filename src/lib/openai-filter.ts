import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function filterTranscriptionContent(
  rawTranscription: string
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("o3-mini"),
      prompt: `You are a veterinary assistant helping to clean up consultation transcriptions. 

Your task is to filter out non-essential content while preserving all medically relevant information.

REMOVE:
- Greetings and smalltalk (hello, how are you, weather talk, etc.)
- Technical difficulties (microphone issues, "can you hear me", etc.)
- Administrative talk (scheduling, payment discussions, etc.)
- Filler words and repetitions
- Off-topic conversations

KEEP:
- All medical symptoms and observations
- Treatment discussions and recommendations
- Medication names and dosages
- Follow-up instructions
- Patient history and concerns
- Any veterinary medical terminology

Maintain the speaker labels (Veterinarian, Speaker 1, Speaker 2) and preserve the conversation flow.

Original transcription:
${rawTranscription}

Filtered transcription:`,
      temperature: 0.1, // Low temperature for consistent filtering
    });

    return text;
  } catch (error) {
    console.error("OpenAI filtering error:", error);
    // Return original transcription if filtering fails
    return rawTranscription;
  }
}
