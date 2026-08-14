/** Formats an ISO timestamp (as returned by the API's DateTime fields) for display. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** `fare` comes back as a Decimal-serialized string (e.g. "150", "150.5") — format as currency-ish text. */
export function formatFare(fare: string): string {
  const parsed = Number(fare);
  if (Number.isNaN(parsed)) return fare;
  return `₹${parsed.toFixed(2)}`;
}
