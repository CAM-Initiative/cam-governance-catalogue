function installHomepagePositioning() {
  const mount = () => {
    if (window.location.pathname !== "/" || document.querySelector(".home-vigil-positioning")) return;

    const artwork = document.querySelector(".home-identity-artwork");
    if (!artwork?.parentElement) return;

    const section = document.createElement("section");
    section.className = "home-vigil-positioning";
    section.setAttribute("aria-labelledby", "home-vigil-positioning-heading");
    section.innerHTML = `
      <p class="home-vigil-positioning-kicker">What VIGIL does differently</p>
      <h2 id="home-vigil-positioning-heading">Other incident databases tell you what happened.</h2>
      <p class="home-vigil-positioning-lead"><strong>VIGIL makes incidents comparable across the AI ecosystem — showing why systems failed and the impact of those failures.</strong></p>
      <div class="home-vigil-positioning-flow" aria-label="VIGIL analytical pipeline">
        <span>Evidence</span><b aria-hidden="true">→</b>
        <span>Governance assessment</span><b aria-hidden="true">→</b>
        <span>Failure classification</span><b aria-hidden="true">→</b>
        <span>Harm impact</span><b aria-hidden="true">→</b>
        <span>Cross-incident comparison</span>
      </div>
      <p class="home-vigil-positioning-detail">VIGIL normalises heterogeneous incident evidence into a common analytical structure so recurring failure mechanisms, materialised impacts and governance boundaries can be compared across models, providers and deployment contexts.</p>
      <div class="home-vigil-positioning-actions">
        <a href="/observatory/cases/">Explore Case Files <span aria-hidden="true">→</span></a>
        <a href="/observatory/knowledge-base/failure-taxonomy/">Explore the Failure Taxonomy <span aria-hidden="true">→</span></a>
      </div>
    `;

    artwork.parentElement.insertBefore(section, artwork);
  };

  mount();
  const observer = new MutationObserver(mount);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installHomepagePositioning, { once: true });
} else {
  installHomepagePositioning();
}
