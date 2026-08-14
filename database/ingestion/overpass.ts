/**
 * Thin Overpass API client: fetch one relation body, or resolve a batch of
 * node IDs to their coordinates/tags. Includes retry/backoff for transient
 * failures — the public Overpass endpoint intermittently returns an HTTP
 * 200 response with an HTML "server too busy" body rather than a clean
 * error status, so that shape is treated as a retryable failure too.
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const MAX_ATTEMPTS = 4;
const INITIAL_BACKOFF_MS = 2000;
// The Overpass QL query has its own [timeout:60] for server-side execution,
// but that does not bound our HTTP connection — a stalled/slow connection
// on our end can hang the global fetch() indefinitely otherwise. This is
// the client-side ceiling per attempt.
const REQUEST_TIMEOUT_MS = 30000;
// Overpass's usage guidelines ask API consumers to identify themselves;
// requests without a descriptive User-Agent were observed returning HTTP
// 406 from this endpoint even though the query itself was valid (verified:
// the exact same query succeeds with this header and fails without it).
const USER_AGENT =
  'Vahak-PMPML-OSM-Ingestion/1.0 (pilot data ingestion; see database/ingestion/README.md)';

export interface OverpassMember {
  type: 'node' | 'way' | 'relation';
  ref: number;
  role: string;
}

export interface OverpassRelation {
  type: 'relation';
  id: number;
  tags: Record<string, string>;
  members: OverpassMember[];
}

export interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryOverpass(query: string): Promise<{ elements: unknown[] }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain', 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Overpass HTTP ${response.status}`);
      }
      // A busy/erroring Overpass instance responds 200 OK with an HTML body
      // instead of JSON — detect and treat that as a retryable failure too.
      if (text.trim().startsWith('<')) {
        throw new Error(`Overpass returned a non-JSON response: ${text.slice(0, 200)}`);
      }

      return JSON.parse(text) as { elements: unknown[] };
    } catch (err) {
      lastError =
        err instanceof Error && err.name === 'AbortError'
          ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`)
          : err;
      if (attempt < MAX_ATTEMPTS) {
        const delayMs = INITIAL_BACKOFF_MS * 2 ** (attempt - 1);
        await sleep(delayMs);
      }
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
  throw new Error(
    `Overpass query failed after ${MAX_ATTEMPTS} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

/** Fetches a single relation (tags + members). Returns null if it no longer exists upstream. */
export async function fetchRelation(relationId: string): Promise<OverpassRelation | null> {
  const query = `[out:json][timeout:60];relation(${relationId});out body;`;
  const result = await queryOverpass(query);
  const relation = result.elements.find(
    (e): e is OverpassRelation => (e as { type?: string }).type === 'relation',
  );
  return relation ?? null;
}

/** Resolves a batch of node IDs (expected to belong to ONE relation) to their coordinates/tags. */
export async function fetchNodes(nodeIds: string[]): Promise<Map<string, OverpassNode>> {
  const map = new Map<string, OverpassNode>();
  if (nodeIds.length === 0) return map;

  const query = `[out:json][timeout:60];node(id:${nodeIds.join(',')});out body;`;
  const result = await queryOverpass(query);
  for (const el of result.elements) {
    const node = el as OverpassNode;
    if (node.type === 'node') {
      map.set(String(node.id), node);
    }
  }
  return map;
}

/** A small pause between successive relation fetches — the public endpoint is rate-sensitive. */
export async function politeDelay(): Promise<void> {
  await sleep(1500);
}
