(async function () {
  const page = document.body.dataset.page;
  if (!["runtime", "explorer"].includes(page)) return;

  const warnings = [];

  function addWarning(msg) { warnings.push(msg); }

  function renderWarnings(messages) {
    const panel = document.getElementById("data-warnings");
    if (!panel) return;
    panel.innerHTML = "";
    if (!messages.length) {
      panel.innerHTML = "<p>No data warnings.</p>";
      return;
    }
    const heading = document.createElement("h2");
    heading.textContent = "Data warnings";
    const list = document.createElement("ul");
    messages.forEach((message) => {
      const li = document.createElement("li");
      li.textContent = message;
      list.appendChild(li);
    });
    panel.appendChild(heading);
    panel.appendChild(list);
  }

  try {
    const [govRaw, runtimeFlow, pathways] = await Promise.all([
      fetch("data/cam-governance.json").then((r) => r.json()),
      fetch("data/runtime-flow.json").then((r) => r.json()),
      fetch("data/problem-pathways.json").then((r) => r.json())
    ]);

    const govItems = Array.isArray(govRaw) ? govRaw : (govRaw.items || []);
    const instrumentsById = new Map(govItems.filter((i) => i?.id).map((i) => [i.id, i]));

    const validateRefSet = (entries, label) => {
      entries.forEach((entry, idx) => {
        const ids = Array.isArray(entry.instrument_ids) ? entry.instrument_ids : [];
        ids.forEach((id) => {
          if (!instrumentsById.has(id)) addWarning(`${label}[${idx}] references unknown instrument ID: ${id}`);
        });
      });
    };

    validateRefSet(runtimeFlow, "runtime-flow.json");
    validateRefSet(pathways, "problem-pathways.json");

    if (page === "runtime") {
      const map = document.getElementById("runtime-map");
      map.src = "images/cam-runtime-flow-ecology-coding.svg";
      const wrap = document.getElementById("runtime-steps");

      runtimeFlow.forEach((step) => {
        const ids = Array.isArray(step.instrument_ids) ? step.instrument_ids : [];
        const invalid = ids.filter((id) => !instrumentsById.has(id));
        if (invalid.length) {
          addWarning(`runtime step \"${step.step_label}\" hidden due to unknown IDs: ${invalid.join(", ")}`);
          return;
        }

        const card = document.createElement("article");
        card.className = "step-card";
        const refs = ids.map((id) => {
          const item = instrumentsById.get(id);
          const hasLink = typeof item?.link === "string" && item.link.trim().length > 0;
          if (!hasLink) {
            addWarning(`Instrument ${id} has no canonical link in cam-governance.json.`);
            return `<li>${id} (no canonical link)</li>`;
          }
          return `<li><a href='https://github.com/CAM-Initiative/Caelestis/blob/main/${item.link}' target='_blank' rel='noopener'>${id}</a></li>`;
        }).join("");

        card.innerHTML = `<button aria-expanded='false'><h3>${step.phase} · ${step.step_label}</h3><p>${step.explanation}</p><p><strong>Governance question:</strong> ${step.governance_question}</p></button><div class='step-details'><p><strong>Referenced instruments</strong></p><ul>${refs || "<li>None mapped</li>"}</ul><p class='muted'>Interpretive navigation layer — not canonical CAM text.</p><p class='muted'>Source: CAM-Initiative/Caelestis / Governance/CAM.Governance.JSON</p></div>`;
        const btn = card.querySelector("button");
        btn.onclick = () => {
          const active = card.classList.toggle("active");
          btn.setAttribute("aria-expanded", active ? "true" : "false");
        };
        wrap.appendChild(card);
      });

      if (!wrap.children.length) {
        const p = document.createElement("p");
        p.className = "error";
        p.textContent = "No authoritative runtime cards rendered because referenced IDs are invalid or missing.";
        wrap.appendChild(p);
      }
    }
  } catch (e) {
    addWarning(`Validation loader failed: ${e.message}`);
  }

  renderWarnings(warnings);
})();
