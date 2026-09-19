import { connectTestClient, McpErrorCode, noopLogger } from '@coderrob/mcp-kernel';
import { describe, expect, it, vi } from 'vitest';

import { createBackstageServer } from '../../server.js';
import { AuthType } from '../../shared/constants/backstage-catalog.js';
import { BackstageCatalogApi } from '../api/backstage-catalog-api.js';
import { getOrphanedEntitiesTool } from './get_orphaned_entities.tool.js';

const INPUT = {};

describe('get_orphaned_entities tool', () => {
  it('should expose a valid read-only contract and send a filtered Catalog request', async () => {
    expect(getOrphanedEntitiesTool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    expect(getOrphanedEntitiesTool.inputSchema.safeParse(INPUT).success).toBe(true);
    expect(getOrphanedEntitiesTool.inputSchema.safeParse({ unexpected: true }).success).toBe(true);
    const fetcher = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], totalItems: 0, pageInfo: {} })));
    const catalogClient = new BackstageCatalogApi({
      baseUrl: 'http://localhost:7007',
      auth: { type: AuthType.BEARER, token: 'test-token' },
      fetch: fetcher,
    });
    const connection = await connectTestClient(createBackstageServer({ catalogClient, logger: noopLogger }));
    try {
      const result = await connection.client.callTool({ name: 'get_orphaned_entities', arguments: INPUT });
      expect(result).toMatchObject({ structuredContent: { status: 'success', data: [] } });
      expect(fetcher).toHaveBeenCalledOnce();
      const request = fetcher.mock.calls[0]?.[0];
      expect(request).toBeInstanceOf(Request);
      if (request instanceof Request) {
        expect(request.url).toContain('/api/catalog/entities/by-query');
        expect(decodeURIComponent(request.url)).toContain('metadata.annotations.backstage.io/orphan=true');
        expect(request.headers.get('authorization')).toBe('Bearer test-token');
      }
    } finally {
      await connection.close();
    }
  });
  it('should map Catalog rejection to a typed MCP error', async () => {
    const fetcher = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response('{}', { status: 403 }));
    const catalogClient = new BackstageCatalogApi({
      baseUrl: 'http://localhost:7007',
      auth: { type: AuthType.BEARER, token: 'test-token' },
      fetch: fetcher,
    });
    const connection = await connectTestClient(createBackstageServer({ catalogClient, logger: noopLogger }));
    try {
      expect(await connection.client.callTool({ name: 'get_orphaned_entities', arguments: INPUT })).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.INSUFFICIENT_PERMISSIONS } },
      });
    } finally {
      await connection.close();
    }
  });
});
