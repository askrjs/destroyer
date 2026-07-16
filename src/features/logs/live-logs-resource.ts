import { queryScope } from "@askrjs/askr/data";
import { createLiveLogWindow, type LogEntry } from "./logs-data";

export type LiveLogSnapshot = {
  entries: LogEntry[];
  sequence: number;
};

export const liveLogScope = queryScope("destroyer.logs");
export const liveLogQueryKey = liveLogScope.key("live");

let liveLogSequence = 0;

export async function fetchLiveLogs({ signal }: { signal: AbortSignal }): Promise<LiveLogSnapshot> {
  await waitForLiveLogDelay(120 + (liveLogSequence % 4) * 25, signal);

  liveLogSequence += 1;
  const timestamp = Date.now();

  return {
    sequence: liveLogSequence,
    entries: createLiveLogWindow(liveLogSequence, timestamp),
  };
}

function createAbortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

function waitForLiveLogDelay(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      clearTimeout(timeout);
      reject(createAbortError());
    }

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}
