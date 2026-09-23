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

function agentConfigurationLabel(value: unknown) {
  const normalized = text(value)?.toLowerCase();
  const labels: Record<string, string> = {
    "non-agentic": "Non-agentic",
    "single-agent": "Single agent",
    "multi-agent": "Multi-agent",
    swarm: "Swarm",
    unknown: "Unknown",
  };
  return normalized ? labels[normalized] ?? normalized : undefined;
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

function occurrenceSettingLabel(value: unknown) {
  const normalized = text(value)?.toLowerCase();
  const labels: Record<string, string> = {
    testing: "Testing",
    live: "Live",
    mixed: "Mixed testing / live",
    unknown: "Unknown",
  };
  return normalized ? labels[normalized] ?? normalized : undefined;
}

function testingActorLabel(value: unknown) {
  const normalized = text(value)?.toLowerCase();
  const labels: Record<string, string | undefined> = {
    "provider-internal": "Provider / internal",
    government: "Government",
    "third-party": "Third party",
    joint: "Joint / multi-party",
    "not-applicable": undefined,
    unknown: "Unknown",
  };
  return normalized ? labels[normalized] ?? normalized : undefined;
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
  const occurrenceSetting = occurrenceSettingLabel(occurrenceEnvironment.operational_setting);
  const testingActor = testingActorLabel(occurrenceEnvironment.testing_actor);

  if (![provider, product, model, systemType, interfaceSurface, deploymentContext, agentConfiguration, agentCount, occurrenceSetting, testingActor].some(Boolean)) {
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
      system.occurrenceSetting,
    ].filter(Boolean).join("|").toLowerCase();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
