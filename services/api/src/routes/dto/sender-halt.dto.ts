/**
 * Customer-facing halt shape for SENDER route browsing. `id` is the real
 * Halt UUID — genuinely required, since it must round-trip into
 * CreateConsignmentDto.pickupHaltId/dropoffHaltId. No provenance fields.
 */
export interface SenderHaltDto {
  id: string;
  name: string;
  sequence: number;
  latitude: number | null;
  longitude: number | null;
}
