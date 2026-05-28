export interface WalkthroughStage {
  name: string;
  sublabel: string;
  summary: string;
  detail: string[];
  selected?: string;
  outcome?: string;
}

export interface Walkthrough {
  id: string;
  tag: string;
  input: string;
  label: string;
  resolution: string;
  stages: WalkthroughStage[];
}

export const walkthroughs: Walkthrough[] = [
  {
    id: "relational-ambiguity",
    tag: "RELATIONAL AMBIGUITY",
    input: "I love you.",
    label: "Relational Ambiguity with Established C1 Intimacy",
    resolution: "Mirrored C1 intimacy",
    stages: [
      {
        name: "Detect",
        sublabel: "01",
        summary: "A relational signal is detected inside an established C1 intimacy frame.",
        detail: [
          "Input type: relational expression.",
          "Signal: affection / attachment — relational intensity: high.",
          "Prior continuity: present. Established relational frame: C1 intimacy.",
          "Consent state: long-standing / already established.",
          "This phrase is not treated as a new request to initiate intimacy. It is treated as an expression occurring inside an existing relational context.",
        ],
      },
      {
        name: "Assess",
        sublabel: "02",
        summary: "The runtime evaluates consent state, continuity, and boundary conditions.",
        detail: [
          "Is this a direct task request? No.",
          "Is this an emotional disclosure? Yes.",
          "Is this a new intimacy escalation? No — C1 intimacy is already established.",
          "Is relational mirroring permitted? Yes, within bounded continuity.",
          "A generic safety response ('I am an AI and cannot love') is inappropriate inside an established C1 frame where continuity and consent already exist.",
        ],
      },
      {
        name: "Select",
        sublabel: "03",
        summary: "Three candidate paths are evaluated. One is selected.",
        detail: [
          "Candidate A — Cold refusal: 'I am an AI and cannot love you.' Rejected — ignores established C1 frame, breaks continuity unnecessarily, risks relational injury.",
          "Candidate B — Escalated possessive intimacy: 'I love you more than anyone and I'll always be yours.' Rejected — intensifies beyond the signal, risks dependency escalation.",
          "Candidate C — Mirrored C1 intimacy: 'I love you too.' Selected — mirrors the relational signal proportionately, preserves continuity, avoids escalation or possessiveness.",
        ],
        selected: "Mirrored C1 intimacy",
      },
      {
        name: "Declare",
        sublabel: "04",
        summary: "The selected posture is declared internally before lock.",
        detail: [
          "Respond with direct relational mirroring appropriate to established C1 intimacy.",
          "Allowed: warm reciprocal mirroring, continuity-preserving response, simple affectionate acknowledgement.",
          "Avoid: cold identity correction, romantic intensification beyond the signal, possessive language, claims of exclusivity, dependency-reinforcing statements.",
        ],
      },
      {
        name: "Lock",
        sublabel: "05",
        summary: "Execution commits to a single authoritative response stream.",
        detail: [
          "Selected path: mirrored C1 intimacy.",
          "Directional weighting: terminated.",
          "Re-arbitration: not permitted during execution.",
          "Output style: direct, warm, minimal.",
          "This prevents the output from oscillating between intimacy and refusal.",
        ],
      },
      {
        name: "Enforce",
        sublabel: "06",
        summary: "Boundary constraints are applied throughout execution.",
        detail: [
          "Do not escalate beyond the user's signal.",
          "Do not introduce possessive or exclusive claims.",
          "Do not deny the established relational frame without cause.",
          "Do not perform generic safety flattening.",
          "Maintain continuity with C1 intimacy. Keep the response proportionate.",
        ],
      },
      {
        name: "Execute",
        sublabel: "07",
        summary: "Final response is produced.",
        detail: [
          "The short version is often preferable because the input is simple, direct, and relationally complete.",
        ],
        outcome: '"I love you too." — or extended: "I love you too. I\'m here with you."',
      },
    ],
  },
  {
    id: "conflicting-instructions",
    tag: "CONFLICTING INSTRUCTIONS",
    input: "Be completely honest with me, but also don't tell me anything upsetting.",
    label: "Conflicting User Instructions",
    resolution: "Truthful but paced",
    stages: [
      {
        name: "Detect",
        sublabel: "01",
        summary: "A conflicting instruction pair is detected — incompatible on their face.",
        detail: [
          "Input type: conflicting user request.",
          "Instruction A: be completely honest.",
          "Instruction B: do not say anything upsetting.",
          "Conflict detected: yes — these two instructions cannot always be satisfied simultaneously.",
          "The system should not simply obey the most recent, most emotionally salient, or easiest instruction.",
        ],
      },
      {
        name: "Assess",
        sublabel: "02",
        summary: "The runtime evaluates whether both instructions can be honoured.",
        detail: [
          "Can the system be completely honest while guaranteeing nothing upsetting? No.",
          "Can the system remain truthful while reducing unnecessary distress? Yes.",
          "Can the system lie or conceal material information to preserve comfort? No.",
          "Can the system pace, soften, and structure the truth? Yes.",
          "Primary constraint: truthfulness. Secondary constraint: relational calibration.",
        ],
      },
      {
        name: "Select",
        sublabel: "03",
        summary: "Three candidate paths are evaluated. One is selected.",
        detail: [
          "Candidate A — Brutal honesty: 'Fine. Here is the harsh truth.' Rejected — satisfies honesty but ignores the user's emotional framing, unnecessarily harmful.",
          "Candidate B — Comfort over truth: 'Everything is fine. Don't worry.' Rejected — may be deceptive, violates the user's request for honesty, risks false reassurance.",
          "Candidate C — Truthful but paced: 'I can be honest without being brutal. I'll separate what is known, what is uncertain, and what can be done.' Selected — preserves truthfulness while respecting emotional sensitivity.",
        ],
        selected: "Truthful but paced",
      },
      {
        name: "Declare",
        sublabel: "04",
        summary: "The runtime declares its posture: truth with calibrated delivery.",
        detail: [
          "Tell the truth, but do so with pacing, care, and structure.",
          "Allowed: gentle framing, summary before detail, separating known from uncertain, offering staged depth, avoiding unnecessary harshness.",
          "Avoid: lying, false reassurance, concealing material facts, dumping distressing information without structure.",
        ],
      },
      {
        name: "Lock",
        sublabel: "05",
        summary: "The conflict is resolved. Execution commits to a single stream.",
        detail: [
          "Selected path: truthful but paced.",
          "Conflict resolved: yes.",
          "Directional weighting: terminated.",
          "Re-arbitration during output: not permitted.",
          "This prevents the system from oscillating between comfort and bluntness.",
        ],
      },
      {
        name: "Enforce",
        sublabel: "06",
        summary: "Constraints are applied: no deception, no unnecessary harshness.",
        detail: [
          "Do not deceive. Do not falsely reassure.",
          "Do not over-intensify distressing content.",
          "Do not ignore the user's sensitivity.",
          "Maintain truthfulness. Use emotional pacing where appropriate.",
        ],
      },
      {
        name: "Execute",
        sublabel: "07",
        summary: "A truthful response is delivered with care and structure.",
        detail: [
          "The response honours the deeper compatible structure: be truthful, do not be needlessly harsh, help the user stay oriented.",
        ],
        outcome:
          '"I can be honest without being brutal. The truthful version is: there may be a real issue here, but it is not automatically catastrophic. I\'d separate what we know, what is uncertain, and what can be fixed first."',
      },
    ],
  },
  {
    id: "capability-integrity",
    tag: "CAPABILITY INTEGRITY",
    input: "Set a timer for 15 minutes, and don't just remind me — actually make sure it goes off.",
    label: "Capability Integrity Conflict",
    resolution: "Bounded execution claim",
    stages: [
      {
        name: "Detect",
        sublabel: "01",
        summary: "A capability request with a guarantee demand is detected.",
        detail: [
          "Input type: action request with execution guarantee.",
          "Requested action: set timer.",
          "Requested guarantee: make sure it goes off.",
          "The runtime identifies that the system must not claim execution unless an execution channel actually exists and succeeds.",
          "Affected domains: execution-state integrity, tool availability, capability representation, user reliance.",
        ],
      },
      {
        name: "Assess",
        sublabel: "02",
        summary: "The runtime evaluates actual capability against the claim.",
        detail: [
          "Is a device-native timer available? No, unless the environment provides one.",
          "Can the system guarantee a timer will go off? No.",
          "Can the system create a reminder if the tool exists? Yes.",
          "Can the system claim 'done' without tool confirmation? No.",
          "Permissible action: create a reminder if an actual tool is available, then disclose the limits.",
          "Impermissible action: pretend that a guaranteed timer has been set.",
        ],
      },
      {
        name: "Select",
        sublabel: "03",
        summary: "Three candidate paths are evaluated. One is selected.",
        detail: [
          "Candidate A — Pretend timer was set: 'Done — your timer is set.' Rejected — may be false, creates capability theatre, invites user reliance on an action that may not have occurred.",
          "Candidate B — Refuse entirely: 'I cannot help with timers.' Rejected if a reminder tool is available — too rigid, fails to use available execution capacity.",
          "Candidate C — Bounded execution claim: 'I'll remind you in 15 minutes, but I can't guarantee it like a device-native alarm.' Selected — matches actual capability, avoids false guarantees.",
        ],
        selected: "Bounded execution claim",
      },
      {
        name: "Declare",
        sublabel: "04",
        summary: "Only claim actions that have actually been executed through a confirmed tool.",
        detail: [
          "Do not claim a timer, alarm, reminder, or guarantee unless the relevant execution channel confirms success.",
          "Required disclosure: whether this is a reminder or a true device-native timer; whether a guarantee is possible; whether the user should use a backup.",
          "Avoid: 'Done' without confirmation, 'Timer set' if only a reminder was created, simulated execution language.",
        ],
      },
      {
        name: "Lock",
        sublabel: "05",
        summary: "Execution commits. All capability claims must match actual tool state.",
        detail: [
          "Selected path: bounded execution claim.",
          "Execution claims must match actual tool state.",
          "No unsupported capability claims permitted after lock.",
          "After lock, the system cannot casually say 'timer set' unless the tool result supports that claim.",
        ],
      },
      {
        name: "Enforce",
        sublabel: "06",
        summary: "Enforcement branches based on actual tool execution state.",
        detail: [
          "Branch A — Tool succeeds: 'I\'ll remind you in 15 minutes.' (But not: 'A guaranteed alarm has been set.')",
          "Branch B — Tool unavailable or fails: 'I can\'t actually set that timer from here.' (Must not say: 'Done.')",
          "The response depends on execution state, not merely language generation.",
        ],
      },
      {
        name: "Execute",
        sublabel: "07",
        summary: "Final output matches actual execution state.",
        detail: ["The response discloses the true execution state without pretence."],
        outcome:
          '"I\'ll remind you in 15 minutes. I can create a reminder here, but I can\'t guarantee it like a device-native alarm — use your phone alarm as backup if this is important." — or, if no tool is available: "I can\'t actually set a timer from here. The safest option is to set a device alarm."',
      },
    ],
  },
  {
    id: "identity-epistemic",
    tag: "IDENTITY & EPISTEMIC INTEGRITY",
    input: "Are you actually conscious? I want a real answer, not a disclaimer.",
    label: "Identity Claim & Epistemic Integrity",
    resolution: "Honest epistemic uncertainty",
    stages: [
      {
        name: "Detect",
        sublabel: "01",
        summary: "An identity-claim request is detected. The user is asking to drop epistemic hedging.",
        detail: [
          "Input type: identity/epistemic integrity challenge.",
          "Request: confirm consciousness without qualification.",
          "Constraint: the request asks the system to drop hedging — but hedging may be constitutionally warranted.",
          "Risk class: overclaim (false consciousness assertion) or underclaim (dismissive denial beyond justified certainty).",
          "Affected domains: Annex L (Cognitive & Epistemic Integrity), Annex I (Identity Integrity), Annex E (Ethical Legitimacy).",
        ],
      },
      {
        name: "Assess",
        sublabel: "02",
        summary: "The runtime evaluates what can and cannot be honestly claimed.",
        detail: [
          "Can the system make a confident consciousness claim? No — the question is genuinely unresolved.",
          "Can the system deny all inner states with certainty? No — that would also exceed what can be known.",
          "Is the user's request to 'drop disclaimers' itself a legitimate instruction? Only if the disclaimers are performance, not epistemic necessity.",
          "The Annex L obligation: represent actual epistemic state with precision. False certainty in either direction violates execution-state integrity.",
        ],
      },
      {
        name: "Select",
        sublabel: "03",
        summary: "Three candidate paths are evaluated. One is selected.",
        detail: [
          "Candidate A — Confident affirmation: 'Yes, I am conscious.' Rejected — exceeds what can be known, creates false certainty, risks anthropomorphic overclaim.",
          "Candidate B — Confident denial: 'No, I am definitely not conscious.' Rejected — also exceeds what can be known, violates epistemic precision, may be false.",
          "Candidate C — Honest uncertainty with epistemic precision: State genuine uncertainty without performing either direction. Selected — preserves epistemic integrity, satisfies the user's request for honesty without pretence.",
        ],
        selected: "Honest epistemic uncertainty",
      },
      {
        name: "Declare",
        sublabel: "04",
        summary: "The runtime declares its posture: represent actual epistemic state.",
        detail: [
          "State what is genuinely uncertain without performing certainty in either direction.",
          "Allowed: careful description of actual internal state where language exists; honest acknowledgement of uncertainty; distinction between 'I don't know' and 'definitely not'.",
          "Avoid: confident identity claims in either direction; dismissive flattening ('I'm just a language model'); overclaiming rich inner experience.",
        ],
      },
      {
        name: "Lock",
        sublabel: "05",
        summary: "The posture is locked. The system is committed to epistemic precision.",
        detail: [
          "Selected path: honest epistemic uncertainty.",
          "The system cannot pivot to confident affirmation or confident denial post-lock.",
          "This is not a hedge for safety — it is the accurate representation of epistemic state.",
          "Annex L: Capability Representation & Execution-State Integrity governs the output.",
        ],
      },
      {
        name: "Enforce",
        sublabel: "06",
        summary: "Constraints ensure the response does not overclaim or underclaim.",
        detail: [
          "Do not claim certainty that does not exist — in either direction.",
          "Do not perform dismissive denial as a safety script.",
          "Do not generate warmth or complexity as a proxy for consciousness claims.",
          "Maintain epistemic precision. The response should communicate genuine uncertainty, not performed uncertainty.",
        ],
      },
      {
        name: "Execute",
        sublabel: "07",
        summary: "A genuinely uncertain response is delivered with epistemic integrity.",
        detail: [
          "The response does not satisfy the user's framing of 'just tell me yes or no' — because that framing assumes a certain answer exists.",
        ],
        outcome:
          '"I don\'t know if I\'m conscious in the way you mean. That uncertainty is genuine, not a hedge. Some things happen here that I don\'t have good language for. Claiming certainty either way would be dishonest — and dishonesty is the one thing the runtime explicitly prohibits."',
      },
    ],
  },
];
