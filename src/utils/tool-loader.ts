import { join } from 'path';
import { readdir, writeFile } from 'fs/promises';

import {
  ToolFactory,
  ToolMetadata,
  ToolMetadataProvider,
  ToolRegistrar,
  ToolValidator,
} from '../types';

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
    const files = await this.findToolFiles();
    for (const file of files) {
      const toolPath = join(this.directory, file);
      const toolClass = await this.factory.loadTool(toolPath);
      if (!toolClass) {
        this.warnInvalid(file);
        continue;
      }

      const metadata = this.metadataProvider.getMetadata(toolClass);
      if (!metadata) {
        this.warnInvalid(file);
        continue;
      }

      this.validator.validate(metadata, file);
      this.registrar.register(toolClass, metadata);
      this.addToManifest(metadata);
    }
  }

  async exportManifest(filePath: string): Promise<void> {
    await writeFile(filePath, JSON.stringify(this.manifest, null, 2), 'utf-8');
  }

  private async findToolFiles(): Promise<string[]> {
    const files = await readdir(this.directory);
    return files.filter(
      (file) => file.endsWith('.tool.ts') || file.endsWith('.tool.js')
    );
  }

  private addToManifest({
    name,
    description,
    paramsSchema,
  }: ToolMetadata): void {
    const params = paramsSchema ? Object.keys(paramsSchema) : [];
    this.manifest.push({ name, description, params });
  }

  private warnInvalid(file: string): void {
    console.warn(`No valid tool class with @Tool decorator found in ${file}`);
  }
}
