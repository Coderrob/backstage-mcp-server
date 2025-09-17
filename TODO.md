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

- To add a task: copy the task template below, fill out the fields, and insert the appropriate priority position.
- To reorder tasks: move the task block to a new place in this file. Tasks are processed top-to-bottom unless otherwise prioritized.
- To mark a task complete: remove the task block from this file and add a short summary (task id, summary, and link to PR/commit) to the `Unreleased` section of `CHANGELOG.md`.

Priority convention

- P0 — Critical (blocker for release or security/compliance)
- P1 — High (important for next release)
- P2 — Medium (planned for upcoming work)
- P3 — Low (nice-to-have)

---

id: T-001
priority: P0
status: open
summary: Implement comprehensive mock strategy for unit tests
owner: AI Assistant
created: 2025-09-16
updated: 2025-09-16

detailed_requirements:

- Define readonly mock creation pattern for all external dependencies
- Implement proper mock lifecycle management (creation in beforeEach, cleanup in afterEach)
- Ensure mocks are fully isolated between tests
- Use jest.Mocked<T> for type safety
- Implement call count and parameter assertions for all mocked methods
- Add jest.resetModules() for module isolation where needed
- Document mock patterns in test standards

positive_behaviors:

- All mocks are readonly and properly typed
- No test bleeding or state pollution
- Clear assertion of call counts and parameters
- Deterministic test execution

negative_behaviors:

- Mutable mocks
- Missing cleanup leading to test interference
- Incomplete call assertions
- Memory leaks from uncleared references

validations:

- All existing tests pass with --detectLeaks
- No flaky tests due to mock state
- Coverage reports accurate (no false positives from mock pollution)
- TypeScript compilation succeeds with mock types

---

id: T-002
priority: P0
status: open
summary: Ensure all test files have proper afterEach cleanup
owner: AI Assistant
created: 2025-09-16
updated: 2025-09-16

detailed_requirements:

- Add afterEach blocks to all test files
- Clear all mocks with jest.clearAllMocks()
- Reset modules with jest.resetModules() where appropriate
- Close any resources (timers, connections) in mocks
- Verify no memory leaks with --detectLeaks flag

positive_behaviors:

- Tests run cleanly without side effects
- Memory usage remains stable across test runs
- No interference between test suites

negative_behaviors:

- Memory leaks detected by Jest
- Test state bleeding between runs
- Resource exhaustion in CI

validations:

- jest --detectLeaks passes for all test suites
- Memory profiling shows no growth
- All mocks properly reset

---

id: T-003
priority: P1
status: open
summary: Continue unit test implementation for remaining modules
owner: AI Assistant
created: 2025-09-16
updated: 2025-09-16

detailed_requirements:

- Implement tests for formatting utilities (responses.ts, jsonapi-formatter.ts, pagination-helper.ts)
- Add tests for tool utilities (tool-loader.ts, tool-factory.ts, etc.)
- Create tests for API layer (backstage-catalog-api.ts)
- Implement auth layer tests (auth-manager.ts, input-sanitizer.ts, security-auditor.ts)
- Add cache layer tests (cache-manager.ts)
- Test main files (server.ts, generate-manifest.ts)
- Use lessons from mock strategy and cleanup for quality

positive_behaviors:

- All public methods have positive and negative test cases
- Table-driven tests for simple functions
- Proper mocking of external dependencies
- High test coverage (>95%)

negative_behaviors:

- Untested code paths
- Poor mock isolation
- Missing edge case coverage

validations:

- jest --coverage shows >95% for all metrics
- All tests pass consistently
- No memory leaks
- Code review passes

---

id: T-004
priority: P2
status: open
summary: Integrate tests into CI pipeline with coverage gates
owner: AI Assistant
created: 2025-09-16
updated: 2025-09-16

detailed_requirements:

- Configure GitHub Actions or CI to run tests
- Set coverage thresholds (95% statements, branches, functions, lines)
- Add test result reporting
- Ensure ES module support in CI environment
- Fail builds on coverage below thresholds

positive_behaviors:

- Automated test execution on PRs
- Coverage requirements enforced
- Test failures block merges

negative_behaviors:

- Tests not running in CI
- Coverage regressions allowed
- Manual test execution required

validations:

- CI passes for current codebase
- Coverage reports generated and accessible
- PR checks include test status
