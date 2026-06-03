import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import type { ChatUser } from '../hooks/useMessages';

export type MessagesStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string; otherUser: ChatUser };
};

const Stack = createStackNavigator<MessagesStackParamList>();

export default function MessagesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversationList" component={MessagesScreen} />
      <Stack.Screen name="Chat"             component={ChatScreen} />
    </Stack.Navigator>
  );
}
