import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { SuscripcionService } from '../services/suscripcion.service';

@Injectable({
  providedIn: 'root'
})
export class SuscripcionGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private suscripcionService: SuscripcionService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      // 1. Verificar si hay sesión activa
      const { data: { user }, error: authError } = await this.supabase.getClient().auth.getUser();
      
      if (authError || !user) {
        console.log('No hay sesión, redirigiendo al login');
        this.router.navigate(['/tenant/login']);
        return false;
      }

      // 2. Verificar estado de suscripción
      const { activa, diasRestantes } = await this.suscripcionService.verificarEstadoSuscripcion();
      
      if (!activa) {
        console.log(`Suscripción vencida (${diasRestantes} días), redirigiendo a pagos`);
        this.router.navigate(['/tenant/pagos']);
        return false;
      }

      // 3. Todo OK, permitir acceso
      return true;
    } catch (error) {
      console.error('Error en SuscripcionGuard:', error);
      // En caso de error, permitir acceso para no bloquear al usuario
      return true;
    }
  }
}