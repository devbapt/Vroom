import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#140102' },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { showWelcome } = useAppContext();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Écran de chargement rouge et noir le temps de vérifier la base de données
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#140102' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  const vroomTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#140102',
      card: '#140102',
      border: 'transparent',
    },
  };

  return (
    <NavigationContainer theme={vroomTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#140102' },
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
        }}
      >
        {isRecovery ? (
          // RESET PASSWORD ➡️ lien email cliqué → changer le mot de passe sans le connaître
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            initialParams={{ isRecoveryMode: true }}
          />
        ) : session && session.user ? (
          showWelcome ? (
            // NOUVEL INSCRIT ➡️ Écran de bienvenue 2.5s puis MainApp
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
          ) : (
            // UTILISATEUR CONNECTÉ ➡️ On affiche l'app avec les 5 onglets
            <Stack.Screen name="MainApp" component={MainNavigator} />
          )
        ) : (
          // NON CONNECTÉ ➡️ On affiche l'écran de connexion
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}