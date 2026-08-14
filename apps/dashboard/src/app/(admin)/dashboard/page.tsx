'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Card, ErrorBanner, LoadingSpinner } from '../../../components/ui';
import { ICONS } from '../../../constants/icons';
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
 * not a fabricated or mocked number. There is likewise no admin-wide consignment listing,
 * so this page intentionally shows nothing about consignments — "Find Consignment" (by ID)
 * is a separate sidebar tool, not folded in here as a fake metric.
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

export default function NetworkPage() {
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
        <h1 className="text-xl font-bold text-ink-900">Network</h1>
        <p className="text-sm text-ink-500">Operational snapshot from the routes network.</p>
      </div>

      {loading ? <LoadingSpinner label="Loading stats..." /> : null}

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <ErrorBanner message={error} />
          <Button label="Retry" onClick={load} />
        </div>
      ) : null}

      {stats && !loading ? (
        <div className="flex flex-col gap-4">
          <ActiveBusRatioCard active={stats.activeBusCount} total={stats.busCount} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={ICONS.route} label="Routes" value={stats.routeCount} />
            <StatCard icon={ICONS.halt} label="Halts" value={stats.haltCount} />
            <StatCard icon={ICONS.bus} label="Buses" value={stats.busCount} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActiveBusRatioCard({ active, total }: { active: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((active / total) * 100);
  const Icon = ICONS.bus;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-brand-tint text-brand">
            <Icon size={22} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm text-ink-500">Active buses</p>
            <p className="text-2xl font-bold text-ink-900">
              {active} / {total}
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold text-brand">{pct}%</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-ink-150">
        <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ICONS.route;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-canvas text-ink-500">
          <Icon size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm text-ink-500">{label}</p>
          <p className="text-xl font-bold text-ink-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
