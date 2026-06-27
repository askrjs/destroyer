import { Link, navigate } from "@askrjs/askr/router";
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
import { demoUser, signOut } from "../auth";

export function LogoutPage() {
  const handleSignOut = () => {
    signOut();
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
                This will end the local session for {demoUser.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Block direction="column" gap="md">
                <Text tone="muted" size="sm">
                  You can sign back in at any time with the demo account. Nothing outside this
                  browser is changed.
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
