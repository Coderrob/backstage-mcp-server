import { pathToFileURL } from 'url';

import { ITool, IToolFactory } from '../../types/tools.js';
import { isFunction } from '../core/guards.js';
import { logger } from '../core/logger.js';

/**
 * Default implementation of IToolFactory that loads tools from file paths.
 * Dynamically imports tool modules and extracts the tool class.
 */
export class DefaultToolFactory implements IToolFactory {
  /**
   * Loads a tool from the specified file path.
   * Converts TypeScript paths to JavaScript and dynamically imports the module.
   * @param filePath - The file path to load the tool from (supports .ts and .js extensions)
   * @returns Promise resolving to the loaded tool class, or undefined if loading fails
   */
  async loadTool(filePath: string): Promise<ITool | undefined> {
    try {
      logger.debug(`Loading tool module from ${filePath}`);
      const modulePath = filePath.replace(/\.ts$/, '.js');
      const module = await import(pathToFileURL(modulePath).href);
      const toolClass = Object.values(module).find(isFunction) as unknown as ITool;
      if (toolClass != null) {
        logger.debug(`Successfully loaded tool class from ${filePath}`);
      } else {
        logger.warn(`No function found in module ${filePath}`);
      }
      return toolClass;
    } catch (error) {
      logger.error(`Failed to load tool from ${filePath}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }
}
