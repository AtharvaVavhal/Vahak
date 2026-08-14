'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Button, ErrorBanner, LoadingSpinner } from '../../../components/ui';
import { adminApi } from '../../../services/api';
import type { RouteWithRelations } from '../../../types';
import { ApiError } from '../../../utils/ApiError';

interface Stats {
  routeCount: number;
  haltCount: number;
  busCount: number;
  activeBusCount: number;
}

/**
 * The backend has no aggregate dashboard endpoint (verified live: GET /dashboard/summary
 * and /api/v1/dashboard/summary both 404). These counts are honestly derived by paging
 * through the real GET /routes response (which nests halts/buses per route) and summing —
 * not a fabricated or mocked number.
 */
async function computeStats(): Promise<Stats> {
  const firstPage = await adminApi.listRoutes(1, 100);
  const pages: RouteWithRelations[] = [...firstPage.data];

  let page = firstPage.meta.page;
  while (page < firstPage.meta.totalPages) {
    page += 1;
    const next = await adminApi.listRoutes(page, 100);
    pages.push(...next.data);
  }

  const haltCount = pages.reduce((sum, route) => sum + route.halts.length, 0);
  const busCount = pages.reduce((sum, route) => sum + route.buses.length, 0);
  const activeBusCount = pages.reduce(
    (sum, route) => sum + route.buses.filter((bus) => bus.active).length,
    0,
  );

  return { routeCount: firstPage.meta.total, haltCount, busCount, activeBusCount };
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await computeStats());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load dashboard stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount to synchronize with the backend, per React's documented data-fetching
    // pattern (react.dev/learn/synchronizing-with-effects#fetching-data) — not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500">Operational snapshot from the routes network.</p>
      </div>

      {loading ? <LoadingSpinner label="Loading stats..." /> : null}

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <ErrorBanner message={error} />
          <Button label="Retry" onClick={load} />
        </div>
      ) : null}

      {stats && !loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Routes" value={stats.routeCount} />
          <StatCard label="Halts" value={stats.haltCount} />
          <StatCard label="Buses" value={stats.busCount} />
          <StatCard label="Active buses" value={`${stats.activeBusCount} / ${stats.busCount}`} />
        </div>
      ) : null}

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700">Consignment overview unavailable</p>
        <p className="mt-1 text-sm text-slate-500">
          The backend doesn&apos;t expose an admin-wide consignment listing or aggregate endpoint
          (confirmed: no <code className="rounded bg-slate-100 px-1">GET /consignments</code> filter
          works for an admin account, and there is no{' '}
          <code className="rounded bg-slate-100 px-1">/dashboard/summary</code> route). This dashboard
          won&apos;t show fabricated consignment counts as a result — look up a specific consignment
          by ID instead.
        </p>
        <Link href="/consignments" className="mt-3 inline-block">
          <Button label="Find a consignment" variant="secondary" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
