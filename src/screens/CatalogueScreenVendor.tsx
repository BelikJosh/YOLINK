// screens/CatalogueScreenVendor.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { productoService } from '../services/productoService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CatalogueScreenVendor = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Estado para nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock: ''
  });

  useEffect(() => {
    cargarUsuarioYProductos();
  }, []);

  const cargarUsuarioYProductos = async () => {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
        
        // Cargar productos del vendedor desde DynamoDB
        const productosData = await productoService.obtenerProductosPorVendedor(userData.id);
        setProducts(productosData);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setModalVisible(true);
  };

 // En CatalogueScreenVendor.tsx, en la función handleSaveProduct:
const handleSaveProduct = async () => {
  // Validaciones
  if (!nuevoProducto.nombre.trim()) {
    Alert.alert('Error', 'El nombre del producto es requerido');
    return;
  }

  if (!nuevoProducto.precio || parseFloat(nuevoProducto.precio) <= 0) {
    Alert.alert('Error', 'El precio debe ser mayor a 0');
    return;
  }

  if (!nuevoProducto.stock || parseInt(nuevoProducto.stock) < 0) {
    Alert.alert('Error', 'El stock no puede ser negativo');
    return;
  }

  try {
    const producto = {
      id: `producto_${Date.now()}`,
      vendedorId: user.id,
      nombre: nuevoProducto.nombre.trim(),
      descripcion: nuevoProducto.descripcion.trim(),
      precio: parseFloat(nuevoProducto.precio), // Asegurar que sea número
      categoria: nuevoProducto.categoria.trim() || 'General',
      stock: parseInt(nuevoProducto.stock) || 0,
      fechaCreacion: new Date().toISOString(),
      activo: true
    };

    console.log('➕ Creando producto:', producto);

    const exito = await productoService.crearProducto(producto);

    if (exito) {
      Alert.alert('Éxito', 'Producto agregado correctamente');
      setProducts(prev => [producto, ...prev]);
      resetForm();
      setModalVisible(false);
    } else {
      Alert.alert('Error', 'No se pudo guardar el producto');
    }
  } catch (error) {
    console.error('Error guardando producto:', error);
    Alert.alert('Error', 'No se pudo guardar el producto');
  }
};

  const resetForm = () => {
    setNuevoProducto({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      stock: ''
    });
  };

  const handleDeleteProduct = (producto: any) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que quieres eliminar "${producto.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const exito = await productoService.eliminarProducto(producto.id);
              if (exito) {
                Alert.alert('Éxito', 'Producto eliminado correctamente');
                setProducts(prev => prev.filter(p => p.id !== producto.id));
              } else {
                Alert.alert('Error', 'No se pudo eliminar el producto');
              }
            } catch (error) {
              console.error('Error eliminando producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        },
      ]
    );
  };

  const handleEditProduct = (producto: any) => {
    Alert.alert('Editar Producto', 'Funcionalidad en desarrollo');
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.nombre}</Text>
        <View style={styles.productActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditProduct(item)}
          >
            <MaterialIcons name="edit" size={18} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(item)}
          >
            <MaterialIcons name="delete" size={18} color="#e53e3e" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.productPrice}>${item.precio.toFixed(2)}</Text>
      <Text style={styles.productCategory}>Categoría: {item.categoria}</Text>
      <Text style={styles.productStock}>
        Stock: <Text style={item.stock > 0 ? styles.stockAvailable : styles.stockUnavailable}>
          {item.stock}
        </Text>
      </Text>
      {item.descripcion && (
        <Text style={styles.productDescription}>{item.descripcion}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi Catálogo</Text>
        <Text style={styles.subtitle}>
          {products.length} producto{products.length !== 1 ? 's' : ''} en tu catálogo
        </Text>
      </View>

      {/* Lista de Productos */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay productos en tu catálogo</Text>
            <Text style={styles.emptySubtext}>
              Agrega tu primer producto para comenzar a vender
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={cargarUsuarioYProductos}
      />

      {/* Botón Agregar Producto */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddProduct}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Agregar Producto</Text>
      </TouchableOpacity>

      {/* Modal para Agregar Producto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Nuevo Producto</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Producto *</Text>
                <TextInput
                  style={styles.input}
                  value={nuevoProducto.nombre}
                  onChangeText={(text) => setNuevoProducto(prev => ({ ...prev, nombre: text }))}
                  placeholder="Ej: Camiseta básica"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={nuevoProducto.descripcion}
                  onChangeText={(text) => setNuevoProducto(prev => ({ ...prev, descripcion: text }))}
                  placeholder="Describe tu producto..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Precio *</Text>
                  <TextInput
                    style={styles.input}
                    value={nuevoProducto.precio}
                    onChangeText={(text) => setNuevoProducto(prev => ({ ...prev, precio: text }))}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.label}>Stock *</Text>
                  <TextInput
                    style={styles.input}
                    value={nuevoProducto.stock}
                    onChangeText={(text) => setNuevoProducto(prev => ({ ...prev, stock: text }))}
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoría</Text>
                <TextInput
                  style={styles.input}
                  value={nuevoProducto.categoria}
                  onChangeText={(text) => setNuevoProducto(prev => ({ ...prev, categoria: text }))}
                  placeholder="Ej: Ropa, Electrónicos, etc."
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProduct}
              >
                <Text style={styles.saveButtonText}>Guardar Producto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  editButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#48bb78',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  stockAvailable: {
    color: '#48bb78',
    fontWeight: 'bold',
  },
  stockUnavailable: {
    color: '#e53e3e',
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#4a5568',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#667eea',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2d3748',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CatalogueScreenVendor;