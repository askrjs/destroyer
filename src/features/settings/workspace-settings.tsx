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
  Select,
  SelectContent,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
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
                <Select
                  name="defaultRole"
                  value={defaultRole()}
                  onValueChange={(value) => {
                    if (value === "viewer" || value === "member") setDefaultRole(value);
                  }}
                >
                  <SelectTrigger id="settings-default-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </Field>
              <Field>
                <Label for="settings-approval">Approval policy</Label>
                <Select
                  name="approvalPolicy"
                  value={approvalPolicy()}
                  onValueChange={(value) => {
                    if (value === "automatic" || value === "manual") setApprovalPolicy(value);
                  }}
                >
                  <SelectTrigger id="settings-approval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectContent>
                      <SelectItem value="manual">Manual approval</SelectItem>
                      <SelectItem value="automatic">Automatic approval</SelectItem>
                    </SelectContent>
                  </SelectPortal>
                </Select>
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
