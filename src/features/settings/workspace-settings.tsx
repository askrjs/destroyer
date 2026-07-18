import { state } from "@askrjs/askr";
import { action, ActionForm } from "@askrjs/askr/actions";
import { currentAuth } from "@askrjs/askr/router";
import { Building2Icon, Link2OffIcon, Trash2Icon } from "@askrjs/lucide";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Grid,
  Input,
  Label,
  Text,
} from "@askrjs/themes/components";
import { operatorSettingsData, resetInviteAction, updateWorkspaceAction } from "./settings-model";

export function WorkspaceSettings() {
  const settings = operatorSettingsData(currentAuth().principal?.id ?? "anonymous");
  const save = action<{
    defaultRole: "viewer" | "member";
    approvalPolicy: "automatic" | "manual";
    version: string;
  }>(updateWorkspaceAction);
  const reset = action<{ version: string }>(resetInviteAction);
  const [defaultRole, setDefaultRole] = state<"viewer" | "member">(
    settings.data?.defaultRole ?? "viewer",
  );
  const [approvalPolicy, setApprovalPolicy] = state<"automatic" | "manual">(
    settings.data?.approvalPolicy ?? "manual",
  );
  const mutationError = state("");
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Persisted access defaults for new operators.</CardDescription>
          <CardAction>
            <Building2Icon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={updateWorkspaceAction}
            onSubmit={(event: Event) => {
              event.preventDefault();
              mutationError.set("");
              void save
                .submit({
                  defaultRole: defaultRole(),
                  approvalPolicy: approvalPolicy(),
                  version: String(settings.data?.version ?? 1),
                })
                .catch((error: unknown) =>
                  mutationError.set(
                    error instanceof Error ? error.message : "Workspace update failed.",
                  ),
                );
            }}
          >
            <Grid columns={{ base: 1, md: 2 }} gap="md">
              <Field>
                <Label for="settings-default-role">Default role</Label>
                <select
                  id="settings-default-role"
                  value={defaultRole()}
                  onChange={(event: Event) =>
                    setDefaultRole((event.target as HTMLSelectElement).value as "viewer" | "member")
                  }
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                </select>
              </Field>
              <Field>
                <Label for="settings-approval">Approval policy</Label>
                <select
                  id="settings-approval"
                  value={approvalPolicy()}
                  onChange={(event: Event) =>
                    setApprovalPolicy(
                      (event.target as HTMLSelectElement).value as "automatic" | "manual",
                    )
                  }
                >
                  <option value="manual">Manual approval</option>
                  <option value="automatic">Automatic approval</option>
                </select>
              </Field>
            </Grid>
            {mutationError() ? (
              <Text tone="danger" role="alert">
                {mutationError()}
              </Text>
            ) : null}
            <Button type="submit" variant="primary" disabled={save.state().pending}>
              Save workspace
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invite links</CardTitle>
          <CardDescription>Rotate the active SQLite-backed invite token.</CardDescription>
          <CardAction>
            <Link2OffIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Field>
              <Label for="settings-invite-link">Active invite link</Label>
              <Input
                id="settings-invite-link"
                value={settings.data?.inviteLink ?? "Loading…"}
                readonly
              />
            </Field>
            <AlertDialog>
              <Button asChild variant="destructive">
                <AlertDialogTrigger>
                  <Trash2Icon size={16} aria-hidden="true" />
                  Reset links
                </AlertDialogTrigger>
              </Button>
              <AlertDialogPortal>
                <AlertDialogOverlay />
                <AlertDialogContent>
                  <AlertDialogTitle>Reset workspace invite links?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Existing tokens will be revoked and one replacement token will be persisted.
                  </AlertDialogDescription>
                  <Block direction="row" justify="end" gap="sm">
                    <Button asChild variant="outline">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </Button>
                    <Button asChild variant="destructive">
                      <AlertDialogAction
                        onPress={() => {
                          mutationError.set("");
                          void reset
                            .submit({ version: String(settings.data?.version ?? 1) })
                            .catch((error: unknown) =>
                              mutationError.set(
                                error instanceof Error ? error.message : "Invite reset failed.",
                              ),
                            );
                        }}
                      >
                        Reset links
                      </AlertDialogAction>
                    </Button>
                  </Block>
                </AlertDialogContent>
              </AlertDialogPortal>
            </AlertDialog>
          </Block>
        </CardContent>
      </Card>
    </Block>
  );
}
