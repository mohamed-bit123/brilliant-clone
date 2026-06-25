import { generateText, isAIConfigured, parseJsonResponse } from "@/lib/ai/provider";
import { generateProblem } from "@/lib/ai/practice";
import {
  SCENARIO_SYSTEM,
  scenarioUserPrompt,
  scenarioPreservesNumbers,
} from "@/lib/ai/prompts";
import type { Difficulty, PracticeTopic } from "@/lib/ai/types";
import { LESSON_TOPIC } from "@/lib/ai/types";

const VALID_TOPICS = new Set<PracticeTopic>([
  "ohms",
  "series",
  "parallel",
  "equivalent",
  "power",
  "mixed",
]);

export async function POST(req: Request) {
  let body: { topic?: string; lessonId?: string; difficulty?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  let topic = (body.topic as PracticeTopic) ?? undefined;
  if (!topic && body.lessonId) topic = LESSON_TOPIC[body.lessonId];
  if (!topic || !VALID_TOPICS.has(topic)) topic = "ohms";

  let difficulty = Number(body.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    difficulty = 1;
  }

  // The engine authors the problem and owns every number/answer.
  const problem = generateProblem(topic, difficulty as Difficulty);

  // If AI is on, ask only for real-world FLAVOR, then verify it kept the numbers.
  if (isAIConfigured()) {
    try {
      const raw = await generateText({
        system: SCENARIO_SYSTEM,
        user: scenarioUserPrompt(problem),
        json: true,
        temperature: 0.9,
        maxTokens: 500,
      });
      const parsed = parseJsonResponse<{ scenario?: string; prompt?: string }>(raw);
      if (
        parsed?.prompt &&
        scenarioPreservesNumbers(parsed.prompt, problem.interaction.givens)
      ) {
        problem.prompt = parsed.prompt.trim();
        if (parsed.scenario) problem.scenario = parsed.scenario.trim();
        problem.source = "ai";
      }
    } catch {
      // Keep the verified procedural problem as-is.
    }
  }

  return Response.json(problem);
}
