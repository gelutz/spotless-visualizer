import { describe, it, expect } from "vitest";
import { importOrder } from "./importOrder.js";

const DEFAULTS = { order: "java|javax,,\\#", wildcardsLast: false, semanticSort: false };
const run = (src, o = {}) => importOrder.apply(src, { ...DEFAULTS, ...o });

const file = (...imports) => ["package p;", "", ...imports, "", "class C {}"].join("\n");
const importsOf = out => out.split("\n").slice(2, -2);

describe("importOrder", () => {
  it("leaves a file with no imports alone", () => {
    const src = "package p;\n\nclass C {}";
    expect(run(src)).toBe(src);
  });

  it("sorts into the declared groups, blank line between them", () => {
    const out = run(file(
      "import com.example.A;",
      "import java.util.List;",
      "import static org.junit.Assert.assertTrue;"
    ));
    expect(importsOf(out)).toEqual([
      "import java.util.List;",
      "",
      "import com.example.A;",
      "",
      "import static org.junit.Assert.assertTrue;"
    ]);
  });

  it("matches the longest prefix when two groups both apply", () => {
    const out = run(file("import com.example.deep.X;", "import com.other.Y;"),
      { order: "com,com.example,," });
    expect(importsOf(out)).toEqual([
      "import com.other.Y;",
      "",
      "import com.example.deep.X;"
    ]);
  });

  it("does not treat a prefix as matching a longer package name", () => {
    // `javax` must not land in the `java` group by string prefix alone.
    const out = run(file("import javax.annotation.Nullable;"), { order: "java,," });
    expect(importsOf(out)).toEqual(["import javax.annotation.Nullable;"]);
  });

  it("keeps static imports out of non-static groups", () => {
    const out = run(file("import static java.util.Objects.requireNonNull;", "import java.util.List;"));
    expect(importsOf(out)).toEqual([
      "import java.util.List;",
      "",
      "import static java.util.Objects.requireNonNull;"
    ]);
  });

  it("falls back to the first group when the order string has no catch-all", () => {
    const out = run(file("import com.example.A;"), { order: "java" });
    expect(importsOf(out)).toEqual(["import com.example.A;"]);
  });

  it("sorts alphabetically inside a group", () => {
    const out = run(file("import java.util.Map;", "import java.util.ArrayList;", "import java.io.File;"),
      { order: "java,," });
    expect(importsOf(out)).toEqual([
      "import java.io.File;",
      "import java.util.ArrayList;",
      "import java.util.Map;"
    ]);
  });

  it("pushes wildcards to the end of their group when asked", () => {
    const src = file("import java.util.*;", "import java.util.List;");
    expect(importsOf(run(src, { order: "java,," }))).toEqual([
      "import java.util.*;",
      "import java.util.List;"
    ]);
    expect(importsOf(run(src, { order: "java,,", wildcardsLast: true }))).toEqual([
      "import java.util.List;",
      "import java.util.*;"
    ]);
  });

  it("groups by package before simple name under semanticSort", () => {
    // Plain lexicographic order puts zebra.Apple after apple.Zebra; semantic
    // sort agrees here, but differs once the simple name is what varies.
    const src = file("import b.pkg.Alpha;", "import a.pkg.Zulu;");
    expect(importsOf(run(src, { order: ",", semanticSort: true }))).toEqual([
      "import a.pkg.Zulu;",
      "import b.pkg.Alpha;"
    ]);
  });

  it("drops blank lines that were inside the original block", () => {
    const src = ["package p;", "", "import java.util.List;", "", "import com.example.A;", "", "class C {}"].join("\n");
    expect(run(src).split("\n")).toEqual([
      "package p;", "",
      "import java.util.List;", "",
      "import com.example.A;", "",
      "class C {}"
    ]);
  });

  it("preserves everything outside the import block", () => {
    const out = run(file("import java.util.List;"));
    expect(out.split("\n")[0]).toBe("package p;");
    expect(out.split("\n").at(-1)).toBe("class C {}");
  });
});
