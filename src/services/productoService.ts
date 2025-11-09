// services/productoService.ts
import { dynamodb, Producto, TABLE_NAME } from '../aws-config';

export const productoService = {
  // Obtener productos del vendedor - OPTIMIZADO
  async obtenerProductosPorVendedor(vendedorId: string): Promise<Producto[]> {
    try {
      console.log('🔍 Buscando productos para:', vendedorId);
      
      if (!dynamodb) {
        console.error('❌ DynamoDB no configurado');
        return [];
      }

      // INTENTO 1: Query con índice (más rápido)
      try {
        console.log('🎯 Intentando query con índice...');
        const queryParams = {
          TableName: TABLE_NAME,
          IndexName: 'vendedorId-index', // Este índice debe existir en DynamoDB
          KeyConditionExpression: 'vendedorId = :vendedorId',
          ExpressionAttributeValues: {
            ':vendedorId': vendedorId
          },
          Limit: 50 // Limitar resultados para mayor velocidad
        };

        const queryResult = await dynamodb.query(queryParams).promise();
        console.log('✅ Query exitoso, productos encontrados:', queryResult.Items?.length);
        
        if (queryResult.Items && queryResult.Items.length > 0) {
          return this.procesarProductos(queryResult.Items, vendedorId);
        }
      } catch (queryError) {
        console.log('⚠️ Query falló, intentando scan...', queryError.message);
      }

      // INTENTO 2: Scan optimizado (más lento pero funciona sin índice)
      console.log('🔎 Realizando scan optimizado...');
      const scanParams = {
        TableName: TABLE_NAME,
        FilterExpression: 'vendedorId = :vendedorId',
        ExpressionAttributeValues: {
          ':vendedorId': vendedorId
        },
        Limit: 50, // Limitar para evitar timeouts
        ProjectionExpression: 'id, vendedorId, nombre, precio, stock, categoria, descripcion, imagen, fechaCreacion, activo' // Solo campos necesarios
      };

      const scanResult = await dynamodb.scan(scanParams).promise();
      console.log('✅ Scan completado, productos:', scanResult.Items?.length);
      
      return this.procesarProductos(scanResult.Items || [], vendedorId);

    } catch (error: any) {
      console.error('❌ Error en obtenerProductosPorVendedor:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      return [];
    }
  },

  // Procesar productos - función auxiliar
  procesarProductos(items: any[], vendedorId: string): Producto[] {
    if (!items || items.length === 0) {
      console.log('📭 No se encontraron productos');
      return [];
    }

    const productos = items
      .filter(item => item.vendedorId === vendedorId) // Filtro adicional por seguridad
      .map((item: any) => ({
        id: item.id || `prod_${Date.now()}`,
        vendedorId: item.vendedorId || vendedorId,
        nombre: item.nombre || 'Producto sin nombre',
        descripcion: item.descripcion || '',
        precio: Number(item.precio) || 0,
        categoria: item.categoria || 'General',
        imagen: item.imagen || '',
        stock: Number(item.stock) || 0,
        fechaCreacion: item.fechaCreacion || new Date().toISOString(),
        activo: item.activo !== undefined ? item.activo : true
      }));

    console.log('📦 Productos procesados:', productos.length);
    productos.forEach((prod, index) => {
      console.log(`   ${index + 1}. ${prod.nombre} - $${prod.precio}`);
    });

    return productos;
  },

  // Crear nuevo producto - OPTIMIZADO
  async crearProducto(producto: Producto): Promise<boolean> {
    try {
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

      console.log('💾 Guardando producto:', productoValidado.nombre);

      const params = {
        TableName: TABLE_NAME,
        Item: productoValidado
      };

      await dynamodb.put(params).promise();
      console.log('✅ Producto guardado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      return false;
    }
  },

  // ... otros métodos se mantienen igual
  async actualizarProducto(productoId: string, updates: Partial<Producto>): Promise<boolean> {
    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: { [key: string]: string } = {};
      const expressionAttributeValues: { [key: string]: any } = {};

      Object.keys(updates).forEach((key: string) => {
        if (key !== 'id' && key !== 'vendedorId') {
          const attributeKey = `#${key}`;
          const valueKey = `:${key}`;
          
          updateExpression.push(`${attributeKey} = ${valueKey}`);
          expressionAttributeNames[attributeKey] = key;
          expressionAttributeValues[valueKey] = (updates as any)[key];
        }
      });

      if (updateExpression.length === 0) {
        console.log('ℹ️ No hay campos para actualizar');
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
      console.log('✅ Producto actualizado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
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
      console.log('✅ Producto eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      return false;
    }
  }
};