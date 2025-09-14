import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { ToolFactory, ToolMetadata, ToolMetadataProvider, ToolRegistrar, ToolValidator } from '../types';
import { logger } from '../utils';

interface ToolManifestEntry {
  name: string;
  description: string;
  params: string[];
}

export class ToolLoader {
  private readonly manifest: ToolManifestEntry[] = [];

  constructor(
    private readonly directory: string,
    private readonly factory: ToolFactory,
    private readonly registrar: ToolRegistrar,
    private readonly validator: ToolValidator,
    private readonly metadataProvider: ToolMetadataProvider
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

  private addToManifest({ name, description, paramsSchema }: ToolMetadata): void {
    const params =
      paramsSchema !== undefined &&
      paramsSchema !== null &&
      typeof paramsSchema === 'object' &&
      !Array.isArray(paramsSchema)
        ? Object.keys(paramsSchema as unknown as Record<string, unknown>)
        : [];
    this.manifest.push({ name, description, params });
  }

  private warnInvalid(file: string): void {
    logger.warn(`No valid tool class with @Tool decorator found in ${file}`);
  }
}
