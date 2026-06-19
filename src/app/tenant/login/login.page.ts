import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TenantAuthService } from '../../core/services/tenant-auth.service';

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
  error = '';

  constructor(
    private tenantAuth: TenantAuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // ✅ Esperar a que se cargue la sesión persistente
    const usuario = await this.tenantAuth.waitForAuth();
    
    // Si ya hay sesión activa, redirigir al dashboard
    if (usuario) {
      console.log('✅ Sesión activa, redirigiendo al dashboard');
      this.router.navigate(['/tenant/dashboard']);
    }
  }

  async login() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.cargando = true;
    this.error = '';

    try {
      const result = await this.tenantAuth.login(this.email, this.password);

      if (result.success) {
        console.log('✅ Login exitoso, redirigiendo...');
        this.router.navigate(['/tenant/dashboard']);
      } else {
        this.error = result.error || 'Credenciales incorrectas';
      }
    } catch (error: any) {
      console.error('Error login:', error);
      this.error = 'Error al iniciar sesión';
    }

    this.cargando = false;
  }
}