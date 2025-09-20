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
import { GetEntitiesByRefsOperation } from '../utils/tools/catalog-operations.js';
import { ToolName } from '../utils/tools/common-imports.js';
import { ToolFactory } from '../utils/tools/generic-tool-factory.js';

/**
 * GetEntitiesByRefsTool - Generated using advanced patterns
 * Demonstrates: Factory Pattern, Generics, SOLID Principles, Strategy Pattern
 */
export const GetEntitiesByRefsTool = ToolFactory({
  name: ToolName.GET_ENTITIES_BY_REFS,
  description: 'Get multiple entities by their refs.',
  paramsSchema: GetEntitiesByRefsOperation.paramsSchema,
})(GetEntitiesByRefsOperation);
