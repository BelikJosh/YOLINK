// aws-config.ts - ACTUALIZADO
import AWS from 'aws-sdk';

const config = {
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  correctClockSkew: true,
};

AWS.config.update(config);

export const dynamodb = new AWS.DynamoDB.DocumentClient({
  correctClockSkew: true,
  httpOptions: {
    timeout: 30000,
    connectTimeout: 5000
  }
});

export const TABLE_NAME = 'YOLINK';

// Interface actualizada - SIN ColeccionID
export interface UserData {
  // CLAVE PRINCIPAL (igual que tu ejemplo)
  id: string;
  
  // Campos principales
  userType: 'client' | 'vendor';
  nombre: string;
  email: string; // Cambié de 'correo' a 'email' para consistencia
  password: string;
  walletOpenPay: string;
  fechaRegistro: string;
  rating?: number;
  reseñasCount?: number;
  
  // Campos de cliente
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
  
  // Campos de vendedor
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