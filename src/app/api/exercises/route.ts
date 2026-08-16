import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/lib/claude";
import type { Exercise } from "@/types/exercises";

export type { Exercise };

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Je bent een professionele golfcoach. Op basis van de coachingobservaties die een speler heeft gekregen, stel je gerichte oefeningen voor. Geef ALLEEN geldige JSON terug zonder markdown of uitleg. Gebruik altijd exact dit formaat:
{
  "exercises": [
    {
      "title": "string",
      "focusArea": "string",
      "description": "string",
      "steps": ["string", "string"],
      "reps": "string",
      "why": "string"
    }
  ]
}`;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get last 10 analyses for this user
  const analyses = await prisma.analysis.findMany({
    where: { swing: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { result: true },
  });

  if (analyses.length === 0) {
    return Response.json({ exercises: [], noAnalyses: true });
  }

  // Extract all top_priorities and coaching_tips
  const observations: string[] = [];
  for (const a of analyses) {
    const result = a.result as unknown as AnalysisResult;
    if (result.top_priorities) observations.push(...result.top_priorities);
    if (result.checkpoints) {
      for (const cp of result.checkpoints) {
        if (cp.coaching_tip) observations.push(cp.coaching_tip);
      }
    }
  }

  // Deduplicate and cap at 20 observations
  const unique = [...new Set(observations)].slice(0, 20);

  const prompt = `Hier zijn de coachingobservaties van ${analyses.length} recente slaganalyses van deze speler:\n\n${unique.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\nStel 5 gerichte oefeningen voor in het Nederlands die de meest voorkomende problemen aanpakken. Houd de stappen praktisch en uitvoerbaar op de driving range of thuis.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") return Response.json({ error: "Unexpected response" }, { status: 500 });

  const raw = block.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const data = JSON.parse(raw) as { exercises: Exercise[] };

  return Response.json(data);
}
