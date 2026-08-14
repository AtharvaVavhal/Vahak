'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Button, EmptyState, ErrorBanner, LoadingSpinner, useToast } from '../../../components/ui';
import { RouteFormModal } from '../../../components/routes';
import { ICONS } from '../../../constants/icons';
import { adminApi } from '../../../services/api';
import type { RouteWithRelations } from '../../../types';
import { ApiError } from '../../../utils/ApiError';

const PAGE_LIMIT = 10;

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteWithRelations[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.listRoutes(targetPage, PAGE_LIMIT);
      setRoutes(result.data);
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load routes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount to synchronize with the backend, per React's documented data-fetching
    // pattern (react.dev/learn/synchronizing-with-effects#fetching-data) — not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1);
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Routes</h1>
          <p className="text-sm text-ink-500">{total} route{total === 1 ? '' : 's'} total.</p>
        </div>
        <Button label="+ New route" onClick={() => setCreating(true)} />
      </div>

      {loading ? <LoadingSpinner label="Loading routes..." /> : null}

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <ErrorBanner message={error} />
          <Button label="Retry" onClick={() => load(page)} />
        </div>
      ) : null}

      {!loading && !error && routes && routes.length === 0 ? (
        <EmptyState
          icon={ICONS.route}
          title="No routes yet"
          subtitle="Create one to start assigning halts and buses."
        />
      ) : null}

      {!loading && !error && routes && routes.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-md border border-ink-150 bg-surface">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-ink-150 bg-canvas text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Origin → Destination</th>
                  <th className="px-4 py-3 font-medium">Halts</th>
                  <th className="px-4 py-3 font-medium">Buses</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id} className="border-b border-ink-150 last:border-b-0 hover:bg-canvas">
                    <td className="px-4 py-3">
                      <Link href={`/routes/${route.id}`} className="font-medium text-brand hover:underline">
                        {route.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {route.origin} → {route.destination}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{route.halts.length}</td>
                    <td className="px-4 py-3 text-ink-700">{route.buses.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <Button
                label="Previous"
                variant="secondary"
                onClick={() => load(page - 1)}
                disabled={page <= 1}
              />
              <span className="text-sm text-ink-500">
                Page {page} of {totalPages}
              </span>
              <Button
                label="Next"
                variant="secondary"
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
              />
            </div>
          ) : null}
        </>
      ) : null}

      {creating ? (
        <RouteFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load(1);
            showToast('Route created.');
          }}
        />
      ) : null}
    </div>
  );
}
