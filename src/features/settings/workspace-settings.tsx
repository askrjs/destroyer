import { derive, state } from "@askrjs/askr";
import { action, ActionForm } from "@askrjs/askr/actions";
import { on } from "@askrjs/askr/resources";
import { currentAuth, navigate } from "@askrjs/askr/router";
import { Building2Icon, Link2OffIcon, MoreHorizontalIcon, Trash2Icon } from "@askrjs/lucide";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const save = action<
    {
      defaultRole: "viewer" | "member";
      approvalPolicy: "automatic" | "manual";
      approverGroup: string;
      version: string;
    },
    { kind: "updated" } | { kind: "conflict" }
  >(updateWorkspaceAction);
  const reset = action<{ version: string }>(resetInviteAction);
  const [defaultRole, setDefaultRole] = state<"viewer" | "member">(
    settings.data?.defaultRole ?? "viewer",
  );
  const [approvalPolicy, setApprovalPolicy] = state<"automatic" | "manual">(
    settings.data?.approvalPolicy ?? "manual",
  );
  const approverGroup = state(settings.data?.approverGroup ?? "Operations leads");
  const mutationError = state("");
  const saved = state(true);
  const navigationDialogOpen = state(false);
  const workspaceNavigationTrigger = state({ current: null as HTMLElement | null })();
  const dirty = derive(
    () =>
      !saved() &&
      (defaultRole() !== (settings.data?.defaultRole ?? "viewer") ||
        approvalPolicy() !== (settings.data?.approvalPolicy ?? "manual") ||
        approverGroup() !== (settings.data?.approverGroup ?? "Operations leads")),
  );
  on(
    () => window,
    "beforeunload",
    (event) => {
      if (!dirty()) return;
      event.preventDefault();
    },
  );
  const inviteDialogOpen = state(false);
  const inviteActionsTrigger = state({ current: null as HTMLElement | null })();
  return (
    <Block direction="column" gap="lg">
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
                  approverGroup: approverGroup(),
                  version: String(settings.data?.version ?? 1),
                })
                .then((result) => {
                  if (result.kind === "conflict")
                    mutationError.set("Settings changed in another session; reload and retry.");
                  else saved.set(true);
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
                    if (value === "viewer" || value === "member") {
                      saved.set(false);
                      setDefaultRole(value);
                    }
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
                    if (value === "automatic" || value === "manual") {
                      saved.set(false);
                      setApprovalPolicy(value);
                    }
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
            {approvalPolicy() === "manual" ? (
              <Field>
                <Label for="settings-approver-group">Approver group</Label>
                <Input
                  id="settings-approver-group"
                  name="approverGroup"
                  value={approverGroup()}
                  onInput={(event: Event) => {
                    saved.set(false);
                    approverGroup.set((event.currentTarget as HTMLInputElement).value);
                  }}
                  required
                />
              </Field>
            ) : null}
            {mutationError() ? (
              <Text tone="danger" role="alert">
                {mutationError()}
              </Text>
            ) : null}
            <Button type="submit" variant="primary" disabled={save.state().pending}>
              Save workspace
            </Button>
            <Button
              ref={(node) => (workspaceNavigationTrigger.current = node as HTMLElement | null)}
              type="button"
              variant="outline"
              onPress={() => (dirty() ? navigationDialogOpen.set(true) : navigate("/logs"))}
            >
              Return to logs
            </Button>
          </ActionForm>
          <AlertDialog
            open={navigationDialogOpen()}
            onOpenChange={(open) => navigationDialogOpen.set(open)}
          >
            <AlertDialogPortal>
              <AlertDialogOverlay />
              <AlertDialogContent restoreFocus={() => workspaceNavigationTrigger.current}>
                <AlertDialogTitle>Leave without saving workspace changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your local role and approval changes will be discarded.
                </AlertDialogDescription>
                <Block direction="row" justify="end" gap="sm">
                  <Button asChild variant="outline">
                    <AlertDialogCancel>Keep editing</AlertDialogCancel>
                  </Button>
                  <Button asChild variant="destructive">
                    <AlertDialogAction onPress={() => navigate("/logs")}>
                      Discard changes
                    </AlertDialogAction>
                  </Button>
                </Block>
              </AlertDialogContent>
            </AlertDialogPortal>
          </AlertDialog>
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
          <Block direction="column" gap="md">
            <Field>
              <Label for="settings-invite-link">Active invite link</Label>
              <Input
                id="settings-invite-link"
                value={settings.data?.inviteLink ?? "Loading…"}
                readonly
              />
            </Field>
            <DropdownMenu>
              <DropdownMenuTrigger
                ref={(node) => (inviteActionsTrigger.current = node as HTMLElement | null)}
                aria-label="Open invite actions"
                variant="ghost"
                size="icon"
              >
                <MoreHorizontalIcon size={18} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem variant="destructive" onSelect={() => inviteDialogOpen.set(true)}>
                  <Trash2Icon size={16} aria-hidden="true" />
                  Reset active link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog
              open={inviteDialogOpen()}
              onOpenChange={(open) => inviteDialogOpen.set(open)}
            >
              <AlertDialogPortal>
                <AlertDialogOverlay />
                <AlertDialogContent restoreFocus={() => inviteActionsTrigger.current}>
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
                        Reset active link
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
