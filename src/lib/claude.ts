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

const SYSTEM_PROMPT = `You are an expert golf coach. Analyze golf swing images and return ONLY valid JSON — no markdown, no explanation, just the JSON object. Always use exactly this structure:
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
      text: `Compare this player's iron swing against ${proName}'s iron swing, phase by phase. Give honest, actionable feedback in plain language. Be specific about what differs and what to improve.`,
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
    text: `Return your full analysis as a single JSON object. Include one checkpoint entry per phase shown. top_priorities should list 2-3 most important things to improve.`,
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
