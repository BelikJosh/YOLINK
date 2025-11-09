import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { dynamodb, TABLE_NAME, UserData } from '../aws-config';
import { ClientTabParamList } from '../navigation/types';

type ProfileScreenNavigationProp = StackNavigationProp<
  ClientTabParamList,
  'ProfileClient'
>;

type Props = {
  navigation: ProfileScreenNavigationProp;
  route?: any;
};

const ProfileScreenClient = ({ navigation, route }: Props) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWallet, setShowWallet] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
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
            id: userId,
          },
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
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, cerrar',
        onPress: () => {
          navigation.getParent()?.navigate('Login');
        },
      },
    ]);
  };

  const handleWalletAccess = () => {
    setShowWallet(true);
    setWalletLoading(true);
  };

  const handleCloseWallet = () => {
    setShowWallet(false);
    setWalletLoading(false);
  };

  const walletUrl = 'https://pay.interledger-test.dev/payment-choice?receiver=https://ilp.interledger-test.dev/car21';

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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
                <Text style={styles.infoValue}>{user.rating || '0'} / 5.0</Text>
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

          <TouchableOpacity
            style={[styles.actionButton, styles.walletButton]}
            onPress={handleWalletAccess}
          >
            <Text style={styles.actionButtonText}>💰 Mi Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              🚪 Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Modal para la Wallet */}
      <Modal
        visible={showWallet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseWallet}
      >
        <View style={styles.modalContainer}>
          {/* Header del Modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mi Wallet</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseWallet}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* WebView */}
          {walletLoading && (
            <View style={styles.walletLoadingContainer}>
              <ActivityIndicator size="large" color="#4ecdc4" />
              <Text style={styles.walletLoadingText}>Cargando wallet...</Text>
            </View>
          )}
          
          <WebView
            source={{ uri: walletUrl }}
            style={styles.webview}
            onLoadStart={() => setWalletLoading(true)}
            onLoadEnd={() => setWalletLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('Error cargando WebView:', nativeEvent);
              Alert.alert('Error', 'No se pudo cargar la wallet');
              setWalletLoading(false);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4ecdc4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#95a5a6',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a535c',
  },
  statLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e9ecef',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  iconText: {
    fontSize: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a535c',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4ecdc4',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a535c',
  },
  walletButton: {
    backgroundColor: '#4fd1c5',
    borderColor: '#4fd1c5',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  logoutButtonText: {
    color: '#fff',
  },
  footer: {
    height: 20,
  },
  // Estilos para el modal de Wallet
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a535c',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  walletLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  walletLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1a535c',
  },
});

export default ProfileScreenClient;