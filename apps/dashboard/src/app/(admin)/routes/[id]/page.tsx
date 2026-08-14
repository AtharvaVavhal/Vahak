'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button, Card, ConfirmDialog, EmptyState, ErrorBanner, InfoRow, LoadingSpinner, useToast } from '../../../../components/ui';
import { ActiveBadge } from '../../../../components/ui/StatusBadge';
import { BusFormModal, HaltFormModal, RouteFormModal } from '../../../../components/routes';
import { ICONS } from '../../../../constants/icons';
import { adminApi } from '../../../../services/api';
import type { Bus, Halt, RouteWithRelations } from '../../../../types';
import { ApiError } from '../../../../utils/ApiError';

type DeleteTarget = { kind: 'route' } | { kind: 'halt'; halt: Halt } | { kind: 'bus'; bus: Bus };

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const routeId = params.id;
  const router = useRouter();
  const { showToast } = useToast();

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
      showToast('Route deleted.');
      return;
    }
    if (deleteTarget.kind === 'halt') {
      await adminApi.deleteHalt(deleteTarget.halt.id);
      setRoute((prev) => (prev ? { ...prev, halts: prev.halts.filter((h) => h.id !== deleteTarget.halt.id) } : prev));
      setDeleteTarget(null);
      showToast('Halt deleted.');
      return;
    }
    await adminApi.deleteBus(deleteTarget.bus.id);
    setRoute((prev) => (prev ? { ...prev, buses: prev.buses.filter((b) => b.id !== deleteTarget.bus.id) } : prev));
    setDeleteTarget(null);
    showToast('Bus deleted.');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSpinner label="Loading route..." />
      </div>
    );
  }

  if (loadError || !route) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-start gap-3">
          <ErrorBanner message={loadError ?? 'Route not found.'} />
          <Button label="Retry" onClick={load} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">{route.name}</h1>
          <p className="text-sm text-ink-500">
            {route.origin} → {route.destination}
          </p>
        </div>
        <div className="flex gap-2">
          <Button label="Edit" variant="secondary" onClick={() => setEditingRoute(true)} />
          <Button label="Delete" variant="danger" onClick={() => setDeleteTarget({ kind: 'route' })} />
        </div>
      </div>

      <Card>
        <InfoRow label="Created" value={new Date(route.createdAt).toLocaleString()} />
        <InfoRow label="Last updated" value={new Date(route.updatedAt).toLocaleString()} />
      </Card>

      {/* Halts */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <ICONS.halt size={16} strokeWidth={2} className="text-ink-500" />
            Halts
          </h2>
          <Button label="+ Add halt" variant="secondary" onClick={() => setHaltModal({})} />
        </div>
        {route.halts.length === 0 ? (
          <EmptyState compact title="No halts yet." />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-ink-150 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="py-2 font-medium">#</th>
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Coordinates</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {route.halts.map((halt) => (
                  <tr key={halt.id} className="border-b border-ink-150 last:border-b-0">
                    <td className="py-2 text-ink-700">{halt.sequence}</td>
                    <td className="py-2 font-medium text-ink-900">{halt.name}</td>
                    <td className="py-2 text-ink-500">
                      {halt.latitude && halt.longitude ? `${halt.latitude}, ${halt.longitude}` : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button label="Edit" variant="ghost" onClick={() => setHaltModal({ halt })} />
                        <Button
                          label="Delete"
                          variant="dangerGhost"
                          onClick={() => setDeleteTarget({ kind: 'halt', halt })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Buses */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <ICONS.bus size={16} strokeWidth={2} className="text-ink-500" />
            Buses
          </h2>
          <Button label="+ Add bus" variant="secondary" onClick={() => setBusModal({})} />
        </div>
        {route.buses.length === 0 ? (
          <EmptyState compact title="No buses yet." />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="border-b border-ink-150 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="py-2 font-medium">Registration</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {route.buses.map((bus) => (
                  <tr key={bus.id} className="border-b border-ink-150 last:border-b-0">
                    <td className="py-2 font-medium text-ink-900">{bus.registration}</td>
                    <td className="py-2">
                      <ActiveBadge active={bus.active} />
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button label="Edit" variant="ghost" onClick={() => setBusModal({ bus })} />
                        <Button
                          label="Delete"
                          variant="dangerGhost"
                          onClick={() => setDeleteTarget({ kind: 'bus', bus })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingRoute ? (
        <RouteFormModal
          initialRoute={route}
          onClose={() => setEditingRoute(false)}
          onSaved={() => {
            setEditingRoute(false);
            load();
            showToast('Route updated.');
          }}
        />
      ) : null}

      {haltModal ? (
        <HaltFormModal
          routeId={routeId}
          initialHalt={haltModal.halt}
          onClose={() => setHaltModal(null)}
          onSaved={() => {
            const wasEditing = Boolean(haltModal.halt);
            setHaltModal(null);
            load();
            showToast(wasEditing ? 'Halt updated.' : 'Halt added.');
          }}
        />
      ) : null}

      {busModal ? (
        <BusFormModal
          routeId={routeId}
          initialBus={busModal.bus}
          onClose={() => setBusModal(null)}
          onSaved={() => {
            const wasEditing = Boolean(busModal.bus);
            setBusModal(null);
            load();
            showToast(wasEditing ? 'Bus updated.' : 'Bus added.');
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
