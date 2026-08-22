/* ------------------------------------------------------------------ *
 * Sample TypeScript.
 *
 * Unlike Java, most of this language's reformatters really execute here -
 * Prettier and Biome are JavaScript, so their output is computed from this
 * sample rather than hand-written. Only tsfmt needs a snapshot: it wraps a
 * Node CLI that reads its config off disk.
 * ------------------------------------------------------------------ */

import { TAB as T, SPACE as SP } from "../../core/chars.js";

// Deliberately messy: mixed quotes, absent semicolons, tabs and trailing
// whitespace, so every cheap step has something to bite on.
export const SAMPLE_NONE = [
  "import {Component} from './component'",
  "import   {unused} from './unused'",
  'import {Logger} from "../util/logger"',
  "",
  "type Options = {retries:number, label?:string}",
  "",
  "export class Widget<T> extends Component implements Disposable {",
  T + "private items:T[] = []",
  T + "public label = 'widget'" + SP + SP,
  "",
  T + "constructor(private readonly opts:Options){",
  T + T + "super()",
  T + T + "if(opts.retries == true){ Logger.warn('retries is not a boolean') }",
  T + "}",
  "",
  T + "async load(url:string, timeout?:number):Promise<T[]>{",
  T + T + "const res = await fetch(url,{signal:AbortSignal.timeout(timeout??5000)})",
  T + T + "return res.json() as Promise<T[]>",
  T + "}",
  "",
  T + "dispose(){this.items = new Array<T>()}",
  "}",
  "",
  "export enum Level{Debug,Info,Warn}"
].join("\n");

/* tsfmt's snapshot. It is built on the TypeScript language service's own
 * formatter, which normalises spacing and indentation but rewrites nothing
 * else - it will not touch your quotes, add semicolons or re-wrap a line. */
export const SAMPLE_TSFMT = [
  "import { Component } from './component'",
  "import { unused } from './unused'",
  'import { Logger } from "../util/logger"',
  "",
  "type Options = { retries: number, label?: string }",
  "",
  "export class Widget<T> extends Component implements Disposable {",
  "    private items: T[] = []",
  "    public label = 'widget'",
  "",
  "    constructor(private readonly opts: Options) {",
  "        super()",
  "        if (opts.retries == true) { Logger.warn('retries is not a boolean') }",
  "    }",
  "",
  "    async load(url: string, timeout?: number): Promise<T[]> {",
  "        const res = await fetch(url, { signal: AbortSignal.timeout(timeout ?? 5000) })",
  "        return res.json() as Promise<T[]>",
  "    }",
  "",
  "    dispose() { this.items = new Array<T>() }",
  "}",
  "",
  "export enum Level { Debug, Info, Warn }"
].join("\n");
