export type LlmUsage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export type ProviderChatRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxOutputTokens: number;
};

export type ProviderChatResponse = {
  ok: true;
  provider: "gemini";
  model: string;
  text: string;
  usage?: LlmUsage;
};

export type ProviderGatewayResult =
  | ProviderChatResponse
  | {
      ok: false;
      provider: "gemini";
      model: string;
      error: {
        code: string;
        message: string;
      };
    };

export type ProviderStreamGatewayResult =
  | {
      ok: true;
      provider: "gemini";
      model: string;
      stream: AsyncIterable<string>;
    }
  | {
      ok: false;
      provider: "gemini";
      model: string;
      error: {
        code: string;
        message: string;
      };
    };

export type ProviderHealth = {
  provider: "gemini";
  configured: boolean;
  enabled: boolean;
  model: string;
  stream_enabled: boolean;
  retry_limit: number;
  timeout_ms: number;
  stream_retry_limit: number;
  stream_timeout_ms: number;
  circuit: {
    enabled: boolean;
    state: "closed" | "open" | "half_open";
    failure_count: number;
    cooldown_ms: number;
    opened_until: string | null;
    threshold: number;
  };
  reason?: string;
};
