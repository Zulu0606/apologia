import { createServerFn } from "@tanstack/react-start";
import type { SearchResponse } from "./types";

export const askScripture = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Type a question first.");
    }
    const raw = (input as { question?: unknown }).question;
    if (typeof raw !== "string") throw new Error("Type a question first.");
    const question = raw.trim().replace(/\s+/g, " ");
    if (question.length < 2) throw new Error("Type a question first.");
    if (question.length > 400) throw new Error("Ask in 400 characters or fewer.");
    return { question };
  })
  .handler(async ({ data }): Promise<SearchResponse> => {
    try {
      const { answerQuestion } = await import("./engine.server");
      return await answerQuestion(data.question);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed.";
      return { ok: false, error: message };
    }
  });
