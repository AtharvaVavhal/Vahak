/**
 * Server-authoritative fare for the current DEVELOPMENT/DEMO product state.
 *
 * There is no verified real PMPML fare source (see Milestone 4/7/9
 * research), no distance field anywhere in Route/Halt, and no existing
 * pricing rule anywhere in this repository. DEMO_FLAT_FARE is therefore a
 * single, fixed, explicitly-labeled placeholder — not a calculation, not a
 * rate, not derived from parcel size or distance. It exists only so the
 * backend (not the client) is authoritative over what gets persisted.
 *
 * This is NOT PMPML pricing and must never be presented as such. Replacing
 * it with a real pricing model is a product decision, not an engineering
 * one — see the Milestone 9 report.
 */
export const DEMO_FLAT_FARE = 100;

export function resolveDemoFare(): number {
  return DEMO_FLAT_FARE;
}
