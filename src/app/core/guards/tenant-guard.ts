import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TenantAuthService } from '../services/tenant-auth.service';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TenantGuard implements CanActivate {
  constructor(
    private tenantAuth: TenantAuthService,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    // Si ya hay usuario en memoria, permitir acceso
    if (this.tenantAuth.isLoggedIn()) {
      return true;
    }

    // Intentar restaurar sesión de Supabase
    try {
      const { data: { session } } = await this.supabase.getClient().auth.getSession();
      
      if (session?.user) {
        // Esperar a que el servicio cargue el perfil
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (this.tenantAuth.isLoggedIn()) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
    }

    // No hay sesión, redirigir al login
    this.router.navigate(['/tenant/login']);
    return false;
  }
}