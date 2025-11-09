// services/dynamoDBService.ts
import { dynamodb, TABLE_NAME, UserData, CreateUserResponse } from '../aws-config';

export const dynamoDBService = {
  async createUser(userData: UserData): Promise<CreateUserResponse> {
    // Validar que tenemos conexión a DynamoDB
    if (!dynamodb) {
      return { 
        success: false, 
        error: 'DynamoDB not configured' 
      };
    }

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
        error: error.message || 'Unknown error creating user' 
      };
    }
  },

  async checkEmailExists(email: string): Promise<boolean> {
    if (!dynamodb) {
      console.error('DynamoDB not configured in checkEmailExists');
      return false;
    }

    try {
      // Primero intentar con query (índice secundario)
      const queryParams = {
        TableName: TABLE_NAME,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase().trim()
        }
      };

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

  async loginUser(email: string, password: string): Promise<{ 
    success: boolean; 
    user?: any; 
    error?: string 
  }> {
    // Validar configuración primero
    if (!dynamodb) {
      return { 
        success: false, 
        error: 'Database not configured. Please check AWS credentials.' 
      };
    }

    try {
      console.log('🔐 Attempting login for:', email);
      
      // PRIMERO buscar por email usando scan (más confiable)
      const scanParams = {
        TableName: TABLE_NAME,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase().trim()
        }
      };

      console.log('📋 Scanning for user...');
      const scanResult = await dynamodb.scan(scanParams).promise();
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        const user = scanResult.Items[0];
        console.log('👤 User found:', user.nombre);
        
        if (user.password === password) {
          console.log('✅ Login successful for:', user.nombre);
          return { success: true, user };
        } else {
          console.log('❌ Invalid password for:', user.nombre);
          return { success: false, error: 'Contraseña incorrecta' };
        }
      } else {
        console.log('❌ User not found:', email);
        return { success: false, error: 'Usuario no encontrado' };
      }
    } catch (error: any) {
      console.error('💥 Error during login:', error);
      return { 
        success: false, 
        error: 'Error de conexión con la base de datos: ' + error.message 
      };
    }
  },

  // Métodos auxiliares...
  async getAllUsers(): Promise<any[]> {
    if (!dynamodb) return [];
    
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
    if (!dynamodb) return null;
    
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
  }
};