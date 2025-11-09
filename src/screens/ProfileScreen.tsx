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
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta según tu estructura

// Tipos para OpenPayment
interface OpenPaymentWallet {
  id: string;
  address: string;
  balance?: number;
  currency: string;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  wallets: OpenPaymentWallet[];
  notificationsEnabled: boolean;
}

const ProfileScreen = () => {
  const { user, logout } = useAuth(); // Asumiendo que tienes un contexto de autenticación
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingWallet, setAddingWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');

  // Datos temporales del perfil
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    notificationsEnabled: true,
  });

  // Cargar datos del perfil
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      // Simular carga de datos - reemplaza con tu API real
      const mockProfile: UserProfile = {
        id: user?.id || '1',
        name: user?.name || 'Usuario Vendedor',
        email: user?.email || 'vendor@example.com',
        phone: '+1234567890',
        businessName: 'Mi Negocio',
        wallets: [
          {
            id: '1',
            address: '0x742d35Cc6634C0532925a3b8D1234567890ABCDE',
            balance: 150.75,
            currency: 'USD',
            isDefault: true,
          },
        ],
        notificationsEnabled: true,
      };

      setProfile(mockProfile);
      setFormData({
        name: mockProfile.name,
        email: mockProfile.email,
        phone: mockProfile.phone || '',
        businessName: mockProfile.businessName || '',
        notificationsEnabled: mockProfile.notificationsEnabled,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Validaciones básicas
      if (!formData.name.trim() || !formData.email.trim()) {
        Alert.alert('Error', 'Nombre y email son obligatorios');
        return;
      }

      // Aquí iría la llamada a tu API para actualizar el perfil
      console.log('Guardando perfil:', formData);
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWallet = async () => {
    if (!newWalletAddress.trim()) {
      Alert.alert('Error', 'Por favor ingresa una dirección de wallet válida');
      return;
    }

    try {
      setAddingWallet(true);
      
      // Aquí integrarías con OpenPayment API
      // Por ahora simulamos la creación
      const newWallet: OpenPaymentWallet = {
        id: Date.now().toString(),
        address: newWalletAddress,
        currency: 'USD',
        isDefault: profile?.wallets.length === 0,
      };

      setProfile(prev => prev ? {
        ...prev,
        wallets: [...prev.wallets, newWallet]
      } : null);

      setNewWalletAddress('');
      Alert.alert('Éxito', 'Wallet agregada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la wallet');
    } finally {
      setAddingWallet(false);
    }
  };

  const handleSetDefaultWallet = (walletId: string) => {
    if (!profile) return;

    const updatedWallets = profile.wallets.map(wallet => ({
      ...wallet,
      isDefault: wallet.id === walletId,
    }));

    setProfile({ ...profile, wallets: updatedWallets });
    // Aquí también guardarías el cambio en tu API
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
            const updatedWallets = profile.wallets.filter(wallet => wallet.id !== walletId);
            setProfile({ ...profile, wallets: updatedWallets });
            // Aquí también eliminarías de tu API
          },
        },
      ]
    );
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

  return (
    <ScrollView style={styles.container}>
      {/* Header del Perfil */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {formData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{formData.name}</Text>
        <Text style={styles.email}>{formData.email}</Text>
      </View>

      {/* Información del Perfil */}
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
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
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
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Ingresa tu teléfono"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Negocio</Text>
              <TextInput
                style={styles.input}
                value={formData.businessName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
                placeholder="Nombre de tu negocio"
              />
            </View>

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
              <Text style={styles.infoValue}>{formData.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{formData.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{formData.phone || 'No especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Negocio:</Text>
              <Text style={styles.infoValue}>{formData.businessName || 'No especificado'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Wallets de OpenPayment */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wallets OpenPayment</Text>
        </View>

        {profile?.wallets.map((wallet) => (
          <View key={wallet.id} style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <Text style={styles.walletName}>
                Wallet {wallet.currency} {wallet.isDefault && '(Principal)'}
              </Text>
              {!wallet.isDefault && (
                <View style={styles.walletActions}>
                  <TouchableOpacity
                    onPress={() => handleSetDefaultWallet(wallet.id)}
                    style={styles.walletActionButton}
                  >
                    <Text style={styles.walletActionText}>Hacer principal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteWallet(wallet.id)}
                    style={[styles.walletActionButton, styles.deleteButton]}
                  >
                    <Text style={styles.walletActionText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.walletAddress}>{wallet.address}</Text>
            {wallet.balance !== undefined && (
              <Text style={styles.walletBalance}>
                Balance: {wallet.currency} {wallet.balance.toFixed(2)}
              </Text>
            )}
          </View>
        ))}

        {/* Formulario para agregar nueva wallet */}
        <View style={styles.addWalletSection}>
          <Text style={styles.addWalletTitle}>Agregar Nueva Wallet</Text>
          <TextInput
            style={styles.walletInput}
            value={newWalletAddress}
            onChangeText={setNewWalletAddress}
            placeholder="Ingresa la dirección de la wallet"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[styles.addWalletButton, addingWallet && styles.addWalletButtonDisabled]}
            onPress={handleAddWallet}
            disabled={addingWallet}
          >
            {addingWallet ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addWalletButtonText}>Agregar Wallet</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Acciones */}
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
    alignItems: 'center',
    marginBottom: 5,
  },
  walletName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 10,
  },
  walletActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#6200ee',
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  walletActionText: {
    color: '#fff',
    fontSize: 12,
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#28a745',
  },
  addWalletSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addWalletTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  walletInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  addWalletButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  addWalletButtonDisabled: {
    opacity: 0.6,
  },
  addWalletButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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