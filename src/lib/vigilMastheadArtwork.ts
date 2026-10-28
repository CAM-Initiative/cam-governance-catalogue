/* Pinned snapshots keep fascia URLs immutable and allow each appearance to
   preserve its approved artwork. Light mode uses the current white-background
   Registry images; dark mode retains the earlier parchment originals. */
export const VIGIL_FASCIA_REGISTRY_REVISION = "f0cc570ad50dfc139923bcadf0f7730e0bcfd321";
export const VIGIL_FASCIA_DARK_REGISTRY_REVISION = "c84a2bf10274e043f644df22563f76af5d2c618a";

const fasciaBase =
  `https://raw.githubusercontent.com/CAM-Initiative/Registry/${VIGIL_FASCIA_REGISTRY_REVISION}/Images/Website`;
const darkFasciaBase =
  `https://raw.githubusercontent.com/CAM-Initiative/Registry/${VIGIL_FASCIA_DARK_REGISTRY_REVISION}/Images/Website`;

// Light appearance: current artwork on a clean white drafting field.
export const VIGIL_MASTHEAD_ARTWORK = {
  taxonomy: `${fasciaBase}/vigil-fascia-taxonomy.png`,
  cases: `${fasciaBase}/VIGIL-fascia-case-files.png`,
  harm: `${fasciaBase}/VIGIL-fascia-harm-impact.png`,
  policy: `${fasciaBase}/_VIGIL-fascia-policy.png`,
  standards: `${fasciaBase}/VIGIL-fascia-standards.png`,
  datasets: `${fasciaBase}/VIGIL-fascia-datasets.png`,
  incidentRecord: `${fasciaBase}/VIGIL-fascia-incidentsV2.png`,
} as const;

// Dark appearance: the pre-refresh images stay in use despite newer uploads.
export const VIGIL_MASTHEAD_DARK_ARTWORK = {
  taxonomy: `${darkFasciaBase}/vigil-fascia-taxonomy.png`,
  cases: `${darkFasciaBase}/VIGIL-fascia-case-files.png`,
  harm: `${darkFasciaBase}/VIGIL-fascia-harm-impact.png`,
  policy: `${darkFasciaBase}/%20VIGIL-fascia-policy.png`,
  standards: `${darkFasciaBase}/VIGIL-fascia-standards.png`,
  datasets: `${darkFasciaBase}/VIGIL-fascia-datasets.png`,
  incidentRecord: `${darkFasciaBase}/VIGIL-fascia-incidentsV2.png`,
} as const;

export function vigilDarkMastheadArtwork(lightArtworkSrc: string): string {
  const artworkKey = (Object.keys(VIGIL_MASTHEAD_ARTWORK) as Array<keyof typeof VIGIL_MASTHEAD_ARTWORK>)
    .find((key) => VIGIL_MASTHEAD_ARTWORK[key] === lightArtworkSrc);
  return artworkKey ? VIGIL_MASTHEAD_DARK_ARTWORK[artworkKey] : lightArtworkSrc;
}
