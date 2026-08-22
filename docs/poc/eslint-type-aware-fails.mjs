import { Linter } from "eslint-linter-browserify";
import * as tsParser from "@typescript-eslint/parser";
const linter = new Linter();
// Type-aware config: does requesting a Program blow up without a filesystem?
const cfg = [{
  files: ["**/*.ts"],
  languageOptions: { parser: tsParser, parserOptions: { project: "./tsconfig.json", ecmaVersion: "latest", sourceType: "module" } },
  rules: {}
}];
try {
  const r = linter.verify("const p: Promise<void> = foo();\n", cfg, { filename: "Example.ts" });
  console.log("TYPE-AWARE RESULT:", JSON.stringify(r.map(m=>m.message)));
} catch (e) { console.log("TYPE-AWARE THREW:", e.constructor.name, "::", String(e.message).slice(0,300)); }
