import { licenseHeader } from "./licenseHeader.js";
import { removeUnusedImports } from "./removeUnusedImports.js";
import { importOrder } from "./importOrder.js";
import { formatAnnotations } from "./formatAnnotations.js";
import { cleanthat } from "./cleanthat.js";

// Order matters: this is the order the pipeline runs them in.
export const JAVA_STEPS = [
  licenseHeader,
  removeUnusedImports,
  importOrder,
  formatAnnotations,
  cleanthat
];
