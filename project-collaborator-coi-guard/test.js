const assert = require("node:assert/strict");
const { ACTIONS, evaluateProjectAccess, hashEvidence } = require("./index");

const basePolicy = {
  coauthorLookbackDays: 730,
  allowSameInstitution: false
};

function candidate(overrides) {
  return {
    id: "user_clean",
    name: "Clean Researcher",
    requestedRole: "reviewer",
    identity: {
      orcidVerified: true,
      mfaFresh: true,
      affiliationVerified: true
    },
    conflictSignals: [],
    ...overrides
  };
}

function project(candidates) {
  return {
    id: "proj_quantum_cells",
    title: "Quantum Cell Imaging Dataset",
    reviewDate: "2026-05-29",
    policy: basePolicy,
    candidates
  };
}

function testAllowsCleanCollaborator() {
  const report = evaluateProjectAccess(project([candidate({ id: "user_clean" })]));
  assert.equal(report.decisions[0].action, ACTIONS.allow);
  assert.deepEqual(report.decisions[0].findings, []);
  assert.deepEqual(report.decisions[0].identityGaps, []);
  assert.equal(report.summary.allow, 1);
}

function testHoldsRecentCoauthor() {
  const report = evaluateProjectAccess(project([
    candidate({
      id: "user_recent",
      name: "Recent Coauthor",
      conflictSignals: [
        { type: "recent_coauthor", with: "project owner", lastCollaborationAt: "2026-01-01" }
      ]
    })
  ]));
  const decision = report.decisions[0];
  assert.equal(decision.action, ACTIONS.hold);
  assert.equal(decision.findings[0].code, "recent_coauthor");
  assert.equal(decision.findings[0].severity, "high");
}

function testRoutesMediumRiskToStewardReview() {
  const report = evaluateProjectAccess(project([
    candidate({
      id: "user_funding",
      name: "Shared Grant Reviewer",
      conflictSignals: [
        { type: "funding_overlap", grant: "NSF-2042", direct: false }
      ]
    })
  ]));
  const decision = report.decisions[0];
  assert.equal(decision.action, ACTIONS.stewardReview);
  assert.equal(decision.findings[0].code, "funding_overlap");
}

function testIdentityGapsTriggerReviewWithoutConflictSignal() {
  const report = evaluateProjectAccess(project([
    candidate({
      id: "user_gap",
      name: "Unverified Reviewer",
      identity: {
        orcidVerified: false,
        mfaFresh: true,
        affiliationVerified: false
      }
    })
  ]));
  const decision = report.decisions[0];
  assert.equal(decision.action, ACTIONS.stewardReview);
  assert.deepEqual(decision.identityGaps, ["orcid_unverified", "affiliation_unverified"]);
}

function testAuditDigestIsDeterministicAndChangesWithEvidence() {
  const reportA = evaluateProjectAccess(project([candidate({ id: "user_clean" })]));
  const reportB = evaluateProjectAccess(project([candidate({ id: "user_clean" })]));
  const reportC = evaluateProjectAccess(project([candidate({ id: "user_other" })]));

  assert.equal(reportA.auditDigest, reportB.auditDigest);
  assert.notEqual(reportA.auditDigest, reportC.auditDigest);
  assert.equal(hashEvidence({ a: 1 }), hashEvidence({ a: 1 }));
}

[
  testAllowsCleanCollaborator,
  testHoldsRecentCoauthor,
  testRoutesMediumRiskToStewardReview,
  testIdentityGapsTriggerReviewWithoutConflictSignal,
  testAuditDigestIsDeterministicAndChangesWithEvidence
].forEach((test) => test());

console.log("project-collaborator-coi-guard tests passed");
