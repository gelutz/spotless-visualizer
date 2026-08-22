import { describe, it, expect } from "vitest";
import { indent } from "./indent.js";

const run = (src, o = {}) => indent.apply(src, { spaces: true, spacesPerTab: 4, ...o });

describe("indent", () => {
  it("expands a leading tab to the tab width", () => {
    expect(run("\tx")).toBe("    x");
  });

  it("advances a tab to the next tab stop rather than adding a full width", () => {
    // Two spaces then a tab lands on column 4, not column 6.
    expect(run("  \tx")).toBe("    x");
  });

  it("honours a non-default tab width", () => {
    expect(run("\tx", { spacesPerTab: 2 })).toBe("  x");
  });

  it("converts spaces back to tabs, keeping the remainder as spaces", () => {
    expect(run("      x", { spaces: false })).toBe("\t  x");
  });

  it("leaves interior whitespace alone", () => {
    expect(run("\tint a\t= 1;")).toBe("    int a\t= 1;");
  });

  it("leaves a line with no indentation alone", () => {
    expect(run("x")).toBe("x");
  });

  it("leaves an empty line empty", () => {
    expect(run("a\n\nb")).toBe("a\n\nb");
  });

  it("treats a width of zero as one, rather than dividing by zero", () => {
    expect(run("\tx", { spacesPerTab: 0 })).toBe(" x");
  });
});
