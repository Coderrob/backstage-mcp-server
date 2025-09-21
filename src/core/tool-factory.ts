/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { z } from 'zod';

import { ToolName } from '../shared/types/constants.js';
import { AuthenticationMiddleware } from './middleware/authentication.middleware.js';
import { AuthorizationMiddleware } from './middleware/authorization.middleware.js';
import { LoggingMiddleware } from './middleware/logging.middleware.js';
import { RateLimitingMiddleware } from './middleware/rate-limiting.middleware.js';
import { ValidationMiddleware } from './middleware/validation.middleware.js';
import { ToolBuilder, ToolFactory as BaseToolFactory } from './tool-builder.js';
import { IEnhancedTool, ITool } from './types.js';

/**
 * Enhanced tool factory with pre-configured middleware and common patterns
 * Implements the Factory pattern with domain-specific configurations
 */
export class CatalogToolFactory {
  /**
   * Create a standard catalog read tool with common middleware
   */
  static createCatalogReadTool(): ToolBuilder {
    return BaseToolFactory.createReadTool()
      .category('catalog-read')
      .use(new LoggingMiddleware())
      .use(new ValidationMiddleware())
      .use(new RateLimitingMiddleware(200, 60 * 1000)); // Higher limit for read operations
  }

  /**
   * Create a standard catalog write tool with security middleware
   */
  static createCatalogWriteTool(): ToolBuilder {
    return BaseToolFactory.createWriteTool()
      .category('catalog-write')
      .use(new LoggingMiddleware())
      .use(new AuthenticationMiddleware())
      .use(new ValidationMiddleware())
      .use(new RateLimitingMiddleware(50, 60 * 1000)); // Lower limit for write operations
  }

  /**
   * Create a batch catalog tool with appropriate configurations
   */
  static createCatalogBatchTool(maxBatchSize = 25): ToolBuilder {
    return BaseToolFactory.createBatchTool(maxBatchSize)
      .category('catalog-batch')
      .use(new LoggingMiddleware())
      .use(new AuthenticationMiddleware())
      .use(new ValidationMiddleware())
      .use(new RateLimitingMiddleware(10, 60 * 1000)); // Very restrictive for batch operations
  }

  /**
   * Create an admin catalog tool with full security stack
   */
  static createCatalogAdminTool(): ToolBuilder {
    return BaseToolFactory.createAdminTool()
      .category('catalog-admin')
      .use(new LoggingMiddleware())
      .use(new AuthenticationMiddleware())
      .use(new AuthorizationMiddleware(['admin', 'catalog:admin']))
      .use(new ValidationMiddleware())
      .use(new RateLimitingMiddleware(20, 60 * 1000));
  }

  /**
   * Create a basic tool builder
   */
  static create(): ToolBuilder {
    return BaseToolFactory.create();
  }
}

/**
 * Convenience functions for quick tool creation with standard patterns
 */
export class QuickToolFactory {
  /**
   * Create a simple read tool with minimal configuration
   */
  static createSimpleReadTool<TSchema extends z.ZodSchema<unknown>>(
    name: ToolName,
    description: string,
    schema: TSchema,
    toolClass: new () => ITool
  ): IEnhancedTool {
    return CatalogToolFactory.createCatalogReadTool()
      .name(name)
      .description(description)
      .schema(schema)
      .withClass(toolClass)
      .build();
  }

  /**
   * Create a simple write tool with standard security
   */
  static createSimpleWriteTool<TSchema extends z.ZodSchema<unknown>>(
    name: ToolName,
    description: string,
    schema: TSchema,
    toolClass: new () => ITool
  ): IEnhancedTool {
    return CatalogToolFactory.createCatalogWriteTool()
      .name(name)
      .description(description)
      .schema(schema)
      .withClass(toolClass)
      .build();
  }

  /**
   * Create a simple batch tool with standard configurations
   */
  static createSimpleBatchTool<TSchema extends z.ZodSchema<unknown>>(
    name: ToolName,
    description: string,
    schema: TSchema,
    toolClass: new () => ITool,
    maxBatchSize = 25
  ): IEnhancedTool {
    return CatalogToolFactory.createCatalogBatchTool(maxBatchSize)
      .name(name)
      .description(description)
      .schema(schema)
      .withClass(toolClass)
      .build();
  }
}

/**
 * Tool metadata helpers for consistent tool configuration
 */
export class ToolMetadataHelper {
  /**
   * Generate standard tags based on tool type and operations
   */
  static generateTags(category: string, operations: string[]): string[] {
    const baseTags = [category];
    const operationTags = operations.map((op) => `${category}:${op}`);
    return [...baseTags, ...operationTags];
  }

  /**
   * Create semantic version string
   */
  static createVersion(major: number, minor: number, patch: number): string {
    return `${major}.${minor}.${patch}`;
  }

  /**
   * Validate tool name follows naming conventions
   */
  static validateToolName(name: string): boolean {
    // Tool names should be snake_case and descriptive
    const namePattern = /^[a-z][a-z0-9_]*[a-z0-9]$/;
    return namePattern.test(name) && name.length >= 3 && name.length <= 50;
  }

  /**
   * Generate tool description with consistent format
   */
  static formatDescription(action: string, target: string, details?: string): string {
    const baseDescription = `${action} ${target}`;
    return details ? `${baseDescription}. ${details}` : baseDescription;
  }
}
