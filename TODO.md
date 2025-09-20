<!--
TODO.md — Task queue for document-driven development framework

Rules:
- Tasks are defined using the task-template at `docs/templates/task-template.md`.
- Each task MUST include the following fields: id, priority, summary, detailed_requirements,
  positive_behaviors, negative_behaviors, validations, status, owner (optional), created, updated.
- Tasks in this file are the active queue (resumable and reorderable). When a task is completed,
  remove it from this file and add a corresponding entry under the `Unreleased` section of `CHANGELOG.md`.
- Task IDs must be unique and use the prefix `T-` followed by a zero-padded number (e.g. `T-001`).
-->

# TODO — Task Queue

This file is the canonical, human-manageable task queue for the Documentation-Driven Development framework in this repository.

## How to use

- To add a task: copy the task template below, fill out the fields, and insert the appropriate priority position.
- To reorder tasks: move the task block to a new place in this file. Tasks are processed top-to-bottom unless otherwise prioritized.
- To mark a task complete: remove the task block from this file and add a short summary (task id, summary, and link to PR/commit) to the `Unreleased` section of `CHANGELOG.md`.

## Priority convention

- P0 — Critical (blocker for release or security/compliance)
- P1 — High (important for next release)
- P2 — Medium (planned for upcoming work)
- P3 — Low (nice-to-have)

---

## Phase 1: Critical MCP SDK Compatibility Fix

id: T-001
priority: P0
status: open
summary: Fix MCP SDK tool registration API compatibility
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Replace deprecated `server.tool()` API with modern `server.registerTool()` API in `DefaultToolRegistrar`
- Remove `toZodRawShape()` utility function as it's incompatible with MCP SDK v1.18.0
- Update tool registration to pass Zod schemas directly without conversion
- Ensure all 13 existing tools register and function correctly with MCP clients
- Fix `keyValidator._parse is not a function` error that prevents tool invocation
- Maintain backward compatibility with existing tool implementations
- Update type definitions if necessary

positive_behaviors:

- All 13 tools can be successfully invoked via MCP clients
- Tool schemas are properly exposed in MCP protocol
- No validation errors during tool registration or invocation
- Existing tool functionality is preserved
- Tool manifest generation continues to work correctly

negative_behaviors:

- Tools cannot be invoked by MCP clients
- Schema validation errors during tool calls
- Breaking changes to existing tool implementations
- Loss of tool metadata or descriptions

validations:

- All tools can be called successfully via MCP clients without errors
- Tool list is correctly exposed to MCP clients
- Tool schemas validate properly
- No `keyValidator._parse is not a function` errors
- All existing unit tests continue to pass
- Integration tests with actual MCP clients succeed

---

id: T-002
priority: P0
status: open
summary: Validate and test MCP server functionality end-to-end
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Test all 13 tools individually with MCP clients
- Verify authentication works correctly with bearer token
- Test error handling and response formats
- Validate JSON:API and standard response formats
- Ensure server startup and shutdown work correctly
- Test tool discovery and metadata exposure
- Validate input sanitization and validation works properly

positive_behaviors:

- 100% tool invocation success rate
- Proper error messages for invalid inputs
- Correct response formatting for all tools
- Authentication works as expected
- Server handles multiple concurrent requests

negative_behaviors:

- Tools fail to execute
- Authentication failures
- Malformed responses
- Server crashes or hangs
- Memory leaks or resource exhaustion

validations:

- All tools execute successfully when called via MCP
- Authentication is validated correctly
- Response formats comply with MCP protocol
- Error handling provides meaningful messages
- Server performance is acceptable under normal load

---

## Phase 2: Enhanced Query Capabilities

id: T-003
priority: P1
status: open
summary: Implement fuzzy search and enhanced entity querying
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Enhance `GetEntitiesByQueryTool` to support fuzzy matching on `metadata.name`, `metadata.title`, and `spec.profile.displayName`
- Implement case-insensitive partial matching with configurable similarity threshold
- Add support for multiple field searches with OR logic
- Add query parameter for fuzzy search mode (exact vs fuzzy)
- Optimize query performance for large catalogs
- Maintain backward compatibility with existing exact match queries

positive_behaviors:

- Can find entities with partial name matches (e.g., "user-mgmt" finds "user-management")
- Case-insensitive searches work correctly
- Multiple field searches return comprehensive results
- Performance remains acceptable for large catalogs
- Existing exact match functionality is preserved

negative_behaviors:

- False positive matches that confuse users
- Poor performance with fuzzy matching
- Breaking changes to existing query behavior
- Inconsistent matching results

validations:

- Can answer: "Find entities with 'user' in the name"
- Can answer: "What entities are related to 'management'?"
- Fuzzy search returns relevant results within acceptable time limits
- Exact match queries still work as before
- Performance benchmarks show acceptable query times

---

id: T-004
priority: P1
status: open
summary: Create entity relationship resolution tools
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Create `FindEntityOwnerTool` to resolve ownership for Components, Resources, APIs, Systems, and Domains
- Handle all entity reference formats: full (`kind:namespace/name`), partial (`kind:name`), and implicit (`name`)
- Implement `GetUserTeamsTool` to find all groups/teams a user belongs to
- Create `GetTeamMembersTool` to find all users in a specific team/group
- Support recursive team hierarchy traversal (teams within teams)
- Add entity reference validation and normalization utilities

positive_behaviors:

- Can resolve ownership chains from entity to user/team
- Handles implicit entity references correctly
- Traverses team hierarchies properly
- Provides clear ownership information
- Validates entity references before processing

negative_behaviors:

- Fails to resolve valid entity references
- Infinite loops in circular relationships
- Poor performance on large team hierarchies
- Incorrect ownership resolution

validations:

- Can answer: "Who owns the user-management Component?"
- Can answer: "What team does John Doe work on?"
- Can answer: "Who are the members of the engineering team?"
- Handles all entity reference formats correctly
- Performance is acceptable for complex ownership chains

---

id: T-005
priority: P1
status: open
summary: Implement entity counting and facet analysis tools
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Create `GetEntityCountsTool` to count entities by kind, owner, system, domain, etc.
- Enhance `GetEntityFacetsTool` with natural language descriptions
- Create `GetSystemComponentsTool` to list all components within a system
- Create `GetDomainSystemsTool` to list all systems within a domain
- Add filtering capabilities for counts (e.g., count only active entities)
- Provide summary statistics and breakdowns

positive_behaviors:

- Provides accurate entity counts with clear breakdowns
- Facet analysis includes helpful descriptions
- System and domain hierarchy tools work correctly
- Filtering options provide useful subsets
- Results are formatted for easy LLM consumption

negative_behaviors:

- Inaccurate counts or missing entities
- Poor performance on large catalogs
- Confusing or misleading facet descriptions
- Incomplete hierarchy traversal

validations:

- Can answer: "How many entities are in the Examples system?"
- Can answer: "How many Components does the platform-team own?"
- Can answer: "What's the breakdown of entity types in the catalog?"
- Counts are accurate and performance is acceptable
- Facet analysis provides meaningful insights

---

## Phase 3: Response Enhancement and User Experience

id: T-006
priority: P1
status: open
summary: Enhance response formatting for natural language queries
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Implement structured response formatting that includes entity counts and summaries
- Add relationship explanations in natural language (e.g., "Found 5 Components owned by team-alpha")
- Create response templates for common query patterns
- Enhance JSON:API formatter with better context for LLMs
- Add contextual information and suggestions to responses
- Implement response aggregation for multi-step queries

positive_behaviors:

- Responses are in natural language format suitable for LLMs
- Include helpful context and summaries
- Provide actionable next steps or related queries
- Format complex data in readable structure
- Maintain technical accuracy while being user-friendly

negative_behaviors:

- Verbose or confusing responses
- Loss of important technical details
- Inconsistent formatting across tools
- Poor readability for complex queries

validations:

- Responses read naturally in conversational context
- Technical information is preserved and accessible
- Complex queries provide structured, readable results
- User feedback indicates improved understanding
- LLM can effectively use the formatted responses

---

id: T-007
priority: P2
status: open
summary: Implement comprehensive error handling and user guidance
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Implement descriptive error messages for common failure cases
- Add suggestions for alternative queries when entities are not found
- Provide helpful hints for proper entity reference formats
- Implement graceful degradation for partial query failures
- Add query validation with suggested corrections
- Create error recovery suggestions based on context

positive_behaviors:

- Error messages are clear and actionable
- Provides helpful suggestions when queries fail
- Guides users toward successful query patterns
- Gracefully handles partial failures
- Maintains user engagement despite errors

negative_behaviors:

- Cryptic or technical error messages
- No guidance for failed queries
- System crashes on invalid inputs
- Frustrating user experience with errors

validations:

- Error messages provide clear next steps
- Users can successfully reformulate failed queries
- System handles edge cases gracefully
- Error recovery suggestions are helpful and accurate
- Overall user experience is positive despite occasional failures

---

## Phase 4: Performance and Advanced Features

id: T-008
priority: P2
status: open
summary: Implement caching and performance optimization
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Implement intelligent caching for relationship queries and entity metadata
- Add performance monitoring and metrics collection
- Optimize common query patterns and frequently accessed data
- Implement cache invalidation strategies for data freshness
- Add configurable cache TTL and size limits
- Monitor and optimize memory usage

positive_behaviors:

- Significant performance improvement for repeated queries
- Cache hit rates are high for common operations
- Memory usage is controlled and predictable
- Cache invalidation maintains data freshness
- Performance metrics guide optimization efforts

negative_behaviors:

- Memory leaks from unbounded caches
- Stale data from poor invalidation
- Cache thrashing reducing performance
- Excessive memory usage

validations:

- Complex queries execute within acceptable time limits (< 5 seconds)
- Cache hit rates > 70% for repeated queries
- Memory usage remains stable over time
- Performance benchmarks show measurable improvement
- Data freshness is maintained appropriately

---

id: T-009
priority: P2
status: open
summary: Create advanced search and discovery tools
owner: AI Assistant
created: 2025-09-19
updated: 2025-09-19

detailed_requirements:

- Create `SearchEntitiesByNameTool` with advanced fuzzy search across all entity types
- Implement `FindEntitiesByOwnerTool` for comprehensive ownership queries
- Create `GetEntityHierarchyTool` for complete Domain → System → Component hierarchies
- Add `GetEntityDependenciesTool` and `GetEntityDependentsTool` for dependency analysis
- Implement semantic search capabilities where applicable
- Add advanced filtering and sorting options

positive_behaviors:

- Comprehensive search capabilities across all entity types
- Advanced dependency analysis provides valuable insights
- Hierarchy tools show complete organizational structure
- Search results are relevant and well-ranked
- Advanced features enhance discoverability

negative_behaviors:

- Search results are irrelevant or poorly ranked
- Dependency analysis is incomplete or incorrect
- Poor performance on complex searches
- Confusing or overwhelming search options

validations:

- Advanced search provides comprehensive entity discovery
- Dependency analysis accurately reflects relationships
- Hierarchy tools show complete organizational structure
- Search performance is acceptable for complex queries
- Users can effectively discover entities and relationships

---

## Task Template

```
id: T-XXX
priority: P0/P1/P2/P3
status: open/in-progress/blocked/completed
summary: Brief description of the task
owner: [Optional] Who is responsible
created: YYYY-MM-DD
updated: YYYY-MM-DD

detailed_requirements:

- Specific requirement 1
- Specific requirement 2
- Technical details and constraints

positive_behaviors:

- Expected good outcomes
- Success criteria
- Quality indicators

negative_behaviors:

- Things to avoid
- Failure modes
- Anti-patterns

validations:

- How to verify success
- Test criteria
- Acceptance criteria
```
