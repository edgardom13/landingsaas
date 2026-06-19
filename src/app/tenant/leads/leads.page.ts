import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.page.html',
  styleUrls: ['./leads.page.scss'],
  standalone: false
})
export class LeadsPage implements OnInit {
  leads: any[] = [];
  cargando = true;
  busqueda = '';
  
  // Modal de venta
  modalVentaAbierto = false;
  leadSeleccionado: any = null;
  ventaData = {
    monto: 0,
    metodo_pago: '',
    notas: ''
  };

  constructor(
    private supabase: SupabaseService,
    private tenantAuth: TenantAuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.cargarLeads();
  }

  async cargarLeads() {
    this.cargando = true;
    const user = this.tenantAuth.getCurrentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.getClient()
        .from('leads')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.leads = data || [];
    } catch (error) {
      console.error(error);
      await this.mostrarToast('Error al cargar leads', 'danger');
    }
    this.cargando = false;
  }

  get leadsFiltrados() {
    if (!this.busqueda) return this.leads;
    const term = this.busqueda.toLowerCase();
    return this.leads.filter(lead =>
      lead.nombre?.toLowerCase().includes(term) ||
      lead.telefono?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term)
    );
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const parts = nombre.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  getLeadsPorEstado(estado: string): number {
    return this.leads.filter(l => l.estado === estado).length;
  }

  getTotalVentas(): number {
    return this.leads
      .filter(l => l.estado === 'vendido' && l.monto_venta)
      .reduce((sum, l) => sum + (parseFloat(l.monto_venta) || 0), 0);
  }

  async cambiarEstado(lead: any, nuevoEstado: string) {
    try {
      const { error } = await this.supabase.getClient()
        .from('leads')
        .update({ estado: nuevoEstado })
        .eq('id', lead.id);

      if (error) throw error;
      lead.estado = nuevoEstado;
      await this.mostrarToast('Estado actualizado', 'success');
    } catch (error) {
      await this.mostrarToast('Error al actualizar', 'danger');
    }
  }

  // ============================================
  // MODAL DE VENTA
  // ============================================
  abrirModalVenta(lead: any) {
    this.leadSeleccionado = lead;
    this.ventaData = {
      monto: lead.monto_venta || 0,
      metodo_pago: lead.metodo_pago || '',
      notas: lead.notas_venta || ''
    };
    this.modalVentaAbierto = true;
  }

  cerrarModalVenta() {
    this.modalVentaAbierto = false;
    this.leadSeleccionado = null;
    this.ventaData = { monto: 0, metodo_pago: '', notas: '' };
  }

  async confirmarVenta() {
    if (!this.leadSeleccionado || !this.ventaData.monto) return;

    try {
      const { error } = await this.supabase.getClient()
        .from('leads')
        .update({
          estado: 'vendido',
          monto_venta: this.ventaData.monto,
          metodo_pago: this.ventaData.metodo_pago,
          notas_venta: this.ventaData.notas,
          fecha_venta: new Date().toISOString()
        })
        .eq('id', this.leadSeleccionado.id);

      if (error) throw error;

      // Actualizar localmente
      this.leadSeleccionado.estado = 'vendido';
      this.leadSeleccionado.monto_venta = this.ventaData.monto;
      this.leadSeleccionado.metodo_pago = this.ventaData.metodo_pago;
      this.leadSeleccionado.notas_venta = this.ventaData.notas;
      this.leadSeleccionado.fecha_venta = new Date().toISOString();

      await this.mostrarToast(`Venta registrada: $${this.ventaData.monto} COP`, 'success');
      this.cerrarModalVenta();
    } catch (error) {
      console.error(error);
      await this.mostrarToast('Error al registrar venta', 'danger');
    }
  }

  async eliminarLead(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: '¿Eliminar este lead?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.supabase.getClient()
                .from('leads')
                .delete()
                .eq('id', id);
              await this.cargarLeads();
              await this.mostrarToast('Lead eliminado', 'success');
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

  async exportarCSV() {
    if (this.leads.length === 0) {
      await this.mostrarToast('No hay leads para exportar', 'warning');
      return;
    }

    const headers = ['Nombre', 'Teléfono', 'Email', 'Mensaje', 'Estado', 'Monto Venta', 'Método Pago', 'Fecha', 'Marketing'];
    const rows = this.leads.map(lead => [
      lead.nombre,
      lead.telefono,
      lead.email || '',
      lead.mensaje || '',
      lead.estado,
      lead.monto_venta || 0,
      lead.metodo_pago || '',
      new Date(lead.created_at).toLocaleDateString(),
      lead.consentimiento_marketing ? 'Sí' : 'No'
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.map(c => `"${c}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await this.mostrarToast('CSV descargado', 'success');
  }

  abrirWhatsApp(lead: any) {
    const telefono = lead.telefono.replace(/\D/g, '');
    const user = this.tenantAuth.getCurrentUser();
    const negocio = user?.nombre_negocio || 'nuestra tienda';
    const mensaje = `Hola ${lead.nombre}, soy de ${negocio}. ${lead.mensaje || 'Gracias por tu interés'}`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
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