// Match only explicitly admitted relationships. Neither proximity nor the
// Incident-level role assigns an episode to a mapping.
export function mappingEvidence(raw, classId) {
  if (!classId) return [];
  const clauses = raw?.vigil_assessment?.source_clause_analysis?.clauses;
  const sources = Array.isArray(raw?.source_records) ? raw.source_records : [];
  return (Array.isArray(clauses) ? clauses : []).flatMap((clause, index) => {
    const relationships = (Array.isArray(clause?.taxonomy_relationships) ? clause.taxonomy_relationships : [])
      .filter(item => item?.canonical_taxonomy_mapping === true && item.class_id === classId);
    if (!relationships.length) return [];
    const episodeId = typeof clause.episode_id === 'string' ? clause.episode_id : undefined;
    return [{
      episodeId,
      label: episodeId || `Source observation ${index + 1}`,
      href: episodeId ? `#vigil-source-episode-${encodeURIComponent(episodeId)}` : undefined,
      relationships: relationships.map(item => ({ role: item.relationship, rationale: item.rationale })),
      sources: (Array.isArray(clause.source_record_refs) ? clause.source_record_refs : []).flatMap(ref => {
        const match = /^source_records\[(\d+)\]$/.exec(ref);
        const source = match ? sources[Number(match[1])] : undefined;
        return source?.source_url ? [{ ref, url: source.source_url, title: source.source_title || ref }] : [];
      }),
    }];
  });
}
