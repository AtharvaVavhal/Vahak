import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AdminConsignmentDetailScreen,
  AdminFindConsignmentScreen,
  AdminHomeScreen,
  BusFormScreen,
  HaltFormScreen,
  RouteDetailScreen,
  RouteFormScreen,
  RouteListScreen,
} from '../screens';

export type AdminStackParamList = {
  AdminHome: undefined;
  RouteList: undefined;
  RouteForm: { routeId?: string };
  RouteDetail: { routeId: string };
  HaltForm: { routeId: string; haltId?: string };
  BusForm: { routeId: string; busId?: string };
  AdminFindConsignment: undefined;
  AdminConsignmentDetail: { consignmentId: string };
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Vahak' }} />
      <Stack.Screen name="RouteList" component={RouteListScreen} options={{ title: 'Routes' }} />
      <Stack.Screen name="RouteForm" component={RouteFormScreen} options={{ title: 'Route' }} />
      <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ title: 'Route' }} />
      <Stack.Screen name="HaltForm" component={HaltFormScreen} options={{ title: 'Halt' }} />
      <Stack.Screen name="BusForm" component={BusFormScreen} options={{ title: 'Bus' }} />
      <Stack.Screen
        name="AdminFindConsignment"
        component={AdminFindConsignmentScreen}
        options={{ title: 'Find a consignment' }}
      />
      <Stack.Screen
        name="AdminConsignmentDetail"
        component={AdminConsignmentDetailScreen}
        options={{ title: 'Consignment' }}
      />
    </Stack.Navigator>
  );
}
