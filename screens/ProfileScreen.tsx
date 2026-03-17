import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const screenWidth = Dimensions.get('window').width;

type GarageItem = { id: string; uri: string };

export default function ProfileScreen() {
  const [garage, setGarage] = useState<GarageItem[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [bio, setBio] = useState('Passionné de bolides japonais 🚗🇯🇵');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickGarageImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) {
      setGarage([...garage, { id: Date.now().toString(), uri: result.assets[0].uri }]);
    }
  };

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header avec profil + menu */}
      <View style={styles.header}>
        <Text style={styles.username}>Mon Profil</Text>
        <TouchableOpacity onPress={() => alert('Paramètres à venir')}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar + changer photo */}
      <TouchableOpacity style={styles.avatarBlock} onPress={pickProfileImage}>
        <Image
          source={profilePic ? { uri: profilePic } : require('../assets/vroom_logo.png')}
          style={styles.avatar}
        />
        <Text style={styles.changeText}>Changer la photo</Text>
      </TouchableOpacity>

      {/* Bio */}
      <TextInput
        value={bio}
        onChangeText={setBio}
        multiline
        style={styles.bio}
      />

      {/* Garage */}
      <View style={styles.garageBox}>
        <Text style={styles.sectionTitle}>🚗 Mon garage</Text>

        <TouchableOpacity style={styles.addButton} onPress={pickGarageImage}>
          <Text style={styles.addButtonText}>+ Ajouter une voiture</Text>
        </TouchableOpacity>

        <FlatList
          data={garage}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleImagePress(item.uri)}
              style={styles.imageContainer}
            >
              <Image source={{ uri: item.uri }} style={styles.carImage} />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Modal image en grand */}
      <Modal visible={modalVisible} transparent>
        <View style={styles.modalContainer}>
          {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.fullImage} /> : null}
          <Text style={styles.imageCaption}>Cette voiture est dans mon garage 🏎️</Text>
          <Button title="Fermer" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: { fontSize: 24, fontWeight: 'bold' },
  menuIcon: { fontSize: 26, fontWeight: 'bold' },

  avatarBlock: {
    marginTop: 20,
    alignItems: 'center',
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  changeText: { fontSize: 12, color: '#888', marginTop: 4 },

  bio: {
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#444',
    marginBottom: 20,
  },

  garageBox: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    flex: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },

  addButton: {
    backgroundColor: '#ff3b3f',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },

  imageContainer: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
  },
  carImage: {
    width: (screenWidth - 60) / 2,
    height: 160,
    borderRadius: 10,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullImage: {
    width: '90%',
    height: '60%',
    borderRadius: 10,
    marginBottom: 15,
  },
  imageCaption: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});
