import { Building2Icon, ChevronDownIcon, Link2OffIcon, Trash2Icon } from "@askrjs/lucide";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Field,
  Grid,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Switch,
  Text,
} from "@askrjs/themes/components";
import { defaultRoleOptions } from "./settings-data";

export function WorkspaceSettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Team defaults and access controls.</CardDescription>
          <CardAction>
            <Building2Icon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Field>
              <Label for="settings-workspace-name">Workspace name</Label>
              <Input id="settings-workspace-name" value="Destroyer" readonly />
            </Field>
            <Field>
              <Label id="settings-access-label">Default role</Label>
              <RadioGroup
                aria-labelledby="settings-access-label"
                name="default-role"
                defaultValue="member"
                orientation="horizontal"
              >
                {defaultRoleOptions.map((role) => (
                  <RadioGroupItem
                    key={role.value}
                    value={role.value}
                    disabled={"disabled" in role ? role.disabled : false}
                  >
                    <Block gap="0">
                      <Text weight="medium">{role.label}</Text>
                      <Text tone="muted" size="sm">
                        {role.description}
                      </Text>
                    </Block>
                  </RadioGroupItem>
                ))}
              </RadioGroup>
            </Field>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Access</CardTitle>
          <CardDescription>Controls for new teammates and shared links.</CardDescription>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Invite links</Text>
                <Text tone="muted" size="sm">
                  Allow admins to create scoped invite links.
                </Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Require approval</Text>
                <Text tone="muted" size="sm">
                  New members need an admin review.
                </Text>
              </Block>
              <Switch />
            </Block>
            <Separator decorative />
            <Collapsible>
              <Button asChild variant="ghost" size="sm">
                <CollapsibleTrigger>
                  Advanced invite policy
                  <ChevronDownIcon size={16} aria-hidden="true" />
                </CollapsibleTrigger>
              </Button>
              <CollapsibleContent>
                <Block background="muted" padding="md" radius="md" gap="sm">
                  <Text weight="medium">Policy preview</Text>
                  <Text tone="muted" size="sm">
                    Invite links inherit the default role, expire with workspace policy, and require
                    approval when admin review is enabled.
                  </Text>
                </Block>
              </CollapsibleContent>
            </Collapsible>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invite links</CardTitle>
          <CardDescription>Rotate shared links when access policy changes.</CardDescription>
          <CardAction>
            <Link2OffIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
            <Block gap="xs">
              <Text weight="medium">Reset all active invite links</Text>
              <Text tone="muted" size="sm">
                Existing demo invite URLs stop working and admins can generate fresh links.
              </Text>
            </Block>
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
                    This is a local Destroyer action, but it uses the same confirmation pattern a
                    production workspace would need before invalidating shared access.
                  </AlertDialogDescription>
                  <Block direction="row" justify="end" gap="sm">
                    <Button asChild variant="outline">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </Button>
                    <Button asChild variant="destructive">
                      <AlertDialogAction>Reset links</AlertDialogAction>
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
