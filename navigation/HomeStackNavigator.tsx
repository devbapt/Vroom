import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

export type HomeStackParamList = {
  HomeFeed: undefined;
  CreatePost: undefined;
  UserProfile: { userId: string; username: string };
};

const Stack = createStackNavigator<HomeStackParamList>();

const SCREEN_BASE = {
  headerShown: false,
  cardStyle: { backgroundColor: '#140102' },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
} as const;

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={SCREEN_BASE}>
      <Stack.Screen name="HomeFeed"    component={HomeScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      {/* Slide from bottom — écran de création */}
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ ...TransitionPresets.ModalSlideFromBottomIOS }}
      />
    </Stack.Navigator>
  );
}
