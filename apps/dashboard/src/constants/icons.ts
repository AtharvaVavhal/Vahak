import { Bus, IndianRupee, Inbox, LayoutGrid, MapPin, Route, Search, ShieldCheck } from 'lucide-react';

/** Centralized functional icon mapping — reuse instead of repeating per page. */
export const ICONS = {
  network: LayoutGrid,
  route: Route,
  halt: MapPin,
  bus: Bus,
  search: Search,
  recipientInbox: Inbox,
  security: ShieldCheck,
  fare: IndianRupee,
} as const;
