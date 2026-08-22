import { licenseHeaderFor } from "../../shared/steps/licenseHeader.js";
import { removeUnusedImports } from "./removeUnusedImports.js";
import { importOrder } from "./importOrder.js";
import { formatAnnotations } from "./formatAnnotations.js";
import { cleanthat } from "./cleanthat.js";

// Java's delimiter. A regex like every other language's, it just happens to
// match itself.
const licenseHeader = licenseHeaderFor({ delimiter: "package ", group: "java" });

// Order matters: this is the order the pipeline runs them in.
export const JAVA_STEPS = [
  licenseHeader,
  removeUnusedImports,
  importOrder,
  formatAnnotations,
  cleanthat
];
