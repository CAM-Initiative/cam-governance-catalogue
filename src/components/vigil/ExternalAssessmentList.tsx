import { ExternalLink } from "lucide-react";
import {
  externalAssessmentDate,
  externalAssessmentRelationshipLabel,
  externalAssessmentTypeLabel,
  type ExternalAssessment,
} from "@/lib/vigilExternalAssessments";

export function ExternalAssessmentList({ assessments, compact = false }: { assessments: ExternalAssessment[]; compact?: boolean }) {
  if (!assessments.length) return null;
  return <div className={`vigil-external-assessments${compact ? " is-compact" : ""}`}>
    {assessments.map((assessment) => <article key={assessment.id} className="vigil-external-assessment">
      <header>
        <p className="vigil-external-assessment-kicker">External assessment</p>
        <h4><a href={assessment.url} target="_blank" rel="noreferrer">{assessment.title}<ExternalLink aria-hidden="true" /></a></h4>
        <p className="vigil-external-assessment-byline"><strong>{assessment.assessor}</strong> · {externalAssessmentDate(assessment.date)}</p>
      </header>
      <p className="vigil-external-assessment-summary">{assessment.summary}</p>
      {assessment.classificationOrRating && <dl className="vigil-external-assessment-rating">
        <div><dt>External classification / rating</dt><dd>{assessment.classificationOrRating.verbatimLabel ?? assessment.classificationOrRating.value}</dd></div>
        <div><dt>External scheme</dt><dd>{assessment.classificationOrRating.scheme}</dd></div>
      </dl>}
      {assessment.comparisonNote && <section><h5>VIGIL relationship</h5><p>{assessment.comparisonNote}</p></section>}
      {assessment.scopeNote && <section><h5>Scope</h5><p>{assessment.scopeNote}</p></section>}
      <footer>
        <span>{externalAssessmentTypeLabel(assessment.type)}</span>
        <span>{externalAssessmentRelationshipLabel(assessment.relationship)}</span>
        <a href={assessment.url} target="_blank" rel="noreferrer">View assessment <ExternalLink aria-hidden="true" /></a>
      </footer>
    </article>)}
  </div>;
}
