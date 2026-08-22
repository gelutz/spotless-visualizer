import { describe, it, expect } from "vitest";
import { typescript } from "./index.js";

describe("typescript language", () => {
  it("keeps the unformatted sample as the diff baseline", () => {
    expect(typescript.formatters[0].id).toBe("none");
    expect(typescript.formatters[0].text).toContain("export class Widget");
  });

  it("declares the target Spotless demands for this block", () => {
    expect(typescript.target).toBe("src/**/*.ts");
  });

  it("marks the reformatters that really execute", () => {
    const runs = typescript.formatters.filter(f => f.run).map(f => f.id);
    expect(runs).toEqual(["prettier", "biome"]);
  });

  it("gives every executable reformatter its own options", () => {
    for (const f of typescript.formatters) {
      if (f.run) expect(f.opts.length).toBeGreaterThan(0);
    }
  });

  /* The two tools name the same concepts differently. Sharing an id between
   * them would emit config that one of them silently ignores. */
  it("shares no option id between prettier and biome", () => {
    const ids = f => new Set(typescript.formatters.find(x => x.id === f).opts.map(o => o.id));
    const p = ids("prettier"), b = ids("biome");
    const shared = [...p].filter(id => b.has(id));
    expect(shared).toEqual(["bracketSpacing"]);   // the one name they genuinely agree on
  });

  it("uses a regex delimiter for the license header", () => {
    const step = typescript.steps.find(s => s.id === "licenseHeader");
    const delimiter = step.opts.find(o => o.id === "delimiter").def;
    const out = step.apply("// stale\nimport { a } from './a';", { content: "// h", delimiter });
    expect(out).toBe("// h\nimport { a } from './a';");
  });

  it("inherits every generic step", () => {
    const ids = typescript.steps.map(s => s.id);
    for (const id of ["replace", "replaceRegex", "indent", "trimTrailingWhitespace",
                      "endWithNewline", "toggleOffOn"]) {
      expect(ids).toContain(id);
    }
  });

  it("names the parser in the emitted config, which Spotless cannot infer", () => {
    const prettier = typescript.formatters.find(f => f.id === "prettier");
    const defaults = Object.fromEntries(prettier.opts.map(o => [o.id, o.def]));
    expect(prettier.gradle(defaults)).toContain("'parser': 'typescript'");
    expect(prettier.maven(defaults)).toContain("<parser>typescript</parser>");

    const biome = typescript.formatters.find(f => f.id === "biome");
    const bd = Object.fromEntries(biome.opts.map(o => [o.id, o.def]));
    expect(biome.gradle(bd)).toContain(".language('ts')");
    expect(biome.maven(bd)).toContain("<language>ts</language>");
  });
});
