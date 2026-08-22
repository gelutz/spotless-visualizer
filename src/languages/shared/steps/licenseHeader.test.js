import { describe, it, expect } from "vitest";
import { licenseHeaderFor } from "./licenseHeader.js";

const licenseHeader = licenseHeaderFor({ delimiter: "package " });
const DEFAULTS = { content: "/* (C)$YEAR MyCompany */", delimiter: "package " };
const run = (src, o = {}) => licenseHeader.apply(src, { ...DEFAULTS, ...o });

describe("licenseHeader", () => {
  it("inserts the header above the delimiter line", () => {
    const out = run("package p;\n\nclass C {}");
    expect(out.split("\n")[0]).toBe(`/* (C)${new Date().getFullYear()} MyCompany */`);
    expect(out.split("\n")[1]).toBe("package p;");
  });

  it("expands every $YEAR occurrence", () => {
    const y = String(new Date().getFullYear());
    const out = run("package p;", { content: `/* $YEAR-$YEAR */` });
    expect(out.split("\n")[0]).toBe(`/* ${y}-${y} */`);
  });

  it("replaces a header that is already there", () => {
    const out = run("/* old header */\npackage p;\n\nclass C {}");
    expect(out).not.toContain("old header");
    expect(out.split("\n").filter(l => l.startsWith("/*"))).toHaveLength(1);
  });

  it("prepends when the delimiter is not found, keeping the source intact", () => {
    const out = run("class C {}", { delimiter: "NOPE" });
    expect(out).toBe(`/* (C)${new Date().getFullYear()} MyCompany */\nclass C {}`);
  });

  it("honours a custom delimiter", () => {
    const out = run("package p;\n\nclass C {}", { content: "// h", delimiter: "class " });
    // Everything above `class` is dropped, package line included.
    expect(out).toBe("// h\nclass C {}");
  });

  // Spotless treats the delimiter as a regex for every language. `package `
  // only worked under startsWith because it matches itself.
  it("treats the delimiter as a regex, not a literal prefix", () => {
    const ts = licenseHeaderFor({ delimiter: "(import|const|declare|export|var) " });
    const out = ts.apply("// stale\nimport { a } from './a';\nconst x = 1;", {
      content: "// h", delimiter: "(import|const|declare|export|var) "
    });
    expect(out).toBe("// h\nimport { a } from './a';\nconst x = 1;");
  });

  it("matches the delimiter at the start of a line only", () => {
    const out = run("const s = 'package x';\npackage p;", { content: "// h" });
    expect(out).toBe("// h\npackage p;");
  });

  it("falls back to a literal match when the delimiter is not a valid regex", () => {
    // Half-typed regexes arrive from a text input on every keystroke; throwing
    // here would blank the pane mid-edit.
    const out = run("a(b\nrest", { content: "// h", delimiter: "a(b" });
    expect(out).toBe("// h\na(b\nrest");
  });

  it("emits the delimiter argument only when it differs from the language default", () => {
    expect(licenseHeader.gradle(DEFAULTS)).toBe(`licenseHeader '${DEFAULTS.content}'`);
    expect(licenseHeader.gradle({ ...DEFAULTS, delimiter: "class " }))
      .toBe(`licenseHeader '${DEFAULTS.content}', 'class '`);

    const ts = licenseHeaderFor({ delimiter: "(import|const) " });
    expect(ts.gradle({ ...DEFAULTS, delimiter: "(import|const) " }))
      .toBe(`licenseHeader '${DEFAULTS.content}'`);
  });
});
