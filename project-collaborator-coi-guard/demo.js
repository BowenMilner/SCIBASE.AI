const fs = require("node:fs");
const path = require("node:path");
const { evaluateProjectAccess } = require("./index");

const project = {
  id: "proj_quantum_cells",
  title: "Quantum Cell Imaging Dataset",
  reviewDate: "2026-05-29",
  policy: {
    coauthorLookbackDays: 730,
    allowSameInstitution: false
  },
  candidates: [
    {
      id: "user_ada",
      name: "Ada Park",
      requestedRole: "reviewer",
      identity: {
        orcidVerified: true,
        mfaFresh: true,
        affiliationVerified: true
      },
      conflictSignals: []
    },
    {
      id: "user_ben",
      name: "Ben Ortiz",
      requestedRole: "data_steward",
      identity: {
        orcidVerified: true,
        mfaFresh: true,
        affiliationVerified: true
      },
      conflictSignals: [
        { type: "recent_coauthor", with: "project owner", lastCollaborationAt: "2026-01-01" }
      ]
    },
    {
      id: "user_chandra",
      name: "Chandra Li",
      requestedRole: "collaborator",
      identity: {
        orcidVerified: false,
        mfaFresh: true,
        affiliationVerified: true
      },
      conflictSignals: [
        { type: "funding_overlap", grant: "NIH-AI-7781", direct: false }
      ]
    }
  ]
};

const report = evaluateProjectAccess(project);
const reportsDir = path.join(__dirname, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

fs.writeFileSync(
  path.join(reportsDir, "coi-access-report.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

const markdown = [
  `# ${report.projectTitle} COI Access Review`,
  "",
  `Reviewed at: ${report.reviewedAt}`,
  `Audit digest: \`${report.auditDigest}\``,
  "",
  "## Summary",
  "",
  `- Allow: ${report.summary.allow}`,
  `- Steward review: ${report.summary.stewardReview}`,
  `- Hold: ${report.summary.hold}`,
  "",
  "## Decisions",
  "",
  ...report.decisions.map((decision) => [
    `### ${decision.name}`,
    "",
    `- Requested role: ${decision.requestedRole}`,
    `- Action: ${decision.action}`,
    `- Findings: ${decision.findings.map((finding) => finding.code).join(", ") || "none"}`,
    `- Identity gaps: ${decision.identityGaps.join(", ") || "none"}`,
    `- Evidence hash: \`${decision.evidenceHash}\``,
    ""
  ].join("\n"))
].join("\n");

fs.writeFileSync(path.join(reportsDir, "coi-access-report.md"), markdown);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#101827"/>
  <text x="48" y="70" fill="#e5e7eb" font-family="Arial" font-size="34" font-weight="700">Collaborator COI Access Guard</text>
  <text x="48" y="112" fill="#94a3b8" font-family="Arial" font-size="18">${report.projectTitle}</text>
  <rect x="48" y="150" width="250" height="180" rx="10" fill="#0f766e"/>
  <rect x="355" y="150" width="250" height="180" rx="10" fill="#92400e"/>
  <rect x="662" y="150" width="250" height="180" rx="10" fill="#991b1b"/>
  <text x="84" y="220" fill="#ecfeff" font-family="Arial" font-size="64">${report.summary.allow}</text>
  <text x="391" y="220" fill="#fffbeb" font-family="Arial" font-size="64">${report.summary.stewardReview}</text>
  <text x="698" y="220" fill="#fee2e2" font-family="Arial" font-size="64">${report.summary.hold}</text>
  <text x="84" y="280" fill="#ccfbf1" font-family="Arial" font-size="26">Allow</text>
  <text x="391" y="280" fill="#fde68a" font-family="Arial" font-size="26">Steward review</text>
  <text x="698" y="280" fill="#fecaca" font-family="Arial" font-size="26">Hold</text>
  <text x="48" y="410" fill="#cbd5e1" font-family="Arial" font-size="18">Digest: ${report.auditDigest.slice(0, 24)}...</text>
  <text x="48" y="450" fill="#64748b" font-family="Arial" font-size="16">Synthetic demo data only. No identity-provider calls, credentials, or private projects.</text>
</svg>`;

fs.writeFileSync(path.join(reportsDir, "summary.svg"), svg);

console.log(markdown);
