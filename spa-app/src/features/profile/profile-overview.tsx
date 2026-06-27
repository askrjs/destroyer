import { Block, Grid, Text } from "@askrjs/themes/components";

export function ProfileOverview() {
  return (
    <Block direction="column" gap="md">
      <Text tone="muted">
        This profile is intentionally local to the sample app. It gives the shell a realistic
        signed-in state without requiring a backend.
      </Text>
      <Grid columns={{ base: 1, md: 2 }} gap="md">
        <Block background="muted" padding="md" radius="lg" gap="xs">
          <Text tone="muted" size="sm">
            Workspace
          </Text>
          <Text weight="semibold">Destroyer</Text>
        </Block>
        <Block background="muted" padding="md" radius="lg" gap="xs">
          <Text tone="muted" size="sm">
            Session scope
          </Text>
          <Text weight="semibold">Local browser</Text>
        </Block>
      </Grid>
    </Block>
  );
}
