import type { AppDependencies } from "./contracts";

export function createRateLimits(now: () => number): AppDependencies["rateLimits"] {
  const counters = new Map<string, { count: number; reset: number }>();
  return {
    async consume(key, limit, windowMs) {
      const time = now();
      const current = counters.get(key);
      const state =
        !current || current.reset <= time ? { count: 0, reset: time + windowMs } : current;
      state.count += 1;
      counters.set(key, state);
      return {
        allowed: state.count <= limit,
        remaining: Math.max(0, limit - state.count),
        reset: state.reset,
      };
    },
  };
}
