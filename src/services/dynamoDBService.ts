// dynamoDBService.ts - ACTUALIZADO (similar a tu ejemplo)
import { dynamodb, TABLE_NAME, UserData, CreateUserResponse } from '../aws-config';

export const dynamoDBService = {
  async createUser(userData: UserData): Promise<CreateUserResponse> {
    const params = {
      TableName: TABLE_NAME,
      Item: userData
    };

    try {
      await dynamodb.put(params).promise();
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  },

  async checkEmailExists(email: string): Promise<boolean> {
    // PRIMERO intentar con QUERY (índice secundario)
    const queryParams = {
      TableName: TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim()
      }
    };

    try {
      console.log('🔍 Buscando email con query...');
      const result = await dynamodb.query(queryParams).promise();
      return result.Items ? result.Items.length > 0 : false;
    } catch (error: any) {
      console.log('⚠️ Query falló, intentando con scan...', error.code);
      
      // Si query falla, intentar con SCAN
      try {
        const scanParams = {
          TableName: TABLE_NAME,
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': email.toLowerCase().trim()
          }
        };

        const scanResult = await dynamodb.scan(scanParams).promise();
        return scanResult.Items ? scanResult.Items.length > 0 : false;
      } catch (scanError) {
        console.error('❌ Error en scan también:', scanError);
        return false;
      }
    }
  },

  async getAllUsers(): Promise<any[]> {
    const params = {
      TableName: TABLE_NAME
    };

    try {
      const result = await dynamodb.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  async getUserById(userId: string): Promise<any> {
    // AHORA USA GET ITEM (más eficiente)
    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: userId
      }
    };

    try {
      const result = await dynamodb.get(params).promise();
      return result.Item || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  async getUsersByType(userType: 'client' | 'vendor'): Promise<any[]> {
    // USANDO ÍNDICE SECUNDARIO
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'UserTypeIndex',
      KeyConditionExpression: 'userType = :userType',
      ExpressionAttributeValues: {
        ':userType': userType
      }
    };

    try {
      const result = await dynamodb.query(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error getting users by type:', error);
      return [];
    }
  },

  async loginUser(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // PRIMERO buscar por email usando índice
      const emailParams = {
        TableName: TABLE_NAME,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase().trim()
        }
      };

      const emailResult = await dynamodb.query(emailParams).promise();
      
      if (emailResult.Items && emailResult.Items.length > 0) {
        const user = emailResult.Items[0];
        if (user.password === password) {
          return { success: true, user };
        } else {
          return { success: false, error: 'Contraseña incorrecta' };
        }
      } else {
        return { success: false, error: 'Usuario no encontrado' };
      }
    } catch (error: any) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  },

  // MÉTODO PARA VER TODOS LOS USUARIOS
  async listAllUsers(): Promise<any[]> {
    try {
      const users = await this.getAllUsers();
      
      // Ordenar por tipo y fecha
      return users.sort((a, b) => {
        if (a.userType !== b.userType) {
          return a.userType === 'vendor' ? -1 : 1;
        }
        return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
      });
    } catch (error) {
      console.error('Error listing users:', error);
      return [];
    }
  }
};