'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button, ConfirmDialog, ErrorBanner, InfoRow, LoadingSpinner } from '../../../../components/ui';
import { ActiveBadge } from '../../../../components/ui/StatusBadge';
import { BusFormModal, HaltFormModal, RouteFormModal } from '../../../../components/routes';
import { adminApi } from '../../../../services/api';
import type { Bus, Halt, RouteWithRelations } from '../../../../types';
import { ApiError } from '../../../../utils/ApiError';

type DeleteTarget = { kind: 'route' } | { kind: 'halt'; halt: Halt } | { kind: 'bus'; bus: Bus };

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const routeId = params.id;
  const router = useRouter();

  const [route, setRoute] = useState<RouteWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingRoute, setEditingRoute] = useState(false);
  const [haltModal, setHaltModal] = useState<{ halt?: Halt } | null>(null);
  const [busModal, setBusModal] = useState<{ bus?: Bus } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRoute(await adminApi.getRoute(routeId));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load this route.');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    // Fetching on mount to synchronize with the backend, per React's documented data-fetching
    // pattern (react.dev/learn/synchronizing-with-effects#fetching-data) — not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'route') {
      await adminApi.deleteRoute(routeId);
      router.push('/routes');
      return;
    }
    if (deleteTarget.kind === 'halt') {
      await adminApi.deleteHalt(deleteTarget.halt.id);
      setRoute((prev) => (prev ? { ...prev, halts: prev.halts.filter((h) => h.id !== deleteTarget.halt.id) } : prev));
      setDeleteTarget(null);
      return;
    }
    await adminApi.deleteBus(deleteTarget.bus.id);
    setRoute((prev) => (prev ? { ...prev, buses: prev.buses.filter((b) => b.id !== deleteTarget.bus.id) } : prev));
    setDeleteTarget(null);
  };

  if (loading) return <LoadingSpinner label="Loading route..." />;

  if (loadError || !route) {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorBanner message={loadError ?? 'Route not found.'} />
        <Button label="Retry" onClick={load} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{route.name}</h1>
          <p className="text-sm text-slate-500">
            {route.origin} → {route.destination}
          </p>
        </div>
        <div className="flex gap-2">
          <Button label="Edit" variant="secondary" onClick={() => setEditingRoute(true)} />
          <Button label="Delete" variant="danger" onClick={() => setDeleteTarget({ kind: 'route' })} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <InfoRow label="Created" value={new Date(route.createdAt).toLocaleString()} />
        <InfoRow label="Last updated" value={new Date(route.updatedAt).toLocaleString()} />
      </div>

      {/* Halts */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Halts</h2>
          <Button label="+ Add halt" variant="secondary" onClick={() => setHaltModal({})} />
        </div>
        {route.halts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No halts yet.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 font-medium">#</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Coordinates</th>
                <th className="py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {route.halts.map((halt) => (
                <tr key={halt.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-2 text-slate-600">{halt.sequence}</td>
                  <td className="py-2 font-medium text-slate-900">{halt.name}</td>
                  <td className="py-2 text-slate-500">
                    {halt.latitude && halt.longitude ? `${halt.latitude}, ${halt.longitude}` : '—'}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button label="Edit" variant="ghost" onClick={() => setHaltModal({ halt })} />
                      <Button
                        label="Delete"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteTarget({ kind: 'halt', halt })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Buses */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Buses</h2>
          <Button label="+ Add bus" variant="secondary" onClick={() => setBusModal({})} />
        </div>
        {route.buses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No buses yet.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 font-medium">Registration</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {route.buses.map((bus) => (
                <tr key={bus.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-2 font-medium text-slate-900">{bus.registration}</td>
                  <td className="py-2">
                    <ActiveBadge active={bus.active} />
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button label="Edit" variant="ghost" onClick={() => setBusModal({ bus })} />
                      <Button
                        label="Delete"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteTarget({ kind: 'bus', bus })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editingRoute ? (
        <RouteFormModal
          initialRoute={route}
          onClose={() => setEditingRoute(false)}
          onSaved={() => {
            setEditingRoute(false);
            load();
          }}
        />
      ) : null}

      {haltModal ? (
        <HaltFormModal
          routeId={routeId}
          initialHalt={haltModal.halt}
          onClose={() => setHaltModal(null)}
          onSaved={() => {
            setHaltModal(null);
            load();
          }}
        />
      ) : null}

      {busModal ? (
        <BusFormModal
          routeId={routeId}
          initialBus={busModal.bus}
          onClose={() => setBusModal(null)}
          onSaved={() => {
            setBusModal(null);
            load();
          }}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title={
            deleteTarget.kind === 'route'
              ? 'Delete route?'
              : deleteTarget.kind === 'halt'
                ? `Delete "${deleteTarget.halt.name}"?`
                : `Delete "${deleteTarget.bus.registration}"?`
          }
          description="This cannot be undone."
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}
