import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { z } from 'zod';

const ROOT = resolve(import.meta.dirname, '..');
const KNOWLEDGE = resolve(ROOT, 'docs/knowledge');
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FOOTNOTE = /\[\^([a-z-]+)\]/g;
const DEFINITION = /^\[\^([a-z-]+)\]:/gm;
const INDEX_NAME = 'README.md';
const LINK = /\]\(([^)]+)\)/g;

/**
 * Reads a JSON document without depending on the temporary source snapshot.
 * @param file The document or metadata value to validate.
 * @returns The parsed and validated value.
 */
async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

const semanticContract = z
  .object({
    '@context': z.literal('https://schema.org'),
    '@type': z.literal('TechArticle'),
    identifier: z.string().startsWith('urn:backstage-mcp:knowledge:'),
    headline: z.string().min(1),
    inLanguage: z.literal('en'),
    dateModified: z.string().regex(DATE),
    about: z
      .array(
        z.object({
          '@type': z.literal('DefinedTerm'),
          termCode: z.string(),
          name: z.string(),
          inDefinedTermSet: z.literal('urn:backstage-mcp:classification:BKC'),
        })
      )
      .length(1),
    citation: z.array(z.object({ '@type': z.literal('CreativeWork'), name: z.string(), url: z.string().url() })).min(1),
  })
  .strict();

/**
 * Builds the supported frontmatter contract from the controlled vocabulary.
 * @param contract The document or metadata value to validate.
 * @returns The parsed and validated value.
 */
function metadataContract(contract) {
  return z
    .object({
      id: z.string().regex(/^backstage\.[a-z-]+$/),
      title: z.string().min(1),
      classification: z
        .object({ scheme: z.literal('BKC'), code: z.enum(contract.properties.classification.properties.code.enum) })
        .strict(),
      categories: z.array(z.enum(contract.properties.categories.items.enum)).min(1),
      status: z.enum(['curated', 'needs-review']),
      reviewed: z.string().regex(DATE),
      sources: z.array(z.enum(contract.properties.sources.items.enum)).min(1),
      schema: semanticContract,
    })
    .strict();
}

/**
 * Requires unique entries rather than silently accepting repeated metadata.
 * @param values The document or metadata value to validate.
 */
function assertUnique(values) {
  assert.equal(new Set(values).size, values.length, 'Duplicate metadata values');
}

/**
 * Checks internal consistency of the article's standalone JSON-LD.
 * @param metadata The document or metadata value to validate.
 */
function validateSemantics(metadata) {
  assert.equal(metadata.schema.headline, metadata.title);
  assert.equal(metadata.schema.identifier, 'urn:backstage-mcp:knowledge:' + metadata.id.slice('backstage.'.length));
  assert.equal(metadata.schema.dateModified, metadata.reviewed);
  assert.equal(metadata.schema.about[0].termCode, metadata.classification.code);
  assert.equal(metadata.schema.about[0].name, metadata.title);
  assert.equal(new Date(metadata.reviewed).toISOString().slice(0, 10), metadata.reviewed);
  assertUnique(metadata.categories);
  assertUnique(metadata.sources);
}

/**
 * Verifies reusable footnotes and source-backed semantic citations.
 * @param body The document or metadata value to validate.
 * @param metadata The document or metadata value to validate.
 * @param sources The document or metadata value to validate.
 */
function validateCitations(body, metadata, sources) {
  const used = [
    ...new Set([...body.matchAll(FOOTNOTE)].map(/** Selects a citation key. */ (match) => match[1])),
  ].sort();
  const defined = [...body.matchAll(DEFINITION)].map(/** Selects a defined reference. */ (match) => match[1]).sort();
  assert.deepEqual(used, [...metadata.sources].sort(), 'Citation use differs from metadata');
  assert.deepEqual(defined, used, 'Missing or duplicate footnote definitions');
  const citations = metadata.sources.map(
    /** Resolves a semantic citation. */ (key) => ({
      '@type': 'CreativeWork',
      name: sources[key].title,
      url: sources[key].url,
    })
  );
  assert.deepEqual(metadata.schema.citation, citations, 'Semantic citations differ from source registry');
}

/**
 * Validates one article's frontmatter, semantics and named references.
 * @param text The document or metadata value to validate.
 * @param sources The document or metadata value to validate.
 * @param contract The document or metadata value to validate.
 * @returns The parsed and validated value.
 */
export function validateArticle(text, sources, contract) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  assert(match, 'Expected JSON-compatible YAML frontmatter');
  const metadata = metadataContract(contract).parse(JSON.parse(match[1]));
  validateSemantics(metadata);
  validateCitations(match[2], metadata, sources);
  return metadata;
}

/**
 * Checks one local Markdown target without fetching external websites.
 * @param file The document or metadata value to validate.
 * @param target The document or metadata value to validate.
 */
function validateTarget(file, target) {
  if (/^(?:https?:|#)/.test(target)) return;
  const path = target.split('#')[0];
  assert(existsSync(resolve(dirname(file), path)), `Broken local link in ${file}: ${target}`);
}

/**
 * Checks relative links used to connect skills and curated knowledge.
 * @param file The document or metadata value to validate.
 * @param text The document or metadata value to validate.
 */
function validateLinks(file, text) {
  for (const match of text.matchAll(LINK)) validateTarget(file, match[1]);
}

/**
 * Requires reproducible provenance without claiming an unknown upstream revision.
 * @param source The document or metadata value to validate.
 */
function validateSource(source) {
  z.object({
    title: z.string().min(1),
    publisher: z.string().min(1),
    url: z.string().url(),
    source_path: z.string().startsWith('scratch/docs/'),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    reviewed: z.string().regex(DATE),
    source_revision: z.string().min(1),
  })
    .strict()
    .parse(source);
}

/**
 * Optionally checks fingerprints when the reference-only snapshot is available.
 * @param sources The document or metadata value to validate.
 */
async function verifySnapshot(sources) {
  for (const source of Object.values(sources)) {
    const bytes = await readFile(resolve(ROOT, source.source_path));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      source.sha256,
      `Source drift: ${source.source_path}`
    );
  }
}

/**
 * Validates the repository skill subset and all its relative references.
 * @param name The document or metadata value to validate.
 */
async function validateSkill(name) {
  const file = resolve(ROOT, '.agents/skills', name, 'SKILL.md');
  const text = await readFile(file, 'utf8');
  assert.match(text, new RegExp(`^---\\r?\\nname: ${name}\\r?\\ndescription: .+\\r?\\n---`));
  assert(!/TODO|PLACEHOLDER/.test(text), `Unfinished skill: ${name}`);
  validateLinks(file, text);
}

/** Validates all curated articles, source records, navigation and repository skills. */
async function main() {
  const sources = await readJson(resolve(KNOWLEDGE, 'sources.json'));
  const contract = await readJson(resolve(KNOWLEDGE, 'metadata-schema.json'));
  Object.values(sources).forEach(validateSource);
  const names = (await readdir(KNOWLEDGE)).filter(
    /** Selects curated Markdown files. */ (name) => name.endsWith('.md')
  );
  const identifiers = [];
  for (const name of names) {
    const file = resolve(KNOWLEDGE, name);
    const text = await readFile(file, 'utf8');
    validateLinks(file, text);
    if (name !== INDEX_NAME) identifiers.push(validateArticle(text, sources, contract).id);
  }
  assertUnique(identifiers);
  await Promise.all(
    ['backstage-catalog-lookup', 'backstage-entity-maintenance', 'backstage-mcp-maintenance'].map(validateSkill)
  );
  await verifyRequestedSnapshot(sources);
  process.stdout.write(`Knowledge validation passed (${identifiers.length} articles, 3 skills)\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

/**
 * Checks source fingerprints only when explicitly requested.
 * @param sources - Source registry with content fingerprints.
 */
async function verifyRequestedSnapshot(sources) {
  if (process.argv.includes('--verify-snapshot')) await verifySnapshot(sources);
}
