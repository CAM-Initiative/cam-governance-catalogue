// A classification is a mutually exclusive Case File outcome. Selecting several
// outcomes therefore uses OR across outcomes; other facets remain conjunctive.
export function toggleClassificationSelection(current, key) {
  if (!key) return current;
  return current.includes(key)
    ? current.filter(value => value !== key)
    : [...current, key];
}

export function matchesClassificationSelection(key, selected) {
  return !selected.length || selected.includes(key);
}
