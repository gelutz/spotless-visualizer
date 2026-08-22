import { replace } from "./replace.js";
import { replaceRegex } from "./replaceRegex.js";
import { indent } from "./indent.js";
import { trimTrailingWhitespace } from "./trimTrailingWhitespace.js";
import { endWithNewline } from "./endWithNewline.js";
import { toggleOffOn } from "./toggleOffOn.js";

/* Steps that are not tied to any one language. Every language spreads these
 * into its own `steps` array - they are shared, not copied, which is what
 * makes registering a second language cheap. */
export const GENERIC_STEPS = [
  replace,
  replaceRegex,
  indent,
  trimTrailingWhitespace,
  endWithNewline,
  toggleOffOn
];

export {
  replace, replaceRegex, indent,
  trimTrailingWhitespace, endWithNewline, toggleOffOn
};
