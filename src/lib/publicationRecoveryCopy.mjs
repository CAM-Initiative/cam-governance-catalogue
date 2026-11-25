import { createElement as h } from "react";

export const RECOVERY_HEADLINE = "Well, this is awkward.";
export const RECOVERY_SUBTITLE = "An AI incident observatory has experienced an incident of its own.";
export const RECOVERY_FOOTNOTE = "Operational resilience is apparently a hands-on subject.";

// Inline artwork: no network request, external font, or image decoder dependency.
export function RecoveryIllustration() {
  return h("svg", { viewBox: "0 0 240 120", width: "220", height: "110", "aria-hidden": true, focusable: "false", style: { maxWidth: "100%", display: "block", margin: "0 auto" } },
    h("g", { fill: "none", stroke: "#b79a59", strokeWidth: 2.3, strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M42 103H198", opacity: .35 }),
      h("rect", { x: 83, y: 25, width: 74, height: 55, rx: 13 }),
      h("path", { d: "M120 25V13M115 13H125M83 43H74V63H83M157 43H166V63H157" }),
      h("circle", { cx: 102, cy: 46, r: 5 }), h("circle", { cx: 138, cy: 46, r: 5 }),
      h("path", { d: "M108 65L114 61L126 66L132 62M98 80L91 103M142 80L149 103M84 85L65 96M156 85L176 73" }),
      h("circle", { cx: 185, cy: 52, r: 18 }), h("path", { d: "M177 44L193 60M193 44L177 60" })
    ));
}
