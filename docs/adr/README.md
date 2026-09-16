# Architecture Decision Records

Architecture decision records capture choices that constrain future implementation. They supplement, rather than duplicate, the detailed evidence in architecture analyses and the task sequencing in implementation plans.

| ADR                                                                   | Decision                                                                | Status   |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| [0001](0001-generic-mcp-application-kernel.md)                        | Adopt a generic MCP application kernel                                  | Accepted |
| [0002](0002-source-boundaries-and-single-package.md)                  | Organize cohesive source boundaries in a single package                 | Accepted |
| [0003](0003-mcp-verification-strategy.md)                             | Verify MCP behavior at multiple boundaries                              | Accepted |
| [0004](0004-official-backstage-catalog-client.md)                     | Delegate Catalog protocol behavior to the official Backstage client     | Accepted |
| [0005](0005-remove-unreachable-compatibility-and-enforce-coverage.md) | Remove unreachable compatibility code and enforce per-file verification | Accepted |
| [0006](0006-enforce-mjs-quality-limits.md)                            | Enforce strict ECMAScript module quality limits                         | Accepted |
| [0007](0007-test-shell-automation-with-bats.md)                       | Test shell automation with colocated BATS suites                        | Accepted |
| [0008](0008-enforce-unused-code-analysis-with-knip.md)                | Enforce unused-code and dependency analysis with Knip                   | Accepted |
| [0009](0009-standardize-node-24-and-harden-automation.md)             | Standardize Node.js 24 and harden dependency and release automation     | Accepted |

## Record lifecycle

- Give each new record the next four-digit sequence number.
- Use `Proposed`, `Accepted`, `Deprecated`, or `Superseded by ADR NNNN` as its status.
- Do not rewrite an accepted decision when the architecture changes. Add a new ADR that supersedes it and cross-link both records.
- Small corrections and link repairs may be made without creating a replacement record.
- Keep implementation checklists in `docs/plans`; ADR consequences should describe lasting tradeoffs, not transient tasks.
