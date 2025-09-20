# Backstage MCP Server Enhancement Planning Document

## Executive Summary

This document provides a comprehensive analysis and planning framework for enhancing the Backstage MCP Server to provide exceptional tooling for natural language interactions with the Backstage software catalog. The current implementation has architectural issues that prevent proper tool registration and discovery, which must be resolved before advanced catalog querying capabilities can be implemented.

## Current State Analysis

### Architecture Overview

The Backstage MCP Server is designed to provide MCP (Model Context Protocol) tools for interacting with a Backstage software catalog. The server architecture consists of:

1. **MCP Server Layer**: Uses `@modelcontextprotocol/sdk` for MCP protocol handling
2. **Tool Registration System**: Discovers and registers tools with the MCP server
3. **Catalog API Layer**: Interfaces with Backstage's catalog API
4. **Tool Implementation Layer**: Individual tool classes that implement specific catalog operations

### Critical Issues Identified

#### 1. Tool Registration Failure

**Problem**: The tool registration system is broken due to metadata discovery issues.

**Root Cause**:

- Recent refactoring converted tools from decorator-based pattern to factory-based pattern
- `ReflectToolMetadataProvider` expects metadata from `@Tool` decorator registry
- Factory-created tools don't populate the metadata registry
- Tools are not being registered with the MCP server

**Evidence**:

```typescript
// Old pattern (working)
@Tool({
  name: ToolName.GET_ENTITY_BY_REF,
  description: 'Get entity by reference',
  paramsSchema: entityRefSchema,
})
export class GetEntityByRefTool {
  static async execute() {
    /* implementation */
  }
}

// New pattern (broken)
export const GetEntityByRefTool = ToolFactory({
  name: ToolName.GET_ENTITY_BY_REF,
  description: 'Get entity by reference',
  paramsSchema: GetEntityByRefOperation.paramsSchema,
})(GetEntityByRefOperation);
```

**Impact**: No tools are being registered with the MCP server, making the entire system non-functional.

#### 2. Manifest Generation Issues

**Problem**: The generated `tools-manifest.json` doesn't match the actual tool schemas.

**Evidence**: The manifest shows simplified parameter lists that don't reflect the actual Zod schemas used by the tools.

#### 3. Schema Complexity Mismatch

**Problem**: Tool schemas are more complex than what's exposed in the manifest.

**Example**:

- Manifest shows: `"params": ["entityRef"]`
- Actual schema: `entityRef: z.union([z.string(), z.object({kind, namespace, name})])`

### Backstage Catalog API Analysis

#### Entity Reference Formats

Backstage supports three entity reference formats:

1. **Full Reference**: `<kind>:<namespace>/<name>` (e.g., `Component:default/my-app`)
2. **Short Reference**: `<kind>:<name>` (e.g., `Component:my-app`)
3. **Name Only**: `<name>` (e.g., `my-app`) - requires context to resolve

#### Well-Known Relationships

Backstage defines implicit relationships between entity types:

**Ownership Relationships**:

- `spec.owner` can reference User or Group entities
- Format can be: full ref, short ref, or name-only
- Requires resolution logic to determine entity type

**System Relationships**:

- `spec.system` references System entities
- `spec.domain` references Domain entities
- Components/Resources/APIs belong to Systems
- Systems belong to Domains

**Membership Relationships**:

- `spec.memberOf` lists Group entities a User belongs to
- Groups can have `spec.type`: `team`, `plt`, `blt`, `dlt`

#### Query Capabilities Required

To support natural language queries like:

- "How many entities are in the Examples system?"
- "What team does Marty Riley work on?"
- "Who owns the user-service component?"

The system needs:

1. **Entity Resolution**: Convert fuzzy names to entity references
2. **Relationship Traversal**: Navigate entity relationships
3. **Context-Aware Queries**: Use entity type context for resolution
4. **Facet Analysis**: Count entities by various criteria

## Enhancement Requirements

### Phase 1: Fix Tool Registration (Critical)

#### 1.1 Metadata Provider Enhancement

**Who**: Tool Metadata System
**What**: Update `ReflectToolMetadataProvider` to handle factory-created tools
**Why**: Current provider only works with decorator-based tools
**Where**: `src/utils/tools/tool-metadata.ts`

**Implementation**:

```typescript
export class EnhancedToolMetadataProvider implements IToolMetadataProvider {
  getMetadata(tool: ToolClass | object): IToolMetadata | undefined {
    // Try decorator-based lookup first
    const decoratorMetadata = toolMetadataMap.get(tool as ToolClass);
    if (decoratorMetadata) return decoratorMetadata;

    // Try factory-based lookup
    if (isFactoryCreatedTool(tool)) {
      return extractMetadataFromFactoryTool(tool);
    }

    return undefined;
  }
}
```

#### 1.2 Tool Discovery Enhancement

**Who**: Tool Loader System
**What**: Update `ToolLoader` to handle both decorator and factory patterns
**Why**: Current loader assumes all tools use decorators
**Where**: `src/utils/tools/tool-loader.ts`

#### 1.3 Manifest Generation Fix

**Who**: Manifest Generation System
**What**: Update manifest generation to reflect actual Zod schemas
**Why**: Current manifest shows incorrect parameter information
**Where**: `src/utils/tools/tool-loader.ts`

### Phase 2: Advanced Catalog Querying

#### 2.1 Entity Resolution Engine

**Who**: New Entity Resolution Service
**What**: Create service to resolve fuzzy entity names to references
**Why**: Support natural language queries like "user-service"
**Where**: `src/utils/catalog/entity-resolver.ts`

**Capabilities**:

- Fuzzy name matching across `metadata.name`, `metadata.title`
- Context-aware resolution (prefer certain entity types)
- Multiple result handling with scoring

#### 2.2 Relationship Traversal Engine

**Who**: New Relationship Service
**What**: Navigate entity relationships for complex queries
**Why**: Support queries like "who owns X" or "what team does Y work on"
**Where**: `src/utils/catalog/relationship-traversal.ts`

**Capabilities**:

- Traverse ownership relationships
- Navigate membership hierarchies
- Resolve implicit references
- Handle circular relationship detection

#### 2.3 Natural Language Query Processor

**Who**: New Query Processor Service
**What**: Parse and execute natural language catalog queries
**Why**: Enable conversational catalog interactions
**Where**: `src/utils/catalog/query-processor.ts`

**Supported Query Types**:

- Count queries: "How many APIs are in system X?"
- Ownership queries: "Who owns component Y?"
- Membership queries: "What team does person Z work on?"
- Relationship queries: "What components belong to domain A?"

### Phase 3: Enhanced Tool Capabilities

#### 3.1 Smart Entity Lookup Tool

**Who**: Enhanced GetEntityByRefTool
**What**: Add fuzzy matching and context awareness
**Why**: Support natural language entity references
**Where**: `src/tools/get_entity_by_ref.tool.ts`

#### 3.2 Advanced Query Tool

**Who**: Enhanced GetEntitiesByQueryTool
**What**: Add relationship-aware filtering
**Why**: Support complex multi-entity queries
**Where**: `src/tools/get_entities_by_query.tool.ts`

#### 3.3 Entity Analysis Tool

**Who**: New Entity Analysis Tool
**What**: Provide entity relationship insights
**Why**: Support "who owns what" type queries
**Where**: `src/tools/analyze_entity.tool.ts`

### Phase 4: Testing and Validation

#### 4.1 Integration Testing

**Who**: Test Infrastructure
**What**: Create end-to-end tests for natural language queries
**Why**: Validate complex query capabilities
**Where**: `src/test/integration/`

#### 4.2 Dogfooding Validation

**Who**: Development Team
**What**: Test all example queries from requirements
**Why**: Ensure real-world usability
**Where**: Manual testing and validation

## Implementation Plan

### Week 1: Tool Registration Fix

**Tasks**:

1. Fix `ReflectToolMetadataProvider` for factory tools
2. Update `ToolLoader` discovery logic
3. Fix manifest generation
4. Test basic tool registration

**Validation**: All 13 tools register correctly with MCP server

### Week 2: Entity Resolution Foundation

**Tasks**:

1. Implement `EntityResolver` service
2. Add fuzzy matching capabilities
3. Create entity reference utilities
4. Test basic entity resolution

**Validation**: Can resolve "user-service" to correct entity reference

### Week 3: Relationship Traversal

**Tasks**:

1. Implement `RelationshipTraversal` service
2. Add ownership relationship navigation
3. Add membership hierarchy traversal
4. Test relationship queries

**Validation**: Can answer "who owns component X?"

### Week 4: Natural Language Processing

**Tasks**:

1. Implement `QueryProcessor` service
2. Add query parsing and execution
3. Integrate with existing tools
4. Test complex queries

**Validation**: Can handle all example queries from requirements

### Week 5: Enhanced Tools and Testing

**Tasks**:

1. Enhance existing tools with smart capabilities
2. Create new analysis tools
3. Implement comprehensive integration tests
4. Performance optimization

**Validation**: All example queries work end-to-end

## Risk Assessment

### High Risk Items

1. **Tool Registration Fix**: Critical path - if not fixed, entire system is broken
2. **Entity Resolution Accuracy**: Fuzzy matching could return incorrect results
3. **Performance**: Complex relationship traversal could be slow

### Mitigation Strategies

1. **Incremental Testing**: Test each component as it's built
2. **Fallback Mechanisms**: Provide exact match fallbacks for fuzzy resolution
3. **Caching**: Implement result caching for performance
4. **Error Handling**: Comprehensive error handling for edge cases

## Success Criteria

### Functional Requirements

- ✅ All 13 tools register correctly with MCP server
- ✅ Tool manifest accurately reflects actual schemas
- ✅ Can resolve fuzzy entity names to correct references
- ✅ Can traverse ownership and membership relationships
- ✅ Can answer all example queries from requirements
- ✅ Natural language queries work conversationally

### Non-Functional Requirements

- ✅ Response time < 2 seconds for simple queries
- ✅ Response time < 5 seconds for complex relationship queries
- ✅ Error handling for invalid queries
- ✅ Comprehensive test coverage (>80%)
- ✅ Clear error messages for debugging

## Dependencies

### External Dependencies

- Backstage Catalog API (already integrated)
- MCP SDK (already integrated)
- Zod for schema validation (already integrated)

### Internal Dependencies

- Tool registration system (needs fixing)
- Catalog API client (already working)
- Authentication system (already working)

## Monitoring and Maintenance

### Key Metrics

- Tool registration success rate
- Query success rate
- Average response time
- Error rate by query type

### Maintenance Tasks

- Regular updates to Backstage API compatibility
- Performance monitoring and optimization
- Test suite maintenance
- Documentation updates

---

## Current Status Assessment

**Date**: September 19, 2025  
**Status**: ✅ FIXED - Tool Registration Issue Resolved  
**Next Action**: Begin Phase 2 - Enhanced Query Capabilities

### ✅ Completed: Phase 1 - Tool Registration Fix & Basic Testing

**Issue**: Tool registration system was broken due to metadata discovery issues with factory-created tools.  
**Root Cause**: `ReflectToolMetadataProvider` only worked with decorator-based tools, but the refactored tools use factory pattern.  
**Solution**: Enhanced `ReflectToolMetadataProvider` to extract metadata from factory-created tools by checking static properties (`toolName`, `description`, `paramsSchema`).  
**Result**: All 13 tools now register successfully with the MCP server.

**Additional Fixes Applied**:

- ✅ **Case sensitivity fix**: `EntityRef.parse()` now handles case-insensitive entity kinds (e.g., "Component" → "component")
- ✅ **Variable shadowing fix**: Fixed parameter shadowing in `getEntityByRef` method
- ✅ **Error handling**: Tools now return proper HTTP error responses instead of parsing errors

**Verification Results**:

- ✅ **Server logs**: "Found 13 tool classes to process"
- ✅ **Server logs**: "Registered 13 tools successfully"
- ✅ **MCP Protocol**: All 13 tools properly exposed via `tools/list`
- ✅ **Input Schemas**: Zod schemas correctly converted to JSON Schema
- ✅ **Tool Execution**: Tools process requests and return proper error responses (401 Unauthorized expected with dummy token)
- ✅ **Case Insensitive**: Entity kinds like "Component", "User", "API" work correctly
- ✅ **Build Status**: Clean compilation with no errors

### 🔄 Ready for Phase 2: Enhanced Query Capabilities

Now that basic tool functionality is verified and working, we can proceed with implementing the advanced natural language querying capabilities.
