import { Link, currentAuth, navigate } from "@askrjs/askr/router";
import { BoxIcon, LogOutIcon } from "@askrjs/lucide";
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
  Page,
  Separator,
  Text,
} from "@askrjs/themes/components";
import { signOut } from "../auth";

export function LogoutPage() {
  const principal = currentAuth().principal;
  const handleSignOut = async () => {
    const response = await signOut();
    if (!response.ok) return;
    navigate("/login");
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
              <CardTitle>Sign out of your workspace?</CardTitle>
              <CardDescription>
                This will end the browser session for{" "}
                {typeof principal?.name === "string" ? principal.name : "your account"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Block direction="column" gap="md">
                <Text tone="muted" size="sm">
                  You can sign back in at any time with the local operator account.
                </Text>
                <Separator decorative />
                <Button type="button" variant="destructive" width="full" onPress={handleSignOut}>
                  <LogOutIcon size={16} aria-hidden="true" />
                  Sign out
                </Button>
                <Button asChild variant="outline" width="full">
                  <Link href="/">Stay signed in</Link>
                </Button>
              </Block>
            </CardContent>
            <CardFooter>
              <Text tone="muted" size="sm">
                Signing out returns you to the login screen.
              </Text>
            </CardFooter>
          </Card>
        </Block>
      </Block>
    </Page>
  );
}
