import Anthropic from "@anthropic-ai/sdk";
import type { SwingPhase } from "./constants";
import { SWING_PHASE_LABELS } from "./constants";

const client = new Anthropic();

export interface CheckpointFeedback {
  phase: SwingPhase;
  observation: string;
  comparison_to_pro: string;
  coaching_tip: string;
}

export interface AnalysisResult {
  overall_summary: string;
  checkpoints: CheckpointFeedback[];
  top_priorities: string[];
}

interface FramePair {
  phase: SwingPhase;
  userImageUrl: string;
  proImageUrl: string;
}

const SYSTEM_PROMPT = `Je bent een ervaren golfcoach. Analyseer golfswingbeelden en geef je feedback UITSLUITEND in het Nederlands. Geef ALLEEN geldige JSON terug — geen markdown, geen uitleg, alleen het JSON-object. Gebruik altijd exact deze structuur:
{
  "overall_summary": "string",
  "checkpoints": [
    {
      "phase": "ADDRESS|TAKEAWAY|TOP_OF_BACKSWING|DOWNSWING_TRANSITION|IMPACT|FOLLOW_THROUGH",
      "observation": "string",
      "comparison_to_pro": "string",
      "coaching_tip": "string"
    }
  ],
  "top_priorities": ["string", "string", "string"]
}`;

export async function analyzeSwing(
  framePairs: FramePair[],
  proName: string
): Promise<AnalysisResult> {
  const messageContent: Anthropic.MessageParam["content"] = [
    {
      type: "text",
      text: `Vergelijk de ijzerswing van deze speler fase voor fase met die van ${proName}. Geef eerlijke, bruikbare feedback in het Nederlands. Wees specifiek over wat er verschilt en wat de speler kan verbeteren.`,
    },
  ];

  for (const pair of framePairs) {
    const label = SWING_PHASE_LABELS[pair.phase];
    messageContent.push({ type: "text", text: `\n## ${label}\n\nPlayer's swing:` });
    messageContent.push({
      type: "image",
      source: { type: "url", url: pair.userImageUrl },
    });
    messageContent.push({ type: "text", text: `${proName}'s swing:` });
    messageContent.push({
      type: "image",
      source: { type: "url", url: pair.proImageUrl },
    });
  }

  messageContent.push({
    type: "text",
    text: `Geef je volledige analyse terug als één JSON-object. Voeg voor elke getoonde fase één checkpoint in. top_priorities bevat 2-3 belangrijkste verbeterpunten, in het Nederlands.`,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: messageContent }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected Claude response type");

  // Strip any accidental markdown code fences
  const raw = block.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  return JSON.parse(raw) as AnalysisResult;
}
