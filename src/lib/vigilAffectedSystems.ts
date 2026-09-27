import type { UnknownRecord } from "./vigilRegistry";
import type { VigilIndexRecord } from "./vigilPresentation";

// Public Stage 01 projection of canonical system_context; provenance stays in the Incident record.
export type AffectedSystem = {
  recordId: string;
  provider?: string;
  product?: string;
  model?: string;
  systemType?: string;
  interfaceSurface?: string;
  deploymentContext?: string;
  agentConfiguration?: string;
  agentCount?: string;
  deploymentState?: string;
  activityContexts?: string;
  externalReach?: string;
  activityActor?: string;
  // Transitional display only. These are the pre-2026-09-27 occurrence-environment fields
  // and are shown only when the separated four-field model is absent.
  occurrenceSetting?: string;
  testingActor?: string;
};

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function textList(value: unknown) {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return values.flatMap((item) => text(item) ? [text(item)!] : []);
}

function joinedText(value: unknown) {
  const values = textList(value);
  return values.length ? values.join(" · ") : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function controlledLabel(value: unknown, labels: Record<string, string | undefined>) {
  const normalized = text(value)?.toLowerCase();
  return normalized ? labels[normalized] ?? normalized : undefined;
}

function agentConfigurationLabel(value: unknown) {
  return controlledLabel(value, {
    "non-agentic": "Non-agentic",
    "single-agent": "Single agent",
    "multi-agent": "Multi-agent",
    swarm: "Swarm",
    unknown: "Unknown",
  });
}

function agentCountLabel(agentContext: UnknownRecord) {
  const basis = text(agentContext.count_basis)?.toLowerCase();
  const count = numberValue(agentContext.agent_count);
  const min = numberValue(agentContext.agent_count_min);
  const max = numberValue(agentContext.agent_count_max);

  if (basis === "exact" && count !== undefined) return String(count);
  if (basis === "minimum" && min !== undefined) return `At least ${min}`;
  if (basis === "range" && min !== undefined && max !== undefined) return `${min}–${max}`;
  if (basis === "unknown") return "Unknown";
  if (basis === "not-applicable") return undefined;

  if (count !== undefined) return String(count);
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (min !== undefined) return `At least ${min}`;
  return undefined;
}

function deploymentStateLabel(value: unknown) {
  return controlledLabel(value, {
    "pre-deployment": "Pre-deployment",
    deployed: "Deployed",
    unknown: "Unknown",
  });
}

function activityContextsLabel(value: unknown) {
  const labels: Record<string, string> = {
    training: "Training",
    evaluation: "Evaluation",
    research: "Research",
    "operational-use": "Operational use",
    unknown: "Unknown",
  };
  const values = textList(value).map((item) => labels[item.toLowerCase()] ?? item);
  return values.length ? values.join(" · ") : undefined;
}

function externalReachLabel(value: unknown) {
  return controlledLabel(value, {
    contained: "Contained",
    "live-external": "Live external",
    unknown: "Unknown",
  });
}

function activityActorLabel(value: unknown) {
  return controlledLabel(value, {
    "provider-internal": "Provider / internal",
    government: "Government",
    "third-party": "Third party",
    joint: "Joint / multi-party",
    "not-applicable": undefined,
    unknown: "Unknown",
  });
}

function occurrenceSettingLabel(value: unknown) {
  return controlledLabel(value, {
    testing: "Testing",
    live: "Live",
    mixed: "Mixed testing / live",
    unknown: "Unknown",
  });
}

export function affectedSystemFor(record: VigilIndexRecord): AffectedSystem | undefined {
  const context = isObject(record.raw.system_context) ? record.raw.system_context : {};
  const agentContext = isObject(context.agent_context) ? context.agent_context : {};
  const occurrenceEnvironment = isObject(context.occurrence_environment) ? context.occurrence_environment : {};

  const provider = text(context.platform_or_vendor) ?? record.affected_platform_label ?? record.platform_label;
  const product = text(context.product_or_service ?? context.model_or_product);
  const modelRaw = text(context.specific_model_or_runtime);
  const model = modelRaw && !/^not applicable$/i.test(modelRaw) ? modelRaw : undefined;
  const systemType = text(context.system_type);
  const interfaceSurface = joinedText(context.interface_surface);
  const deploymentContext = text(context.deployment_context);
  const agentConfiguration = agentConfigurationLabel(agentContext.agentic_status);
  const agentCount = agentCountLabel(agentContext);

  const hasSeparatedEnvironment = [
    "deployment_state",
    "activity_contexts",
    "external_reach",
    "activity_actor",
  ].some((key) => occurrenceEnvironment[key] !== undefined);

  const deploymentState = hasSeparatedEnvironment ? deploymentStateLabel(occurrenceEnvironment.deployment_state) : undefined;
  const activityContexts = hasSeparatedEnvironment ? activityContextsLabel(occurrenceEnvironment.activity_contexts) : undefined;
  const externalReach = hasSeparatedEnvironment ? externalReachLabel(occurrenceEnvironment.external_reach) : undefined;
  const activityActor = hasSeparatedEnvironment ? activityActorLabel(occurrenceEnvironment.activity_actor) : undefined;

  // Do not infer separated semantics from the legacy field. Keep old labels only as a
  // temporary display fallback while production VIGIL still publishes the earlier schema.
  const occurrenceSetting = hasSeparatedEnvironment ? undefined : occurrenceSettingLabel(occurrenceEnvironment.operational_setting);
  const testingActor = hasSeparatedEnvironment ? undefined : activityActorLabel(occurrenceEnvironment.testing_actor);

  if (![provider, product, model, systemType, interfaceSurface, deploymentContext, agentConfiguration, agentCount, deploymentState, activityContexts, externalReach, activityActor, occurrenceSetting, testingActor].some(Boolean)) {
    return undefined;
  }

  return {
    recordId: record.id,
    provider,
    product,
    model,
    systemType,
    interfaceSurface,
    deploymentContext,
    agentConfiguration,
    agentCount,
    deploymentState,
    activityContexts,
    externalReach,
    activityActor,
    occurrenceSetting,
    testingActor,
  };
}

export function dedupeAffectedSystems(records: VigilIndexRecord[]) {
  const seen = new Set<string>();
  return records.flatMap((record) => affectedSystemFor(record) ?? []).filter((system) => {
    const key = [
      system.provider,
      system.product,
      system.model,
      system.interfaceSurface,
      system.agentConfiguration,
      system.deploymentState,
      system.activityContexts,
      system.externalReach,
      system.activityActor,
      system.occurrenceSetting,
    ].filter(Boolean).join("|").toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
