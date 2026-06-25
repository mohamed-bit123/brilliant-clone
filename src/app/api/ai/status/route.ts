import { isAIConfigured } from "@/lib/ai/provider";

/** Lets the client know whether AI features should be offered (key is server-only). */
export async function GET() {
  return Response.json({ enabled: isAIConfigured() });
}
