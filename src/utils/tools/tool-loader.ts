import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

import { IToolFactory, IToolMetadata, IToolMetadataProvider, IToolRegistrar, IToolValidator } from '../../types';
import { logger } from '../core';

interface ToolManifestEntry {
  name: string;
  description: string;
  params: string[];
}

export class ToolLoader {
  protected readonly manifest: ToolManifestEntry[] = [];

  constructor(
    private readonly directory: string,
    private readonly factory: IToolFactory,
    private readonly registrar: IToolRegistrar,
    private readonly validator: IToolValidator,
    private readonly metadataProvider: IToolMetadataProvider
  ) {}

  async registerAll(): Promise<void> {
    logger.debug('Starting tool registration process');

    const files = await this.findToolFiles();
    logger.info(`Found ${files.length} tool files to process`);

    for (const file of files) {
      const toolPath = join(this.directory, file);
      logger.debug(`Loading tool from ${toolPath}`);

      const toolClass = await this.factory.loadTool(toolPath);
      if (toolClass === undefined || toolClass === null) {
        this.warnInvalid(file);
        continue;
      }

      const metadata = this.metadataProvider.getMetadata(toolClass);
      if (metadata === undefined || metadata === null) {
        this.warnInvalid(file);
        continue;
      }

      this.validator.validate(metadata, file);
      this.registrar.register(toolClass, metadata);
      this.addToManifest(metadata);
      logger.debug(`Successfully registered tool: ${metadata.name}`);
    }

    logger.info(`Tool registration completed. Registered ${this.manifest.length} tools`);
  }

  async exportManifest(filePath: string): Promise<void> {
    logger.debug(`Exporting tools manifest to ${filePath}`);
    await writeFile(filePath, JSON.stringify(this.manifest, null, 2), 'utf-8');
    logger.info(`Tools manifest exported to ${filePath} with ${this.manifest.length} tools`);
  }

  protected async findToolFiles(): Promise<string[]> {
    const files = await readdir(this.directory);
    return files.filter((file) => file.endsWith('.tool.ts') || file.endsWith('.tool.js'));
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
