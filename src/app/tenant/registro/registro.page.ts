import { Component, OnInit } from '@angular/core';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ValidacionService } from '../../core/services/validacion.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false 
})
export class RegistroPage implements OnInit {
  datos = {
    email: '',
    password: '',
    nombre_negocio: '',
    subdominio: '',
    telefono_whatsapp: ''
  };
  cargando = false;

  constructor(
    private tenantAuth: TenantAuthService,
    private supabase: SupabaseService,
    private validacion: ValidacionService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {}

  async registrar() {
    // Validaciones
    const valEmail = this.validacion.validarEmail(this.datos.email);
    if (!valEmail.valido) {
      await this.mostrarToast(valEmail.errores[0], 'warning');
      return;
    }

    const valPass = this.validacion.validarPassword(this.datos.password);
    if (!valPass.valido) {
      await this.mostrarToast(valPass.errores[0], 'warning');
      return;
    }

    const valSub = this.validacion.validarSubdominio(this.datos.subdominio);
    if (!valSub.valido) {
      await this.mostrarToast(valSub.errores[0], 'warning');
      return;
    }

    const valTel = this.validacion.validarTelefono(this.datos.telefono_whatsapp);
    if (!valTel.valido) {
      await this.mostrarToast(valTel.errores[0], 'warning');
      return;
    }

    if (!this.datos.nombre_negocio.trim()) {
      await this.mostrarToast('El nombre del negocio es obligatorio', 'warning');
      return;
    }

    this.cargando = true;
    try {
      // Verificar que el subdominio esté disponible
      const { data: existente } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('id')
        .eq('subdominio', this.datos.subdominio)
        .maybeSingle();

      if (existente) {
        await this.mostrarToast('Ese subdominio ya está en uso', 'danger');
        this.cargando = false;
        return;
      }

      // ✅ PASAR UN SOLO OBJETO con todos los datos
      const resultado = await this.tenantAuth.registro({
        email: this.datos.email,
        password: this.datos.password,
        nombre_negocio: this.datos.nombre_negocio,
        subdominio: this.datos.subdominio,
        telefono_whatsapp: this.datos.telefono_whatsapp
      });

     // ✅ CORRECTO
if (resultado?.success && !resultado?.error) {
        await this.mostrarToast('¡Registro exitoso! Tienes 30 días de prueba', 'success');
        this.router.navigate(['/tenant/login']);
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      await this.mostrarToast('Error: ' + (error.message || 'No se pudo crear la cuenta'), 'danger');
    }
    this.cargando = false;
  }

  irALogin() {
    this.router.navigate(['/tenant/login']);
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}