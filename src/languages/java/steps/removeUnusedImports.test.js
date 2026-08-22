import { describe, it, expect } from "vitest";
import { removeUnusedImports } from "./removeUnusedImports.js";

const run = src => removeUnusedImports.apply(src);

describe("removeUnusedImports", () => {
  it("leaves a file with no imports alone", () => {
    const src = "package p;\n\nclass C {}";
    expect(run(src)).toBe(src);
  });

  it("drops an import whose simple name never appears in the body", () => {
    const out = run([
      "package p;", "",
      "import java.util.List;",
      "import java.util.Date;", "",
      "class C { List<String> xs; }"
    ].join("\n"));
    expect(out).not.toContain("Date");
    expect(out).toContain("import java.util.List;");
  });

  it("keeps a wildcard import, whose usage it cannot see", () => {
    const out = run(["package p;", "", "import java.util.*;", "", "class C {}"].join("\n"));
    expect(out).toContain("import java.util.*;");
  });

  it("keeps a static import that is referenced by simple name", () => {
    const out = run([
      "package p;", "",
      "import static java.util.Objects.requireNonNull;", "",
      "class C { void f(Object o) { requireNonNull(o); } }"
    ].join("\n"));
    expect(out).toContain("requireNonNull");
  });

  it("drops an unreferenced static import", () => {
    const out = run([
      "package p;", "",
      "import static java.util.Objects.requireNonNull;", "",
      "class C {}"
    ].join("\n"));
    expect(out).not.toContain("requireNonNull");
  });

  it("does not count a mention inside the import block itself as usage", () => {
    // Date appears only in its own import line, so it must still go.
    const out = run([
      "package p;", "",
      "import java.util.Date;", "",
      "class C {}"
    ].join("\n"));
    expect(out).not.toContain("Date");
  });

  it("strips trailing whitespace from the imports it keeps", () => {
    const out = run([
      "package p;", "",
      "import java.util.List;   ", "",
      "class C { List xs; }"
    ].join("\n"));
    expect(out).toContain("import java.util.List;\n");
    expect(out).not.toContain("List;   ");
  });

  it("preserves everything outside the import block", () => {
    const out = run(["package p;", "", "import java.util.Date;", "", "class C {}"].join("\n"));
    expect(out.split("\n")[0]).toBe("package p;");
    expect(out.split("\n").at(-1)).toBe("class C {}");
  });
});
