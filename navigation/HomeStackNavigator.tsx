import React from 'react';
import { Easing } from 'react-native';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';

export type HomeStackParamList = {
  HomeFeed: undefined;
  CreatePost: undefined;
  UserProfile: { userId: string; username: string };
  PostDetail: { id: string; name: string; image: string; description?: string; date?: string };
};

const Stack = createStackNavigator<HomeStackParamList>();

const SCREEN_BASE = {
  headerShown: false,
  cardStyle: { backgroundColor: '#140102' },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
} as const;

// Ouverture : spring natif iOS · Fermeture : timing rapide 220ms pour éviter
// que le spring lent ne chevauche le re-render du feed (InteractionManager ne
// peut pas court-circuiter le thread natif mais un timing court élimine l'overlap).
const MODAL_TRANSITION = {
  ...TransitionPresets.ModalSlideFromBottomIOS,
  transitionSpec: {
    open: {
      animation: 'spring' as const,
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'timing' as const,
      config: { duration: 220, easing: Easing.out(Easing.poly(4)) },
    },
  },
} as const;

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={SCREEN_BASE}>
      <Stack.Screen name="HomeFeed"    component={HomeScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={MODAL_TRANSITION}
      />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
}
