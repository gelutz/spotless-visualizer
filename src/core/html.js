export const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Trailing whitespace and tabs are the whole point of some steps, so show them.
export function visibleWs(text) {
  return esc(text)
    .replace(/\t/g, '<span class="ws">→   </span>')
    .replace(/([ ]+)$/, (m) => '<span class="ws">' + "·".repeat(m.length) + "</span>");
}

export function indentBlock(text, pad) {
  return text.split("\n").map(l => pad + l).join("\n");
}
