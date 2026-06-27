import { navigate } from "@askrjs/askr/router";
import { BoxIcon, LockIcon, MailIcon } from "@askrjs/lucide";
import { GoogleLogo, MicrosoftLogo } from "@askrjs/logos";
import {
  Block,
  Brand,
  BrandLabel,
  BrandMark,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Page,
  Separator,
  Text,
} from "@askrjs/themes/components";
import { demoUser, signIn } from "../auth";

export function LoginPage() {
  const handleSignIn = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    signIn();
    navigate("/");
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
              <CardDescription>
                Enter your credentials below to continue as {demoUser.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Block as="form" direction="column" gap="md" onSubmit={handleSignIn}>
                <Field>
                  <Label for="login-email">Email</Label>
                  <InputGroup>
                    <InputGroupText>
                      <MailIcon size={16} aria-hidden="true" />
                    </InputGroupText>
                    <Input id="login-email" name="email" value={demoUser.email} readonly />
                  </InputGroup>
                </Field>
                <Block direction="row" align="center" justify="between" gap="md">
                  <Label for="login-password">Password</Label>
                  <Button type="button" variant="link" size="sm">
                    Forgot your password?
                  </Button>
                </Block>
                <Field>
                  <InputGroup>
                    <InputGroupText>
                      <LockIcon size={16} aria-hidden="true" />
                    </InputGroupText>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      value="destroyer"
                      readonly
                    />
                  </InputGroup>
                </Field>
                <Button type="submit" variant="primary" width="full">
                  Sign in
                </Button>
                <Separator decorative />
                <Text tone="muted" size="sm">
                  Or continue with
                </Text>
                <Button type="button" variant="outline" width="full" onPress={handleSignIn}>
                  <GoogleLogo size={16} aria-hidden="true" />
                  Login with Google
                </Button>
                <Button type="button" variant="outline" width="full" onPress={handleSignIn}>
                  <MicrosoftLogo size={16} aria-hidden="true" />
                  Login with Microsoft
                </Button>
              </Block>
            </CardContent>
            <CardFooter>
              <Text tone="muted" size="sm">
                By continuing, you agree to the Askr terms and privacy policy.
              </Text>
            </CardFooter>
          </Card>
          <Block direction="row" align="center" justify="center" gap="xs">
            <Text as="span" tone="muted" size="sm">
              Need an account?
            </Text>
            <Button type="button" variant="link" size="sm">
              Create one
            </Button>
          </Block>
        </Block>
      </Block>
    </Page>
  );
}
