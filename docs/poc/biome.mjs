import pkg from "@biomejs/js-api/nodejs";
const { Biome } = pkg;
const biome = new Biome();
const { projectKey } = biome.openProject("/");
biome.applyConfiguration(projectKey, {
  formatter: { indentStyle: "space", indentWidth: 4, lineWidth: 100 },
  javascript: { formatter: { quoteStyle: "single", semicolons: "asNeeded", trailingCommas: "none", arrowParentheses: "asNeeded" } }
});
const src = `import {A} from './a'
export class Foo<T> implements Bar {
private   x:number=1
  async m(a:string,b?:number):Promise<void>{if(a){await this.n()}}
}
enum E{A,B}
`;
console.log("=== BIOME TS FORMAT ===");
console.log(biome.formatContent(projectKey, src, { filePath: "Example.ts" }).content);
console.log("=== BIOME LINT (safe fixes applied) ===");
const l = biome.lintContent(projectKey, "const x = 1; if(x==1){var y=2}\n", { filePath: "Example.ts", fixFileMode: "safeFixes" });
console.log(l.content);
console.log("diagnostics:", l.diagnostics.map(d => d.category).join(", "));
