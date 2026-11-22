export function classOutcomePairs(raw: Record<string, unknown>): Array<{ classId: string; role: "failure-occurrence" | "successful-invariant" | "ambiguous-boundary" }>;
export function classOutcomeCounts(records: Array<{ id?: string; raw?: Record<string, unknown> }>): { "failure-occurrence": number; "successful-invariant": number; "ambiguous-boundary": number; distinctIncidents: number };
export function failureClassIds(raw: Record<string, unknown>): string[];
export function topFailureClasses(records: Array<{ raw?: Record<string, unknown> }>, maxItems?: number): Array<{ id: string; count: number }>;
export const SEVERITY_ORDER: string[];
export function severityDistribution(records: Array<{ severity?: string; raw?: Record<string, unknown> }>): Array<{ code: string; count: number }>;
