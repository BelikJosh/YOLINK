import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { dynamodb, TABLE_NAME, UserData } from '../aws-config';
import { ClientTabParamList } from '../navigation/types';

type ProfileScreenNavigationProp = StackNavigationProp<ClientTabParamList, 'ProfileClient'>;

type Props = {
  navigation: ProfileScreenNavigationProp;
  route?: any;
};

const ProfileScreen = ({ navigation, route }: Props) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const userFromRoute = route?.params?.user;

  // Obtener datos del usuario desde AWS DynamoDB
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Si ya tenemos datos del usuario desde el route, usarlos
        if (userFromRoute) {
          console.log('📱 Usuario desde route:', userFromRoute);
          setUser(userFromRoute);
          setLoading(false);
          return;
        }

        // Si no hay usuario en el route, intentar obtenerlo de DynamoDB
        const userId = await getUserIdFromStorage();
        
        if (!userId) {
          console.log('❌ No se encontró ID de usuario');
          setLoading(false);
          return;
        }

        console.log('🔍 Buscando usuario en DynamoDB con ID:', userId);

        const params = {
          TableName: TABLE_NAME,
          Key: {
            id: userId
          }
        };

        const result = await dynamodb.get(params).promise();
        
        if (result.Item) {
          console.log('✅ Usuario encontrado en DynamoDB:', result.Item);
          setUser(result.Item as UserData);
        } else {
          console.log('❌ Usuario no encontrado en DynamoDB');
          Alert.alert('Error', 'No se pudo cargar la información del usuario');
        }
      } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        Alert.alert('Error', 'No se pudo cargar la información del perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userFromRoute]);

  // Función para obtener el ID del usuario desde AsyncStorage (simulada)
  const getUserIdFromStorage = async (): Promise<string | null> => {
    if (userFromRoute?.id) {
      return userFromRoute.id;
    }
    return null;
  };

  const handleEditProfile = () => {
    Alert.alert('Editar Perfil', 'Funcionalidad en desarrollo');
  };

  const handleSettings = () => {
    Alert.alert('Configuración', 'Funcionalidad en desarrollo');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, cerrar', 
          onPress: () => {
            // Usar el navigation del parent para navegar al Login
            navigation.getParent()?.navigate('Login');
          }
        },
      ]
    );
  };

  // Estados de carga
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // Si no hay usuario
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró información del usuario</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header del perfil */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user.nombre || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user.email || 'No disponible'}</Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.comprasRealizadas || '0'}</Text>
          <Text style={styles.statLabel}>Compras</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Favoritos</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.reseñasCount || '0'}</Text>
          <Text style={styles.statLabel}>Reseñas</Text>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.divider} />

      {/* Información Personal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre completo</Text>
              <Text style={styles.infoValue}>{user.nombre || 'No disponible'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>
                {user.telefono || 'No registrado'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>📍</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>
                {user.ubicacionActual ? 'CDMX, México' : 'No disponible'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>⭐</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>
                {user.rating || '0'} / 5.0
              </Text>
            </View>
          </View>

          {user.preferencias?.intereses && user.preferencias.intereses.length > 0 && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>🎯</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Intereses</Text>
                <Text style={styles.infoValue}>
                  {user.preferencias.intereses.join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
          <Text style={styles.actionButtonText}>✏️ Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
          <Text style={styles.actionButtonText}>⚙️ Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Espacio al final */}
      <View style={styles.footer} />
    </ScrollView>
  );
};

// ... (los estilos permanecen igual)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
  },
  header: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  divider: {
    height: 8,
    backgroundColor: '#f7fafc',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '400',
  },
  actionsSection: {
    padding: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#667eea',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e53e3e',
    shadowColor: 'transparent',
    elevation: 0,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButtonText: {
    color: '#e53e3e',
  },
  footer: {
    height: 30,
  },
  errorText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;