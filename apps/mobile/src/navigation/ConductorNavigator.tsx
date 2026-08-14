import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AvailableConsignmentsScreen,
  ConductorConsignmentDetailScreen,
  ConductorHomeScreen,
  FindConsignmentScreen,
} from '../screens';

export type ConductorStackParamList = {
  ConductorHome: undefined;
  AvailableConsignments: undefined;
  FindConsignment: undefined;
  ConductorConsignmentDetail: { consignmentId: string };
};

const Stack = createNativeStackNavigator<ConductorStackParamList>();

export function ConductorNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ConductorHome" component={ConductorHomeScreen} options={{ title: 'Vahak' }} />
      <Stack.Screen
        name="AvailableConsignments"
        component={AvailableConsignmentsScreen}
        options={{ title: 'Consignments' }}
      />
      <Stack.Screen
        name="FindConsignment"
        component={FindConsignmentScreen}
        options={{ title: 'Find a consignment' }}
      />
      <Stack.Screen
        name="ConductorConsignmentDetail"
        component={ConductorConsignmentDetailScreen}
        options={{ title: 'Consignment' }}
      />
    </Stack.Navigator>
  );
}
