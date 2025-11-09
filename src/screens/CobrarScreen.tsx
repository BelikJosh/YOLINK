// screens/CobrarScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { productoService } from '../services/productoService';
import { ventaService } from '../services/ventaService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { useIsFocused } from '@react-navigation/native'; // IMPORTANTE: Agrega esto

interface ProductoSeleccionado {
  producto: any;
  cantidad: number;
  subtotal: number;
}

const CobrarScreen = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  const [loading, setLoading] = useState(true);
  const [generandoQR, setGenerandoQR] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  // Hook para detectar cuando la pantalla está enfocada
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      cargarUsuarioYProductos();
    }
  }, [isFocused]); // Se ejecuta cada vez que la pantalla recibe foco

  const cargarUsuarioYProductos = async () => {
    try {
      setLoading(true);
      const userString = await AsyncStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
        
        // Cargar productos del vendedor
        const productosData = await productoService.obtenerProductosPorVendedor(userData.id);
        setProductos(productosData);
        console.log('🔄 Productos cargados en Cobrar:', productosData.length);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... el resto del código se mantiene igual ...
 // En CobrarScreen.tsx, en la función agregarProducto:
const agregarProducto = (producto: any) => {
  // Validar que el producto tenga precio
  if (!producto.precio) {
    console.error('❌ Producto sin precio:', producto);
    Alert.alert('Error', 'El producto no tiene precio definido');
    return;
  }

  const existente = productosSeleccionados.find(p => p.producto.id === producto.id);
  
  if (existente) {
    // Si ya existe, aumentar cantidad
    const nuevaCantidad = existente.cantidad + 1;
    const nuevoSubtotal = nuevaCantidad * (producto.precio || 0);
    
    setProductosSeleccionados(prev => 
      prev.map(p => 
        p.producto.id === producto.id 
          ? { ...p, cantidad: nuevaCantidad, subtotal: nuevoSubtotal }
          : p
      )
    );
  } else {
    // Si no existe, agregar nuevo
    setProductosSeleccionados(prev => [
      ...prev,
      {
        producto,
        cantidad: 1,
        subtotal: producto.precio || 0
      }
    ]);
  }
};
  const removerProducto = (productoId: string) => {
    setProductosSeleccionados(prev => 
      prev.filter(p => p.producto.id !== productoId)
    );
  };

  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) {
      removerProducto(productoId);
      return;
    }

    setProductosSeleccionados(prev => 
      prev.map(p => {
        if (p.producto.id === productoId) {
          const nuevoSubtotal = nuevaCantidad * p.producto.precio;
          return { ...p, cantidad: nuevaCantidad, subtotal: nuevoSubtotal };
        }
        return p;
      })
    );
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, item) => total + item.subtotal, 0);
  };

  // En CobrarScreen.tsx, en la función generarQR, reemplaza esta parte:
const generarQR = async () => {
  if (productosSeleccionados.length === 0) {
    Alert.alert('Error', 'Selecciona al menos un producto');
    return;
  }

  setGenerandoQR(true);

  try {
    // Crear objeto de venta CON la propiedad qrCode
    const venta = {
      id: `venta_${Date.now()}`,
      vendedorId: user.id,
      productos: productosSeleccionados.map(item => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        precio: item.producto.precio,
        cantidad: item.cantidad,
        subtotal: item.subtotal
      })),
      total: calcularTotal(),
      fecha: new Date().toISOString(),
      estado: 'pendiente' as const,
      qrCode: '' // Inicializar como string vacío
    };

    // Generar QR en base64
    const qrData = JSON.stringify({
      ventaId: venta.id,
      vendedorId: user.id,
      total: venta.total,
      productos: venta.productos
    });

    // En una app real, aquí generarías el QR y lo convertirías a base64
    const qrBase64 = `data:image/png;base64,simulated_qr_code_${btoa(qrData)}`;
    
    // Actualizar la venta con el QR generado
    venta.qrCode = qrBase64;
    
    // Guardar venta en DynamoDB
    const exito = await ventaService.crearVenta(venta);

    if (exito) {
      setQrCode(qrBase64);
      Alert.alert('Éxito', 'QR generado correctamente');
    } else {
      Alert.alert('Error', 'No se pudo guardar la venta');
    }
  } catch (error) {
    console.error('Error generando QR:', error);
    Alert.alert('Error', 'No se pudo generar el QR');
  } finally {
    setGenerandoQR(false);
  }
};

  const limpiarCarrito = () => {
    setProductosSeleccionados([]);
    setQrCode('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Lista de Productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos Disponibles ({productos.length})</Text>
          {productos.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos en tu catálogo</Text>
          ) : (
            productos.map(producto => (
              <TouchableOpacity
    key={producto.id}
    style={styles.productoItem}
    onPress={() => agregarProducto(producto)}
  >
    <View style={styles.productoInfo}>
      <Text style={styles.productoNombre}>{producto.nombre || 'Producto sin nombre'}</Text>
      <Text style={styles.productoPrecio}>
        ${(producto.precio || 0).toFixed(2)}
      </Text>
      <Text style={styles.productoStock}>Stock: {producto.stock || 0}</Text>
    </View>
    <MaterialIcons name="add-circle" size={24} color="#48bb78" />
  </TouchableOpacity>
            ))
          )}
        </View>

        {/* Carrito */}
        {productosSeleccionados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carrito de Compra</Text>
            {productosSeleccionados.map(item => (
              <View key={item.producto.id} style={styles.carritoItem}>
                <View style={styles.carritoInfo}>
                  <Text style={styles.carritoNombre}>{item.producto.nombre}</Text>
                  <Text style={styles.carritoPrecio}>${item.producto.precio.toFixed(2)} c/u</Text>
                </View>
                <View style={styles.cantidadContainer}>
                  <TouchableOpacity
                    onPress={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                    style={styles.cantidadButton}
                  >
                    <MaterialIcons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.cantidadText}>{item.cantidad}</Text>
                  <TouchableOpacity
                    onPress={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                    style={styles.cantidadButton}
                  >
                    <MaterialIcons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removerProducto(item.producto.id)}
                    style={styles.eliminarButton}
                  >
                    <MaterialIcons name="delete" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtotalText}>${item.subtotal.toFixed(2)}</Text>
              </View>
            ))}
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total: ${calcularTotal().toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* QR Code */}
        {qrCode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Generado</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={JSON.stringify({
                  ventaId: `venta_${Date.now()}`,
                  total: calcularTotal(),
                  productos: productosSeleccionados.length
                })}
                size={200}
              />
            </View>
            <Text style={styles.qrInstruction}>Escanea este código para completar el pago</Text>
          </View>
        )}
      </ScrollView>

      {/* Botones de Acción */}
      <View style={styles.actionButtons}>
        {productosSeleccionados.length > 0 && !qrCode && (
          <TouchableOpacity
            style={styles.generarButton}
            onPress={generarQR}
            disabled={generandoQR}
          >
            {generandoQR ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="qr-code-2" size={20} color="#fff" />
                <Text style={styles.generarButtonText}>Generar QR de Pago</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {(productosSeleccionados.length > 0 || qrCode) && (
          <TouchableOpacity
            style={styles.limpiarButton}
            onPress={limpiarCarrito}
          >
            <Text style={styles.limpiarButtonText}>Limpiar Todo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    fontStyle: 'italic',
  },
  productoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  productoPrecio: {
    fontSize: 14,
    color: '#48bb78',
    fontWeight: 'bold',
  },
  productoStock: {
    fontSize: 12,
    color: '#718096',
  },
  carritoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  carritoInfo: {
    flex: 1,
  },
  carritoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  carritoPrecio: {
    fontSize: 12,
    color: '#718096',
  },
  cantidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  cantidadButton: {
    backgroundColor: '#667eea',
    padding: 5,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  cantidadText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  eliminarButton: {
    backgroundColor: '#e53e3e',
    padding: 5,
    borderRadius: 4,
    marginLeft: 10,
  },
  subtotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    minWidth: 80,
    textAlign: 'right',
  },
  totalContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrInstruction: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 10,
  },
  actionButtons: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  generarButton: {
    backgroundColor: '#48bb78',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  generarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  limpiarButton: {
    backgroundColor: '#e53e3e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  limpiarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CobrarScreen;