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

export type ProviderHealth = {
  provider: "gemini";
  configured: boolean;
  enabled: boolean;
  model: string;
  reason?: string;
};
