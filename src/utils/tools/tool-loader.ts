import { writeFile } from 'fs/promises';
import { z } from 'zod';

import * as allTools from '../../tools/index.js';
import {
  IToolFactory,
  IToolMetadata,
  IToolMetadataProvider,
  IToolRegistrar,
  IToolValidator,
  ToolClass,
} from '../../types/tools.js';
import { isDefined, isFunction, isNullOrUndefined } from '../core/guards.js';
import { logger } from '../core/logger.js';

/**
 * Entry in the tool manifest for documentation purposes.
 */
interface ToolManifestEntry {
  name: string;
  description: string;
  params: string[];
}

/**
 * Loads and registers all available tools with the MCP server.
 * Handles tool discovery, validation, registration, and manifest generation.
 */
export class ToolLoader {
  protected readonly manifest: ToolManifestEntry[] = [];

  constructor(
    private readonly factory: IToolFactory,
    private readonly registrar: IToolRegistrar,
    private readonly validator: IToolValidator,
    private readonly metadataProvider: IToolMetadataProvider
  ) {}

  /**
   * Registers all available tools by discovering tool classes and processing them.
   * Validates each tool's metadata before registration and maintains a manifest.
   * @returns Promise that resolves when all tools are registered
   */
  async registerAll(): Promise<void> {
    logger.debug('Starting tool registration process');

    const toolClasses = Object.values(allTools).filter(
      // add a guard on is a execute function
      (tool) => isFunction(tool) && tool.prototype !== undefined && 'execute' in tool
    ) as ToolClass[];

    logger.info(`Found ${toolClasses.length} tool classes to process`);

    for (const toolClass of toolClasses) {
      logger.debug(`Registering tool class ${toolClass.name}`);

      const metadata = this.metadataProvider.getMetadata(toolClass);
      if (isNullOrUndefined(metadata)) {
        logger.warn(`Invalid tool metadata for ${toolClass.name}`);
        continue;
      }

      try {
        this.validator.validate(metadata, '');
      } catch (error) {
        logger.warn(`Tool validation failed for ${toolClass.name}: ${error}`);
        continue;
      }

      this.registrar.register(toolClass, metadata);
      this.addToManifest(metadata);

      logger.debug(`Successfully registered tool ${metadata.name}`);
    }

    logger.info(`Registered ${this.manifest.length} tools successfully`);
  }

  /**
   * Exports the tool manifest to a JSON file for documentation purposes.
   * @param filePath - Path where the manifest should be written
   * @returns Promise that resolves when manifest is written
   */
  async exportManifest(filePath: string): Promise<void> {
    logger.debug(`Exporting tools manifest to ${filePath}`);
    await writeFile(filePath, JSON.stringify(this.manifest, null, 2), 'utf-8');
    logger.info(`Tools manifest exported to ${filePath} with ${this.manifest.length} tools`);
  }

  /**
   * Adds a tool to the internal manifest for tracking.
   * @param metadata - Tool metadata to add to manifest
   * @protected
   */
  protected addToManifest({ name, description, paramsSchema }: IToolMetadata): void {
    const params =
      isDefined(paramsSchema) && paramsSchema instanceof z.ZodObject ? Object.keys(paramsSchema.shape) : [];
    this.manifest.push({ name, description, params });
  }

  /**
   * Logs a warning for invalid tool files.
   * @param file - File path that contains invalid tool
   * @private
   */
  private warnInvalid(file: string): void {
    logger.warn(`No valid tool class with @Tool decorator found in ${file}`);
  }
}
