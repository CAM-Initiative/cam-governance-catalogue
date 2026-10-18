// Ordered display projection: statements stay bound to their original episode.
export function clauseAssessmentRows(analysis) {
  if (!analysis || typeof analysis !== "object") return [];
  const rows = [];
  const context = analysis.pre_compaction_context;
  if (context?.source_paraphrase) rows.push({ ...context, observation_title: "Before compaction: known task and missing context", adjudication_note: context.rationale, display_context: true });
  for (const clause of Array.isArray(analysis.clauses) ? analysis.clauses : []) {
    const statements = clause?.statement_analysis;
    const relationships = Array.isArray(clause?.taxonomy_relationships) ? clause.taxonomy_relationships : [];
    const indices = Array.isArray(statements) ? statements.flatMap(item => item?.taxonomy_relationship_indices || []) : [];
    const valid = Array.isArray(statements) && statements.length > 0
      && statements.every(item => item && (item.source_anchor || item.source_paraphrase) && Array.isArray(item.taxonomy_relationship_indices))
      && indices.every(index => Number.isInteger(index) && index >= 0 && index < relationships.length)
      && new Set(indices).size === indices.length
      && indices.length === relationships.length;
    if (!valid) { rows.push(clause); continue; }
    rows.push({
      source_paraphrase: clause.source_paraphrase,
      complete_source_anchor: statements.some(item => item.source_anchor === clause.source_anchor) ? undefined : clause.source_anchor,
      observation_title: "Shared source context",
      adjudication_note: clause.adjudication_note,
      display_context: true,
    });
    for (const statement of statements) {
      const selected = statement.taxonomy_relationship_indices.map(index => relationships[index]);
      rows.push({
        ...statement,
        observation_title: statement.title,
        source_record_refs: clause.source_record_refs,
        taxonomy_relationships: selected,
        adjudication_status: clause.adjudication_status === "unresolved" && selected.some(item => item.canonical_taxonomy_mapping !== true && String(item.relationship || "").includes("candidate"))
          ? "unresolved"
          : selected.some(item => item.canonical_taxonomy_mapping === true) ? "mapped" : "resolved-no-mapping",
      });
    }
  }
  return rows;
}
