import { ShieldCheckIcon } from "@askrjs/lucide";
import {
  Badge,
  Block,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Separator,
  Text,
} from "@askrjs/themes/components";
import { demoUser } from "../../auth";

export function ProfileAccess() {
  return (
    <Block direction="column" gap="md">
      <Block direction="row" align="center" justify="between" gap="md">
        <Block gap="0">
          <Text weight="medium">Workspace role</Text>
          <Text tone="muted" size="sm">
            Review the access model attached to this local demo identity.
          </Text>
        </Block>
        <Badge variant="secondary">Member</Badge>
      </Block>
      <Separator decorative />
      <Dialog>
        <Button asChild variant="outline">
          <DialogTrigger>
            <ShieldCheckIcon size={16} aria-hidden="true" />
            Review access
          </DialogTrigger>
        </Button>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogTitle>Workspace access</DialogTitle>
            <DialogDescription>
              {demoUser.name} is using a local demo session for the Destroyer workspace.
            </DialogDescription>
            <Block direction="column" gap="md">
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="muted" size="sm">
                  Role
                </Text>
                <Badge variant="secondary">Member</Badge>
              </Block>
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="muted" size="sm">
                  Session
                </Text>
                <Badge variant="success">Active</Badge>
              </Block>
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="muted" size="sm">
                  Scope
                </Text>
                <Text weight="semibold" size="sm">
                  Local browser
                </Text>
              </Block>
            </Block>
            <Block direction="row" justify="end" gap="sm">
              <Button asChild variant="outline">
                <DialogClose>Close</DialogClose>
              </Button>
            </Block>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </Block>
  );
}
