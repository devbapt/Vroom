import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import MapScreen from '../screens/MapScreen';
import AddMapPointScreen from '../screens/AddMapPointScreen';

export type MapStackParamList = {
  MapHome: undefined;
  AddMapPoint: { initialLat?: number; initialLng?: number } | undefined;
};

const Stack = createStackNavigator<MapStackParamList>();

const SCREEN_BASE = {
  headerShown: false,
  cardStyle: { backgroundColor: '#140102' },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
} as const;

const MODAL = { ...TransitionPresets.ModalSlideFromBottomIOS };

export default function MapStackNavigator() {
  return (
    <Stack.Navigator screenOptions={SCREEN_BASE}>
      <Stack.Screen name="MapHome" component={MapScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="AddMapPoint" component={AddMapPointScreen} options={MODAL} />
    </Stack.Navigator>
  );
}
