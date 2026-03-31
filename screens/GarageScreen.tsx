import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS_LIGHT = {
  bg: '#FFFFFF', 
  text: '#140102', 
  accent: '#E50914', 
  border: '#EEEEEE',
};

export default function GarageScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 Mon Garage</Text>
        <Pressable hitSlop={10}>
          <Ionicons name="menu-outline" size={28} color={COLORS_LIGHT.text} />
        </Pressable>
      </View>

      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Ton garage est vide.</Text>
          <Text style={styles.emptySubText}>Ajoute ta première voiture pour commencer.</Text>
        </View>

        <Pressable style={({ hovered }: any) => [styles.addButton, hovered && { opacity: 0.8 }]}>
          <Text style={styles.addButtonText}>+ Ajouter une voiture</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS_LIGHT.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS_LIGHT.border },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS_LIGHT.text },
  container: { flex: 1, padding: 20, justifyContent: 'space-between' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS_LIGHT.text, marginBottom: 5 },
  emptySubText: { fontSize: 15, color: '#666666', textAlign: 'center' },
  addButton: { backgroundColor: COLORS_LIGHT.accent, height: 55, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});