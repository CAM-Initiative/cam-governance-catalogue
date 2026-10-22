export function countryFromJurisdictionString<T extends { id: string; name: string }>(value: string, countries: T[], aliases?: Record<string, string[]>): T | undefined;
