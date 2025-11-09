import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VendorTabs'>;

type Props = {
  navigation: HomeScreenNavigationProp;
  route?: any;
};

const HomeScreenVendor = ({ navigation, route }: Props) => {
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState({
    salesToday: 0,
    totalToday: 0,
    totalProducts: 0,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setDashboardData({
        salesToday: user?.ventasRealizadas || 0,
        totalToday: user?.totalGanado || 0,
        totalProducts: 42,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, log out',
          onPress: async () => {
            await AsyncStorage.removeItem('currentUser');
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const handleCharge = () => {
    navigation.navigate('MakeCount' as any);
  };

  const handleAddProduct = () => {
    navigation.navigate('Catalogue' as any);
  };

  const handleSalesHistory = () => {
    navigation.navigate('HistorialVentas' as any);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.nombre || 'Vendor'}!
        </Text>
        <Text style={styles.subtitle}>
          {user?.descripcion || 'Vendor Dashboard'}
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today’s Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard]}>
            <MaterialIcons name="attach-money" size={26} color="#4ecdc4" />
            <Text style={styles.statValue}>${dashboardData.totalToday.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>

          <View style={[styles.statCard]}>
            <MaterialIcons name="shopping-cart" size={26} color="#1a535c" />
            <Text style={styles.statValue}>{dashboardData.salesToday}</Text>
            <Text style={styles.statLabel}>Sales Made</Text>
          </View>

          <View style={[styles.statCard]}>
            <MaterialIcons name="inventory" size={26} color="#ff6b6b" />
            <Text style={styles.statValue}>{dashboardData.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </View>
      </View>

      {/* Quick Access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <View style={styles.quickAccessGrid}>
          <TouchableOpacity style={styles.quickAccessItem} onPress={handleCharge}>
            <View style={styles.quickAccessContent}>
              <MaterialIcons name="qr-code" size={34} color="#4ecdc4" />
              <Text style={styles.quickAccessTitle}>Charge</Text>
              <Text style={styles.quickAccessSubtitle}>Generate QR</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessItem} onPress={handleAddProduct}>
            <View style={styles.quickAccessContent}>
              <MaterialIcons name="add-circle" size={34} color="#1a535c" />
              <Text style={styles.quickAccessTitle}>Add</Text>
              <Text style={styles.quickAccessSubtitle}>New Product</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.historyButton} onPress={handleSalesHistory}>
          <MaterialIcons name="history" size={20} color="#1a535c" />
          <Text style={styles.historyButtonText}>Sales History</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Sales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sales</Text>

        <View style={styles.salesList}>
          <View style={styles.saleItem}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleProduct}>Embroidered Huipil</Text>
              <Text style={styles.saleTime}>10 min ago</Text>
            </View>
            <Text style={styles.saleAmount}>$450</Text>
          </View>

          <View style={styles.saleItem}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleProduct}>Alebrijes x2</Text>
              <Text style={styles.saleTime}>1 hour ago</Text>
            </View>
            <Text style={styles.saleAmount}>$200</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdfb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 2,
    borderBottomColor: '#c1f9e1',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4ecdc4',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#c1f9e1',
    shadowColor: '#1a535c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a535c',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#f8fdfb',
    borderWidth: 1,
    borderColor: '#c1f9e1',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a535c',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#95a5a6',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quickAccessItem: {
    flex: 1,
    backgroundColor: '#f8fdfb',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#c1f9e1',
    alignItems: 'center',
  },
  quickAccessContent: {
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a535c',
    marginTop: 8,
    marginBottom: 4,
  },
  quickAccessSubtitle: {
    fontSize: 12,
    color: '#95a5a6',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 8,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  salesList: {
    marginTop: 10,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#c1f9e1',
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a535c',
    marginBottom: 4,
  },
  saleTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
});

export default HomeScreenVendor;
