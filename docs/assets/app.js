const ASSET_URLS = {
  runtimeMap: "images/cam-runtime-flow-ecology-coding.svg",
  runtimeFlow: "images/cam-runtime-flow-ecology-coding.svg"
};

const DATA = {
  gov: "data/cam-governance.json",
  pathways: "data/problem-pathways.json",
  runtime: "data/runtime-flow.json"
};

const SEARCH_FIELDS = ["id", "title", "summary", "purpose", "domain", "instrument_class", "hierarchy_type", "status", "effect", "enforcement", "review_state", "authority_role", "version", "link"];
const FILTER_FIELDS = ["domain", "instrument_class", "hierarchy_type", "status", "effect", "enforcement", "review_state", "authority_role"];
const CANONICAL_BASE = "https://github.com/CAM-Initiative/Caelestis/blob/main/";
const PROVENANCE_TEXT = "Source: CAM-Initiative/Caelestis / Governance/CAM.Governance.JSON";

const clean = (v) => String(v ?? "").trim();
const norm = (v) => clean(v).toLowerCase();

async function j(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

function canonicalSourceLink(item) {
  return item?.link ? `${CANONICAL_BASE}${item.link}` : "https://github.com/CAM-Initiative/Caelestis";
}

function setMapImage() {
  const hero = document.getElementById("hero-runtime-map");
  if (hero) hero.src = ASSET_URLS.runtimeMap;
}

function renderWarnings(messages) {
  const panel = document.getElementById("data-warnings");
  if (!panel) return;
  panel.innerHTML = "";
  if (!messages.length) {
    panel.innerHTML = "<p>No data warnings.</p>";
    return;
  }
  const title = document.createElement("h3");
  title.textContent = "Data warnings";
  const ul = document.createElement("ul");
  messages.forEach((m) => {
    const li = document.createElement("li");
    li.textContent = m;
    ul.appendChild(li);
  });
  panel.appendChild(title);
  panel.appendChild(ul);
}

function initExplorer() {
  if (document.body.dataset.page !== "explorer") return;
  let rows = [];
  const state = { q: "", f: {} };
  FILTER_FIELDS.forEach((f) => (state.f[f] = ""));

  const rc = document.getElementById("result-count");
  const res = document.getElementById("results");

  function render(list) {
    const active = Object.entries(state.f).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(", ");
    rc.textContent = `${list.length} shown of ${rows.length}${active ? ` · filters ${active}` : ""}`;
    res.innerHTML = "";
    list.forEach((item) => {
      const a = document.createElement("article");
      a.className = "instrument-card";
      a.innerHTML = `
        <h3>${clean(item.title) || clean(item.id)}</h3>
        <p class='muted'><strong>ID:</strong> ${clean(item.id) || "—"}</p>
        <p class='muted'><strong>Summary:</strong> ${clean(item.summary) || "—"}</p>
        <p class='muted'><strong>Purpose:</strong> ${clean(item.purpose) || "—"}</p>
        <div class='tags'>
          <span class='tag'>${clean(item.domain) || "—"}</span>
          <span class='tag'>${clean(item.instrument_class) || "—"}</span>
          <span class='tag'>${clean(item.hierarchy_type) || "—"}</span>
          <span class='tag'>${clean(item.status) || "—"}</span>
        </div>
        <p class='muted'>${PROVENANCE_TEXT}</p>
        <p><a href='${canonicalSourceLink(item)}' target='_blank' rel='noopener'>Canonical source file</a></p>`;
      res.appendChild(a);
    });
    if (!list.length) res.innerHTML = "<p class='muted'>No matching instruments.</p>";
  }

  function apply() {
    const list = rows.filter(
      (r) => SEARCH_FIELDS.some((f) => norm(r[f]).includes(norm(state.q))) &&
      FILTER_FIELDS.every((f) => !state.f[f] || clean(r[f]) === state.f[f])
    );
    render(list);
  }

  j(DATA.gov)
    .then((data) => {
      rows = Array.isArray(data) ? data : data.items || [];
      FILTER_FIELDS.forEach((f) => {
        const s = document.getElementById(`filter-${f.replaceAll("_", "-")}`);
        if (!s) return;
        [...new Set(rows.map((r) => clean(r[f])).filter(Boolean))].sort().forEach((v) => {
          const o = document.createElement("option");
          o.value = v;
          o.textContent = v;
          s.appendChild(o);
        });
        s.onchange = (e) => {
          state.f[f] = e.target.value;
          apply();
        };
      });
      const search = document.getElementById("search-input");
      search.oninput = (e) => {
        state.q = e.target.value;
        apply();
      };
      apply();
    })
    .catch((err) => {
      rc.innerHTML = `<span class='error'>Failed to load /docs/data/cam-governance.json (${err.message})</span>`;
    });

  j(DATA.pathways)
    .then((pathways) => {
      const wrap = document.getElementById("pathway-list");
      pathways.forEach((p) => {
        const card = document.createElement("article");
        card.className = "pathway-card";
        card.innerHTML = `
          <h3>${clean(p.name)}</h3>
          <p>${clean(p.meaning) || "—"}</p>
          <p><strong>Likely phase:</strong> ${clean(p.likely_runtime_phase) || "—"}</p>
          <p><strong>Referenced instrument IDs:</strong> ${(p.instrument_ids || []).join(", ") || "—"}</p>
          <p><strong>Map source:</strong> curated JSON</p>`;
        wrap.appendChild(card);
      });
    })
    .catch(() => {
      const e = document.getElementById("pathway-error");
      e.hidden = false;
      e.textContent = "Failed to load curated pathways.";
    });
}

setMapImage();
initExplorer();
