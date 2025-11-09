// aws-config.ts
import AWS from 'aws-sdk';

// CONFIGURACIÓN MANUAL - Reemplaza react-native-config
const MANUAL_CONFIG = {
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'AKIAQ5BAACIV2VSXY7NX',
  AWS_SECRET_ACCESS_KEY: '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',
  DYNAMODB_TABLE: 'YOLINK',
  GOOGLE_MAPS_API_KEY: 'AIzaSyApyzvWHeuxEYr2JmHVa_JWmYS5Iq2e5yw'
};

// Verificar configuración
console.log('🔑 Manual AWS Config:', {
  region: MANUAL_CONFIG.AWS_REGION,
  hasAccessKey: !!MANUAL_CONFIG.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!MANUAL_CONFIG.AWS_SECRET_ACCESS_KEY,
  table: MANUAL_CONFIG.DYNAMODB_TABLE
});

const awsConfig = {
  region: MANUAL_CONFIG.AWS_REGION,
  accessKeyId: MANUAL_CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: MANUAL_CONFIG.AWS_SECRET_ACCESS_KEY,
  correctClockSkew: true,
};

// Validar credenciales
if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
  console.error('❌ AWS credentials missing');
} else {
  console.log('✅ AWS credentials loaded successfully');
  AWS.config.update(awsConfig);
}

export const dynamodb = new AWS.DynamoDB.DocumentClient({
  correctClockSkew: true,
  httpOptions: {
    timeout: 30000,
    connectTimeout: 5000
  }
});

export const TABLE_NAME = MANUAL_CONFIG.DYNAMODB_TABLE;
export const GOOGLE_MAPS_API_KEY = MANUAL_CONFIG.GOOGLE_MAPS_API_KEY;

// Interfaces
export interface UserData {
  id: string;
  userType: 'client' | 'vendor';
  nombre: string;
  email: string;
  password: string;
  walletOpenPay: string;
  fechaRegistro: string;
  rating?: number;
  reseñasCount?: number;
  comprasRealizadas?: number;
  totalGastado?: number;
  ubicacionActual?: {
    lat: number;
    lng: number;
  };
  preferencias?: {
    intereses: string[];
    radioBusqueda: number;
  };
  ventasRealizadas?: number;
  totalGanado?: number;
  categoria?: string;
  ubicacion?: {
    lat: number;
    lng: number;
    direccion: string;
  };
  horario?: {
    apertura: string;
    cierre: string;
    dias: string[];
  };
  telefono?: string;
  descripcion?: string;
}

export interface CreateUserResponse {
  success: boolean;
  user?: UserData;
  error?: string;
}