import { describe, it, expect } from "vitest";
import { formatAnnotations } from "./formatAnnotations.js";

const run = (src, addTypeAnnotation = "") => formatAnnotations.apply(src, { addTypeAnnotation });

describe("formatAnnotations", () => {
  it("pulls a known type annotation onto the following line", () => {
    expect(run("\t@Nullable\n\tprivate String name;")).toBe("\t@Nullable private String name;");
  });

  it("leaves an annotation it does not know on its own line", () => {
    const src = "\t@Override\n\tpublic String toString() {";
    expect(run(src)).toBe(src);
  });

  it("accepts an extra annotation through addTypeAnnotation", () => {
    expect(run("@Custom\nString s;", "Custom")).toBe("@Custom String s;");
  });

  it("tolerates a leading @ in addTypeAnnotation", () => {
    expect(run("@Custom\nString s;", "@Custom")).toBe("@Custom String s;");
  });

  it("keeps the annotation's own arguments", () => {
    expect(run("@GuardedBy(\"lock\")\nint n;")).toBe("@GuardedBy(\"lock\") int n;");
  });

  it("keeps the indentation of the annotation line, not the type line", () => {
    expect(run("  @Nullable\n        String s;")).toBe("  @Nullable String s;");
  });

  it("does not join onto a blank line", () => {
    const src = "@Nullable\n\nString s;";
    expect(run(src)).toBe(src);
  });

  it("does not join when the annotation is the last line", () => {
    expect(run("@Nullable")).toBe("@Nullable");
  });

  it("leaves an annotation that already shares its line", () => {
    const src = "@Nullable String s;";
    expect(run(src)).toBe(src);
  });
});
