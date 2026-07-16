import {
  Badge,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
  Text,
} from "@askrjs/themes/components";

export function BillingSettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Plan and billing details for this workspace.</CardDescription>
          <CardAction>
            <Badge variant="info">Starter</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Grid columns={{ base: 1, md: 3 }} gap="md">
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">
                Plan
              </Text>
              <Text weight="semibold">Starter</Text>
            </Block>
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">
                Seats
              </Text>
              <Text weight="semibold">3 active</Text>
            </Block>
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">
                Renewal
              </Text>
              <Text weight="semibold">Demo only</Text>
            </Block>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Recent billing activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Block direction="row" align="center" justify="between" gap="md">
            <Text tone="muted" size="sm">
              No invoices are generated for local demo sessions.
            </Text>
            <Button type="button" variant="outline" size="sm">
              Download sample
            </Button>
          </Block>
        </CardContent>
      </Card>
    </Block>
  );
}
