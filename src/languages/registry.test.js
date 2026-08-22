import { describe, it, expect } from "vitest";
import { registerLanguage, getLanguage, listLanguages } from "./registry.js";

const valid = (over = {}) => ({
  id: "t1", label: "T", fileName: "t.txt", blockName: "t",
  formatters: [{ id: "none", label: "(none)", doc: "", text: "", gradle: null, maven: null }],
  steps: [], stepGroups: [],
  ...over
});

describe("registerLanguage", () => {
  it("returns the language it registered", () => {
    expect(registerLanguage(valid({ id: "ok" })).id).toBe("ok");
  });

  it("rejects a language missing a required field", () => {
    const bad = valid({ id: "bad1" });
    delete bad.blockName;
    expect(() => registerLanguage(bad)).toThrow(/blockName/);
  });

  it("rejects a language with no formatters, since [0] is the diff baseline", () => {
    expect(() => registerLanguage(valid({ id: "bad2", formatters: [] }))).toThrow(/formatters/);
  });

  it("rejects a duplicate id rather than silently shadowing", () => {
    registerLanguage(valid({ id: "dup" }));
    expect(() => registerLanguage(valid({ id: "dup" }))).toThrow(/already registered/);
  });
});

describe("builds", () => {
  it("defaults to Gradle and Maven, the two Spotless ships as plugins for", () => {
    expect(registerLanguage(valid({ id: "b1" })).builds).toEqual(["gradle", "maven"]);
  });

  it("keeps the targets a language declares for itself", () => {
    expect(registerLanguage(valid({ id: "b2", builds: ["native"] })).builds).toEqual(["native"]);
  });

  it("treats an empty list as unset rather than as a language with no config pane", () => {
    expect(registerLanguage(valid({ id: "b3", builds: [] })).builds).toEqual(["gradle", "maven"]);
  });
});

describe("getLanguage", () => {
  it("finds a registered language by id", () => {
    registerLanguage(valid({ id: "find-me" }));
    expect(getLanguage("find-me").id).toBe("find-me");
  });

  it("falls back to the first language for an unknown id", () => {
    expect(getLanguage("nope").id).toBe(listLanguages()[0].id);
  });
});
