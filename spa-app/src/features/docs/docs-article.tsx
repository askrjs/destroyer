import { LayersIcon } from "@askrjs/lucide";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Block,
  Separator,
  Text,
} from "@askrjs/themes/components";
import { DocsArticleTools } from "./docs-article-tools";
import { docsContent, type DocsPath } from "./docs-data";

export function DocsArticle({ activePath }: { activePath: DocsPath }) {
  const content = docsContent[activePath];
  const Icon = content.icon;

  return (
    <Block as="article" gap="2xl" maxWidth="lg">
      <Block gap="lg">
        <Block direction="row" align="center" gap="sm">
          <Block center padding="sm" radius="md" background="selected">
            <Icon size={20} aria-hidden="true" />
          </Block>
          <Badge variant="secondary">{content.badge}</Badge>
        </Block>
        <Block gap="sm">
          <Text tone="muted" size="sm">
            {content.eyebrow}
          </Text>
          <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
            <Text as="strong" weight="bold" size="lg">
              {content.title}
            </Text>
            <DocsArticleTools activePath={activePath} />
          </Block>
          <Text tone="muted">{content.description}</Text>
        </Block>
      </Block>

      <Separator decorative />

      <Block gap="2xl">
        {content.sections.map((section) => (
          <Block key={section.title} gap="sm">
            <Text as="strong" weight="semibold">
              {section.title}
            </Text>
            <Text tone="muted">{section.body}</Text>
          </Block>
        ))}
      </Block>

      <Block gap="md" padding="lg" background="muted" radius="md">
        <Block direction="row" align="center" gap="sm">
          <LayersIcon size={16} aria-hidden="true" />
          <Text as="strong" weight="semibold">
            Verification notes
          </Text>
        </Block>
        <Accordion defaultValue="route-checks" collapsible>
          <AccordionItem value="route-checks">
            <AccordionHeader>
              <AccordionTrigger>Route and shell checks</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Block gap="sm">
                {content.checks.map((check) => (
                  <Text key={check} tone="muted" size="sm">
                    {check}
                  </Text>
                ))}
              </Block>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="responsive-review">
            <AccordionHeader>
              <AccordionTrigger>Responsive review</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Text tone="muted" size="sm">
                Check the docs page at mobile, tablet, and desktop widths so the rail, article copy,
                and route action stay readable without clipped text.
              </Text>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="theme-ownership">
            <AccordionHeader>
              <AccordionTrigger>Theme ownership</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Text tone="muted" size="sm">
                Any visual issue found here should be fixed in the shared theme unless the docs page
                is composing the primitive incorrectly.
              </Text>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Block>
    </Block>
  );
}
