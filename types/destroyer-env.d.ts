import type { JSXElement } from "@askrjs/askr/foundations";

declare global {
  namespace JSX {
    interface Element extends JSXElement {
      readonly __destroyerElementBrand?: never;
    }

    interface IntrinsicElements {
      [element: string]: Record<string, unknown>;
    }

    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}

export {};
