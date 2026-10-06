import type { AiProvider, AiRequest, AiResult } from "../types";

/** OpenAI (Chat Completions). Alleen fetch, geen extra pakket. De sleutel komt uit OPENAI_API_KEY en staat nooit in logs. */
export function createOpenAiProvider(apiKey: string, model: string): AiProvider {
  return {
    name: "openai",
    model,
    async completeJson(req: AiRequest): Promise<AiResult> {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(req.timeoutMs),
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: req.system },
              { role: "user", content: req.user },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: req.maxOutputTokens,
          }),
        });
        // Alleen de statuscode: de body kan invoer of uitvoer bevatten.
        if (!res.ok) return { ok: false, code: `http_${res.status}`, model };
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
          model?: string;
        };
        const choice = data.choices?.[0];
        const text = choice?.message?.content;
        if (!text) return { ok: false, code: "empty", model };
        if (choice?.finish_reason === "length") return { ok: false, code: "truncated", model };
        return {
          ok: true,
          text,
          model: data.model ?? model,
          usage: { inputTokens: data.usage?.prompt_tokens ?? null, outputTokens: data.usage?.completion_tokens ?? null },
        };
      } catch (e) {
        const name = e instanceof Error ? e.name : "";
        return { ok: false, code: name === "TimeoutError" || name === "AbortError" ? "timeout" : "network", model };
      }
    },
  };
}
