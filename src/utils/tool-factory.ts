import { ToolConstructor, ToolFactory } from '../types';
import { isFunction } from '../utils/guards';

export class DefaultToolFactory implements ToolFactory {
  async loadTool(filePath: string): Promise<ToolConstructor | undefined> {
    try {
      const module = await import(filePath);
      return (module.default ??
        Object.values(module).find(isFunction)) as ToolConstructor;
    } catch (error) {
      console.error(`Failed to load tool from ${filePath}`, error);
      return undefined;
    }
  }
}
