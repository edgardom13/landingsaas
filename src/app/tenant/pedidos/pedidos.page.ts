import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false
})
export class PedidosPage implements OnInit {
  pedidos: any[] = [];
  cargando = true;
  busqueda = '';
  
  // ✅ EXPANSIÓN DE CARDS (sin modales)
  pedidoExpandido: string | null = null;
  
  // Solo modal de edición
  modalEditarAbierto = false;
  pedidoEditando: any = null;
  
  estadosDisponibles = [
    { value: 'pendiente', label: 'Pendiente', icon: 'time-outline' },
    { value: 'confirmado', label: 'Confirmado', icon: 'checkmark-outline' },
    { value: 'enviado', label: 'Enviado', icon: 'send-outline' },
    { value: 'entregado', label: 'Entregado', icon: 'checkmark-circle-outline' },
    { value: 'cancelado', label: 'Cancelado', icon: 'close-circle-outline' }
  ];

  constructor(
    private supabase: SupabaseService,
    private tenantAuth: TenantAuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.cargarPedidos();
  }

  async cargarPedidos() {
    this.cargando = true;
    const user = this.tenantAuth.getCurrentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.getClient()
        .from('pedidos')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.pedidos = data || [];
    } catch (error) {
      console.error(error);
      await this.mostrarToast('Error al cargar pedidos', 'danger');
    }
    this.cargando = false;
  }

  // ✅ EXPANDIR/COLAPSAR CARD
  toggleExpand(id: string) {
    this.pedidoExpandido = this.pedidoExpandido === id ? null : id;
  }

  // TrackBy para mejor performance
  trackById(index: number, item: any): string {
    return item.id;
  }

  get pedidosFiltrados() {
    if (!this.busqueda) return this.pedidos;
    const term = this.busqueda.toLowerCase();
    return this.pedidos.filter(p =>
      p.nombre_cliente?.toLowerCase().includes(term) ||
      p.telefono_cliente?.toLowerCase().includes(term) ||
      p.id?.toLowerCase().includes(term)
    );
  }

  getPedidosPorEstado(estado: string): number {
    return this.pedidos.filter(p => p.estado === estado).length;
  }

  getTotalIngresos(): number {
    return this.pedidos
      .filter(p => p.estado === 'entregado' || p.estado === 'confirmado')
      .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
  }

  // Cambiar estado (inline)
  async cambiarEstadoDesdeModal(pedido: any, nuevoEstado: string) {
    try {
      const { error } = await this.supabase.getClient()
        .from('pedidos')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', pedido.id);

      if (error) throw error;

      pedido.estado = nuevoEstado;
      const index = this.pedidos.findIndex(p => p.id === pedido.id);
      if (index !== -1) {
        this.pedidos[index].estado = nuevoEstado;
      }

      await this.mostrarToast(`Estado: ${nuevoEstado}`, 'success');
    } catch (error) {
      console.error(error);
      await this.mostrarToast('Error al cambiar estado', 'danger');
    }
  }

  // Editar (único modal simple)
  abrirModalEditar(pedido: any) {
    this.pedidoEditando = { ...pedido };
    this.modalEditarAbierto = true;
  }

  cerrarModalEditar() {
    this.modalEditarAbierto = false;
    this.pedidoEditando = null;
  }

  async guardarEdicion() {
    if (!this.pedidoEditando) return;

    try {
      const { error } = await this.supabase.getClient()
        .from('pedidos')
        .update({
          nombre_cliente: this.pedidoEditando.nombre_cliente,
          telefono_cliente: this.pedidoEditando.telefono_cliente,
          direccion_entrega: this.pedidoEditando.direccion_entrega,
          notas: this.pedidoEditando.notas,
          estado: this.pedidoEditando.estado,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.pedidoEditando.id);

      if (error) throw error;

      const index = this.pedidos.findIndex(p => p.id === this.pedidoEditando.id);
      if (index !== -1) {
        this.pedidos[index] = { ...this.pedidoEditando };
      }

      await this.mostrarToast('Pedido actualizado', 'success');
      this.cerrarModalEditar();
    } catch (error) {
      console.error(error);
      await this.mostrarToast('Error al actualizar', 'danger');
    }
  }

  async eliminarPedido(id: string) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar pedido?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.supabase.getClient()
                .from('pedidos')
                .delete()
                .eq('id', id);

              this.pedidos = this.pedidos.filter(p => p.id !== id);
              if (this.pedidoExpandido === id) this.pedidoExpandido = null;
              await this.mostrarToast('Pedido eliminado', 'success');
            } catch (error) {
              await this.mostrarToast('Error al eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  contactarCliente(pedido: any) {
    const telefono = pedido.telefono_cliente.replace(/\D/g, '');
    const user = this.tenantAuth.getCurrentUser();
    const negocio = user?.nombre_negocio || 'nuestra tienda';
    const mensaje = `Hola ${pedido.nombre_cliente}, soy de ${negocio}. Sobre tu pedido #${pedido.id.slice(0, 8)}`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  async exportarCSV() {
    if (this.pedidos.length === 0) {
      await this.mostrarToast('No hay pedidos', 'warning');
      return;
    }

    const headers = ['ID', 'Cliente', 'Teléfono', 'Dirección', 'Items', 'Subtotal', 'Descuento', 'Total', 'Estado', 'Fecha'];
    const rows = this.pedidos.map(p => [
      p.id.slice(0, 8),
      p.nombre_cliente,
      p.telefono_cliente,
      p.direccion_entrega || '',
      p.items?.length || 0,
      p.subtotal,
      p.descuento || 0,
      p.total,
      p.estado,
      new Date(p.created_at).toLocaleDateString()
    ]);

    let csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.map(c => `"${c}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await this.mostrarToast('CSV descargado', 'success');
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    const parts = nombre.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
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