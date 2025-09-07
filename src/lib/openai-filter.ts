import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function filterTranscriptionContent(
  rawTranscription: string
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("o3-mini"),
      prompt: `You are a veterinary assistant helping to convert consultation transcriptions into structured medical charts.

Your task is to analyze the transcription and create a structured veterinary medical chart in English with the following sections:

**REQUIRED STRUCTURE:**
- **Reason of consultation (anamnesis):** Chief complaint and history as reported by the owner
- **General objective examination:** General physical examination findings (vital signs, overall condition, etc.)
- **Specific objective examination:** Specific/focused physical examination findings related to the chief complaint
- **Problem list:** Identified clinical problems and abnormal findings
- **Differential diagnosis:** Differential diagnoses being considered
- **Advisory/treatment:** Treatment recommendations, medications, and follow-up instructions

**INSTRUCTIONS:**
- Extract relevant information from the transcription and organize it into the above sections
- If a section has no relevant information, write "Not documented" or "Not performed"
- Use clear, professional medical terminology
- Maintain clinical accuracy and completeness
- Write everything in the language of the transcription
- Focus only on medical information, ignore greetings, small talk, and administrative discussions

Original transcription:
${rawTranscription}

Structured veterinary medical chart:`,
      temperature: 0.1, // Low temperature for consistent filtering
    });

    return text;
  } catch (error) {
    console.error("OpenAI filtering error:", error);
    // Return original transcription if filtering fails
    return rawTranscription;
  }
}
