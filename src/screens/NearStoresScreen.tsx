import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NearStoresScreen = ({ navigation }: any) => {
  const stores = [
    {
      id: '1',
      name: 'Cafetería La Esquina',
      address: 'Av. Central 102, CDMX',
      latitude: 19.4326,
      longitude: -99.1332,
    },
    {
      id: '2',
      name: 'Tienda Orgánica VerdeVida',
      address: 'Calle Reforma 89, CDMX',
      latitude: 19.4365,
      longitude: -99.1402,
    },
  ];

  const handleRoute = (store: any) => {
    navigation.navigate('Explore', { store });
  };

  const handleFavorite = (store: any) => {
    navigation.navigate('Favorites', { store });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tiendas Cercanas</Text>
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.routeButton}
                onPress={() => handleRoute(item)}
              >
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.btnText}>Trazar Ruta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleFavorite(item)}
              >
                <Ionicons name="heart" size={18} color="#fff" />
                <Text style={styles.btnText}>Agregar a Favoritos</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default NearStoresScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fff7', padding: 10 },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a535c',
    textAlign: 'center',
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 4,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1a535c' },
  address: { fontSize: 14, color: '#4f6367', marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  routeButton: {
    flexDirection: 'row',
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  favoriteButton: {
    flexDirection: 'row',
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});