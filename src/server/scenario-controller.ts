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

  return {
    arm(principalId: string, operation: ScenarioOperation, mode: ScenarioMode) {
      principalControls(principalId).set(operation, { mode, blocked: false });
    },
    state(principalId: string) {
      return [...principalControls(principalId)].map(([operation, value]) => ({
        operation,
        mode: value.mode,
        blocked: value.blocked,
      }));
    },
    release(principalId: string, operation: ScenarioOperation) {
      const control = principalControls(principalId).get(operation);
      control?.release?.();
      return Boolean(control);
    },
    reset(principalId: string) {
      for (const control of principalControls(principalId).values()) control.release?.();
      controls.delete(principalId);
    },
    async before(principalId: string, operation: ScenarioOperation): Promise<ScenarioMode | null> {
      const scoped = principalControls(principalId);
      const control = scoped.get(operation);
      if (!control) return null;
      if (control.mode === "fail-next") {
        scoped.delete(operation);
        throw new ScenarioFailure(operation);
      }
      if (control.mode === "empty-next") {
        scoped.delete(operation);
        return control.mode;
      }
      control.blocked = true;
      await new Promise<void>((resolve) => {
        control.release = resolve;
      });
      scoped.delete(operation);
      return control.mode;
    },
  };
}

export type ScenarioController = ReturnType<typeof createScenarioController>;
