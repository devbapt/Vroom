import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ActivityScreen from '../screens/ActivityScreen';
import SavedScreen from '../screens/SavedScreen';
import CreateStoryScreen from '../screens/CreateStoryScreen';

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileHome" 
        component={ProfileScreen} 
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
      />
      <Stack.Screen 
        name="AddVehicle" 
        component={AddVehicleScreen}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
      />
      <Stack.Screen 
        name="Activity" 
        component={ActivityScreen}
      />
      <Stack.Screen 
        name="Saved" 
        component={SavedScreen}
      />
      <Stack.Screen 
        name="CreateStory" 
        component={CreateStoryScreen}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
