import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-testimonios',
  templateUrl: './testimonios.page.html',
  styleUrls: ['./testimonios.page.scss'],
  standalone: false
})
export class TestimoniosPage implements OnInit {
  testimonios: any[] = [];
  cargando = true;

  constructor(
    private supabase: SupabaseService,
    private tenantAuth: TenantAuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.cargarTestimonios();
  }

  async cargarTestimonios() {
    this.cargando = true;
    const user = this.tenantAuth.getCurrentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.getClient()
        .from('testimonios')
        .select('*')
        .eq('cliente_id', user.id)
        .order('orden', { ascending: true });

      if (error) throw error;
      this.testimonios = data || [];
    } catch (error) {
      console.error(error);
      await this.mostrarToast('Error al cargar testimonios', 'danger');
    }
    this.cargando = false;
  }

  async crearTestimonio() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo Testimonio',
      inputs: [
        { name: 'nombre_cliente', type: 'text', placeholder: 'Nombre del cliente' },
        { name: 'comentario', type: 'text', placeholder: 'Comentario' },
        { name: 'calificacion', type: 'number', placeholder: 'Calificación (1-5)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (!data.nombre_cliente || !data.comentario) {
              await this.mostrarToast('Nombre y comentario obligatorios', 'warning');
              return false;
            }
            try {
              const user = this.tenantAuth.getCurrentUser();
              await this.supabase.getClient()
                .from('testimonios')
                .insert([{
                  cliente_id: user!.id,
                  nombre_cliente: data.nombre_cliente,
                  comentario: data.comentario,
                  calificacion: parseInt(data.calificacion) || 5
                }]);
              await this.cargarTestimonios();
              await this.mostrarToast('Testimonio creado', 'success');
              return true;
            } catch (error) {
              await this.mostrarToast('Error al crear', 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarTestimonio(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: '¿Eliminar este testimonio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.supabase.getClient()
                .from('testimonios')
                .delete()
                .eq('id', id);
              await this.cargarTestimonios();
              await this.mostrarToast('Testimonio eliminado', 'success');
              return true;
            } catch (error) {
              await this.mostrarToast('Error al eliminar', 'danger');
              return false;
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