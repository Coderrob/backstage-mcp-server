import { TOOL_METADATA_KEY } from '../decorators/tool.decorator';
import { IToolRegistrationContext, ToolMetadata } from '../types';
import { isFunction } from './guards';
import { join } from 'path';
import { readdir, writeFile } from 'fs/promises';
import { validateToolMetadata } from './validate-tool-metadata';
import { toZodRawShape } from './mapping';

interface ToolManifestEntry {
  name: string;
  description: string;
  params: string[];
}

export class ToolLoader {
  private readonly manifest: ToolManifestEntry[] = [];

  constructor(
    private readonly directory: string,
    private readonly context: IToolRegistrationContext
  ) {}

  async registerAllTools(): Promise<void> {
    const toolFiles = await this.findToolFiles();

    for (const file of toolFiles) {
      const loadedClass = await this.loadToolClass(join(this.directory, file));

      if (!loadedClass) {
        this.logInvalidTool(file);
        continue;
      }

      const metadata = Reflect.getMetadata(
        TOOL_METADATA_KEY,
        loadedClass
      ) as ToolMetadata;
      if (!metadata) {
        this.logInvalidTool(file);
        continue;
      }

      validateToolMetadata(metadata, file);

      this.registerTool(loadedClass, metadata);
      this.addToManifest(metadata);
    }
  }

  private addToManifest({
    name,
    paramsSchema,
    description,
  }: ToolMetadata): void {
    const params = paramsSchema ? Object.keys(paramsSchema) : [];
    this.manifest.push({ name, description, params });
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

  private async loadToolClass(filePath: string): Promise<any> {
    try {
      const module = await import(filePath);
      const loadedClass =
        module.default ?? Object.values(module).find(isFunction);
      return loadedClass;
    } catch (error) {
      console.error(`Failed to load tool from ${filePath}`, error);
      return undefined;
    }
  }

  private registerTool(
    loadedClass: any,
    { name, description, paramsSchema }: ToolMetadata
  ) {
    this.context.server.tool(
      name,
      description,
      toZodRawShape(paramsSchema),
      async (args, extra) => {
        return loadedClass.execute(args, { ...this.context, extra });
      }
    );
  }

  private logInvalidTool(file: string): void {
    console.warn(`No valid tool class with @Tool decorator found in ${file}`);
  }
}
