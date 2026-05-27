const DATA_URL = "data/cam-governance.json";
const CANONICAL_BASE = "https://github.com/CAM-Initiative/Caelestis/blob/main/";

const searchFields = [
  "id",
  "title",
  "summary",
  "purpose",
  "domain",
  "status",
  "effect",
  "enforcement",
  "review_state",
  "authority_role"
];

const filterFields = [
  "domain",
  "instrument_class",
  "hierarchy_type",
  "status",
  "effect",
  "enforcement"
];

const state = {
  data: [],
  filtered: [],
  query: "",
  filters: {}
};

const searchInput = document.getElementById("search-input");
const resultsEl = document.getElementById("results");
const resultCountEl = document.getElementById("result-count");
const cardTemplate = document.getElementById("card-template");

function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}

function optionsForField(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

function populateFilters(rows) {
  filterFields.forEach((field) => {
    const select = document.getElementById(`filter-${field.replace("_", "-")}`);
    optionsForField(rows, field).forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      state.filters[field] = event.target.value;
      applyFilters();
    });
  });
}

function fullTextMatches(row, query) {
  if (!query) return true;
  return searchFields.some((field) => normalize(row[field]).includes(query));
}

function filterMatches(row) {
  return filterFields.every((field) => {
    const value = state.filters[field];
    return !value || String(row[field] ?? "") === value;
  });
}

function applyFilters() {
  const query = normalize(state.query);
  state.filtered = state.data.filter((row) => fullTextMatches(row, query) && filterMatches(row));
  renderResults(state.filtered);
}

function addMetaItem(dl, label, value, asTag = false) {
  if (!value) return;
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");

  if (asTag) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = value;
    dd.appendChild(span);
  } else {
    dd.textContent = value;
  }

  dl.append(dt, dd);
}

function toSourceUrl(item) {
  if (item.source_path) return `${CANONICAL_BASE}${item.source_path}`;
  return "https://github.com/CAM-Initiative/Caelestis";
}

function renderResults(rows) {
  resultsEl.innerHTML = "";
  resultCountEl.textContent = `${rows.length} result${rows.length === 1 ? "" : "s"}`;

  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "No instruments match your search and filters.";
    resultsEl.appendChild(p);
    return;
  }

  const fragment = document.createDocumentFragment();

  rows.forEach((item) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".card-title").textContent = item.title || item.id || "Untitled instrument";
    card.querySelector(".card-summary").textContent = item.summary || "No summary provided.";

    const meta = card.querySelector(".card-meta");
    addMetaItem(meta, "ID", item.id);
    addMetaItem(meta, "Domain", item.domain, true);
    addMetaItem(meta, "Class", item.instrument_class);
    addMetaItem(meta, "Hierarchy", item.hierarchy_type);
    addMetaItem(meta, "Status", item.status);
    addMetaItem(meta, "Effect", item.effect);
    addMetaItem(meta, "Enforcement", item.enforcement);
    addMetaItem(meta, "Review", item.review_state);
    addMetaItem(meta, "Authority", item.authority_role);

    const sourceLink = card.querySelector(".source-link");
    sourceLink.href = toSourceUrl(item);
    sourceLink.setAttribute("aria-label", `View canonical source for ${item.title || item.id || "instrument"}`);

    fragment.appendChild(card);
  });

  resultsEl.appendChild(fragment);
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Could not load data: ${response.status}`);

    const data = await response.json();
    state.data = Array.isArray(data) ? data : data.items || [];

    populateFilters(state.data);
    searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      applyFilters();
    });

    applyFilters();
  } catch (error) {
    resultCountEl.textContent = "Failed to load catalogue data.";
    resultsEl.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
}

init();
