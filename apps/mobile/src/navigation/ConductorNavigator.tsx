import type { CompositeScreenProps } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AvailableConsignmentsScreen, ConductorConsignmentDetailScreen, FindConsignmentScreen } from '../screens';
import { colors } from '../constants/theme';
import { ICONS } from '../constants/icons';

export type ConductorTabParamList = {
  Queue: undefined;
  Find: undefined;
};

export type ConductorStackParamList = {
  ConductorTabs: undefined;
  ConductorConsignmentDetail: { consignmentId: string };
};

export type ConductorTabScreenProps<Screen extends keyof ConductorTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<ConductorTabParamList, Screen>,
  NativeStackScreenProps<ConductorStackParamList>
>;

const Tab = createBottomTabNavigator<ConductorTabParamList>();
const Stack = createNativeStackNavigator<ConductorStackParamList>();

function ConductorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Queue"
        component={AvailableConsignmentsScreen}
        options={{
          title: 'Queue',
          tabBarIcon: ({ color }) => <ICONS.conductorQueue size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Find"
        component={FindConsignmentScreen}
        options={{
          title: 'Find a consignment',
          tabBarLabel: 'Find',
          tabBarIcon: ({ color }) => <ICONS.search size={24} color={color} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function ConductorNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ConductorTabs" component={ConductorTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ConductorConsignmentDetail"
        component={ConductorConsignmentDetailScreen}
        options={{ title: 'Consignment' }}
      />
    </Stack.Navigator>
  );
}
