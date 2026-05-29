const crypto = require("node:crypto");

const ACTIONS = {
  allow: "allow",
  hold: "hold",
  stewardReview: "steward_review"
};

function hashEvidence(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function daysBetween(a, b) {
  return Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function evaluateConflictSignal(project, candidate, signal) {
  switch (signal.type) {
    case "recent_coauthor": {
      const ageDays = daysBetween(signal.lastCollaborationAt, project.reviewDate);
      return ageDays <= project.policy.coauthorLookbackDays
        ? {
            code: "recent_coauthor",
            severity: "high",
            message: `${candidate.name} coauthored with ${signal.with} ${ageDays} days before review.`
          }
        : null;
    }
    case "same_institution":
      return project.policy.allowSameInstitution
        ? null
        : {
            code: "same_institution",
            severity: "medium",
            message: `${candidate.name} shares an institution with ${signal.with}.`
          };
    case "funding_overlap":
      return {
        code: "funding_overlap",
        severity: signal.direct ? "high" : "medium",
        message: `${candidate.name} has ${signal.direct ? "direct" : "indirect"} funding overlap via ${signal.grant}.`
      };
    case "active_competitor":
      return {
        code: "active_competitor",
        severity: "medium",
        message: `${candidate.name} is active on a competing project: ${signal.project}.`
      };
    default:
      return {
        code: "unknown_signal",
        severity: "low",
        message: `Unrecognized conflict signal ${signal.type}.`
      };
  }
}

function evaluateCandidate(project, candidate) {
  const findings = candidate.conflictSignals
    .map((signal) => evaluateConflictSignal(project, candidate, signal))
    .filter(Boolean);

  const hasHigh = findings.some((finding) => finding.severity === "high");
  const hasMedium = findings.some((finding) => finding.severity === "medium");
  const identityGaps = [];

  if (!candidate.identity.orcidVerified) identityGaps.push("orcid_unverified");
  if (!candidate.identity.mfaFresh) identityGaps.push("mfa_not_fresh");
  if (!candidate.identity.affiliationVerified) identityGaps.push("affiliation_unverified");

  const action = hasHigh
    ? ACTIONS.hold
    : hasMedium || identityGaps.length > 0
      ? ACTIONS.stewardReview
      : ACTIONS.allow;

  return {
    candidateId: candidate.id,
    name: candidate.name,
    requestedRole: candidate.requestedRole,
    action,
    findings,
    identityGaps,
    evidenceHash: hashEvidence({
      projectId: project.id,
      candidateId: candidate.id,
      requestedRole: candidate.requestedRole,
      findings,
      identityGaps
    })
  };
}

function evaluateProjectAccess(project) {
  const decisions = project.candidates.map((candidate) => evaluateCandidate(project, candidate));
  const summary = {
    allow: decisions.filter((decision) => decision.action === ACTIONS.allow).length,
    hold: decisions.filter((decision) => decision.action === ACTIONS.hold).length,
    stewardReview: decisions.filter((decision) => decision.action === ACTIONS.stewardReview).length
  };

  return {
    projectId: project.id,
    projectTitle: project.title,
    reviewedAt: project.reviewDate,
    policy: project.policy,
    decisions,
    summary,
    auditDigest: hashEvidence({ projectId: project.id, decisions, summary })
  };
}

module.exports = {
  ACTIONS,
  evaluateCandidate,
  evaluateProjectAccess,
  hashEvidence
};
