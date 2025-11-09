// types/Product.ts
export interface Product {
  id: string;
  vendedorId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen?: string;
  stock: number;
  disponible: boolean;
  fechaCreacion: string;
  rating?: number;
  reseñasCount?: number;
}

export interface CreateProductRequest {
  vendedorId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen?: string;
  stock: number;
}