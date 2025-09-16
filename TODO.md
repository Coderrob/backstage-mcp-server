<!--
TODO.md — Task queue for document-driven development framework

Rules:
-- Tasks are defined using the task-template at `docs/templates/task-template.md`.
- Each task MUST include the following fields: id, priority, summary, detailed_requirements,
  positive_behaviors, negative_behaviors, validations, status, owner (optional), created, updated.
- Tasks in this file are the active queue (resumable and reorderable). When a task is completed,
  remove it from this file and add a corresponding entry under the `Unreleased` section of `CHANGELOG.md`.
- Task IDs must be unique and use the prefix `T-` followed by a zero-padded number (e.g. `T-001`).
-->

# TODO — Task Queue

This file is the canonical, human-manageable task queue for the Documentation-Driven Development framework in this repository.

How to use

- To add a task: copy the task template below, fill out the fields, and insert the task at the appropriate priority position.
- To reorder tasks: move the task block to a new place in this file. Tasks are processed top-to-bottom unless otherwise prioritized.
- To mark a task complete: remove the task block from this file and add a short summary (task id, summary, and link to PR/commit) to the `Unreleased` section of `CHANGELOG.md`.

Priority convention

- P0 — Critical (blocker for release or security/compliance)
- P1 — High (important for next release)
- P2 — Medium (planned for upcoming work)
- P3 — Low (nice-to-have)

Task template reference

See `docs/templates/task-template.md` for the canonical template and examples. The template below is a quick copy you can paste to create a task.

---

id: T-001
priority: P1
status: open
summary: Short one-line summary of the task
owner: Unassigned
created: 2025-09-14
updated: 2025-09-14

detailed_requirements:

- Step 1: Do this.

- Step 2: Do that.

positive_behaviors:

- The system should behave like this when correct.

negative_behaviors:

- The system should NOT do this.

validations:

- Automated tests (unit/integration) to run and expected results.

- Manual checks or QA steps.

notes:

- Any additional context or links to spec ids or planning.md sections.

---

Active tasks

<!-- Add tasks below. Keep the completed tasks out of this file and move to CHANGELOG.md -> Unreleased -->
