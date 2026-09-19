import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { validateArticle } from './check-knowledge.mjs';

const root = new URL('../docs/knowledge/', import.meta.url);
const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'));
const contract = JSON.parse(await readFile(new URL('metadata-schema.json', root), 'utf8'));
const article = await readFile(new URL('filters.md', root), 'utf8');

test('should accept curated metadata with resolvable citations', () => {
  assert.equal(validateArticle(article, sources, contract).id, 'backstage.filters');
});

test('should reject unknown classification codes and source drift', () => {
  assert.throws(() => validateArticle(article.replaceAll('BKC.400', 'BKC.999'), sources, contract));
  const changed = { ...sources, api: { ...sources.api, title: 'Changed source' } };
  assert.throws(() => validateArticle(article, changed, contract));
});

test('should reject dangling citations and inconsistent semantic metadata', () => {
  assert.throws(() => validateArticle(article.replace('[^api]:', '[^missing]:'), sources, contract));
  assert.throws(() =>
    validateArticle(article.replace('"headline": "Filters', '"headline": "Wrong'), sources, contract)
  );
  assert.throws(() =>
    validateArticle(article.replace('"reviewed": "2026-09-19"', '"reviewed": "2026-02-31"'), sources, contract)
  );
});
