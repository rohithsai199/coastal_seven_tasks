import api from "./api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Initiates SSE streaming for AI Shopping Assistant.
 * Uses native fetch + ReadableStream for smooth token-by-token streaming.
 */
export async function streamAIChat({
  query,
  history = [],
  provider = "auto",
  apiKey = "",
  top_k = 4,
  signal,
  onCitations,
  onMetadata,
  onDelta,
  onFallbackNotice,
  onDone,
  onError,
}) {
  try {
    const response = await fetch(`${BASE_URL}/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        history,
        provider: provider === "auto" ? null : provider,
        api_key: apiKey.trim() || null,
        top_k,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Service HTTP ${response.status}: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      // Keep unfinished trailing block in buffer
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;

        const lines = block.split("\n");
        let currentEvent = "message";
        let currentData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6).trim();
          }
        }

        if (!currentData) continue;

        try {
          const parsed = JSON.parse(currentData);

          switch (currentEvent) {
            case "citations":
              if (onCitations) onCitations(parsed.sources || []);
              break;
            case "metadata":
              if (onMetadata) onMetadata(parsed);
              break;
            case "delta":
              if (onDelta) onDelta(parsed.content || "");
              break;
            case "fallback_notice":
              if (onFallbackNotice) onFallbackNotice(parsed);
              break;
            case "done":
              if (onDone) onDone(parsed);
              break;
            case "error":
              if (onError) onError(new Error(parsed.message || "Unknown error"));
              break;
            default:
              break;
          }
        } catch {
          // If raw text or non-json data
          if (currentEvent === "delta" && onDelta) {
            onDelta(currentData);
          }
        }
      }
    }

    if (onDone) {
      onDone({ status: "stream_closed" });
    }
  } catch (err) {
    if (err.name === "AbortError") {
      loggerSafe("Streaming aborted by user.");
      return;
    }
    if (onError) {
      onError(err);
    }
  }
}

export async function getAIStatus() {
  const res = await api.get("/ai/status");
  return res.data;
}

export async function reindexAICatalogue() {
  const res = await api.post("/ai/reindex");
  return res.data;
}

export async function testLangChainRAG(query = "headphones") {
  const res = await api.get(`/ai/langchain/test?q=${encodeURIComponent(query)}`);
  return res.data;
}

export async function semanticSearch(query, options = {}) {
  const { limit = 10, min_score = 0.35, max_price, in_stock_only = false } = options;
  const params = { q: query, limit, min_score, in_stock_only };
  if (max_price != null) params.max_price = max_price;
  const res = await api.get("/ai/semantic-search", { params });
  return res.data;
}

export async function generateProductDescription({ name, category, features = [], tone = "persuasive", target_audience }) {
  const res = await api.post("/ai/generate-description", {
    name,
    category,
    features,
    tone,
    target_audience,
  });
  return res.data;
}

export async function checkModeration(text) {
  const res = await api.post("/ai/moderate", { text });
  return res.data;
}

export async function chatWithAIAgent({ message, provider, apiKey }) {
  const res = await api.post("/ai/agent/chat", {
    message,
    provider: provider === "auto" ? null : provider,
    api_key: apiKey || null,
  });
  return res.data;
}

export async function getAIGovernance() {
  const res = await api.get("/ai/governance");
  return res.data;
}

export async function dispatchAsyncReindexTask() {
  const res = await api.post("/ai/tasks/reindex");
  return res.data;
}

export async function dispatchAsyncQuotaAuditTask() {
  const res = await api.post("/ai/tasks/audit-quotas");
  return res.data;
}

export async function dispatchAsyncGenerateDescriptionTask(payload) {
  const res = await api.post("/ai/tasks/generate-description", payload);
  return res.data;
}

function loggerSafe(msg) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[AI Assistant]", msg);
  }
}
