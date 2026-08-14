import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  DeliveryConfirmationScreen,
  FindDeliveryScreen,
  IncomingDeliveriesScreen,
  PinVerificationScreen,
  RecipientConsignmentDetailScreen,
  RecipientHomeScreen,
} from '../screens';
import type { Consignment } from '../types';

export type RecipientStackParamList = {
  RecipientHome: undefined;
  IncomingDeliveries: undefined;
  FindDelivery: undefined;
  RecipientConsignmentDetail: { consignmentId: string };
  PinVerification: { consignmentId: string };
  DeliveryConfirmation: { consignment: Consignment };
};

const Stack = createNativeStackNavigator<RecipientStackParamList>();

export function RecipientNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="RecipientHome" component={RecipientHomeScreen} options={{ title: 'Vahak' }} />
      <Stack.Screen
        name="IncomingDeliveries"
        component={IncomingDeliveriesScreen}
        options={{ title: 'Incoming deliveries' }}
      />
      <Stack.Screen
        name="FindDelivery"
        component={FindDeliveryScreen}
        options={{ title: 'Find a delivery' }}
      />
      <Stack.Screen
        name="RecipientConsignmentDetail"
        component={RecipientConsignmentDetailScreen}
        options={{ title: 'Delivery' }}
      />
      <Stack.Screen
        name="PinVerification"
        component={PinVerificationScreen}
        options={{ title: 'Verify handover' }}
      />
      <Stack.Screen
        name="DeliveryConfirmation"
        component={DeliveryConfirmationScreen}
        options={{ title: 'Delivered', headerBackVisible: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
