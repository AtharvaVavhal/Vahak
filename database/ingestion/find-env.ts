import fs from 'node:fs';
import path from 'node:path';

/**
 * Walks up from startDir to find the repo root (the directory whose
 * package.json declares "workspaces") and returns the path to the `.env`
 * file there. Using a fixed relative `../../` offset breaks depending on
 * whether these scripts run via ts-node directly (database/ingestion/) or
 * from a compiled dist copy (dist/database/ingestion/), so we search
 * instead.
 *
 * Intentionally duplicated from database/seed/find-env.ts rather than
 * imported — the QA seed system and the real-data ingestion system are
 * kept fully independent of one another, with zero cross-references, so
 * either can be run, modified, or removed without affecting the other.
 */
export function findRepoRootEnvFile(startDir: string): string {
  let dir = startDir;
  while (true) {
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
          workspaces?: unknown;
        };
        if (pkg.workspaces) {
          return path.join(dir, '.env');
        }
      } catch {
        // Not valid JSON or unreadable — keep searching upward.
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      // Reached filesystem root without finding it; fall back to cwd.
      return path.resolve(process.cwd(), '.env');
    }
    dir = parent;
  }
}
