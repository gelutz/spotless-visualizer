import { describe, it, expect } from "vitest";
import { trimTrailingWhitespace } from "./trimTrailingWhitespace.js";
import { endWithNewline } from "./endWithNewline.js";
import { replace } from "./replace.js";
import { replaceRegex } from "./replaceRegex.js";
import { toggleOffOn } from "./toggleOffOn.js";

describe("trimTrailingWhitespace", () => {
  const run = src => trimTrailingWhitespace.apply(src);

  it("strips trailing spaces and tabs", () => {
    expect(run("a   \nb\t\t")).toBe("a\nb");
  });

  it("leaves leading indentation alone", () => {
    expect(run("    a   ")).toBe("    a");
  });

  it("empties a whitespace-only line", () => {
    expect(run("a\n   \nb")).toBe("a\n\nb");
  });
});

describe("endWithNewline", () => {
  const run = src => endWithNewline.apply(src);

  it("adds the missing newline", () => {
    expect(run("a")).toBe("a\n");
  });

  it("leaves a single trailing newline alone", () => {
    expect(run("a\n")).toBe("a\n");
  });

  it("collapses several trailing newlines to one", () => {
    expect(run("a\n\n\n")).toBe("a\n");
  });
});

describe("replace", () => {
  const run = (src, o) => replace.apply(src, o);

  it("replaces every occurrence", () => {
    expect(run("TODO x TODO", { search: "TODO", replacement: "FIXME" })).toBe("FIXME x FIXME");
  });

  it("is a no-op when the search string is empty", () => {
    expect(run("abc", { search: "", replacement: "x" })).toBe("abc");
  });

  it("treats the search string literally, not as a regex", () => {
    expect(run("a.c", { search: "a.c", replacement: "X" })).toBe("X");
    expect(run("abc", { search: "a.c", replacement: "X" })).toBe("abc");
  });
});

describe("replaceRegex", () => {
  const run = (src, o) => replaceRegex.apply(src, o);

  it("applies the pattern globally across lines", () => {
    expect(run("a1b2", { searchRegex: "\\d", replacement: "#" })).toBe("a#b#");
  });

  it("interprets a literal \\n in the pattern as a newline", () => {
    expect(run("{\n\nx", { searchRegex: "\\{\\n\\n", replacement: "{\\n" })).toBe("{\nx");
  });

  it("returns the source untouched when the pattern is invalid", () => {
    expect(run("abc", { searchRegex: "[", replacement: "x" })).toBe("abc");
  });

  it("is a no-op when the pattern is empty", () => {
    expect(run("abc", { searchRegex: "", replacement: "x" })).toBe("abc");
  });

  it("supports backreferences", () => {
    expect(run("ab", { searchRegex: "(a)(b)", replacement: "$2$1" })).toBe("ba");
  });
});

describe("toggleOffOn", () => {
  it("has no transform - the pipeline implements it", () => {
    expect(toggleOffOn.apply).toBeNull();
  });

  it("emits the bare call for the default markers", () => {
    const o = { off: "spotless:off", on: "spotless:on" };
    expect(toggleOffOn.gradle(o)).toBe("toggleOffOn()");
    expect(toggleOffOn.maven(o)).toBe("<toggleOffOn/>");
  });

  it("emits the markers when they are customized", () => {
    const o = { off: "fmt:off", on: "fmt:on" };
    expect(toggleOffOn.gradle(o)).toBe("toggleOffOn('fmt:off', 'fmt:on')");
    expect(toggleOffOn.maven(o)).toContain("<off>fmt:off</off>");
  });
});
