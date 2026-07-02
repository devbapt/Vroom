import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import MessagesScreen    from '../screens/MessagesScreen';
import ChatScreen        from '../screens/ChatScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import type { ChatUser } from '../hooks/useMessages';

export type MessagesStackParamList = {
  ConversationList: undefined;
  Chat:        { conversationId: string; otherUser: ChatUser };
  CreateGroup: undefined;
  GroupDetail: { groupId: string; groupName: string };
  UserProfile: { userId: string; username: string };
};

const Stack = createStackNavigator<MessagesStackParamList>();

const SCREEN_BASE = {
  headerShown: false,
  cardStyle: { backgroundColor: '#140102' },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
} as const;

export default function MessagesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={SCREEN_BASE}>
      <Stack.Screen name="ConversationList" component={MessagesScreen} />
      <Stack.Screen name="Chat"             component={ChatScreen} />
      <Stack.Screen name="GroupDetail"       component={GroupDetailScreen} />
      <Stack.Screen name="UserProfile"       component={UserProfileScreen} />
      {/* Slide from bottom — création de groupe */}
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ ...TransitionPresets.ModalSlideFromBottomIOS }}
      />
    </Stack.Navigator>
  );
}
