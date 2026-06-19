import { Component, OnInit } from '@angular/core';
import { SuscripcionService } from '../../core/services/suscripcion.service';
import { TenantAuthService } from '../../core/services/tenant-auth.service';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss'],
  standalone: false
})
export class PagosPage implements OnInit {
  suscripcion: any = null;
  historialPagos: any[] = [];
  diasRestantes = 0;
  cargando = true;
  procesando = false;

  constructor(
    private suscripcionService: SuscripcionService,
    private tenantAuth: TenantAuthService
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const estado = await this.suscripcionService.verificarEstadoSuscripcion();
      this.diasRestantes = estado.diasRestantes;
      this.suscripcion = estado.suscripcion;

      this.historialPagos = await this.suscripcionService.obtenerHistorialPagos();
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
    this.cargando = false;
  }

  async renovarSuscripcion() {
    if (!confirm('¿Confirmas que deseas renovar tu suscripción por $20,000 COP?')) {
      return;
    }

    this.procesando = true;
    try {
      // ✅ Usar el método correcto: renovarSuscripcion
      await this.suscripcionService.renovarSuscripcion(30, 20000);

      alert('✅ Suscripción renovada exitosamente por 30 días');
      await this.cargarDatos();
    } catch (error: any) {
      console.error('Error renovando:', error);
      alert('Error: ' + (error.message || 'No se pudo renovar la suscripción'));
    }
    this.procesando = false;
  }

  getEstadoClass(estado: string): string {
    return estado === 'aprobado' ? 'aprobado' : 
           estado === 'rechazado' ? 'rechazado' : 'pendiente';
  }

  getEstadoLabel(estado: string): string {
    return estado ? estado.toUpperCase() : 'PENDIENTE';
  }
}