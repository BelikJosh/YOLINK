// services/productService.ts
import { dynamodb, TABLE_NAME } from '../aws-config';
import { Product, CreateProductRequest } from '../types/Product';

export const productService = {
  // Obtener productos del vendedor
  async getProductsByVendor(vendedorId: string): Promise<Product[]> {
    if (!dynamodb) {
      console.error('DynamoDB not configured');
      return [];
    }

    try {
      const params = {
        TableName: TABLE_NAME,
        IndexName: 'VendedorIndex', // Necesitarás crear este índice en DynamoDB
        KeyConditionExpression: 'vendedorId = :vendedorId',
        ExpressionAttributeValues: {
          ':vendedorId': vendedorId
        }
      };

      const result = await dynamodb.query(params).promise();
      return result.Items as Product[] || [];
    } catch (error: any) {
      console.error('Error getting products:', error);
      
      // Fallback: usar scan si el índice no existe
      try {
        const scanParams = {
          TableName: TABLE_NAME,
          FilterExpression: 'vendedorId = :vendedorId',
          ExpressionAttributeValues: {
            ':vendedorId': vendedorId
          }
        };

        const scanResult = await dynamodb.scan(scanParams).promise();
        return scanResult.Items as Product[] || [];
      } catch (scanError) {
        console.error('Error in scan fallback:', scanError);
        return [];
      }
    }
  },

  // Crear nuevo producto
  async createProduct(productData: CreateProductRequest): Promise<{ success: boolean; product?: Product; error?: string }> {
    if (!dynamodb) {
      return { success: false, error: 'DynamoDB not configured' };
    }

    const newProduct: Product = {
      id: `Producto#${Date.now()}`,
      vendedorId: productData.vendedorId,
      nombre: productData.nombre,
      descripcion: productData.descripcion,
      precio: productData.precio,
      categoria: productData.categoria,
      imagen: productData.imagen,
      stock: productData.stock,
      disponible: true,
      fechaCreacion: new Date().toISOString(),
      rating: 0,
      reseñasCount: 0
    };

    const params = {
      TableName: TABLE_NAME,
      Item: newProduct
    };

    try {
      await dynamodb.put(params).promise();
      return { success: true, product: newProduct };
    } catch (error: any) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar producto
  async updateProduct(productId: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> {
    if (!dynamodb) {
      return { success: false, error: 'DynamoDB not configured' };
    }

    const updateExpression: string[] = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'vendedorId') {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = (updates as any)[key];
      }
    });

    if (updateExpression.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { id: productId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(id)'
    };

    try {
      await dynamodb.update(params).promise();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
  },

  // Eliminar producto
  async deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    if (!dynamodb) {
      return { success: false, error: 'DynamoDB not configured' };
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { id: productId }
    };

    try {
      await dynamodb.delete(params).promise();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
  }
};