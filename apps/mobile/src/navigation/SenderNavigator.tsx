import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AvailableRoutesScreen,
  BookingConfirmationScreen,
  BookParcelScreen,
  ConsignmentDetailScreen,
  MyConsignmentsScreen,
  SelectHaltsScreen,
  SenderHomeScreen,
} from '../screens';
import type { Consignment } from '../types';

/** Route/halt selection carried forward through the booking flow — see AvailableRoutesScreen -> SelectHaltsScreen -> BookParcelScreen. */
interface RouteSelection {
  routeId: string;
  routeName: string;
  routeRef: string | null;
}

interface HaltSelection {
  pickupHaltId: string;
  pickupHaltName: string;
  dropoffHaltId: string;
  dropoffHaltName: string;
}

export type SenderStackParamList = {
  SenderHome: undefined;
  AvailableRoutes: undefined;
  SelectHalts: RouteSelection;
  // Requires a prior route+halt selection — BookParcel can no longer be reached
  // (or type-checked as navigable) without going through the browsing flow first.
  BookParcel: RouteSelection & HaltSelection;
  BookingConfirmation: { consignment: Consignment };
  MyConsignments: undefined;
  ConsignmentDetail: { consignmentId: string };
};

const Stack = createNativeStackNavigator<SenderStackParamList>();

export function SenderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SenderHome" component={SenderHomeScreen} options={{ title: 'Vahak' }} />
      <Stack.Screen
        name="AvailableRoutes"
        component={AvailableRoutesScreen}
        options={{ title: 'Available routes' }}
      />
      <Stack.Screen name="SelectHalts" component={SelectHaltsScreen} options={{ title: 'Select stops' }} />
      <Stack.Screen name="BookParcel" component={BookParcelScreen} options={{ title: 'Book a parcel' }} />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{ title: 'Booking confirmed', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="MyConsignments"
        component={MyConsignmentsScreen}
        options={{ title: 'My consignments' }}
      />
      <Stack.Screen
        name="ConsignmentDetail"
        component={ConsignmentDetailScreen}
        options={{ title: 'Consignment' }}
      />
    </Stack.Navigator>
  );
}
