import { state } from "@askrjs/askr";
import { Link, currentRoute, navigate } from "@askrjs/askr/router";
import { BoxIcon, LockIcon, MailIcon } from "@askrjs/lucide";
import {
  Block,
  Brand,
  BrandLabel,
  BrandMark,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Page,
  Text,
} from "@askrjs/themes/components";
import { signIn, validatedNext } from "../auth";

export function LoginPage() {
  const pending = state(false);
  const error = state("");
  const route = currentRoute();
  const next = route.query.get("next");
  const search = next ? `?next=${encodeURIComponent(next)}` : "";
  const submit = async (event?: {
    preventDefault?: () => void;
    currentTarget?: EventTarget | null;
  }) => {
    event?.preventDefault?.();
    if (pending()) return;
    const email =
      typeof document === "undefined"
        ? ""
        : ((document.getElementById("login-email") as HTMLInputElement | null)?.value ?? "");
    const password =
      typeof document === "undefined"
        ? ""
        : ((document.getElementById("login-password") as HTMLInputElement | null)?.value ?? "");
    pending.set(true);
    error.set("");
    try {
      const response = await signIn({
        email,
        password,
      });
      if (response.ok) navigate(validatedNext(search));
      else if (response.status === 401) error.set("Email or password is incorrect.");
      else if (response.status === 422)
        error.set("Enter a valid email and a password between 4 and 128 characters.");
      else if (response.status === 429) error.set("Too many attempts. Try again in 15 minutes.");
      else error.set("Sign in could not be completed.");
    } catch {
      error.set("Sign in could not be completed.");
    } finally {
      pending.set(false);
    }
  };
  return (
    <Page background="muted" center>
      <Block as="section" align="center" justify="center" grow>
        <Block width="full" maxWidth="sm" gap="lg">
          <Card variant="raised">
            <CardHeader>
              <Brand>
                <BrandMark aria-hidden="true">
                  <BoxIcon size={16} />
                </BrandMark>
                <BrandLabel>Destroyer</BrandLabel>
              </Brand>
              <CardTitle>Sign in to your workspace</CardTitle>
              <CardDescription>Use your operator email and password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Block as="form" direction="column" gap="md" onSubmit={submit}>
                <Field>
                  <Label for="login-email">Email</Label>
                  <InputGroup>
                    <InputGroupText>
                      <MailIcon size={16} aria-hidden="true" />
                    </InputGroupText>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      autocomplete="email"
                      required
                    />
                  </InputGroup>
                </Field>
                <Field>
                  <Label for="login-password">Password</Label>
                  <InputGroup>
                    <InputGroupText>
                      <LockIcon size={16} aria-hidden="true" />
                    </InputGroupText>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      autocomplete="current-password"
                      minlength={4}
                      maxlength={128}
                      required
                    />
                  </InputGroup>
                </Field>
                {error() && <FieldError>{error()}</FieldError>}
                <Button type="submit" variant="primary" width="full" disabled={pending()}>
                  {pending() ? "Signing in…" : "Sign in"}
                </Button>
              </Block>
            </CardContent>
          </Card>
          <Text tone="muted" size="sm">
            Need an account? <Link href={`/signup${search}`}>Create one</Link>
          </Text>
        </Block>
      </Block>
    </Page>
  );
}
