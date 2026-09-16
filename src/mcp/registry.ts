/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 */

import type { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { McpFeatureKind } from '../shared/constants/mcp-protocol.js';
import type {
  CompiledFeature,
  McpFeature,
  McpManifest,
  McpManifestFeature,
  McpToolCachePolicy,
  McpToolPolicy,
  McpToolRateLimitPolicy,
  PluginDefinition,
  ToolDefinition,
} from '../types/mcp.js';
import { McpConfigurationError } from './errors.js';

export type { McpManifest, McpManifestFeature } from '../types/mcp.js';

const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{1,127}$/;
const JSON_SCHEMA_REFERENCE_STRATEGY = 'none' as const;
const PLUGIN_DEFINITION_KIND = 'plugin';

/**
 * Asserts optional positive.
 * @param value - The value to process.
 * @param message - The message.
 * @throws {Error} When the operation cannot be completed.
 */
function assertOptionalPositive(value: number | undefined, message: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new McpConfigurationError(message);
}

/**
 * Asserts optional positive integer.
 * @param value - The value to process.
 * @param message - The message.
 * @throws {Error} When the operation cannot be completed.
 */
function assertOptionalPositiveInteger(value: number | undefined, message: string): void {
  if (value !== undefined && (!Number.isInteger(value) || value <= 0)) throw new McpConfigurationError(message);
}

/**
 * Performs the compile feature operation.
 * @param plugin - The plugin definition.
 * @param feature - The feature definition.
 * @param state - The state.
 * @returns The operation result.
 * @throws {Error} When the operation cannot be completed.
 */
function compileFeature<TContext>(
  plugin: Readonly<PluginDefinition<TContext>>,
  feature: Readonly<McpFeature<TContext>>,
  state: Readonly<CompilationState>
): CompiledFeature<TContext> {
  validateName(feature.kind, feature.name);
  const namespace = feature.kind === McpFeatureKind.RESOURCE_TEMPLATE ? McpFeatureKind.RESOURCE : feature.kind;
  const key = `${namespace}:${feature.name}`;
  const owner = state.featureNames.get(key);
  if (owner) {
    throw new McpConfigurationError(`Duplicate ${feature.kind} '${feature.name}'`, {
      firstPlugin: owner,
      secondPlugin: plugin.name,
    });
  }
  state.featureNames.set(key, plugin.name);
  if (feature.kind === McpFeatureKind.TOOL) validateToolPolicy(feature as unknown as ToolDefinition<unknown>);
  return Object.freeze({ plugin, feature });
}

/**
 * Performs the compile plugin operation.
 * @param plugin - The plugin definition.
 * @param state - The state.
 * @returns The operation result.
 * @throws {Error} When the operation cannot be completed.
 */
function compilePlugin<TContext>(
  plugin: Readonly<PluginDefinition<TContext>>,
  state: Readonly<CompilationState>
): CompiledFeature<TContext>[] {
  validateName(PLUGIN_DEFINITION_KIND, plugin.name);
  if (!plugin.version.trim()) throw new McpConfigurationError(`Plugin '${plugin.name}' must declare a version`);
  if (state.pluginNames.has(plugin.name)) throw new McpConfigurationError(`Duplicate plugin '${plugin.name}'`);
  state.pluginNames.add(plugin.name);
  return plugin.features.map(
    /** Maps each item to its transformed value. */ (feature) => compileFeature(plugin, feature, state)
  );
}

/**
 * Validates cache policy.
 * @param tool - The tool.
 * @param cache - The cache.
 * @throws {Error} When the operation cannot be completed.
 */
function validateCachePolicy(tool: Readonly<ToolDefinition<unknown>>, cache: McpToolCachePolicy | undefined): void {
  assertOptionalPositive(cache?.ttlMs, `Tool '${tool.name}' has an invalid cache TTL`);
  if (cache && !tool.annotations?.readOnlyHint) {
    throw new McpConfigurationError(`Cached tool '${tool.name}' must declare readOnlyHint`);
  }
}

/**
 * Validates name.
 * @param kind - The kind.
 * @param name - The name.
 * @throws {Error} When the operation cannot be completed.
 */
function validateName(kind: string, name: string): void {
  if (!NAME_PATTERN.test(name)) {
    throw new McpConfigurationError(`Invalid ${kind} name '${name}'`, {
      expected: NAME_PATTERN.source,
    });
  }
}

/**
 * Validates policy fields.
 * @param tool - The tool.
 * @param policy - The policy.
 */
function validatePolicyFields(tool: Readonly<ToolDefinition<unknown>>, policy: Readonly<McpToolPolicy>): void {
  assertOptionalPositive(policy.timeoutMs, `Tool '${tool.name}' has an invalid timeout`);
  validateCachePolicy(tool, policy.cache);
  validateRateLimitPolicy(tool, policy.rateLimit);
}

interface CompilationState {
  pluginNames: Set<string>;
  featureNames: Map<string, string>;
}

/**
 * Validates rate limit policy.
 * @param tool - The tool.
 * @param rateLimit - The rate limit.
 */
function validateRateLimitPolicy(
  tool: Readonly<ToolDefinition<unknown>>,
  rateLimit: McpToolRateLimitPolicy | undefined
): void {
  assertOptionalPositiveInteger(rateLimit?.maxRequests, `Tool '${tool.name}' has an invalid rate-limit maximum`);
  assertOptionalPositive(rateLimit?.windowMs, `Tool '${tool.name}' has an invalid rate-limit window`);
}

/**
 * Validates tool policy.
 * @param tool - The tool.
 */
function validateToolPolicy(tool: Readonly<ToolDefinition<unknown>>): void {
  if (tool.policy) validatePolicyFields(tool, tool.policy);
}

/**
 * Converts a Zod schema into the inline JSON Schema stored in the manifest.
 * @param schema - Runtime schema to serialize.
 * @returns JSON Schema without the redundant draft declaration.
 */
function serializeSchema(schema: Readonly<ZodTypeAny>): Record<string, unknown> {
  const { $schema: _schemaDeclaration, ...document } = zodToJsonSchema(schema, {
    $refStrategy: JSON_SCHEMA_REFERENCE_STRATEGY,
  }) as Record<string, unknown>;
  return document;
}

/**
 * Creates metadata shared by every serialized MCP feature.
 * @param compiled - Feature and owning plugin metadata.
 * @returns Common manifest feature fields.
 */
function manifestFeatureBase<TContext>(compiled: Readonly<CompiledFeature<TContext>>): McpManifestFeature {
  const { feature, plugin } = compiled;
  return {
    kind: feature.kind,
    name: feature.name,
    plugin: plugin.name,
    title: feature.title,
    description: feature.description,
  };
}

/**
 * Serializes one compiled feature for the deterministic manifest.
 * @param compiled - Feature and owning plugin metadata.
 * @returns Manifest representation of the feature.
 */
function manifestFeature<TContext>(compiled: Readonly<CompiledFeature<TContext>>): McpManifestFeature {
  const { feature } = compiled;
  const common = manifestFeatureBase(compiled);
  if (feature.kind === McpFeatureKind.TOOL) {
    return {
      ...common,
      inputSchema: serializeSchema(feature.inputSchema),
      outputSchema: feature.outputSchema ? serializeSchema(feature.outputSchema) : undefined,
      annotations: feature.annotations,
      policy: feature.policy,
    };
  }
  if (feature.kind === McpFeatureKind.RESOURCE) return { ...common, uri: feature.uri };
  if (feature.kind === McpFeatureKind.RESOURCE_TEMPLATE) return { ...common, uriTemplate: feature.uriTemplate };
  return { ...common, inputSchema: serializeSchema(feature.argsSchema) };
}

/** Validates plugins, detects collisions, and exposes compiled features and manifests. */
export class McpRegistry<TContext> {
  private readonly compiled: CompiledFeature<TContext>[];

  /**
   * Compiles and validates an immutable plugin collection.
   * @param plugins - Plugins to validate and register.
   */
  constructor(readonly plugins: readonly PluginDefinition<TContext>[]) {
    const state: CompilationState = { pluginNames: new Set(), featureNames: new Map() };
    const compiled = plugins.flatMap(
      /** Maps each item and flattens the resulting collections. */ (plugin) => compilePlugin(plugin, state)
    );
    this.compiled = Object.freeze(compiled) as unknown as CompiledFeature<TContext>[];
  }

  /**
   * Lists compiled features in deterministic plugin declaration order.
   * @returns The immutable compiled feature collection.
   */
  list(): readonly CompiledFeature<TContext>[] {
    return this.compiled;
  }

  /**
   * Serializes registered definitions into a deterministic manifest.
   * @param identity - Public server name and version.
   * @returns The server, plugin, feature, schema, annotation, and policy metadata.
   */
  manifest(identity: { name: string; version: string }): McpManifest {
    return {
      server: { ...identity },
      plugins: this.plugins.map(
        /** Maps each item to its transformed value. */ ({ name, version, description }) => ({
          name,
          version,
          description,
        })
      ),
      features: this.compiled.map(manifestFeature),
    };
  }
}
