// screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { dynamoDBService } from '../services/dynamoDBService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OpenPaymentWallet {
  id: string;
  paymentPointer: string;
  currency: string;
  isDefault: boolean;
  balance?: number;
}

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  userType: 'client' | 'vendor';
  walletOpenPay: string;
  telefono?: string;
  categoria?: string;
  descripcion?: string;
  fechaRegistro?: string;
  rating?: number;
  reseñasCount?: number;
  ventasRealizadas?: number;
  totalGanado?: number;
  comprasRealizadas?: number;
  totalGastado?: number;
  horario?: any;
  ubicacion?: any;
  wallets: OpenPaymentWallet[];
  notificationsEnabled: boolean;
  businessName?: string;
}

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    businessName: '',
    descripcion: '',
    categoria: '',
    notificationsEnabled: true,
  });

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando perfil...');
      
      let userData = user;

      if (!userData) {
        console.log('⚠️ No hay usuario en contexto, buscando en AsyncStorage...');
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) {
          userData = JSON.parse(storedUser);
          console.log('✅ Usuario encontrado en AsyncStorage:', userData?.id);
        }
      }

      if (!userData) {
        console.log('❌ No hay usuario disponible');
        setLoading(false);
        return;
      }

      console.log('📋 Obteniendo datos actualizados de DynamoDB...');
      const updatedUserData = await dynamoDBService.getUserById(userData.id);
      
      if (updatedUserData) {
        console.log('✅ Datos obtenidos de DynamoDB');
        
        const normalizedUser = normalizeDynamoDBData(updatedUserData);
        
        const userProfile: UserProfile = {
          id: normalizedUser.id,
          nombre: normalizedUser.nombre,
          email: normalizedUser.email,
          userType: normalizedUser.userType,
          walletOpenPay: normalizedUser.walletOpenPay,
          telefono: normalizedUser.telefono,
          categoria: normalizedUser.categoria,
          descripcion: normalizedUser.descripcion,
          fechaRegistro: normalizedUser.fechaRegistro,
          rating: normalizedUser.rating || 0,
          reseñasCount: normalizedUser.reseñasCount || 0,
          ventasRealizadas: normalizedUser.ventasRealizadas || 0,
          totalGanado: normalizedUser.totalGanado || 0,
          comprasRealizadas: normalizedUser.comprasRealizadas || 0,
          totalGastado: normalizedUser.totalGastado || 0,
          horario: normalizedUser.horario,
          ubicacion: normalizedUser.ubicacion,
          wallets: generateWalletsFromUserData(normalizedUser),
          notificationsEnabled: true,
          businessName: normalizedUser.userType === 'vendor' ? normalizedUser.nombre : '',
        };

        console.log('👤 Perfil creado exitosamente');
        setProfile(userProfile);
        setFormData({
          nombre: userProfile.nombre,
          email: userProfile.email,
          telefono: userProfile.telefono || '',
          businessName: userProfile.businessName || '',
          descripcion: userProfile.descripcion || '',
          categoria: userProfile.categoria || '',
          notificationsEnabled: userProfile.notificationsEnabled,
        });
      } else {
        console.log('⚠️ No se encontraron datos en DynamoDB, usando datos locales');
        const localProfile: UserProfile = {
          id: userData.id,
          nombre: userData.nombre,
          email: userData.email,
          userType: userData.userType,
          walletOpenPay: userData.walletOpenPay,
          telefono: userData.telefono,
          categoria: userData.categoria,
          descripcion: userData.descripcion,
          fechaRegistro: userData.fechaRegistro,
          rating: userData.rating || 0,
          reseñasCount: userData.reseñasCount || 0,
          ventasRealizadas: userData.ventasRealizadas || 0,
          totalGanado: userData.totalGanado || 0,
          comprasRealizadas: userData.comprasRealizadas || 0,
          totalGastado: userData.totalGastado || 0,
          wallets: generateWalletsFromUserData(userData),
          notificationsEnabled: true,
          businessName: userData.userType === 'vendor' ? userData.nombre : '',
        };
        
        setProfile(localProfile);
        setFormData({
          nombre: localProfile.nombre,
          email: localProfile.email,
          telefono: localProfile.telefono || '',
          businessName: localProfile.businessName || '',
          descripcion: localProfile.descripcion || '',
          categoria: localProfile.categoria || '',
          notificationsEnabled: localProfile.notificationsEnabled,
        });
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      if (user) {
        const fallbackProfile: UserProfile = {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          userType: user.userType,
          walletOpenPay: user.walletOpenPay,
          telefono: user.telefono,
          categoria: user.categoria,
          descripcion: user.descripcion,
          wallets: generateWalletsFromUserData(user),
          notificationsEnabled: true,
          businessName: user.userType === 'vendor' ? user.nombre : '',
          rating: 0,
          reseñasCount: 0,
          ventasRealizadas: 0,
          totalGanado: 0,
          comprasRealizadas: 0,
          totalGastado: 0,
        };
        
        setProfile(fallbackProfile);
        setFormData({
          nombre: fallbackProfile.nombre,
          email: fallbackProfile.email,
          telefono: fallbackProfile.telefono || '',
          businessName: fallbackProfile.businessName || '',
          descripcion: fallbackProfile.descripcion || '',
          categoria: fallbackProfile.categoria || '',
          notificationsEnabled: fallbackProfile.notificationsEnabled,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const normalizeDynamoDBData = (dynamoData: any): any => {
    if (!dynamoData) return {};
    
    const normalized: any = {};
    
    Object.keys(dynamoData).forEach(key => {
      const value = dynamoData[key];
      
      if (value.S) {
        normalized[key] = value.S;
      } else if (value.N) {
        normalized[key] = parseFloat(value.N);
      } else if (value.M) {
        normalized[key] = normalizeDynamoDBData(value.M);
      } else if (value.L) {
        normalized[key] = value.L.map((item: any) => {
          if (item.S) return item.S;
          if (item.N) return parseFloat(item.N);
          if (item.M) return normalizeDynamoDBData(item.M);
          return item;
        });
      } else if (value.BOOL !== undefined) {
        normalized[key] = value.BOOL;
      } else {
        normalized[key] = value;
      }
    });
    
    return normalized;
  };

  const generateWalletsFromUserData = (userData: any): OpenPaymentWallet[] => {
    const wallets: OpenPaymentWallet[] = [];
    
    if (userData.walletOpenPay) {
      wallets.push({
        id: '1',
        paymentPointer: `$ilp.interledger-test.dev/${userData.walletOpenPay}`,
        currency: 'MXN',
        isDefault: true,
        balance: userData.totalGanado || userData.totalGastado || 0,
      });
    }
    
    return wallets;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      if (!formData.nombre.trim() || !formData.email.trim()) {
        Alert.alert('Error', 'Nombre y email son obligatorios');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(prev => prev ? { 
        ...prev, 
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        businessName: formData.businessName,
      } : null);
      
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        <Text style={styles.subErrorText}>Verifica tu conexión e intenta nuevamente</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.nombre}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <Text style={styles.userType}>
          {profile.userType === 'vendor' ? 'Vendedor' : 'Cliente'}
          {profile.categoria && ` • ${profile.categoria}`}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nombre: text }))}
                placeholder="Ingresa tu nombre"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Ingresa tu email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.telefono}
                onChangeText={(text) => setFormData(prev => ({ ...prev, telefono: text }))}
                placeholder="Ingresa tu teléfono"
                keyboardType="phone-pad"
              />
            </View>

            {profile.userType === 'vendor' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre del Negocio</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.businessName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
                    placeholder="Nombre de tu negocio"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Categoría</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.categoria}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, categoria: text }))}
                    placeholder="Categoría de tu negocio"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.descripcion}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, descripcion: text }))}
                    placeholder="Descripción de tu negocio"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            )}

            <View style={styles.switchGroup}>
              <Text style={styles.label}>Notificaciones</Text>
              <Switch
                value={formData.notificationsEnabled}
                onValueChange={(value) => setFormData(prev => ({ ...prev, notificationsEnabled: value }))}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.notificationsEnabled ? '#6200ee' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{profile.nombre}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{profile.telefono || 'No especificado'}</Text>
            </View>
            {profile.userType === 'vendor' && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Negocio:</Text>
                  <Text style={styles.infoValue}>{profile.businessName || profile.nombre}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Categoría:</Text>
                  <Text style={styles.infoValue}>{profile.categoria || 'No especificada'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Descripción:</Text>
                  <Text style={styles.infoValue}>{profile.descripcion || 'No especificada'}</Text>
                </View>
              </>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha Registro:</Text>
              <Text style={styles.infoValue}>
                {profile.fechaRegistro ? new Date(profile.fechaRegistro).toLocaleDateString() : 'No disponible'}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wallet OpenPayment</Text>
        </View>

        {profile.wallets.length > 0 ? (
          profile.wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletName}>
                    {wallet.currency} Wallet {wallet.isDefault && '⭐'}
                  </Text>
                  <Text style={styles.walletCurrency}>
                    Moneda: {wallet.currency}
                  </Text>
                </View>
              </View>
              
              <View style={styles.paymentPointerContainer}>
                <Text style={styles.paymentPointerLabel}>Payment Pointer:</Text>
                <Text style={styles.paymentPointer} numberOfLines={1}>
                  {wallet.paymentPointer}
                </Text>
              </View>

              {wallet.balance !== undefined && (
                <View style={styles.balanceContainer}>
                  <Text style={styles.walletBalance}>
                    Balance: {wallet.currency} ${wallet.balance.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noWalletsContainer}>
            <Text style={styles.noWalletsText}>No hay wallets configuradas</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsContainer}>
          {profile.userType === 'vendor' ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.ventasRealizadas || 0}</Text>
                <Text style={styles.statLabel}>Ventas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${(profile.totalGanado || 0).toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Ganado</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.rating || 0}⭐</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.reseñasCount || 0}</Text>
                <Text style={styles.statLabel}>Reseñas</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.comprasRealizadas || 0}</Text>
                <Text style={styles.statLabel}>Compras</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${(profile.totalGastado || 0).toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Gastado</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.rating || 0}⭐</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  subErrorText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 5,
  },
  userType: {
    fontSize: 14,
    color: '#b39ddb',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6200ee',
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    gap: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  walletCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  walletCurrency: {
    fontSize: 14,
    color: '#666',
  },
  paymentPointerContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  paymentPointerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  paymentPointer: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  balanceContainer: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 5,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
  },
  noWalletsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noWalletsText: {
    color: '#666',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;