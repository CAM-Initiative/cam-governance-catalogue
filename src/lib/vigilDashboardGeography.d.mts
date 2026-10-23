export function countryLookupFromProjection(
  records: Array<{ id: string; record_type?: string; record_version?: string }>,
  projection: unknown,
  countryMatcher: (text: unknown) => { id: string } | undefined
): Map<string, string[]>;
