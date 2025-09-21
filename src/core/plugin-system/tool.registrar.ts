import { IEnhancedTool, IToolMetadata, IToolRegistrar } from '../types.js';

/**
 * Tool registrar implementation for managing tool registration
 * Implements the Registry pattern for centralized tool management
 */

export class ToolRegistrar implements IToolRegistrar {
  private tools = new Map<string, { tool: IEnhancedTool; metadata: IToolMetadata }>();

  /**
   * Register a tool with its metadata
   */
  registerTool(tool: IEnhancedTool, metadata: IToolMetadata): void {
    if (this.tools.has(metadata.name)) {
      throw new Error(`Tool '${metadata.name}' is already registered`);
    }

    this.tools.set(metadata.name, { tool, metadata });
  }

  /**
   * Get all registered tools
   */
  getRegisteredTools(): Array<{ tool: IEnhancedTool; metadata: IToolMetadata }> {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): { tool: IEnhancedTool; metadata: IToolMetadata } | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool is registered
   */
  hasToolDefined(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Array<{ tool: IEnhancedTool; metadata: IToolMetadata }> {
    return Array.from(this.tools.values()).filter(({ metadata }) => metadata.category === category);
  }

  /**
   * Get tools by tag
   */
  getToolsByTag(tag: string): Array<{ tool: IEnhancedTool; metadata: IToolMetadata }> {
    return Array.from(this.tools.values()).filter(({ metadata }) => metadata.tags?.includes(tag));
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
  }
}
