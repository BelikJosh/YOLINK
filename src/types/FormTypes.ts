export interface FormData {
  userType: 'client' | 'vendor';
  nombre: string;
  correo: string;
  contraseña: string;
  confirmarContraseña: string;
  // Campos específicos de vendedor
  categoria: string;
  direccion: string;
  telefono: string;
  descripcion: string;
}