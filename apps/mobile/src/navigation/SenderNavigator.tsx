import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  BookingConfirmationScreen,
  BookParcelScreen,
  ConsignmentDetailScreen,
  MyConsignmentsScreen,
  SenderHomeScreen,
} from '../screens';
import type { Consignment } from '../types';

export type SenderStackParamList = {
  SenderHome: undefined;
  BookParcel: undefined;
  BookingConfirmation: { consignment: Consignment };
  MyConsignments: undefined;
  ConsignmentDetail: { consignmentId: string };
};

const Stack = createNativeStackNavigator<SenderStackParamList>();

export function SenderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SenderHome" component={SenderHomeScreen} options={{ title: 'Vahak' }} />
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
