import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-personalizar',
  templateUrl: './personalizar.page.html',
  styleUrls: ['./personalizar.page.scss'],
  standalone: false
})
export class PersonalizarPage implements OnInit, AfterViewInit {
  // 🔑 DECLARACIÓN DEL ViewChild
  @ViewChild(IonContent) content!: IonContent;
  
  usuario: any;
  perfil: any = {
    nombre_negocio: '',
    subdominio: '',
    telefono_whatsapp: '',
    email: '',
    logo_url: '',
    color_primario: '#6b21a8',
    color_secundario: '#7c3aed',
    color_fondo: '#000000',
    color_texto: '#ffffff',
    color_acento: '#8b5cf6',
    fuente_titulo: '3rem',
    fuente_subtitulo: '1.2rem',
    fuente_texto: '1rem',
    boton_border_radius: '12px',
    boton_estilo: 'gradient',
    hero_1_titulo: '',
    hero_1_subtitulo: '',
    hero_1_imagen: '',
    producto_destacado_id: '',
    redes_sociales: []
  };
  productos: any[] = [];
  productoSeleccionado: any = null;
  guardando = false;

  constructor(
    private tenantAuth: TenantAuthService,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.usuario = this.tenantAuth.getCurrentUser();
    await this.cargarPerfil();
  }

  // 🔑 MÉTODO PARA FORZAR SCROLL AL INICIO
  ngAfterViewInit() {
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToTop(0);
      }
    }, 100);
  }

  async cargarPerfil() {
    if (!this.usuario?.id) return;

    try {
      const { data, error } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('*')
        .eq('id', this.usuario.id)
        .single();

      if (error) throw error;
      
      if (data) {
        this.perfil = {
          ...this.perfil,
          ...data,
          redes_sociales: data.redes_sociales || []
        };
      }
      
      await this.cargarProductos();
      
      if (this.perfil.producto_destacado_id) {
        await this.cargarProductoSeleccionado();
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  }

  async cargarProductos() {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('productos')
        .select('*')
        .eq('cliente_id', this.usuario.id)
        .order('nombre');

      if (error) throw error;
      this.productos = data || [];
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  async cargarProductoSeleccionado() {
    if (!this.perfil.producto_destacado_id) {
      this.productoSeleccionado = null;
      return;
    }

    try {
      const { data, error } = await this.supabase.getClient()
        .from('productos')
        .select('*')
        .eq('id', this.perfil.producto_destacado_id)
        .single();

      if (error) throw error;
      this.productoSeleccionado = data;
    } catch (error) {
      console.error('Error cargando producto seleccionado:', error);
      this.productoSeleccionado = null;
    }
  }

  async subirLogo(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileName = `logos/${this.usuario.id}/${Date.now()}-${file.name}`;
      const { error } = await this.supabase.getClient()
        .storage
        .from('imagenes')
        .upload(fileName, file);

      if (error) throw error;

      const { data } = this.supabase.getClient()
        .storage
        .from('imagenes')
        .getPublicUrl(fileName);

      this.perfil.logo_url = data.publicUrl;
      await this.guardar();
    } catch (error) {
      console.error('Error subiendo logo:', error);
      alert('Error al subir el logo');
    }
  }

  agregarRedSocial() {
    if (!this.perfil.redes_sociales) {
      this.perfil.redes_sociales = [];
    }
    this.perfil.redes_sociales.push({ nombre: 'facebook', url: '' });
  }

  eliminarRedSocial(index: number) {
    this.perfil.redes_sociales.splice(index, 1);
  }

  async guardar() {
    if (!this.usuario?.id) return;
    
    this.guardando = true;

    try {
      const { error } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .update({
          nombre_negocio: this.perfil.nombre_negocio,
          subdominio: this.perfil.subdominio,
          telefono_whatsapp: this.perfil.telefono_whatsapp,
          email: this.perfil.email,
          logo_url: this.perfil.logo_url,
          color_primario: this.perfil.color_primario,
          color_secundario: this.perfil.color_secundario,
          color_fondo: this.perfil.color_fondo,
          color_texto: this.perfil.color_texto,
          color_acento: this.perfil.color_acento,
          fuente_titulo: this.perfil.fuente_titulo,
          fuente_subtitulo: this.perfil.fuente_subtitulo,
          fuente_texto: this.perfil.fuente_texto,
          boton_border_radius: this.perfil.boton_border_radius,
          boton_estilo: this.perfil.boton_estilo,
          hero_1_titulo: this.perfil.hero_1_titulo,
          hero_1_subtitulo: this.perfil.hero_1_subtitulo,
          hero_1_imagen: this.perfil.hero_1_imagen,
          producto_destacado_id: this.perfil.producto_destacado_id || null,
          redes_sociales: this.perfil.redes_sociales || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', this.usuario.id);

      if (error) {
        console.error('Error de Supabase:', error);
        alert('Error al guardar: ' + error.message);
        throw error;
      }
      
      alert('✅ Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar los cambios');
    }
    
    this.guardando = false;
  }

  // ============================================
// SUBIR IMAGEN DEL HERO
// ============================================
async subirHeroImagen(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe pesar más de 5MB');
      return;
    }

    const fileName = `heroes/${this.usuario.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    const { error } = await this.supabase.getClient()
      .storage
      .from('imagenes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data } = this.supabase.getClient()
      .storage
      .from('imagenes')
      .getPublicUrl(fileName);

    this.perfil.hero_1_imagen = data.publicUrl;
    
    // Guardar automáticamente
    await this.guardar();
  } catch (error) {
    console.error('Error subiendo imagen del hero:', error);
    alert('Error al subir la imagen del hero');
  }
}

// ============================================
// ELIMINAR IMAGEN DEL HERO
// ============================================
async eliminarHeroImagen() {
  if (!confirm('¿Estás seguro de eliminar la imagen del hero?')) {
    return;
  }

  try {
    // Si hay una URL anterior, intentar eliminarla del storage
    if (this.perfil.hero_1_imagen) {
      const url = this.perfil.hero_1_imagen;
      // Extraer el path del archivo de la URL
      const match = url.match(/\/imagenes\/(.+)$/);
      if (match) {
        const filePath = match[1];
        await this.supabase.getClient()
          .storage
          .from('imagenes')
          .remove([filePath]);
      }
    }

    this.perfil.hero_1_imagen = '';
    await this.guardar();
  } catch (error) {
    console.error('Error eliminando imagen del hero:', error);
    // Aunque falle la eliminación del storage, limpiamos la URL
    this.perfil.hero_1_imagen = '';
  }
}
}