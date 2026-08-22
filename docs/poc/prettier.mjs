import * as prettier from "prettier/standalone";
import estree from "prettier/plugins/estree";
import ts from "prettier/plugins/typescript";

const src = `import {A} from './a'
export class Foo<T>   implements Bar {
private   x:number=1
  async m(a:string,b?:number):Promise<void>{if(a){await this.n()}}
}
enum E{A,B}
type U = {a:string,b:number}
`;
const out = await prettier.format(src, {
  parser: "typescript", plugins: [estree, ts],
  printWidth: 80, tabWidth: 2, singleQuote: true, semi: false, trailingComma: "all", arrowParens: "avoid",
});
console.log("=== PRETTIER TS OUTPUT ===");
console.log(out);
