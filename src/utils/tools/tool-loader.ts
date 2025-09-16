import { writeFile } from 'fs/promises';
import { z } from 'zod';

import * as allTools from '../../tools/index.js';
import { IToolFactory, IToolMetadata, IToolMetadataProvider, IToolRegistrar, IToolValidator, ToolClass } from '../../types/tools.js';
import { logger } from '../core/logger.js';

interface ToolManifestEntry {
  name: string;
  description: string;
  params: string[];
}

export class ToolLoader {
  protected readonly manifest: ToolManifestEntry[] = [];

  constructor(
    private readonly factory: IToolFactory,
    private readonly registrar: IToolRegistrar,
    private readonly validator: IToolValidator,
    private readonly metadataProvider: IToolMetadataProvider
  ) {}

  async registerAll(): Promise<void> {
    logger.debug('Starting tool registration process');

    // Get all tool classes from the static imports
    const toolClasses = Object.values(allTools).filter(
      (tool) => typeof tool === 'function' && tool.prototype !== undefined && 'execute' in tool
    ) as ToolClass[];

    logger.info(`Found ${toolClasses.length} tool classes to process`);

    for (const toolClass of toolClasses) {
      logger.debug(`Registering tool class ${toolClass.name}`);

      const metadata = this.metadataProvider.getMetadata(toolClass);
      if (metadata === undefined || metadata === null) {
        logger.warn(`Invalid tool metadata for ${toolClass.name}`);
        continue;
      }

      // Validate metadata (pass empty string since we don't have a file path)
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

  async exportManifest(filePath: string): Promise<void> {
    logger.debug(`Exporting tools manifest to ${filePath}`);
    await writeFile(filePath, JSON.stringify(this.manifest, null, 2), 'utf-8');
    logger.info(`Tools manifest exported to ${filePath} with ${this.manifest.length} tools`);
  }

  protected addToManifest({ name, description, paramsSchema }: IToolMetadata): void {
    const params =
      paramsSchema !== undefined && paramsSchema !== null && paramsSchema instanceof z.ZodObject
        ? Object.keys(paramsSchema.shape)
        : [];
    this.manifest.push({ name, description, params });
  }

  private warnInvalid(file: string): void {
    logger.warn(`No valid tool class with @Tool decorator found in ${file}`);
  }
}
