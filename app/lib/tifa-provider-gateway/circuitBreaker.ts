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

type CircuitAttempt =
  | { allowed: true; state: CircuitState }
  | { allowed: false; reason: "GEMINI_CIRCUIT_OPEN"; state: CircuitState };

const store = {
  state: "closed" as CircuitState,
  failureCount: 0,
  openedUntilMs: 0,
  halfOpenInFlight: false,
};

function getConfig(): CircuitConfig {
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

function refreshState(now = Date.now()) {
  if (store.state === "open" && now >= store.openedUntilMs) {
    store.state = "half_open";
    store.halfOpenInFlight = false;
  }
}

export function beginGeminiCircuitAttempt(now = Date.now()): CircuitAttempt {
  const config = getConfig();
  if (!config.enabled) {
    return { allowed: true, state: "closed" };
  }

  refreshState(now);

  if (store.state === "open") {
    return { allowed: false, reason: "GEMINI_CIRCUIT_OPEN", state: "open" };
  }

  if (store.state === "half_open") {
    if (store.halfOpenInFlight) {
      return { allowed: false, reason: "GEMINI_CIRCUIT_OPEN", state: "half_open" };
    }
    store.halfOpenInFlight = true;
  }

  return { allowed: true, state: store.state };
}

export function finalizeGeminiCircuitAttempt(success: boolean, now = Date.now()) {
  const config = getConfig();
  if (!config.enabled) return;

  refreshState(now);

  if (success) {
    store.state = "closed";
    store.failureCount = 0;
    store.openedUntilMs = 0;
    store.halfOpenInFlight = false;
    return;
  }

  if (store.state === "half_open") {
    store.state = "open";
    store.failureCount = config.failureThreshold;
    store.openedUntilMs = now + config.cooldownMs;
    store.halfOpenInFlight = false;
    return;
  }

  store.failureCount += 1;
  if (store.failureCount >= config.failureThreshold) {
    store.state = "open";
    store.openedUntilMs = now + config.cooldownMs;
  }
}

export function getGeminiCircuitSnapshot(now = Date.now()): CircuitSnapshot {
  const config = getConfig();
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

  refreshState(now);

  return {
    enabled: true,
    state: store.state,
    failure_count: store.failureCount,
    cooldown_ms: config.cooldownMs,
    opened_until:
      store.state === "open" && store.openedUntilMs > now
        ? new Date(store.openedUntilMs).toISOString()
        : null,
    threshold: config.failureThreshold,
  };
}

export function resetGeminiCircuitForTests() {
  store.state = "closed";
  store.failureCount = 0;
  store.openedUntilMs = 0;
  store.halfOpenInFlight = false;
}
