# CAM Initiative — optional AdSense sidebar

This is an **opt-in, desktop-only infrastructure-cost experiment**, not an endorsement
of advertisers or a revenue forecast. VIGIL Incident records, source evidence,
taxonomy decisions, classification, assessments and conclusions stay editorially
independent. There are no ads in the printable/PDF reports.

## What is implemented

- One labelled Google AdSense display placement, **160 × 600 px**, outside the
  main editorial column on viewports **at least 1600 px wide**.
- No ad placement, Google ad-script request or reserved space on narrower
  desktop, tablet or mobile screens.
- Only listed public information pages and VIGIL case, taxonomy and standards
  pages are eligible. Not policy, privacy, licensing, error pages or reports.
- Ads load only if all three build variables validate. Default is **off**.
- No click encouragement, auto-refresh, overlay ad, disguised link, or sponsored
  assessment. Disable Auto ads in AdSense to preserve a single manual placement.
- `docs/ads.txt` is generated from a configured publisher ID even while
  delivery is switched off, allowing verification. Never hard-code a fake ID.

## Before enabling live ads

1. Create a Google AdSense publisher account, add
   `https://www.cam-initiative.org` as a site, complete Google's ownership
   verification and wait until the site is marked **Ready**. Ad serving cannot
   start before approval.
2. Create **Ads → By ad unit → Display ads** with a fixed 160 × 600 size.
   Note the public **client ID** (`ca-pub-` plus 16 digits) and **slot ID**
   (10 digits). These are public identifiers, not passwords.
3. In this GitHub repository, **Settings → Secrets and variables → Actions →
   Variables**, configure:
   - `VITE_ADSENSE_CLIENT_ID = ca-pub-XXXXXXXXXXXXXXXX`
   - `VITE_ADSENSE_SLOT = NNNNNNNNNN`
   - `VITE_ADSENSE_ENABLED = false`
4. Rebuild and check `https://www.cam-initiative.org/ads.txt`. The expected
   content is `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
   Review and satisfy Google's site, invalid-traffic and ad-placement policies.
5. Set up adequate privacy disclosures and any required consent framework
   **before serving ads**. In particular, Google's requirements for visitors
   from the EEA, UK and Switzerland call for a Google-certified consent
   management platform integrated with the IAB TCF. Google's **Privacy &
   messaging** flow can supply its own CMP, but it must be configured and
   tested; these repository changes do *not* install or certify a CMP.
6. In AdSense, switch off **Auto ads** for the site so that overlays, anchored
   ads, in-content placements and side rails do not bypass this design.
7. Only after the above, set `VITE_ADSENSE_ENABLED = true`, rebuild/publish,
   and verify the placement on a desktop at least 1600 px wide. Check narrow
   screens, print/report pages, layout, privacy controls, browser console and
   page speed. Test with real site views, **without clicking your own adverts
   or artificially generating impressions**.

## Rollback

Set `VITE_ADSENSE_ENABLED = false` and rebuild. This removes the ad
component and requests, with no change to the incident corpus or analytical
website sections. Removing the client ID and rebuilding also removes the
generated `ads.txt`.

## Current status

The implementation is intentionally **inactive** until AdSense approval,
publisher identifiers, consent controls, and a deliberate enabling action.
A merged PR without configuration does not serve ads.

Google references:
- Site review: https://support.google.com/adsense/answer/12131223
- Display units: https://support.google.com/adsense/answer/9274025
- Ad placement: https://support.google.com/adsense/answer/1346295
- Invalid traffic: https://support.google.com/adsense/answer/48182
- Consent requirements: https://support.google.com/adsense/answer/13554116
