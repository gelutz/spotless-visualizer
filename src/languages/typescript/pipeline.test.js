import { describe, it, expect } from "vitest";
import { typescript } from "./index.js";
import { runPipeline } from "../../core/pipeline.js";
import { defaultState } from "../../state.js";

/* End to end: the real Prettier, through the real pipeline. This is the claim
 * the whole language exists to make - a reformatter that actually ran. */
describe("typescript through the pipeline", () => {
  const stateFor = over => ({ ...defaultState("typescript"), ...over });

  it("shows Prettier's real output for the built-in sample", async () => {
    const r = await runPipeline(typescript, stateFor({ formatter: "prettier" }));
    const out = r.lines.join("\n");
    expect(out).toContain("import { Component } from \"./component\";");
    expect(out).not.toContain("private items:T[]");
    expect(r.error).toBeNull();
  });

  it("runs Prettier on pasted source, which a snapshot formatter cannot", async () => {
    const r = await runPipeline(typescript, stateFor({
      formatter: "prettier", customSource: "const a={b:1,c:2}"
    }));
    // endWithNewline is on by default, hence the trailing blank.
    expect(r.lines.join("\n")).toBe("const a = { b: 1, c: 2 };\n");
    // Credited, so hovering the line names the formatter that produced it.
    expect(r.blame.some(b => b.has("formatter"))).toBe(true);
  });

  it("reflects a changed option in the output", async () => {
    const base = defaultState("typescript");
    const r = await runPipeline(typescript, {
      ...base, formatter: "prettier", customSource: "const a = 'x'",
      formatterOpts: { ...base.formatterOpts, prettier: { ...base.formatterOpts.prettier, semi: false, singleQuote: true } }
    });
    expect(r.lines.join("\n")).toBe("const a = 'x'\n");
  });

  it("falls back to the source when Prettier cannot parse it", async () => {
    const r = await runPipeline(typescript, stateFor({
      formatter: "prettier", customSource: "class {{{"
    }));
    expect(r.lines.join("\n")).toBe("class {{{\n");
    expect(r.error).toBeTruthy();
  });

  it("still runs the cheap steps on top of the reformatter", async () => {
    const base = defaultState("typescript");
    const r = await runPipeline(typescript, {
      ...base, formatter: "prettier", customSource: "const a=1",
      enabled: { ...base.enabled, licenseHeader: true }
    });
    expect(r.lines[0]).toBe(`/* (C)${new Date().getFullYear()} MyCompany */`);
    expect(r.lines[1]).toBe("const a = 1;");
  });
});
