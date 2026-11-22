// One Incident can have several independently supported classification outcomes.
// Selecting several outcomes uses OR; other facets remain conjunctive.
export function toggleClassificationSelection(current, key) {
  if (!key) return current;
  return current.includes(key)
    ? current.filter(value => value !== key)
    : [...current, key];
}

export function matchesClassificationSelection(key, selected) {
  if (!selected.length) return true;
  const keys = Array.isArray(key) ? key : [key];
  return keys.some(value => selected.includes(value));
}
