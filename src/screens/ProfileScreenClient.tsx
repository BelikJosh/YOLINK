import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { dynamodb, TABLE_NAME } from '../aws-config';

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
  userType: 'client' | 'vendor';
  walletOpenPay: string;
  fechaRegistro: string;
  ubicacion?: {
    lat: number;
    lng: number;
    direccion: string;
  };
  telefono?: string;
  descripcion?: string;
  rating?: number;
  ventasRealizadas?: number;
  totalGanado?: number;
  comprasRealizadas?: number;
  totalGastado?: number;
  wallets: OpenPaymentWallet[];
}

const { width: screenWidth } = Dimensions.get('window');

const ProfileScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingWallet, setAddingWallet] = useState(false);
  const [newWalletPointer, setNewWalletPointer] = useState('');

  // Cargar datos REALES del usuario desde DynamoDB
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        
        const userString = await AsyncStorage.getItem('currentUser');
        console.log('📦 Usuario desde AsyncStorage:', userString);
        
        if (!userString) {
          Alert.alert('Error', 'No se encontró usuario logueado');
          setLoading(false);
          return;
        }

        const userData = JSON.parse(userString);
        console.log('🔍 Datos del usuario:', userData);

        const params = {
          TableName: TABLE_NAME,
          Key: {
            id: userData.id
          }
        };

        console.log('📊 Buscando en DynamoDB con ID:', userData.id);
        
        const result = await dynamodb.get(params).promise();
        console.log('✅ Resultado de DynamoDB:', result);

        if (!result.Item) {
          Alert.alert('Error', 'No se encontraron datos del usuario en la base de datos');
          setLoading(false);
          return;
        }

        const dbUser = result.Item;
        
        const userProfile: UserProfile = {
          id: dbUser.id,
          nombre: dbUser.nombre || 'Usuario',
          email: dbUser.email,
          phone: dbUser.telefono || '+525512345678',
          userType: dbUser.userType || 'client',
          walletOpenPay: dbUser.walletOpenPay || `$ilp.interledger-test.dev/${dbUser.id}`,
          fechaRegistro: dbUser.fechaRegistro || new Date().toISOString(),
          ubicacion: dbUser.ubicacion,
          telefono: dbUser.telefono,
          descripcion: dbUser.descripcion,
          rating: dbUser.rating,
          ventasRealizadas: dbUser.ventasRealizadas,
          totalGanado: dbUser.totalGanado,
          comprasRealizadas: dbUser.comprasRealizadas,
          totalGastado: dbUser.totalGastado,
          wallets: [
            {
              id: '1',
              pointer: dbUser.walletOpenPay || `$ilp.interledger-test.dev/${dbUser.id}`,
              currency: 'USD',
              balance: dbUser.totalGanado || dbUser.totalGastado || 0,
              isDefault: true,
            },
          ],
        };

        setProfile(userProfile);
        console.log('🎉 Perfil cargado exitosamente:', userProfile);

      } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos del usuario: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleAddWallet = async () => {
    if (!newWalletPointer.trim()) {
      Alert.alert('Error', 'Por favor ingresa un pointer de wallet válido');
      return;
    }

    if (!newWalletPointer.startsWith('$')) {
      Alert.alert('Error', 'El pointer debe comenzar con $');
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

    const walletToDelete = profile.wallets.find(w => w.id === walletId);
    if (walletToDelete?.isDefault) {
      Alert.alert('Error', 'No puedes eliminar la wallet por defecto');
      return;
    }

    Alert.alert(
      'Eliminar Wallet',
      '¿Estás seguro de que quieres eliminar esta wallet?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedWallets = profile.wallets.filter(w => w.id !== walletId);
            setProfile({ ...profile, wallets: updatedWallets });
          },
        },
      ]
    );
  };

  const handleOpenWallet = (pointer: string) => {
    const cleanPointer = pointer.startsWith('$') ? pointer.substring(1) : pointer;
    const url = `https://pay.interledger-test.dev/payment-choice?receiver=${cleanPointer}`;
    Linking.openURL(url);
  };

  const handleRefreshBalance = async () => {
    Alert.alert('Info', 'Función de actualización de balance en desarrollo');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión', 
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('currentUser');
              await AsyncStorage.removeItem('userToken');
              Alert.alert('Éxito', 'Sesión cerrada correctamente');
            } catch (error) {
              Alert.alert('Error', 'Error al cerrar sesión');
            }
          }
        },
      ]
    );
  };

  // Función para truncar texto largo
  const truncateText = (text: string, maxLength: number = 25) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a535c" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-circle-outline" size={80} color="#1a535c" />
        <Text style={styles.errorText}>No se encontraron datos de usuario</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => loadUserProfile()}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#d4fc79', '#96e6a1']} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={120} color="#1a535c" />
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {profile.nombre}
          </Text>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
            {profile.email}
          </Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {profile.userType === 'vendor' ? '🏪 Vendedor' : '👤 Cliente'}
            </Text>
          </View>
        </View>

        {/* Datos personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Usuario</Text>
          
          <View style={styles.dataBox}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
              {truncateText(profile.id, 20)}
            </Text>
          </View>
          
          <View style={styles.dataBox}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
              {profile.nombre}
            </Text>
          </View>
          
          <View style={styles.dataBox}>
            <Text style={styles.label}>Correo:</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
              {profile.email}
            </Text>
          </View>
          
          <View style={styles.dataBox}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
              {profile.telefono || 'No especificado'}
            </Text>
          </View>
          
          <View style={styles.dataBox}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>
              {profile.userType === 'vendor' ? 'Vendedor' : 'Cliente'}
            </Text>
          </View>
          
          <View style={styles.dataBox}>
            <Text style={styles.label}>Registro:</Text>
            <Text style={styles.value} numberOfLines={1}>
              {new Date(profile.fechaRegistro).toLocaleDateString()}
            </Text>
          </View>

          {/* Wallet Principal */}
          <View style={styles.dataBox}>
            <Text style={styles.label}>Wallet Principal:</Text>
            <Text style={[styles.value, styles.walletPointer]} numberOfLines={1} ellipsizeMode="middle">
              {profile.walletOpenPay}
            </Text>
          </View>
        </View>

        {/* Estadísticas según el tipo de usuario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {profile.userType === 'vendor' ? '📊 Estadísticas de Ventas' : '🛒 Estadísticas de Compras'}
          </Text>
          
          {profile.userType === 'vendor' ? (
            <>
              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>Ventas realizadas:</Text>
                <Text style={styles.statsValue}>{profile.ventasRealizadas || 0}</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>Total ganado:</Text>
                <Text style={styles.statsValue}>${(profile.totalGanado || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>Rating:</Text>
                <Text style={styles.statsValue}>
                  {profile.rating ? `${profile.rating} ⭐` : 'N/A'}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>Compras realizadas:</Text>
                <Text style={styles.statsValue}>{profile.comprasRealizadas || 0}</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>Total gastado:</Text>
                <Text style={styles.statsValue}>${(profile.totalGastado || 0).toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Wallets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💳 Mis Wallets</Text>
            <TouchableOpacity onPress={handleRefreshBalance}>
              <Ionicons name="refresh-outline" size={24} color="#4ecdc4" />
            </TouchableOpacity>
          </View>

          {profile.wallets.map(wallet => (
            <View key={wallet.id} style={[
              styles.walletCard,
              wallet.isDefault && styles.defaultWalletCard
            ]}>
              <TouchableOpacity
                style={styles.walletRow}
                onPress={() => handleOpenWallet(wallet.pointer)}
              >
                <Ionicons 
                  name={wallet.isDefault ? "wallet" : "wallet-outline"} 
                  size={26} 
                  color={wallet.isDefault ? "#1a535c" : "#4ecdc4"} 
                />
                <View style={styles.walletInfo}>
                  <Text style={styles.walletPointer} numberOfLines={1} ellipsizeMode="middle">
                    {wallet.pointer}
                    {wallet.isDefault && (
                      <Text style={styles.defaultBadge}> • Predeterminada</Text>
                    )}
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
                  <Ionicons name="trash-outline" size={16} color="#fff" />
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
              placeholder="$ilp.interledger-test.dev/tuusuario"
              value={newWalletPointer}
              onChangeText={setNewWalletPointer}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={50}
            />
            <TouchableOpacity
              style={[styles.addButton, addingWallet && styles.disabledButton]}
              onPress={handleAddWallet}
              disabled={addingWallet}
            >
              {addingWallet ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.addButtonText}>Agregar Wallet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="exit-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContainer: { 
    padding: 16, 
    alignItems: 'center', 
    paddingBottom: 40,
    minHeight: '100%',
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 20,
  },
  loadingText: { 
    marginTop: 12, 
    color: '#1a535c', 
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: { 
    marginTop: 12, 
    color: '#dc2626', 
    fontSize: 16, 
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#1a535c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    minWidth: 120,
  },
  retryText: { 
    color: '#fff', 
    fontWeight: '600',
    textAlign: 'center',
  },
  header: { 
    alignItems: 'center', 
    marginTop: 20,
    marginBottom: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  name: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#1a535c', 
    marginTop: 12,
    textAlign: 'center',
    maxWidth: '90%',
  },
  email: { 
    fontSize: 15, 
    color: '#4ecdc4', 
    marginTop: 6,
    textAlign: 'center',
    maxWidth: '90%',
  },
  userTypeBadge: {
    backgroundColor: '#1a535c',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  userTypeText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '600',
  },
  section: {
    width: '100%',
    maxWidth: screenWidth - 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1a535c',
    flex: 1,
  },
  dataBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingVertical: 8,
    minHeight: 24,
  },
  label: { 
    fontSize: 15, 
    color: '#555', 
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  value: { 
    fontSize: 15, 
    color: '#333',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  walletPointer: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  statsBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsLabel: { 
    fontSize: 15, 
    color: '#555', 
    fontWeight: '600',
    flex: 1,
  },
  statsValue: { 
    fontSize: 15, 
    color: '#1a535c', 
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
  },
  walletCard: {
    backgroundColor: '#eafaf1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  defaultWalletCard: {
    backgroundColor: '#d4fc79',
    borderWidth: 2,
    borderColor: '#1a535c',
  },
  walletRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  walletInfo: { 
    marginLeft: 12, 
    flex: 1,
    justifyContent: 'center',
  },
  walletBalance: { 
    fontSize: 13, 
    color: '#28a745', 
    marginTop: 4,
    fontWeight: '500',
  },
  defaultBadge: { 
    fontSize: 11, 
    color: '#1a535c', 
    fontStyle: 'italic',
  },
  addWalletBox: { 
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    marginTop: 8,
    marginBottom: 12,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#4ecdc4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    marginLeft: 8,
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    justifyContent: 'center',
    alignSelf: 'flex-end',
    minWidth: 100,
  },
  deleteText: { 
    color: '#fff', 
    marginLeft: 6, 
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    width: '100%',
    maxWidth: screenWidth - 64,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 10,
  },
});

export default ProfileScreen;