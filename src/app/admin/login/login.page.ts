import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  cargando = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {}

  async login() {
    if (!this.email || !this.password) {
      await this.mostrarToast('Completa todos los campos', 'warning');
      return;
    }

    this.cargando = true;
    try {
      const { data, error } = await this.supabase.getClient()
        .auth.signInWithPassword({
          email: this.email,
          password: this.password
        });

      if (error) throw error;

      const { data: admin, error: adminError } = await this.supabase.getClient()
        .from('admins')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (adminError || !admin) {
        await this.supabase.getClient().auth.signOut();
        throw new Error('No tienes permisos de administrador');
      }

      localStorage.setItem('admin_session', JSON.stringify(admin));
      await this.mostrarToast('Bienvenido Admin', 'success');
      this.router.navigate(['/admin/dashboard']);
    } catch (error: any) {
      await this.mostrarToast('Error: ' + error.message, 'danger');
    }
    this.cargando = false;
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