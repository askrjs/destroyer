import { Link } from "@askrjs/askr/router";
import { Button, EmptyState, Page } from "@askrjs/themes/components";

export function NotFoundPage() {
  return (
    <Page>
      <EmptyState
        title="Not found"
        titleAs="h1"
        description="The requested Destroyer route does not exist."
        action={
          <Button asChild variant="primary">
            <Link href="/">Return home</Link>
          </Button>
        }
      />
    </Page>
  );
}
