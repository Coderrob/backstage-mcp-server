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

import { describe, expect, it } from 'vitest';

import { McpErrorCode, McpNotFoundError } from './errors.js';
import { errorResult, jsonResult, mapToolError, textResult } from './results.js';

const TEXT_CONTENT_TYPE = 'text';

describe('MCP results', () => {
  it('should create text, structured JSON, and optional-detail error results', () => {
    expect(textResult('ready')).toEqual({ content: [{ type: TEXT_CONTENT_TYPE, text: 'ready' }] });
    expect(jsonResult({ count: 2n })).toMatchObject({ structuredContent: { count: 2n } });
    const content = jsonResult({ count: 2n }).content[0];
    expect(content.type).toBe(TEXT_CONTENT_TYPE);
    if (content.type === TEXT_CONTENT_TYPE) expect(content.text).toContain('"2"');
    expect(errorResult(McpErrorCode.CONFLICT, 'exists')).not.toHaveProperty('structuredContent.error.details');
  });

  it('should map known and unexpected failures safely', () => {
    expect(mapToolError(new McpNotFoundError('Entity', 'missing'), 'request-one')).toMatchObject({
      isError: true,
      structuredContent: { error: { code: McpErrorCode.NOT_FOUND, details: { reference: 'missing' } } },
    });
    expect(mapToolError(new Error('private'), 'request-two')).toMatchObject({
      isError: true,
      structuredContent: { error: { code: McpErrorCode.INTERNAL_ERROR, details: { requestId: 'request-two' } } },
    });
  });
});
