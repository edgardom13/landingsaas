import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const { data: { session } } = await this.supabase.getClient().auth.getSession();
    
    if (!session) {
      this.router.navigate(['/admin/login']);
      return false;
    }

    const { data } = await this.supabase.getClient()
      .from('admins')
      .select()
      .eq('id', session.user.id)
      .single();

    if (!data) {
      this.router.navigate(['/admin/login']);
      return false;
    }

    return true;
  }
}