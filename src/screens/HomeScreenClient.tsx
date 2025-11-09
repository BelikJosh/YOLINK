// screens/HomeScreenClient.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  Dimensions,
  TouchableOpacity 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/Appnavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route?: any;
};

const { width, height } = Dimensions.get('window');

const HomeScreenClient = ({ navigation, route }: Props) => {
  const user = route?.params?.user;
  const [region, setRegion] = useState({
    latitude: user?.ubicacionActual?.lat || 19.4326,
    longitude: user?.ubicacionActual?.lng || -99.1332,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Negocios de ejemplo
  const businessMarkers = [
    {
      id: 1,
      title: "Artesanías Mexicanas",
      description: "Productos artesanales locales",
      coordinate: { latitude: 19.4326, longitude: -99.1332 },
      type: 'artesanias'
    },
    {
      id: 2,
      title: "Restaurante Local", 
      description: "Comida tradicional mexicana",
      coordinate: { latitude: 19.4340, longitude: -99.1350 },
      type: 'restaurante'
    },
    {
      id: 3,
      title: "Galería de Arte",
      description: "Exposiciones de artistas locales", 
      coordinate: { latitude: 19.4310, longitude: -99.1310 },
      type: 'arte'
    },
    {
      id: 4,
      title: "Mercado Tradicional",
      description: "Productos frescos y souvenirs",
      coordinate: { latitude: 19.4330, longitude: -99.1340 },
      type: 'mercado'
    }
  ];

  const handleMarkerPress = (marker: any) => {
    Alert.alert(
      marker.title,
      marker.description,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver Detalles', onPress: () => console.log('Ver detalles:', marker.title) }
      ]
    );
  };

  const getMarkerColor = (type: string) => {
    switch(type) {
      case 'artesanias': return '#FF6B6B';
      case 'restaurante': return '#4ECDC4'; 
      case 'arte': return '#45B7D1';
      case 'mercado': return '#96CEB4';
      default: return '#667eea';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>¡Hola, {user?.nombre}!</Text>
        <Text style={styles.role}>👤 Turista - Explorando negocios locales</Text>
        <Text style={styles.location}>📍 CDMX, México</Text>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
        >
          {businessMarkers.map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onPress={() => handleMarkerPress(marker)}
              pinColor={getMarkerColor(marker.type)}
            />
          ))}
        </MapView>
      </View>

      {/* Leyenda de colores */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Leyenda:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Artesanías</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>Restaurantes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#45B7D1' }]} />
            <Text style={styles.legendText}>Arte</Text>
          </View>
        </View>
      </View>

      {/* Acciones Rápidas */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => Alert.alert('Buscar', 'Funcionalidad en desarrollo')}
          >
            <Text style={styles.actionEmoji}>🔍</Text>
            <Text style={styles.actionText}>Buscar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => Alert.alert('Favoritos', 'Tus lugares guardados')}
          >
            <Text style={styles.actionEmoji}>⭐</Text>
            <Text style={styles.actionText}>Favoritos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => Alert.alert('Pedidos', 'Historial de pedidos')}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionText}>Pedidos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  legend: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default HomeScreenClient;