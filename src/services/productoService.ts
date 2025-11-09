// services/productoService.ts
import { dynamodb, TABLE_NAME, Producto } from '../aws-config';

export const productoService = {
  // Obtener productos del vendedor - VERSIÓN CORREGIDA
  async obtenerProductosPorVendedor(vendedorId: string): Promise<Producto[]> {
    try {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'vendedorId = :vendedorId',
        ExpressionAttributeValues: {
          ':vendedorId': vendedorId
        }
      };

      const result = await dynamodb.scan(params).promise();
      
      // Validar y asegurar que todos los productos tengan los campos necesarios
      const productos = (result.Items as Producto[] || []).map(producto => ({
        id: producto.id || '',
        vendedorId: producto.vendedorId || vendedorId,
        nombre: producto.nombre || 'Producto sin nombre',
        descripcion: producto.descripcion || '',
        precio: producto.precio || 0,
        categoria: producto.categoria || 'General',
        imagen: producto.imagen || '',
        stock: producto.stock || 0,
        fechaCreacion: producto.fechaCreacion || new Date().toISOString(),
        activo: producto.activo !== undefined ? producto.activo : true
      }));

      console.log('📦 Productos cargados y validados:', productos);
      return productos;
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      return [];
    }
  },

  // Crear nuevo producto - VERSIÓN CORREGIDA
  async crearProducto(producto: Producto): Promise<boolean> {
    try {
      // Validar que todos los campos requeridos estén presentes
      const productoValidado: Producto = {
        id: producto.id || `producto_${Date.now()}`,
        vendedorId: producto.vendedorId,
        nombre: producto.nombre || 'Producto sin nombre',
        descripcion: producto.descripcion || '',
        precio: producto.precio || 0,
        categoria: producto.categoria || 'General',
        imagen: producto.imagen || '',
        stock: producto.stock || 0,
        fechaCreacion: producto.fechaCreacion || new Date().toISOString(),
        activo: producto.activo !== undefined ? producto.activo : true
      };

      console.log('💾 Guardando producto:', productoValidado);

      const params = {
        TableName: TABLE_NAME,
        Item: productoValidado
      };

      await dynamodb.put(params).promise();
      return true;
    } catch (error) {
      console.error('Error creando producto:', error);
      return false;
    }
  },

  // ... el resto de los métodos se mantiene igual
  async actualizarProducto(productoId: string, updates: Partial<Producto>): Promise<boolean> {
    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: { [key: string]: string } = {};
      const expressionAttributeValues: { [key: string]: any } = {};

      Object.keys(updates).forEach((key: string) => {
        const attributeKey = `#${key}`;
        const valueKey = `:${key}`;
        
        updateExpression.push(`${attributeKey} = ${valueKey}`);
        expressionAttributeNames[attributeKey] = key;
        expressionAttributeValues[valueKey] = (updates as any)[key];
      });

      if (updateExpression.length === 0) {
        console.log('No hay campos para actualizar');
        return true;
      }

      const params = {
        TableName: TABLE_NAME,
        Key: { id: productoId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      };

      await dynamodb.update(params).promise();
      return true;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      return false;
    }
  },

  async eliminarProducto(productoId: string): Promise<boolean> {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: { id: productoId }
      };

      await dynamodb.delete(params).promise();
      return true;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      return false;
    }
  }
};