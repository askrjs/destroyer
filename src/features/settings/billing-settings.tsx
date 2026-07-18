import { state } from "@askrjs/askr";
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
  const pending = state(false);
  const error = state("");
  const downloadInvoice = async () => {
    if (pending()) return;
    pending.set(true);
    error.set("");
    try {
      const response = await fetch("/api/invoices/sample", { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Invoice download failed (${response.status}).`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "destroyer-sample-invoice.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      error.set(caught instanceof Error ? caught.message : "Invoice download failed.");
    } finally {
      pending.set(false);
    }
  };
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
              Download a deterministic authenticated sample invoice.
            </Text>
            <Button
              variant="outline"
              size="sm"
              disabled={pending()}
              onPress={() => void downloadInvoice()}
            >
              {pending() ? "Preparing…" : "Download sample"}
            </Button>
          </Block>
          {error() ? (
            <Text tone="danger" role="alert">
              {error()}
            </Text>
          ) : null}
        </CardContent>
      </Card>
    </Block>
  );
}
