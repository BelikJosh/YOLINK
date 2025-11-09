import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta según tu estructura

interface OpenPaymentWallet {
  id: string;
  pointer: string;
  currency: string;
  balance?: number;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  phone?: string;
  wallets: OpenPaymentWallet[];
}

const ProfileScreen = () => {
  const { user, logout } = useAuth(); // usuario logueado desde contexto
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingWallet, setAddingWallet] = useState(false);
  const [newWalletPointer, setNewWalletPointer] = useState('');

  // Cargar datos simulados del usuario
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const mockProfile: UserProfile = {
          id: user?.id || '1',
          nombre: user?.nombre || 'Cliente Invitado',
          email: user?.email || 'cliente@ejemplo.com',
          phone: '+525512345678',
          wallets: [
            {
              id: '1',
              pointer: '$ilp.interledger-test.dev/car21',
              currency: 'USD',
              balance: 85.25,
              isDefault: true,
            },
          ],
        };
        setProfile(mockProfile);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddWallet = async () => {
    if (!newWalletPointer.trim()) {
      Alert.alert('Error', 'Por favor ingresa un pointer de wallet válido');
      return;
    }

    try {
      setAddingWallet(true);
      const newWallet: OpenPaymentWallet = {
        id: Date.now().toString(),
        pointer: newWalletPointer.trim(),
        currency: 'USD',
        isDefault: false,
      };

      setProfile(prev =>
        prev ? { ...prev, wallets: [...prev.wallets, newWallet] } : null
      );

      setNewWalletPointer('');
      Alert.alert('Éxito', 'Nueva wallet agregada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la wallet');
    } finally {
      setAddingWallet(false);
    }
  };

  const handleDeleteWallet = (walletId: string) => {
    if (!profile) return;

    Alert.alert(
      'Eliminar Wallet',
      '¿Estás seguro de que quieres eliminar esta wallet?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updated = profile.wallets.filter(w => w.id !== walletId);
            setProfile({ ...profile, wallets: updated });
          },
        },
      ]
    );
  };

  const handleOpenWallet = (pointer: string) => {
    const url = `https://pay.interledger-test.dev/payment-choice?receiver=${pointer}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a535c" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#d4fc79', '#96e6a1']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={120} color="#1a535c" />
          <Text style={styles.name}>{profile?.nombre}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* Datos personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Usuario</Text>
          <View style={styles.dataBox}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{profile?.nombre}</Text>
          </View>
          <View style={styles.dataBox}>
            <Text style={styles.label}>Correo electrónico:</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>
          <View style={styles.dataBox}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{profile?.phone}</Text>
          </View>
        </View>

        {/* Wallets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Wallets</Text>

          {profile?.wallets.map(wallet => (
            <View key={wallet.id} style={styles.walletCard}>
              <TouchableOpacity
                style={styles.walletRow}
                onPress={() => handleOpenWallet(wallet.pointer)}
              >
                <Ionicons name="wallet-outline" size={26} color="#4ecdc4" />
                <View style={styles.walletInfo}>
                  <Text style={styles.walletPointer}>
                    {wallet.pointer}
                  </Text>
                  {wallet.balance !== undefined && (
                    <Text style={styles.walletBalance}>
                      Balance: {wallet.currency} {wallet.balance.toFixed(2)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {!wallet.isDefault && (
                <TouchableOpacity
                  onPress={() => handleDeleteWallet(wallet.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Agregar nueva wallet */}
          <View style={styles.addWalletBox}>
            <Text style={styles.label}>Agregar nueva wallet</Text>
            <TextInput
              style={styles.input}
              placeholder="$ilp.interledger-test.dev/usuario123"
              value={newWalletPointer}
              onChangeText={setNewWalletPointer}
            />
            <TouchableOpacity
              style={[styles.addButton, addingWallet && { opacity: 0.6 }]}
              onPress={handleAddWallet}
              disabled={addingWallet}
            >
              {addingWallet ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Agregar Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert('Cerrar sesión', '¿Deseas salir?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
            ])
          }
        >
          <Ionicons name="exit-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#1a535c' },
  header: { alignItems: 'center', marginTop: 40 },
  name: { fontSize: 24, fontWeight: '700', color: '#1a535c', marginTop: 10 },
  email: { fontSize: 16, color: '#4ecdc4', marginTop: 4 },
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a535c', marginBottom: 12 },
  dataBox: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 16, color: '#555', fontWeight: '600' },
  value: { fontSize: 16, color: '#333' },
  walletCard: {
    backgroundColor: '#eafaf1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  walletInfo: { marginLeft: 10, flex: 1 },
  walletPointer: { fontSize: 14, color: '#1a535c', textDecorationLine: 'underline' },
  walletBalance: { fontSize: 13, color: '#28a745', marginTop: 2 },
  addWalletBox: { marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f9f9f9',
    marginTop: 8,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#4ecdc4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  deleteText: { color: '#fff', marginLeft: 5, fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    padding: 14,
    borderRadius: 10,
    marginTop: 30,
    width: '90%',
    justifyContent: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
