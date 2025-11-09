// screens/ProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProfileScreen = ({ route }: any) => {
  const user = route?.params?.user || {
    nombre: 'Usuario no identificado',
    email: 'correo@ejemplo.com',
    walletPointer: 'https://wallet.example.com/user123',
  };

  const handleOpenWallet = () => {
    if (user.walletPointer) {
      Linking.openURL(user.walletPointer);
    }
  };

  return (
    <LinearGradient colors={['#d4fc79', '#96e6a1']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={120} color="#1a535c" />
          <Text style={styles.name}>{user.nombre}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Usuario</Text>
          <View style={styles.dataBox}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{user.nombre}</Text>
          </View>
          <View style={styles.dataBox}>
            <Text style={styles.label}>Correo electrónico:</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <TouchableOpacity style={styles.walletBox} onPress={handleOpenWallet}>
            <Ionicons name="wallet-outline" size={28} color="#4ecdc4" />
            <View style={styles.walletTextContainer}>
              <Text style={styles.walletLabel}>Pointer de Wallet:</Text>
              <Text style={styles.walletURL} numberOfLines={1}>
                {user.walletPointer}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.walletHint}>
            Toca el enlace para abrir tu wallet.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a535c',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#4ecdc4',
    marginTop: 4,
  },
  section: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a535c',
    marginBottom: 12,
  },
  dataBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  walletBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eafaf1',
    borderRadius: 12,
    padding: 15,
  },
  walletTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  walletLabel: {
    fontSize: 15,
    color: '#1a535c',
    fontWeight: '600',
  },
  walletURL: {
    fontSize: 14,
    color: '#4ecdc4',
    textDecorationLine: 'underline',
  },
  walletHint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProfileScreen;
