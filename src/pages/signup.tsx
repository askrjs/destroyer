import { state } from "@askrjs/askr";
import { Link, currentRoute, navigate } from "@askrjs/askr/router";
import { BoxIcon } from "@askrjs/lucide";
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
  Label,
  Page,
  Text,
} from "@askrjs/themes/components";
import { signUp, validatedNext } from "../auth";

export function SignupPage() {
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
        : ((document.getElementById("signup-email") as HTMLInputElement | null)?.value ?? "");
    const password =
      typeof document === "undefined"
        ? ""
        : ((document.getElementById("signup-password") as HTMLInputElement | null)?.value ?? "");
    pending.set(true);
    error.set("");
    try {
      const response = await signUp({
        email,
        password,
      });
      if (response.ok) navigate(validatedNext(search));
      else if (response.status === 409) error.set("An account with this email already exists.");
      else if (response.status === 422)
        error.set("Enter a valid email and a password between 4 and 128 characters.");
      else if (response.status === 429) error.set("Too many attempts. Try again in 15 minutes.");
      else error.set("Account creation could not be completed.");
    } catch {
      error.set("Account creation could not be completed.");
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
              <CardTitle>Create your operator account</CardTitle>
              <CardDescription>Signup automatically signs you in.</CardDescription>
            </CardHeader>
            <CardContent>
              <Block as="form" direction="column" gap="md" onSubmit={submit}>
                <Field>
                  <Label for="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                  />
                </Field>
                <Field>
                  <Label for="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    autocomplete="new-password"
                    minlength={4}
                    maxlength={128}
                    required
                  />
                </Field>
                {error() && <FieldError>{error()}</FieldError>}
                <Button type="submit" variant="primary" width="full" disabled={pending()}>
                  {pending() ? "Creating account…" : "Create account"}
                </Button>
              </Block>
            </CardContent>
          </Card>
          <Text tone="muted" size="sm">
            Already have an account? <Link href={`/login${search}`}>Sign in</Link>
          </Text>
        </Block>
      </Block>
    </Page>
  );
}
