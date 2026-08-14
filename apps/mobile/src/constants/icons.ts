import {
  Bus,
  IndianRupee,
  Inbox,
  ListChecks,
  MapPin,
  PackagePlus,
  Route,
  Search,
  ShieldCheck,
} from 'lucide-react-native';

/** Centralized functional icon mapping — reuse instead of repeating per screen. */
export const ICONS = {
  route: Route,
  halt: MapPin,
  bus: Bus,
  bookParcel: PackagePlus,
  search: Search,
  conductorQueue: ListChecks,
  recipientInbox: Inbox,
  security: ShieldCheck,
  fare: IndianRupee,
} as const;
