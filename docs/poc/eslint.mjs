import { Linter } from "eslint-linter-browserify";
import * as tsParser from "@typescript-eslint/parser";
const linter = new Linter();
const code = `const x: number = 1\ninterface P { a: string }\nif (x == 1) { console.log('hi') }\n`;
const cfg = [{
  files: ["**/*.ts"],
  languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
  rules: { semi: ["error","always"], quotes: ["error","double"], eqeqeq: "error", "no-extra-semi": "error" }
}];
const res = linter.verifyAndFix(code, cfg, { filename: "Example.ts" });
console.log("=== TS-ESLINT in browser linter: fixed =", res.fixed, "===");
console.log(res.output);
console.log("remaining:", res.messages.map(m => m.ruleId + ": " + m.message).join(" | "));
