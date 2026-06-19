import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../core/services/supabase.service';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false
})
export class LandingPage implements OnInit, OnDestroy {
  cliente: any = null;
  cargando = true;
  error = '';
  today = new Date();
  
  cartItemCount = 0;
  busquedaProducto = '';
  productosFiltrados: any[] = [];
  productoOferta: any = null; // Producto destacado seleccionado
  
  isScrolled = false;
  isMobile = false;
  menuOpen = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cartService: CartService
  ) {}

  async ngOnInit() {
  await this.cargarCliente();
  
  this.cartService.cart$.subscribe(() => {
    this.cartItemCount = this.cartService.getItemCount();
  });
  
  this.checkScreenSize();
  
  // 🔍 DEBUG: Verificar variables CSS
  setTimeout(() => {
    const root = document.documentElement;
    console.log('🎨 Variables CSS aplicadas:', {
      fondo: root.style.getPropertyValue('--color-fondo-custom'),
      texto: root.style.getPropertyValue('--color-texto-custom'),
      primario: root.style.getPropertyValue('--color-primario-custom')
    });
  }, 1000);
}

  ngOnDestroy() {
    this.menuOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) this.menuOpen = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================
  async cargarCliente() {
    this.cargando = true;
    
    const params = new URLSearchParams(window.location.search);
    const subdominio = params.get('subdominio') || 'minegocio';
    
    if (!subdominio) {
      this.error = 'No se encontró el negocio';
      this.cargando = false;
      return;
    }

    try {
      const { data, error } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('*')
        .eq('subdominio', subdominio)
        .eq('estado', true)
        .single();

      if (error) throw error;
      
      this.cliente = data;
      
      // Aplicar colores personalizados como variables CSS
      this.aplicarEstilosPersonalizados();
      
      // Cargar productos
      await this.cargarProductos();
      
      // Parsear redes_sociales
      if (typeof this.cliente.redes_sociales === 'string') {
        try {
          this.cliente.redes_sociales = JSON.parse(this.cliente.redes_sociales);
        } catch (e) {
          this.cliente.redes_sociales = [];
        }
      }
      
      // 🔑 Cargar producto destacado por ID
      await this.cargarProductoDestacado();
      
      this.productosFiltrados = [...(this.cliente.productos || [])];
      
    } catch (error: any) {
      console.error('Error cargando cliente:', error);
      this.error = 'Negocio no encontrado o inactivo';
    }
    this.cargando = false;
  }

  // 🔑 NUEVO: Cargar producto destacado por ID
  async cargarProductoDestacado() {
    if (!this.cliente.producto_destacado_id || !this.cliente.productos?.length) {
      // Si no hay producto destacado seleccionado, usar el primero con oferta o el primero
      this.productoOferta = this.cliente.productos.find((p: any) => p.precio_oferta) 
                          || this.cliente.productos[0];
      return;
    }

    // Buscar el producto por ID
    this.productoOferta = this.cliente.productos.find(
      (p: any) => p.id === this.cliente.producto_destacado_id
    );

    // Si no lo encuentra, usar el primero
    if (!this.productoOferta && this.cliente.productos.length > 0) {
      this.productoOferta = this.cliente.productos[0];
    }
  }

  async cargarProductos() {
    if (!this.cliente?.id) return;
    
    try {
      const { data, error } = await this.supabase.getClient()
        .from('productos')
        .select('*')
        .eq('cliente_id', this.cliente.id);

      if (error) throw error;
      this.cliente.productos = data || [];
    } catch (error) {
      console.error('Error cargando productos:', error);
      this.cliente.productos = [];
    }
  }

  // 🔑 NUEVO: Aplicar estilos personalizados como variables CSS
  // 🔑 MÉTODO PARA APLICAR ESTILOS PERSONALIZADOS
aplicarEstilosPersonalizados() {
  const root = document.documentElement;
  
  // Aplicar variables CSS dinámicas
  root.style.setProperty('--color-primario-custom', this.cliente.color_primario || '#6b21a8');
  root.style.setProperty('--color-secundario-custom', this.cliente.color_secundario || '#7c3aed');
  root.style.setProperty('--color-fondo-custom', this.cliente.color_fondo || '#000000');
  root.style.setProperty('--color-texto-custom', this.cliente.color_texto || '#ffffff');
  root.style.setProperty('--color-acento-custom', this.cliente.color_acento || '#8b5cf6');
  
  // Aplicar tamaños de fuente
  root.style.setProperty('--fuente-titulo', this.cliente.fuente_titulo || '3rem');
  root.style.setProperty('--fuente-subtitulo', this.cliente.fuente_subtitulo || '1.2rem');
  root.style.setProperty('--fuente-texto', this.cliente.fuente_texto || '1rem');
  
  // Aplicar border radius
  root.style.setProperty('--boton-radius', this.cliente.boton_border_radius || '12px');
  
  console.log('✅ Estilos personalizados aplicados:', {
    fondo: this.cliente.color_fondo,
    texto: this.cliente.color_texto,
    primario: this.cliente.color_primario
  });
}

  // ============================================
  // FUNCIONES
  // ============================================
  generarLinkWhatsApp(producto?: any): string {
    if (!this.cliente) return '#';
    const telefono = this.cliente.telefono_whatsapp.replace(/\D/g, '');
    let mensaje = 'Hola, quiero más información';
    if (producto) {
      mensaje = `Hola, me interesa: ${producto.nombre} ($${producto.precio})`;
    }
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  }

  verCarrito() {
    this.closeMenu();
    this.router.navigate(['/carrito']);
  }

  scrollToProductos() {
    this.closeMenu();
    const element = document.getElementById('productos');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  agregarAlCarrito(producto: any) {
    this.cartService.addItem(producto);
    this.mostrarNotificacion(`${producto.nombre} agregado`);
  }

  getTotalCart(): number {
    return this.cartService.getTotal();
  }

  filtrarProductos() {
    if (!this.busquedaProducto) {
      this.productosFiltrados = [...(this.cliente.productos || [])];
    } else {
      const termino = this.busquedaProducto.toLowerCase();
      this.productosFiltrados = (this.cliente.productos || []).filter((p: any) => 
        p.nombre.toLowerCase().includes(termino) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(termino))
      );
    }
  }

  limpiarBusqueda() {
    this.busquedaProducto = '';
    this.filtrarProductos();
  }

  getDescuentoPorcentaje(producto: any): number {
    if (!producto.precio_oferta || producto.precio_oferta >= producto.precio) return 0;
    return Math.round(((producto.precio - producto.precio_oferta) / producto.precio) * 100);
  }

  getSocialIcon(nombre: string): string {
    const icons: any = {
      facebook: 'logo-facebook',
      instagram: 'logo-instagram',
      twitter: 'logo-twitter',
      whatsapp: 'logo-whatsapp',
      tiktok: 'logo-tiktok',
      youtube: 'logo-youtube',
      linkedin: 'logo-linkedin',
      otro: 'link-outline'
    };
    return icons[nombre?.toLowerCase()] || 'link-outline';
  }

  getHeroTitleLines(): string[] {
    const title = this.cliente?.hero_1_titulo || 'Bienvenido';
    if (title.length > 20) {
      const mid = Math.floor(title.length / 2);
      const spaceIndex = title.indexOf(' ', mid);
      if (spaceIndex !== -1) {
        return [title.substring(0, spaceIndex), title.substring(spaceIndex + 1)];
      }
    }
    return [title];
  }

  private mostrarNotificacion(mensaje: string) {
    const toast = document.createElement('div');
    toast.innerHTML = `<ion-icon name="checkmark-circle"></ion-icon><span>${mensaje}</span>`;
    toast.style.cssText = `
      position: fixed; top: 100px; right: 24px;
      background: linear-gradient(135deg, ${this.cliente?.color_primario || '#6b21a8'}, ${this.cliente?.color_secundario || '#7c3aed'});
      color: white; padding: 14px 20px; border-radius: 10px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      display: flex; align-items: center; gap: 10px;
      z-index: 9999; font-weight: 600;
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
}