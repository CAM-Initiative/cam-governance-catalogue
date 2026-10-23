export function failureClassIds(raw: Record<string, unknown>): string[];
export function topFailureClasses(records: Array<{ raw?: Record<string, unknown> }>, maxItems?: number): Array<{ id: string; count: number }>;
export const SEVERITY_ORDER: string[];
export function severityDistribution(records: Array<{ severity?: string; raw?: Record<string, unknown> }>): Array<{ code: string; count: number }>;
