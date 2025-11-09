// src/screens/FavoritesStoresScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { dynamodb, TABLE_NAME } from '../aws-config';

interface FavoriteVendor {
  id: string;
  name: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  description?: string;
  direccion?: string;
  telefono?: string;
  fechaAgregado: string;
}

const FavoritesStoresScreen = ({ navigation }: any) => {
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState('user123');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'userType = :userType AND userId = :userId',
        ExpressionAttributeValues: {
          ':userType': 'favorite',
          ':userId': userId
        }
      };

      const result = await dynamodb.scan(params).promise();
      
      if (result.Items && result.Items.length > 0) {
        console.log('Favoritos encontrados:', result.Items.length);
        
        const favoritesData: FavoriteVendor[] = result.Items.map((item: any) => {
          try {
            const vendorData = JSON.parse(item.vendorData?.S || '{}');
            return {
              id: item.vendorId?.S || '',
              name: vendorData.name || 'Sin nombre',
              category: vendorData.category || 'General',
              location: vendorData.location || { latitude: 0, longitude: 0 },
              rating: vendorData.rating || 0,
              description: vendorData.description,
              direccion: vendorData.direccion,
              telefono: vendorData.telefono,
              fechaAgregado: item.fechaAgregado?.S || new Date().toISOString()
            };
          } catch (error) {
            console.error('Error parsing vendor data:', error);
            return null;
          }
        }).filter(Boolean) as FavoriteVendor[];

        setFavorites(favoritesData);
      } else {
        console.log('No hay favoritos guardados');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (vendorId: string, vendorName: string) => {
    Alert.alert(
      'Eliminar de favoritos',
      `¿Estás seguro de que quieres eliminar ${vendorName} de tus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const params = {
                TableName: TABLE_NAME,
                Key: {
                  id: { S: `FAVORITE#${userId}#${vendorId}` }
                }
              };

              await dynamodb.delete(params).promise();
              
              // Actualizar lista local
              setFavorites(favorites.filter(fav => fav.id !== vendorId));
              Alert.alert('✅ Eliminado', 'Tienda eliminada de favoritos');
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('❌ Error', 'No se pudo eliminar de favoritos');
            }
          }
        }
      ]
    );
  };

  const handleVendorPress = (vendor: FavoriteVendor) => {
    Alert.alert(
      vendor.name,
      `¿Qué te gustaría hacer con ${vendor.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Ver en mapa', 
          onPress: () => navigation.navigate('Explore', { vendorToFocus: vendor })
        },
        { 
          text: 'Eliminar de favoritos', 
          style: 'destructive',
          onPress: () => removeFromFavorites(vendor.id, vendor.name)
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteVendor }) => (
    <TouchableOpacity 
      style={styles.favoriteItem}
      onPress={() => handleVendorPress(item)}
    >
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteCategory}>{item.category}</Text>
        <Text style={styles.favoriteRating}>⭐ {item.rating}</Text>
        {item.direccion && (
          <Text style={styles.favoriteAddress}>
            <Ionicons name="location" size={12} color="#666" /> {item.direccion}
          </Text>
        )}
        <Text style={styles.favoriteDate}>
          Agregado: {new Date(item.fechaAgregado).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => removeFromFavorites(item.id, item.name)}
        style={styles.removeButton}
      >
        <Ionicons name="trash" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiendas Favoritas</Text>
      <Text style={styles.subtitle}>
        {favorites.length} tiendas guardadas en tus favoritos
      </Text>
      
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No tienes tiendas favoritas</Text>
          <Text style={styles.emptySubtext}>
            Agrega tiendas a tus favoritos desde el mapa para verlas aquí
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.exploreButtonText}>Explorar Tiendas</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  favoriteCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteRating: {
    fontSize: 12,
    color: '#ff9500',
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  favoriteDate: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FavoritesStoresScreen;