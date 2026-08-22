import { describe, it, expect } from "vitest";
import { licenseHeader } from "./licenseHeader.js";

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
});
