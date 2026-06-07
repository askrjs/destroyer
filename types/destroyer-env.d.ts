import type { Props } from "@askrjs/askr";

declare global {
  namespace JSX {
    interface Element {
      readonly __destroyerElementBrand?: never;
      readonly $$typeof?: symbol;
      type: string | ((props: Props) => unknown) | symbol;
      props?: Props;
      children?: Array<Element | string | number | boolean | null | undefined>;
      key?: string | number | null;
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
