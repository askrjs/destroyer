import { state } from "@askrjs/askr";
import { CheckCircle2Icon, MailIcon, MessageSquareIcon, SendIcon } from "@askrjs/lucide";
import {
  Badge,
  Block,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldHint,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Page,
  PageHeader,
  Text,
  Textarea,
} from "@askrjs/themes/components";

type ContactReceipt = { id: string; receivedAt: string };

export function ContactPage() {
  const pending = state(false);
  const error = state("");
  const receipt = state<ContactReceipt | null>(null);
  const submit = async (event: Event) => {
    event.preventDefault();
    if (pending()) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const values = new FormData(form);
    pending.set(true);
    error.set("");
    receipt.set(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          email: String(values.get("email") ?? ""),
          subject: String(values.get("subject") ?? ""),
          message: String(values.get("message") ?? ""),
        }),
      });
      if (response.ok) {
        receipt.set((await response.json()) as ContactReceipt);
        form.reset();
      } else if (response.status === 422) {
        error.set("Enter a valid email, a subject, and at least ten message characters.");
      } else if (response.status === 429) {
        error.set("Contact requests are limited to three per hour.");
      } else {
        error.set("The support request could not be saved.");
      }
    } catch (caught) {
      error.set(
        caught instanceof Error ? caught.message : "The support request could not be saved.",
      );
    } finally {
      pending.set(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Contact"
        description="Send a persisted support request to the local Destroyer operations database."
        actions={<Badge variant="outline">SQLite support queue</Badge>}
      />
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Contact support</CardTitle>
          <CardDescription>
            Requests are validated, rate limited, and assigned a receipt.
          </CardDescription>
          <CardAction>
            <MessageSquareIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block as="form" direction="column" gap="md" onSubmit={submit}>
            <Field>
              <Label for="contact-email">Email</Label>
              <InputGroup>
                <InputGroupText>
                  <MailIcon size={16} aria-hidden="true" />
                </InputGroupText>
                <Input id="contact-email" name="email" type="email" required />
              </InputGroup>
            </Field>
            <Field>
              <Label for="contact-subject">Subject</Label>
              <Input id="contact-subject" name="subject" minlength={3} maxlength={120} required />
            </Field>
            <Field invalid={Boolean(error())}>
              <Label for="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                name="message"
                rows={6}
                minlength={10}
                maxlength={4000}
                required
              />
              <FieldHint>Include the route, expected behavior, and observed result.</FieldHint>
              {error() ? <FieldError role="alert">{error()}</FieldError> : null}
            </Field>
            <ButtonGroup attached={false}>
              <Button type="submit" variant="primary" disabled={pending()}>
                <SendIcon size={16} aria-hidden="true" />
                {pending() ? "Sending…" : "Send request"}
              </Button>
              <Button
                type="reset"
                variant="outline"
                onPress={() => {
                  error.set("");
                  receipt.set(null);
                }}
              >
                Reset
              </Button>
            </ButtonGroup>
          </Block>
          {receipt() ? (
            <Block background="muted" padding="md" radius="md" gap="xs" role="status">
              <Block direction="row" align="center" gap="sm">
                <CheckCircle2Icon size={16} aria-hidden="true" />
                <Text weight="semibold">Support request received</Text>
              </Block>
              <Text size="sm">Receipt {receipt()!.id}</Text>
              <Text tone="muted" size="sm">
                Stored at {new Date(receipt()!.receivedAt).toLocaleString()}.
              </Text>
            </Block>
          ) : null}
        </CardContent>
      </Card>
    </Page>
  );
}
