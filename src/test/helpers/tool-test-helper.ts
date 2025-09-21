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
import { afterEach, expect, jest } from '@jest/globals';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { ApiStatus, IBackstageCatalogApi } from '../../shared/types/apis.js';
import { IToolRegistrationContext } from '../../shared/types/tools.js';

/**
 * Base test setup for catalog tools
 */
export class ToolTestHelper {
  static createMockCatalogClient(): jest.Mocked<IBackstageCatalogApi> {
    return {
      addLocation: jest.fn(),
      getEntities: jest.fn(),
      getEntityByRef: jest.fn(),
      getEntityAncestors: jest.fn(),
      getEntityFacets: jest.fn(),
      getLocationByEntity: jest.fn(),
      getLocationByRef: jest.fn(),
      refreshEntity: jest.fn(),
      removeEntityByUid: jest.fn(),
      removeLocationById: jest.fn(),
      validateEntity: jest.fn(),
    } as unknown as jest.Mocked<IBackstageCatalogApi>;
  }

  static createMockContext(catalogClient: jest.Mocked<IBackstageCatalogApi>): IToolRegistrationContext {
    return {
      catalogClient,
    } as unknown as jest.Mocked<IToolRegistrationContext>;
  }

  static expectSuccessResponse(result: CallToolResult, expectedData: unknown): void {
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const responseData = JSON.parse(result.content[0].text as string);
    expect(responseData.status).toBe(ApiStatus.SUCCESS);
    expect(responseData.data).toEqual(expectedData);
  }

  static expectErrorResponse(result: CallToolResult, expectedMessage: string, expectedCode = 'INTERNAL_ERROR'): void {
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const errorData = JSON.parse(result.content[0].text as string);
    expect(errorData.status).toBe(ApiStatus.ERROR);
    expect(errorData.data.message).toBe(expectedMessage);
    expect(errorData.data.code).toBe(expectedCode);
  }

  static setupTestEnvironment(): void {
    afterEach(() => {
      jest.clearAllMocks();
    });
  }
}
