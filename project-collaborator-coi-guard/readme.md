# Project Collaborator COI Guard

This self-contained module covers a distinct User & Project Management slice for issue #11: conflict-of-interest checks before a collaborator, reviewer, or data steward receives project access.

It evaluates synthetic project membership requests for:

- recent coauthor conflicts
- institutional overlap
- direct and indirect funding overlap
- active competing projects
- ORCID, MFA, and affiliation verification gaps
- deterministic audit evidence for reviewer packets

The module does not call identity providers, external APIs, OAuth, SAML, ORCID, production access-control systems, or private project data. All examples are synthetic.

## Run

```bash
node project-collaborator-coi-guard/test.js
node project-collaborator-coi-guard/demo.js
node project-collaborator-coi-guard/render-video.js
```

Generated reviewer artifacts live in `project-collaborator-coi-guard/reports/`.
