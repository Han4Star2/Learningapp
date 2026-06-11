import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client. Reads ANTHROPIC_API_KEY from the environment.
 * All model access goes through lib/ai/* so retrieval, queues, or streaming
 * can be introduced later without touching actions or UI.
 */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (and Vercel env vars)."
    );
  }
  return new Anthropic();
}

/** Single place to change the model. */
export const MODEL = "claude-opus-4-8";
