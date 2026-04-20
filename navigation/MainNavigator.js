import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import SearchScreen from '../screens/SearchScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

function TabBarWrapper({ children }) {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF',
        paddingBottom: 0,
      }} 
      edges={['left', 'right']}
    >
      {children}
    </SafeAreaView>
  );
}

export default function MainNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Maps') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E50914', // Racing Red Vroom
        tabBarInactiveTintColor: '#8E8E93', // Gris standard
        tabBarStyle: { 
          backgroundColor: '#FFFFFF', 
          borderTopColor: '#EEEEEE',
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          paddingLeft: 0,
          paddingRight: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 2 : 4,
        },
        sceneContainerStyle: {
          backgroundColor: '#FFFFFF',
          paddingBottom: 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Maps" component={MapScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}