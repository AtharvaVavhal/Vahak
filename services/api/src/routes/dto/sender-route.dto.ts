/**
 * Customer-facing route shape for SENDER route browsing. Deliberately
 * narrower than the raw Route row: no provenance fields (provider,
 * externalId, sourceUrl, fetchedAt, dataSource), no internal timestamps.
 */
export interface SenderRouteDto {
  id: string;
  routeRef: string | null;
  name: string;
  origin: string;
  destination: string;
}
