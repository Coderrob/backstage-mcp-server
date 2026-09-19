import { connectTestClient, McpErrorCode, noopLogger } from '@coderrob/mcp-kernel';
import { describe, expect, it, vi } from 'vitest';

import { createBackstageServer } from '../../server.js';
import { AuthType } from '../../shared/constants/backstage-catalog.js';
import { BackstageCatalogApi } from '../api/backstage-catalog-api.js';
import { getSystemsByDomainTool } from './get_systems_by_domain.tool.js';

const INPUT = { domainRef: 'domain:default/smoke' };

describe('get_systems_by_domain tool', () => {
  it('should expose a valid read-only contract and send a filtered Catalog request', async () => {
    expect(getSystemsByDomainTool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    expect(getSystemsByDomainTool.inputSchema.safeParse(INPUT).success).toBe(true);
    expect(getSystemsByDomainTool.inputSchema.safeParse({ unexpected: true }).success).toBe(false);
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
      const result = await connection.client.callTool({ name: 'get_systems_by_domain', arguments: INPUT });
      expect(result).toMatchObject({ structuredContent: { status: 'success', data: [] } });
      expect(fetcher).toHaveBeenCalledOnce();
      const request = fetcher.mock.calls[0]?.[0];
      expect(request).toBeInstanceOf(Request);
      if (request instanceof Request) {
        expect(request.url).toContain('/api/catalog/entities/by-query');
        expect(decodeURIComponent(request.url)).toContain('relations.partOf=domain:default/smoke');
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
      expect(await connection.client.callTool({ name: 'get_systems_by_domain', arguments: INPUT })).toMatchObject({
        isError: true,
        structuredContent: { error: { code: McpErrorCode.INSUFFICIENT_PERMISSIONS } },
      });
    } finally {
      await connection.close();
    }
  });
});
