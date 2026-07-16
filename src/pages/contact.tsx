import { state } from "@askrjs/askr";
import { Link } from "@askrjs/askr/router";
import { CheckCircle2Icon, MailIcon, MessageSquareIcon, SendIcon, XIcon } from "@askrjs/lucide";
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
  Separator,
  Textarea,
} from "@askrjs/themes/components";
import { contactChecks } from "../features/contact/contact-data";

export function ContactPage() {
  const toastOpen = state(false);
  const messageError = state(false);

  const handleSendSample = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    const message =
      typeof document === "undefined"
        ? ""
        : ((document.getElementById("contact-message") as HTMLTextAreaElement | null)?.value ?? "");

    if (message.trim().length === 0) {
      toastOpen.set(false);
      messageError.set(true);
      return;
    }

    messageError.set(false);
    toastOpen.set(true);
  };

  return (
    <>
      <Page>
        <PageHeader
          title="Contact"
          description="A simple themed form surface for checking labels, inputs, textarea, and action rows."
          actions={<Badge variant="outline">SPA sample</Badge>}
        />

        <Block rowFrom="lg" gap="lg">
          <Block direction="column" grow>
            <Card variant="raised">
              <CardHeader>
                <CardTitle>Send a note</CardTitle>
                <CardDescription>
                  Use this static form to review everyday contact styling.
                </CardDescription>
                <CardAction>
                  <MessageSquareIcon size={18} aria-hidden="true" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <Block
                  as="form"
                  direction="column"
                  gap="md"
                  onReset={() => {
                    messageError.set(false);
                    toastOpen.set(false);
                  }}
                  onSubmit={handleSendSample}
                >
                  <Field>
                    <Label for="contact-name">Name</Label>
                    <Input id="contact-name" name="name" placeholder="Jane Developer" />
                  </Field>
                  <Field>
                    <Label for="contact-email">Email</Label>
                    <InputGroup>
                      <InputGroupText>
                        <MailIcon size={16} aria-hidden="true" />
                      </InputGroupText>
                      <Input
                        id="contact-email"
                        name="email"
                        placeholder="jane@example.com"
                        type="email"
                      />
                    </InputGroup>
                  </Field>
                  <Field invalid={messageError()}>
                    <Label for="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      placeholder="What should this sample cover next?"
                      rows={5}
                      aria-describedby={
                        messageError()
                          ? "contact-message-error contact-message-hint"
                          : "contact-message-hint"
                      }
                      aria-invalid={messageError() ? "true" : undefined}
                      onInput={() => {
                        if (messageError()) {
                          messageError.set(false);
                        }
                      }}
                    />
                    <FieldHint id="contact-message-hint">
                      This form is presentational for the destroyer sample.
                    </FieldHint>
                    {messageError() ? (
                      <FieldError id="contact-message-error">Message is required.</FieldError>
                    ) : null}
                  </Field>
                  <ButtonGroup attached={false}>
                    <Button type="submit" variant="primary">
                      <SendIcon size={16} aria-hidden="true" />
                      Send sample
                    </Button>
                    <Button type="reset" variant="outline">
                      Reset
                    </Button>
                  </ButtonGroup>
                </Block>
              </CardContent>
            </Card>
          </Block>

          <Block direction="column" grow>
            <Card>
              <CardHeader>
                <CardTitle>Contact QA</CardTitle>
                <CardDescription>What this page exercises in the SPA.</CardDescription>
                <CardAction>
                  <Badge variant="success">Clean</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Separator decorative />
                <Block direction="column" gap="sm" paddingY="md">
                  {contactChecks.map((check) => (
                    <Block key={check} direction="row" align="center" gap="sm">
                      <CheckCircle2Icon size={16} aria-hidden="true" />
                      <span>{check}</span>
                    </Block>
                  ))}
                </Block>
              </CardContent>
            </Card>
          </Block>
        </Block>
      </Page>
      {toastOpen() ? (
        <div data-slot="toast-viewport">
          <div
            data-slot="toast"
            data-state="open"
            data-variant="success"
            role="status"
            aria-live="polite"
            aria-labelledby="contact-toast-title"
            aria-describedby="contact-toast-description"
          >
            <span data-slot="toast-icon" aria-hidden="true">
              <CheckCircle2Icon size={16} />
            </span>
            <div id="contact-toast-title" data-slot="toast-title">
              Message queued
            </div>
            <div id="contact-toast-description" data-slot="toast-description">
              The note is ready for review in the support queue.
            </div>
            <Link href="/logs" data-slot="toast-action">
              Review logs
            </Link>
            <button
              type="button"
              data-slot="toast-close"
              aria-label="Dismiss notification"
              onClick={() => toastOpen.set(false)}
            >
              <XIcon size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
