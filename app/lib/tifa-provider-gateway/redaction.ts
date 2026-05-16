export function redactSecrets(input: string) {
  if (!input) return input;

  let text = input;
  const secrets = [
    process.env.GEMINI_API_KEY,
    process.env.NEXUS_SMOKE_AUTH_TOKEN,
    process.env.NEXUS_AUTH_SECRET,
  ].filter((value): value is string => Boolean(value));

  for (const secret of secrets) {
    if (secret) {
      text = text.split(secret).join("[REDACTED]");
    }
  }

  text = text.replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED]");
  text = text.replace(/(bearer\s+)[a-z0-9._-]+/gi, "$1[REDACTED]");
  text = text.replace(/(gemini_api_key\s*[=:]\s*)[^\s,;]+/gi, "$1[REDACTED]");

  return text;
}

export function sanitizeProviderError(error: unknown, fallback = "Provider request failed") {
  if (error instanceof Error) {
    return redactSecrets(error.message || fallback);
  }
  if (typeof error === "string") {
    return redactSecrets(error);
  }
  return fallback;
}
