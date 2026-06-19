import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { SuscripcionService } from '../../core/services/suscripcion.service';
import { IonContent } from '@ionic/angular';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit, AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;

  usuario: any;
  suscripcion: any;
  today = new Date();

  estadisticas = {
    productos: 0,
    leads: 0,
    testimonios: 0,
    diasRestantes: 0
  };
  cargando = true;

  constructor(
    private tenantAuth: TenantAuthService,
    private suscripcionService: SuscripcionService,
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.esperarUsuario();

    if (!this.usuario) {
      this.router.navigate(['/tenant/login']);
      return;
    }

    await this.cargarEstadisticas();
    await this.cargarSuscripcion();
    this.cargando = false;
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToTop(300);
      }
    }, 100);
  }

  private esperarUsuario(): Promise<void> {
    return new Promise((resolve) => {
      if (this.tenantAuth.isLoggedIn()) {
        this.usuario = this. tenantAuth.getCurrentUser();
        resolve();
        return;
      }

      const sub = this.tenantAuth.currentUser$.subscribe(user => {
        if (user) {
          this.usuario = user;
          sub.unsubscribe();
          resolve();
        }
      });

      setTimeout(() => {
        sub.unsubscribe();
        this.usuario = this.tenantAuth.getCurrentUser();
        resolve();
      }, 5000);
    });
  }

  async cargarEstadisticas() {
    if (!this.usuario) return;

    try {
      const { count: productos } = await this.supabase.getClient()
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', this.usuario.id);

      const { count: leads } = await this.supabase.getClient()
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', this.usuario.id);

      const { count: testimonios } = await this.supabase.getClient()
        .from('testimonios')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', this.usuario.id);

      this.estadisticas = {
        productos: productos || 0,
        leads: leads || 0,
        testimonios: testimonios || 0,
        diasRestantes: this.estadisticas.diasRestantes
      };
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  async cargarSuscripcion() {
    try {
      const estado = await this.suscripcionService.verificarEstadoSuscripcion();
      this.estadisticas.diasRestantes = estado.diasRestantes;
      this.suscripcion = await this.suscripcionService.obtenerSuscripcionActual();
    } catch (error) {
      console.error('Error cargando suscripción:', error);
    }
  }

  async logout() {
    await this.tenantAuth.logout();
  }

 async verMiNegocio() {
  try {
    let subdominio = this.usuario?.subdominio;

    if (!subdominio && this.usuario?.id) {
      const { data, error } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('subdominio')
        .eq('id', this.usuario.id)
        .single();

      if (error) throw error;
      subdominio = data?.subdominio;
    }

    if (!subdominio) {
      alert('No se encontró el subdominio de tu negocio.');
      return;
    }

    const baseUrl = window.location.origin;
    
    // ✅ NUEVA URL: /minegocio en lugar de /landing?subdominio=minegocio
    const url = `${baseUrl}/${subdominio}`;

    if (this.isMobile()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  } catch (error) {
    console.error('Error al abrir el negocio:', error);
  }
}


  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}