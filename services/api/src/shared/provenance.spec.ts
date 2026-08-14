import { toPublicBus, toPublicHalt, toPublicRoute } from './provenance';
import type { Bus, Halt, Route } from '../generated/prisma/client';

const PROVENANCE_KEYS = ['dataSource', 'provider', 'externalId', 'sourceUrl', 'fetchedAt'];

describe('provenance stripping', () => {
  const route: Route = {
    id: 'route-1',
    name: 'Demo Route',
    origin: 'A',
    destination: 'B',
    routeRef: 'ref-1',
    direction: 'UP',
    dataSource: 'COMMUNITY_DERIVED',
    provider: 'osm',
    externalId: 'ext-1',
    sourceUrl: 'https://example.com',
    fetchedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-03'),
  };

  const halt: Halt = {
    id: 'halt-1',
    routeId: 'route-1',
    name: 'Halt A',
    sequence: 1,
    latitude: null,
    longitude: null,
    dataSource: 'COMMUNITY_DERIVED',
    provider: 'osm',
    externalId: 'ext-2',
    sourceUrl: 'https://example.com',
    fetchedAt: new Date('2026-01-01'),
  };

  const bus: Bus = {
    id: 'bus-1',
    registration: 'BUS-001',
    routeId: 'route-1',
    active: true,
    dataSource: 'COMMUNITY_DERIVED',
    provider: 'osm',
    externalId: 'ext-3',
    sourceUrl: 'https://example.com',
    fetchedAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-02'),
  };

  it('toPublicRoute strips all five provenance fields and keeps everything else', () => {
    const result = toPublicRoute(route);

    for (const key of PROVENANCE_KEYS) {
      expect(result).not.toHaveProperty(key);
    }
    expect(result).toEqual({
      id: 'route-1',
      name: 'Demo Route',
      origin: 'A',
      destination: 'B',
      routeRef: 'ref-1',
      direction: 'UP',
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    });
  });

  it('toPublicHalt strips all five provenance fields and keeps everything else', () => {
    const result = toPublicHalt(halt);

    for (const key of PROVENANCE_KEYS) {
      expect(result).not.toHaveProperty(key);
    }
    expect(result).toEqual({
      id: 'halt-1',
      routeId: 'route-1',
      name: 'Halt A',
      sequence: 1,
      latitude: null,
      longitude: null,
    });
  });

  it('toPublicBus strips all five provenance fields and keeps everything else', () => {
    const result = toPublicBus(bus);

    for (const key of PROVENANCE_KEYS) {
      expect(result).not.toHaveProperty(key);
    }
    expect(result).toEqual({
      id: 'bus-1',
      registration: 'BUS-001',
      routeId: 'route-1',
      active: true,
      createdAt: bus.createdAt,
    });
  });
});
