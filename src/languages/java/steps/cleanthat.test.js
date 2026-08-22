import { describe, it, expect } from "vitest";
import { cleanthat } from "./cleanthat.js";

const run = src => cleanthat.apply(src);

describe("cleanthat", () => {
  it("drops a literal comparison against true", () => {
    expect(run("if (flag == true) {")).toBe("if (flag) {");
  });

  it("drops a literal comparison against false", () => {
    expect(run("if (flag != false) {")).toBe("if (flag) {");
  });

  it("collapses an explicit generic type to the diamond operator", () => {
    expect(run("new ArrayList<String>()")).toBe("new ArrayList<>()");
  });

  it("handles a nested generic argument", () => {
    expect(run("new HashMap<String, List<Integer>>()")).toBe("new HashMap<>()");
  });

  it("leaves a diamond that is already there", () => {
    expect(run("new ArrayList<>()")).toBe("new ArrayList<>()");
  });

  it("does not touch a comparison against a variable named trueish", () => {
    const src = "if (flag == trueish) {";
    expect(run(src)).toBe(src);
  });
});
