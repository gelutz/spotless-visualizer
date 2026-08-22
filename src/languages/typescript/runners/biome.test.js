import { describe, it, expect } from "vitest";
import { configOf } from "./biome.js";

/* The WASM module itself is exercised by docs/poc/biome.mjs, which is a real
 * run. What is worth pinning here is the config mapping: Biome silently
 * ignores a key it does not recognise, so a name that drifted from Prettier's
 * would produce unformatted output and no error at all. */
describe("configOf", () => {
  const OPTS = {
    indentStyle: "space", indentWidth: 4, lineWidth: 100,
    quoteStyle: "single", semicolons: "asNeeded", trailingCommas: "none",
    arrowParentheses: "asNeeded", quoteProperties: "preserve", bracketSpacing: false
  };

  it("splits the options across the global and javascript blocks", () => {
    expect(configOf(OPTS)).toEqual({
      formatter: { indentStyle: "space", indentWidth: 4, lineWidth: 100 },
      javascript: { formatter: {
        quoteStyle: "single", semicolons: "asNeeded", trailingCommas: "none",
        arrowParentheses: "asNeeded", bracketSpacing: false, quoteProperties: "preserve"
      } }
    });
  });

  it("uses Biome's names, not Prettier's", () => {
    const c = configOf(OPTS);
    expect(c.formatter.lineWidth).toBe(100);
    expect(c.formatter.printWidth).toBeUndefined();
    expect(c.javascript.formatter.trailingCommas).toBe("none");
    expect(c.javascript.formatter.trailingComma).toBeUndefined();
    expect(c.javascript.formatter.arrowParentheses).toBe("asNeeded");
    expect(c.javascript.formatter.arrowParens).toBeUndefined();
  });
});
