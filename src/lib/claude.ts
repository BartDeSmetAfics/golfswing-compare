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

const OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    overall_summary: { type: "string" },
    checkpoints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          phase: {
            type: "string",
            enum: [
              "ADDRESS",
              "TAKEAWAY",
              "TOP_OF_BACKSWING",
              "DOWNSWING_TRANSITION",
              "IMPACT",
              "FOLLOW_THROUGH",
            ],
          },
          observation: { type: "string" },
          comparison_to_pro: { type: "string" },
          coaching_tip: { type: "string" },
        },
        required: ["phase", "observation", "comparison_to_pro", "coaching_tip"],
        additionalProperties: false,
      },
    },
    top_priorities: { type: "array", items: { type: "string" } },
  },
  required: ["overall_summary", "checkpoints", "top_priorities"],
  additionalProperties: false,
};

export async function analyzeSwing(
  framePairs: FramePair[],
  proName: string
): Promise<AnalysisResult> {
  const messageContent: Anthropic.Beta.BetaContentBlockParam[] = [
    {
      type: "text",
      text: `You are an expert golf coach. Compare this player's iron swing against ${proName}'s iron swing, phase by phase. Give honest, actionable feedback in plain language. Be specific about what differs and what to improve.`,
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
    text: "Return your analysis as JSON matching the schema exactly. Be specific and practical.",
  });

  const response = await client.beta.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: messageContent }],
    output_config: {
      format: {
        type: "json_schema",
        schema: OUTPUT_SCHEMA,
      },
    },
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected Claude response type");
  return JSON.parse(block.text) as AnalysisResult;
}
