import type { LlmProviderName } from "./types";

type CircuitState = "closed" | "open" | "half_open";

type CircuitConfig = {
  enabled: boolean;
  failureThreshold: number;
  cooldownMs: number;
};

type CircuitSnapshot = {
  enabled: boolean;
  state: CircuitState;
  failure_count: number;
  cooldown_ms: number;
  opened_until: string | null;
  threshold: number;
};

type CircuitReason = "GEMINI_CIRCUIT_OPEN" | "OLLAMA_CIRCUIT_OPEN";

type CircuitAttempt =
  | { allowed: true; state: CircuitState }
  | { allowed: false; reason: CircuitReason; state: CircuitState };

type CircuitStore = {
  state: CircuitState;
  failureCount: number;
  openedUntilMs: number;
  halfOpenInFlight: boolean;
};

const stores: Record<LlmProviderName, CircuitStore> = {
  gemini: {
    state: "closed",
    failureCount: 0,
    openedUntilMs: 0,
    halfOpenInFlight: false,
  },
  ollama: {
    state: "closed",
    failureCount: 0,
    openedUntilMs: 0,
    halfOpenInFlight: false,
  },
};

// Legacy alias used by older imports/tests.
const store = stores.gemini;

function circuitReason(provider: LlmProviderName): CircuitReason {
  return provider === "ollama" ? "OLLAMA_CIRCUIT_OPEN" : "GEMINI_CIRCUIT_OPEN";
}

function getConfig(provider: LlmProviderName = "gemini"): CircuitConfig {
  if (provider === "ollama") {
    const enabled = process.env.OLLAMA_CIRCUIT_BREAKER_ENABLED !== "0";
    const failureThreshold = Number.parseInt(
      process.env.OLLAMA_CIRCUIT_FAILURE_THRESHOLD ||
        process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD ||
        "3",
      10
    );
    const cooldownMs = Number.parseInt(
      process.env.OLLAMA_CIRCUIT_COOLDOWN_MS ||
        process.env.GEMINI_CIRCUIT_COOLDOWN_MS ||
        "60000",
      10
    );

    return {
      enabled,
      failureThreshold:
        Number.isFinite(failureThreshold) && failureThreshold > 0 ? failureThreshold : 3,
      cooldownMs: Number.isFinite(cooldownMs) && cooldownMs > 0 ? cooldownMs : 60_000,
    };
  }

  const enabled = process.env.GEMINI_CIRCUIT_BREAKER_ENABLED !== "0";
  const failureThreshold = Number.parseInt(
    process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD || "3",
    10
  );
  const cooldownMs = Number.parseInt(
    process.env.GEMINI_CIRCUIT_COOLDOWN_MS || "60000",
    10
  );

  return {
    enabled,
    failureThreshold: Number.isFinite(failureThreshold) && failureThreshold > 0 ? failureThreshold : 3,
    cooldownMs: Number.isFinite(cooldownMs) && cooldownMs > 0 ? cooldownMs : 60_000,
  };
}

function refreshState(store: CircuitStore, now = Date.now()) {
  if (store.state === "open" && now >= store.openedUntilMs) {
    store.state = "half_open";
    store.halfOpenInFlight = false;
  }
}

export function beginLlmCircuitAttempt(
  provider: LlmProviderName = "gemini",
  now = Date.now()
): CircuitAttempt {
  const config = getConfig(provider);
  const target = stores[provider];
  if (!config.enabled) {
    return { allowed: true, state: "closed" };
  }

  refreshState(target, now);

  if (target.state === "open") {
    return { allowed: false, reason: circuitReason(provider), state: "open" };
  }

  if (target.state === "half_open") {
    if (target.halfOpenInFlight) {
      return { allowed: false, reason: circuitReason(provider), state: "half_open" };
    }
    target.halfOpenInFlight = true;
  }

  return { allowed: true, state: target.state };
}

export function finalizeLlmCircuitAttempt(
  provider: LlmProviderName = "gemini",
  success: boolean,
  now = Date.now()
) {
  const config = getConfig(provider);
  const target = stores[provider];
  if (!config.enabled) return;

  refreshState(target, now);

  if (success) {
    target.state = "closed";
    target.failureCount = 0;
    target.openedUntilMs = 0;
    target.halfOpenInFlight = false;
    return;
  }

  if (target.state === "half_open") {
    target.state = "open";
    target.failureCount = config.failureThreshold;
    target.openedUntilMs = now + config.cooldownMs;
    target.halfOpenInFlight = false;
    return;
  }

  target.failureCount += 1;
  if (target.failureCount >= config.failureThreshold) {
    target.state = "open";
    target.openedUntilMs = now + config.cooldownMs;
  }
}

export function getLlmCircuitSnapshot(
  provider: LlmProviderName = "gemini",
  now = Date.now()
): CircuitSnapshot {
  const config = getConfig(provider);
  const target = stores[provider];
  if (!config.enabled) {
    return {
      enabled: false,
      state: "closed",
      failure_count: 0,
      cooldown_ms: config.cooldownMs,
      opened_until: null,
      threshold: config.failureThreshold,
    };
  }

  refreshState(target, now);

  return {
    enabled: true,
    state: target.state,
    failure_count: target.failureCount,
    cooldown_ms: config.cooldownMs,
    opened_until:
      target.state === "open" && target.openedUntilMs > now
        ? new Date(target.openedUntilMs).toISOString()
        : null,
    threshold: config.failureThreshold,
  };
}

export function resetLlmCircuitForTests(provider?: LlmProviderName) {
  const targets = provider ? [stores[provider]] : Object.values(stores);
  for (const target of targets) {
    target.state = "closed";
    target.failureCount = 0;
    target.openedUntilMs = 0;
    target.halfOpenInFlight = false;
  }
}

// Backwards-compatible Gemini-specific helpers.
export function beginGeminiCircuitAttempt(now = Date.now()): CircuitAttempt {
  return beginLlmCircuitAttempt("gemini", now);
}

export function finalizeGeminiCircuitAttempt(success: boolean, now = Date.now()) {
  finalizeLlmCircuitAttempt("gemini", success, now);
}

export function getGeminiCircuitSnapshot(now = Date.now()): CircuitSnapshot {
  return getLlmCircuitSnapshot("gemini", now);
}

export function resetGeminiCircuitForTests() {
  resetLlmCircuitForTests("gemini");
}

export function beginOllamaCircuitAttempt(now = Date.now()): CircuitAttempt {
  return beginLlmCircuitAttempt("ollama", now);
}

export function finalizeOllamaCircuitAttempt(success: boolean, now = Date.now()) {
  finalizeLlmCircuitAttempt("ollama", success, now);
}

export function getOllamaCircuitSnapshot(now = Date.now()): CircuitSnapshot {
  return getLlmCircuitSnapshot("ollama", now);
}

export function resetOllamaCircuitForTests() {
  resetLlmCircuitForTests("ollama");
}

export { store };
