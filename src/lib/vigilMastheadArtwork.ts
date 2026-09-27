/* Shared Registry snapshot for VIGIL Observatory masthead artwork.
   Pinning every fascia to one Registry commit gives the browser a new URL when
   artwork is refreshed and keeps the full masthead family on one deterministic
   visual snapshot. Bump this revision when the Registry artwork set changes. */
export const VIGIL_FASCIA_REGISTRY_REVISION = "cb04f4ff442dc2af7bb0108a77a933d690f758c0";

const fasciaBase =
  `https://raw.githubusercontent.com/CAM-Initiative/Registry/${VIGIL_FASCIA_REGISTRY_REVISION}/Images/Website`;

export const VIGIL_MASTHEAD_ARTWORK = {
  taxonomy: `${fasciaBase}/vigil-fascia-taxonomy.png`,
  cases: `${fasciaBase}/VIGIL-fascia-case-files.png`,
  harm: `${fasciaBase}/VIGIL-fascia-harm-impact.png`,
  policy: `${fasciaBase}/%20VIGIL-fascia-policy.png`,
  standards: `${fasciaBase}/VIGIL-fascia-standards.png`,
  datasets: `${fasciaBase}/VIGIL-fascia-datasetsV2.png`,
  incidentRecord: `${fasciaBase}/VIGIL-fascia-incidentsV2.png`,
} as const;
