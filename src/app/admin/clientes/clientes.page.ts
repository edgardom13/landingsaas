import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: false
})
export class ClientesPage implements OnInit {
  clientes: any[] = [];
  cargando = true;
  busqueda = '';

  constructor(
    private supabase: SupabaseService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.cargarClientes();
  }

  async cargarClientes() {
    this.cargando = true;
    try {
      const { data, error } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select(`
          *,
          suscripciones (
            estado,
            fecha_vencimiento,
            monto_pago
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.clientes = data || [];
    } catch (error) {
      console.error(error);
      await this.mostrarToast('Error al cargar clientes', 'danger');
    }
    this.cargando = false;
  }

  get clientesFiltrados() {
    if (!this.busqueda) return this.clientes;
    const term = this.busqueda.toLowerCase();
    return this.clientes.filter(c =>
      c.nombre_negocio?.toLowerCase().includes(term) ||
      c.subdominio?.toLowerCase().includes(term)
    );
  }

  async toggleEstado(cliente: any) {
    try {
      const nuevoEstado = !cliente.estado;
      await this.supabase.getClient()
        .from('perfiles_clientes')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', cliente.id);
      cliente.estado = nuevoEstado;
      await this.mostrarToast('Estado actualizado', 'success');
    } catch (error) {
      await this.mostrarToast('Error al actualizar', 'danger');
    }
  }

  async extenderSuscripcion(cliente: any, dias: number) {
    try {
      const suscripcion = cliente.suscripciones?.[0];
      if (!suscripcion) {
        await this.mostrarToast('No tiene suscripción', 'warning');
        return;
      }

      const nuevaFecha = new Date(suscripcion.fecha_vencimiento);
      nuevaFecha.setDate(nuevaFecha.getDate() + dias);

      await this.supabase.getClient()
        .from('suscripciones')
        .update({
          estado: 'activa',
          fecha_vencimiento: nuevaFecha.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', suscripcion.id);

      await this.cargarClientes();
      await this.mostrarToast(`Suscripción extendida ${dias} días`, 'success');
    } catch (error) {
      await this.mostrarToast('Error al extender', 'danger');
    }
  }

  async eliminarCliente(id: string) {
    const alert = await this.alertCtrl.create({
      header: '⚠️ Confirmar eliminación',
      message: '¿Eliminar este cliente? Se borrarán todos sus datos permanentemente.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.supabase.getClient()
                .from('perfiles_clientes')
                .delete()
                .eq('id', id);
              await this.cargarClientes();
              await this.mostrarToast('Cliente eliminado', 'success');
            } catch (error) {
              await this.mostrarToast('Error al eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}