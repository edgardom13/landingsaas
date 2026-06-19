import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {
  constructor(private supabase: SupabaseService) {}

  // 🔑 Obtener el usuario actual de forma segura
  private async obtenerUsuarioActual() {
    const { data: { user }, error } = await this.supabase.getClient().auth.getUser();
    
    if (error || !user) {
      throw new Error('No autenticado');
    }
    
    return user;
  }

  async obtenerSuscripcionActual() {
    try {
      const user = await this.obtenerUsuarioActual();
      
      const { data, error } = await this.supabase.getClient()
        .from('suscripciones')
        .select(`
          *,
          planes (nombre, precio)
        `)
        .eq('cliente_id', user.id)
        .order('fecha_vencimiento', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error obteniendo suscripción:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerSuscripcionActual:', error);
      return null;
    }
  }

  async verificarEstadoSuscripcion() {
    try {
      const user = await this.obtenerUsuarioActual();

      const { data, error } = await this.supabase.getClient()
        .from('suscripciones')
        .select('*')
        .eq('cliente_id', user.id)
        .order('fecha_vencimiento', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error verificando suscripción:', error);
        throw error;
      }

      if (!data) {
        return { activa: false, diasRestantes: 0, suscripcion: null };
      }

      const hoy = new Date();
      const vencimiento = new Date(data.fecha_vencimiento);
      const diffTime = vencimiento.getTime() - hoy.getTime();
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        activa: diasRestantes > 0 && data.estado === 'activa',
        diasRestantes: Math.max(0, diasRestantes),
        suscripcion: data
      };
    } catch (error) {
      console.error('Error en verificarEstadoSuscripcion:', error);
      return { activa: false, diasRestantes: 0, suscripcion: null };
    }
  }

  async obtenerHistorialPagos() {
    try {
      const user = await this.obtenerUsuarioActual();

      const { data, error } = await this.supabase.getClient()
        .from('pagos')
        .select('*')
        .eq('cliente_id', user.id)
        .order('fecha_pago', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo historial de pagos:', error);
      return [];
    }
  }

  async registrarPago(monto: number, metodo: string, descripcion: string = 'Renovación mensual') {
    try {
      const user = await this.obtenerUsuarioActual();

      const { data, error } = await this.supabase.getClient()
        .from('pagos')
        .insert({
          cliente_id: user.id,
          monto: monto,
          metodo_pago: metodo,
          estado: 'aprobado',
          descripcion: descripcion,
          fecha_pago: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  }

  async renovarSuscripcion(dias: number = 30, monto: number = 20000) {
    try {
      const user = await this.obtenerUsuarioActual();

      // Registrar el pago
      await this.registrarPago(monto, 'manual', `Renovación por ${dias} días`);

      // Actualizar la suscripción
      const nuevaFechaVencimiento = new Date();
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + dias);

      const { data, error } = await this.supabase.getClient()
        .from('suscripciones')
        .update({
          estado: 'activa',
          fecha_vencimiento: nuevaFechaVencimiento.toISOString(),
          fecha_ultimo_pago: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('cliente_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error renovando suscripción:', error);
      throw error;
    }
  }

  async estaActivo(): Promise<boolean> {
    try {
      const estado = await this.verificarEstadoSuscripcion();
      return estado.activa;
    } catch (error) {
      return false;
    }
  }
}