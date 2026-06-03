import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeStackNavigator from './HomeStackNavigator';
import MapScreen from '../screens/MapScreen';
import SearchStackNavigator from './SearchStackNavigator';
import MessagesStackNavigator from './MessagesStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import CustomTabBar from '../components/ui/CustomTabBar';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeStackNavigator} />
      <Tab.Screen name="Maps"     component={MapScreen} />
      <Tab.Screen name="Search"   component={SearchStackNavigator} />
      <Tab.Screen name="Messages" component={MessagesStackNavigator} />
      <Tab.Screen name="Profile"  component={ProfileStackNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
