type ProviderError = {
  response?: {
    status?: number;
    headers?: Record<string, unknown>;
  };
};

function retryDelayMs(error: ProviderError, attempt: number) {
  const rawRetryAfter = error.response?.headers?.["retry-after"];
  const retryAfter = Number.parseInt(String(rawRetryAfter ?? ""), 10);
  if (Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.min(retryAfter * 1000, 5_000);
  }
  return Math.min(1_000 * 2 ** attempt, 5_000);
}

export async function withProviderRetry<T>(
  operation: () => Promise<T>,
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms))
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const providerError = error as ProviderError;
      const status = providerError.response?.status;
      const retryable = status === 429 || (typeof status === "number" && status >= 500);
      if (!retryable || attempt === 1) throw error;
      await sleep(retryDelayMs(providerError, attempt));
    }
  }
  throw new Error("Provider retry exhausted");
}
