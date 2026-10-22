/**
 * Source-first country matching for an existing canonical jurisdiction string.
 * This is a conservative dashboard projection, not a canonical adjudication.
 * Country / territory names must occur explicitly. Multiple country matches
 * are NOT reduced to the first country, because that would falsely imply that
 * a cross-border case happened in one location.
 */
export function countryFromJurisdictionString(value, countries, aliases = {}) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text || /^(global|international|cross-border|multi-jurisdictional|unspecified|unknown|not established|not applicable|jurisdiction not established)/i.test(text)) return undefined;
  const isNamed = name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z])${escaped}(?=$|[^a-z])`, "i").test(text);
  };
  const matches = countries.filter(country =>
    [country.name, ...(aliases[country.id] ?? [])].some(name => isNamed(String(name).toLowerCase()))
  );
  return matches.length === 1 ? matches[0] : undefined;
}
