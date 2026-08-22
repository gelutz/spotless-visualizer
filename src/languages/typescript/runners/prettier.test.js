import { describe, it, expect } from "vitest";
import { runPrettier } from "./prettier.js";

/* Hits the real Prettier. The browser and Node distributions share one API -
 * prettier/standalone is the same module either way - so this is the same code
 * path the page runs. */
describe("runPrettier", () => {
  it("formats TypeScript", async () => {
    const out = await runPrettier("class Foo{private   x:number=1}", {});
    expect(out).toBe("class Foo {\n  private x: number = 1;\n}\n");
  });

  it("honours the options it is handed", async () => {
    const out = await runPrettier("const a = {b: 1}", {
      semi: false, singleQuote: true, tabWidth: 4, printWidth: 120
    });
    expect(out).toBe("const a = { b: 1 }\n");
  });

  it("keeps type-only syntax intact", async () => {
    const out = await runPrettier("type U={a:string}\nenum E{A,B}", {});
    expect(out).toContain("type U = { a: string };");
    expect(out).toContain("enum E {");
  });

  it("throws on source it cannot parse, so the caller can report it", async () => {
    await expect(runPrettier("class {{{", {})).rejects.toThrow();
  });
});
