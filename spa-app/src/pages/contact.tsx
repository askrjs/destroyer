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

const contactChecks = [
  "Route transition keeps the shell mounted",
  "Field spacing follows theme density",
  "Buttons and inputs inherit the active mode",
] as const;

export function ContactPage() {
  return (
    <Page>
      <PageHeader
        title="Contact"
        description="A simple themed form surface for checking labels, inputs, textarea, and action rows."
        actions={<Badge variant="outline">SPA sample</Badge>}
      />

      <Block direction={{ base: "column", lg: "row" }} gap="lg" align="stretch">
        <Block direction="column" grow>
          <Card variant="raised">
            <CardHeader>
              <CardTitle>Send a note</CardTitle>
              <CardDescription>Use this static form to review everyday contact styling.</CardDescription>
              <CardAction>
                <MessageSquareIcon size={18} aria-hidden="true" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <Block as="form" direction="column" gap="md">
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
                <Field>
                  <Label for="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="What should this sample cover next?"
                    rows={5}
                  />
                  <FieldHint>This form is presentational for the destroyer sample.</FieldHint>
                </Field>
                <ButtonGroup attached={false}>
                  <Button type="button" variant="primary">
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
  );
}
