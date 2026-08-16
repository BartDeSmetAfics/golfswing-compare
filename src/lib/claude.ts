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

const SYSTEM_PROMPT = `Je bent een enthousiaste, directe golfcoach die de golfer persoonlijk aanspreekt. Geef feedback in het Nederlands, spreek de golfer aan met "je/jij" en gebruik hun voornaam als je die kent. Wees concreet, eerlijk en motiverend — geen formeel jargon, gewoon duidelijke coaching zoals je dat tegen een vriend zou zeggen. Geef ALLEEN geldige JSON terug — geen markdown, geen uitleg, alleen het JSON-object. Gebruik altijd exact deze structuur:
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
  proName: string,
  userName: string | null = null
): Promise<AnalysisResult> {
  const addressee = userName ?? "je";
  const messageContent: Anthropic.MessageParam["content"] = [
    {
      type: "text",
      text: `Vergelijk${userName ? ` de ijzerswing van ${userName}` : " deze ijzerswing"} fase voor fase met die van ${proName}. Spreek ${userName ? `${userName}` : "de golfer"} direct aan met "je/jij"${userName ? ` en gebruik de naam ${userName}` : ""}. Wees eerlijk, concreet en motiverend — als een coach die je echt verder wil helpen.`,
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
    text: `Geef je volledige analyse terug als één JSON-object. Voeg voor elke getoonde fase één checkpoint in. top_priorities bevat 2-3 concrete verbeterpunten gericht aan ${addressee}, in het Nederlands. Gebruik overal "je/jij"${userName ? ` en de naam ${userName}` : ""}.`,
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
