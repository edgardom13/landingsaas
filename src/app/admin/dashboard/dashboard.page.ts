import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  estadisticas = {
    totalClientes: 0,
    clientesActivos: 0,
    clientesVencidos: 0,
    ingresosMes: 0,
    ingresosTotales: 0
  };
  today = new Date();  // ← AGREGA ESTA LÍNEA
  cargando = true;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    this.cargando = true;
    try {
      const { count: total } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('*', { count: 'exact', head: true });

      const { count: activos } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', true);

      const { count: vencidos } = await this.supabase.getClient()
        .from('suscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'vencida');

      // Ingresos del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: pagosMes } = await this.supabase.getClient()
        .from('pagos')
        .select('monto')
        .eq('estado', 'aprobado')
        .gte('fecha_pago', inicioMes.toISOString());

      const ingresosMes = pagosMes?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0;

      const { data: pagosTotales } = await this.supabase.getClient()
        .from('pagos')
        .select('monto')
        .eq('estado', 'aprobado');

      const ingresosTotales = pagosTotales?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0;

      this.estadisticas = {
        totalClientes: total || 0,
        clientesActivos: activos || 0,
        clientesVencidos: vencidos || 0,
        ingresosMes: ingresosMes,
        ingresosTotales: ingresosTotales
      };
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
    this.cargando = false;
  }

  async logout() {
    await this.supabase.getClient().auth.signOut();
    localStorage.removeItem('admin_session');
    this.router.navigate(['/admin/login']);
  }
}