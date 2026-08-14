import { ICONS } from './icons';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Network', icon: ICONS.network },
  { href: '/routes', label: 'Routes', icon: ICONS.route },
  { href: '/consignments', label: 'Find Consignment', icon: ICONS.search },
] as const;
