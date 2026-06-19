import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TenantAuthService } from './tenant-auth.service';

export interface Producto {
  id?: string;
  cliente_id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_oferta?: number;
  imagen_url?: string;
  orden?: number;
  disponible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  constructor(
    private supabase: SupabaseService,
    private tenantAuth: TenantAuthService
  ) {}

  async getAll() {
    const user = this.tenantAuth.getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .select('*')
      .eq('cliente_id', user.id)
      .order('orden', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async create(producto: Producto) {
    const user = this.tenantAuth.getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .insert([{
        ...producto,
        cliente_id: user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: string, producto: Partial<Producto>) {
    const { data, error } = await this.supabase.getClient()
      .from('productos')
      .update(producto)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase.getClient()
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async uploadImage(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await this.supabase.getClient()
      .storage
      .from('productos')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = this.supabase.getClient()
      .storage
      .from('productos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }
}