import { connectTestClient, noopLogger } from '@coderrob/mcp-kernel';
import { describe, expect, it, vi } from 'vitest';

import { createBackstageServer } from '../../server.js';
import { AuthType } from '../../shared/constants/backstage-catalog.js';
import { BackstageCatalogApi } from '../api/backstage-catalog-api.js';
import { findUsersByNameTool } from './find_users_by_name.tool.js';

describe('find_users_by_name tool', () => {
  it('should expose a read-only contract and execute through the official client', async () => {
    expect(findUsersByNameTool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    expect(findUsersByNameTool.inputSchema.safeParse({ name: { firstName: 'Jane' } }).success).toBe(true);
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
      const result = await connection.client.callTool({
        name: 'find_users_by_name',
        arguments: { name: { firstName: 'Jane' } },
      });
      expect(result).toMatchObject({ structuredContent: { status: 'success', data: [] } });
      expect(fetcher).toHaveBeenCalledOnce();
    } finally {
      await connection.close();
    }
  });
  it('should map upstream failure through the MCP error envelope', async () => {
    const fetcher = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response('{}', { status: 403 }));
    const catalogClient = new BackstageCatalogApi({
      baseUrl: 'http://localhost:7007',
      auth: { type: AuthType.BEARER, token: 'test-token' },
      fetch: fetcher,
    });
    const connection = await connectTestClient(createBackstageServer({ catalogClient, logger: noopLogger }));
    try {
      expect(
        await connection.client.callTool({ name: 'find_users_by_name', arguments: { name: { firstName: 'Jane' } } })
      ).toMatchObject({ isError: true });
    } finally {
      await connection.close();
    }
  });
});
