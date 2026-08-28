export type ScenarioOperation =
  | "settings.read"
  | "settings.update"
  | "settings.reset-invite"
  | "operations.summary"
  | "operations.logs"
  | "operations.metrics"
  | "incidents.read"
  | "incidents.mutate";

export type ScenarioMode = "fail-next" | "hold-next" | "empty-next";

type ArmedControl = { mode: ScenarioMode; blocked: boolean; release?: () => void };

export class ScenarioFailure extends Error {
  constructor(readonly operation: ScenarioOperation) {
    super(`Test controller failed ${operation} before mutation.`);
    this.name = "ScenarioFailure";
  }
}

export function createScenarioController() {
  const controls = new Map<string, Map<ScenarioOperation, ArmedControl>>();
  const principalControls = (principalId: string) => {
    const current = controls.get(principalId) ?? new Map<ScenarioOperation, ArmedControl>();
    controls.set(principalId, current);
    return current;
  };
  const deleteControl = (
    principalId: string,
    scoped: Map<ScenarioOperation, ArmedControl>,
    operation: ScenarioOperation,
    expected?: ArmedControl,
  ) => {
    if (!expected || scoped.get(operation) === expected) scoped.delete(operation);
    if (scoped.size === 0 && controls.get(principalId) === scoped) controls.delete(principalId);
  };

  return {
    arm(principalId: string, operation: ScenarioOperation, mode: ScenarioMode) {
      const scoped = principalControls(principalId);
      scoped.get(operation)?.release?.();
      scoped.set(operation, { mode, blocked: false });
    },
    state(principalId: string) {
      return [...(controls.get(principalId) ?? [])].map(([operation, value]) => ({
        operation,
        mode: value.mode,
        blocked: value.blocked,
      }));
    },
    release(principalId: string, operation: ScenarioOperation) {
      const control = controls.get(principalId)?.get(operation);
      control?.release?.();
      return Boolean(control);
    },
    reset(principalId: string) {
      for (const control of controls.get(principalId)?.values() ?? []) control.release?.();
      controls.delete(principalId);
    },
    async before(
      principalId: string,
      operation: ScenarioOperation,
      signal?: AbortSignal,
    ): Promise<ScenarioMode | null> {
      const scoped = controls.get(principalId);
      if (!scoped) return null;
      const control = scoped.get(operation);
      if (!control) return null;
      if (control.mode === "fail-next") {
        deleteControl(principalId, scoped, operation, control);
        throw new ScenarioFailure(operation);
      }
      if (control.mode === "empty-next") {
        deleteControl(principalId, scoped, operation, control);
        return control.mode;
      }
      control.blocked = true;
      try {
        await new Promise<void>((resolve, reject) => {
          const aborted = () => reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
          const released = () => {
            signal?.removeEventListener("abort", aborted);
            resolve();
          };
          control.release = released;
          if (signal?.aborted) aborted();
          else signal?.addEventListener("abort", aborted, { once: true });
        });
      } finally {
        deleteControl(principalId, scoped, operation, control);
      }
      return control.mode;
    },
  };
}

export type ScenarioController = ReturnType<typeof createScenarioController>;
