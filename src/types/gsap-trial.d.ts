declare module "gsap-trial/SplitText" {
  export class SplitText {
    chars: HTMLElement[];
    words: HTMLElement[];
    lines: HTMLElement[];
    constructor(target: string | Element | Array<string | Element>, vars?: Record<string, unknown>);
    revert(): void;
  }
}

declare module "gsap-trial/ScrollSmoother" {
  export class ScrollSmoother {
    static create(vars?: Record<string, unknown>): ScrollSmoother;
    static refresh(safe?: boolean): void;
    scrollTop(value?: number): number;
    scrollTo(target: string | Element | number | null | undefined, smooth?: boolean, position?: string): void;
    paused(value?: boolean): boolean;
  }
}
