// screens/CobrarScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { productoService } from '../services/productoService';
import { ventaService } from '../services/ventaService';
import { paymentService } from '../services/paymentService'; // NUEVO SERVICIO
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

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
  const [paymentInfo, setPaymentInfo] = useState<any>(null); // NUEVO: info del pago
  
  const isFocused = useIsFocused();


  const API_BASE_URL = 'http://192.168.14.62:3001'; // ← CAMBIA ESTA IP

  useEffect(() => {
    if (isFocused) {
      cargarUsuarioYProductos();
    }
  }, [isFocused]);

  const cargarUsuarioYProductos = async () => {
    try {
      setLoading(true);
      const userString = await AsyncStorage.getItem('currentUser');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
        
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

  const agregarProducto = (producto: any) => {
    if (!producto.precio) {
      console.error('❌ Producto sin precio:', producto);
      Alert.alert('Error', 'El producto no tiene precio definido');
      return;
    }

    const existente = productosSeleccionados.find(p => p.producto.id === producto.id);
    
    if (existente) {
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

  // FUNCIÓN ACTUALIZADA: Generar QR con Open Payments
  const generarQR = async () => {
    if (productosSeleccionados.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un producto');
      return;
    }

    setGenerandoQR(true);

    try {
      const total = calcularTotal();
      
      // 1. Generar QR de pago con el servidor Open Payments
      const qrResult = await paymentService.generatePaymentQR(
        total.toString(),
        `Compra de ${productosSeleccionados.length} productos`,
        user?.nombre || 'Vendedor'
      );

      if (qrResult.ok && qrResult.qrCode) {
        // 2. Crear registro de venta en DynamoDB
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
          total: total,
          fecha: new Date().toISOString(),
          estado: 'pendiente',
          qrCode: qrResult.qrCode,
          paymentInfo: qrResult.paymentInfo // Guardar info del pago
        };

        // 3. Guardar venta en la base de datos
        const exito = await ventaService.crearVenta(venta);

        if (exito) {
          setQrCode(qrResult.qrCode);
          setPaymentInfo(qrResult.paymentInfo);
          Alert.alert('Éxito', 'QR de pago generado correctamente');
        } else {
          Alert.alert('Error', 'No se pudo guardar la venta');
        }
      } else {
        Alert.alert('Error', qrResult.error || 'No se pudo generar el QR de pago');
      }
    } catch (error) {
      console.error('Error generando QR:', error);
      Alert.alert('Error', 'No se pudo conectar con el servicio de pagos');
    } finally {
      setGenerandoQR(false);
    }
  };

  const limpiarCarrito = () => {
    setProductosSeleccionados([]);
    setQrCode('');
    setPaymentInfo(null);
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

        {/* QR Code Generado */}
        {qrCode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR de Pago Generado</Text>
            <View style={styles.qrContainer}>
              <Image source={{ uri: qrCode }} style={styles.qrImage} />
            </View>
            
            {paymentInfo && (
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentInfoTitle}>Información del Pago:</Text>
                <Text style={styles.paymentInfoText}>Monto: ${paymentInfo.amount}</Text>
                <Text style={styles.paymentInfoText}>Descripción: {paymentInfo.description}</Text>
                <Text style={styles.paymentInfoText}>Vendedor: {paymentInfo.vendor}</Text>
                <Text style={styles.paymentInfoHint}>
                  El cliente debe escanear este QR con su app para pagar
                </Text>
              </View>
            )}
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

// ESTILOS ACTUALIZADOS - Agregar estos nuevos estilos
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
  qrImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  paymentInfo: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 5,
  },
  paymentInfoHint: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
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