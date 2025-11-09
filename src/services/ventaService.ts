// services/ventaService.ts
import { dynamodb, TABLE_NAME, Venta } from '../aws-config';

export const ventaService = {
  // Crear nueva venta
  async crearVenta(venta: Venta): Promise<boolean> {
    try {
      const params = {
        TableName: TABLE_NAME,
        Item: venta
      };

      await dynamodb.put(params).promise();
      return true;
    } catch (error) {
      console.error('Error creando venta:', error);
      return false;
    }
  },

  // Obtener ventas del vendedor
  async obtenerVentasPorVendedor(vendedorId: string): Promise<Venta[]> {
    try {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'vendedorId = :vendedorId',
        ExpressionAttributeValues: {
          ':vendedorId': vendedorId
        }
      };

      const result = await dynamodb.scan(params).promise();
      return result.Items as Venta[] || [];
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      return [];
    }
  },

  // Actualizar estado de venta
  async actualizarEstadoVenta(ventaId: string, nuevoEstado: 'pendiente' | 'completada' | 'cancelada'): Promise<boolean> {
    try {
      const params = {
        TableName: TABLE_NAME,
        Key: { id: ventaId },
        UpdateExpression: 'SET #estado = :estado',
        ExpressionAttributeNames: {
          '#estado': 'estado'
        },
        ExpressionAttributeValues: {
          ':estado': nuevoEstado
        }
      };

      await dynamodb.update(params).promise();
      return true;
    } catch (error) {
      console.error('Error actualizando venta:', error);
      return false;
    }
  }
};