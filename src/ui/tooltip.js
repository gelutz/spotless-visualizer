import { esc } from "../core/html.js";

/* Blame tooltip: hover any changed line to see which step (and which of its
 * option values) produced it. Delegated, so it survives re-renders. */
export function initTooltip() {
  const tip = document.getElementById("tip");
  const result = document.getElementById("result");
  let current = null;

  const place = (e) => {
    const pad = 14;
    const r = tip.getBoundingClientRect();
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
    tip.style.left = Math.max(8, x) + "px";
    tip.style.top = Math.max(8, y) + "px";
  };

  result.addEventListener("mousemove", (e) => {
    const ln = e.target.closest(".ln[data-blame]");
    if (!ln) {
      if (current) { tip.style.display = "none"; current = null; }
      return;
    }
    if (ln !== current) {
      current = ln;
      const body = ln.dataset.blame.split("\n\n")
        .map(block => {
          const [head, ...rest] = block.split("\n");
          return `<span class="tip-step">${esc(head)}</span>` +
                 (rest.length ? "\n" + esc(rest.join("\n")) : "");
        })
        .join("\n\n");
      const kind = ln.classList.contains("del") ? "removed by" :
                   ln.classList.contains("add") ? "changed by" : "kept by";
      tip.innerHTML = `<div class="tip-head">${kind}</div>${body}`;
      tip.style.display = "block";
    }
    place(e);
  });

  result.addEventListener("mouseleave", () => {
    tip.style.display = "none";
    current = null;
  });
}
