import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from '../supabaseClient';

// Import de tes écrans
import LoginScreen from '../screens/LoginScreen';
import MainNavigator from './MainNavigator'; // Tes 5 onglets

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifie s'il y a déjà un utilisateur connecté au lancement (npm run web)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Écoute les changements (quand tu cliques sur "Se connecter")
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          // UTILISATEUR CONNECTÉ ➡️ On affiche l'app avec les 5 onglets
          <Stack.Screen name="MainApp" component={MainNavigator} />
        ) : (
          // NON CONNECTÉ ➡️ On affiche l'écran de connexion
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}