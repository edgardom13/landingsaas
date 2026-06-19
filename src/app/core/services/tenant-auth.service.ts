import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TenantAuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private initialized = false;

  constructor(private supabase: SupabaseService) {
    this.inicializarSesion();
  }

  // ============================================
  // ✅ INICIALIZAR SESIÓN (persistente)
  // ============================================
  private async inicializarSesion() {
    if (this.initialized) return;

    try {
      const { data: { session } } = await this.supabase.getClient().auth.getSession();

      if (session?.user) {
        console.log('✅ Sesión encontrada:', session.user.email);
        const perfil = await this.cargarPerfilUsuario(session.user.id);
        
        if (perfil) {
          this.currentUserSubject.next({ ...session.user, ...perfil });
        } else {
          this.currentUserSubject.next(session.user);
        }
      } else {
        this.currentUserSubject.next(null);
      }

      this.supabase.getClient().auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          this.cargarPerfilUsuario(session.user.id).then(perfil => {
            const userData = perfil 
              ? { ...session.user, ...perfil }
              : session.user;
            this.currentUserSubject.next(userData);
          });
        } else if (event === 'SIGNED_OUT') {
          this.currentUserSubject.next(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          this.currentUserSubject.next(session.user);
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('❌ Error inicializando sesión:', error);
      this.currentUserSubject.next(null);
      this.initialized = true;
    }
  }

  // ============================================
  // ✅ CARGAR PERFIL DESDE LA BD
  // ============================================
  private async cargarPerfilUsuario(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error cargando perfil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error cargando perfil:', error);
      return null;
    }
  }

  // ============================================
  // ✅ REGISTRO (NUEVO MÉTODO)
  // ============================================
  async registro(datos: {
    email: string;
    password: string;
    nombre_negocio?: string;
    subdominio?: string;
    telefono_whatsapp?: string;
  }): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      // 1️⃣ Crear usuario en Supabase Auth
      const { data, error } = await this.supabase.getClient().auth.signUp({
        email: datos.email,
        password: datos.password,
        options: {
          data: {
            nombre_negocio: datos.nombre_negocio || '',
            subdominio: datos.subdominio || ''
          }
        }
      });

      if (error) {
        console.error('❌ Error en registro:', error);
        
        // Mensajes más claros
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este email ya está registrado' };
        }
        if (error.message.includes('password')) {
          return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      // 2️⃣ Crear perfil en la tabla perfiles_clientes
      const perfilData = {
        id: data.user.id,
        email: datos.email,
        nombre_negocio: datos.nombre_negocio || '',
        subdominio: datos.subdominio || '',
        telefono_whatsapp: datos.telefono_whatsapp || '',
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
        redes_sociales: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: perfilError } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .insert([perfilData]);

      if (perfilError) {
        console.error('❌ Error creando perfil:', perfilError);
        // No es fatal, el usuario ya existe en auth
      }

      // 3️⃣ Si Supabase requiere confirmación de email, no inicia sesión automáticamente
      if (data.session) {
        // ✅ Sesión creada automáticamente (email no requiere confirmación)
        const perfil = await this.cargarPerfilUsuario(data.user.id);
        const userData = perfil 
          ? { ...data.user, ...perfil }
          : data.user;
        
        this.currentUserSubject.next(userData);
        console.log('✅ Registro exitoso y sesión iniciada:', data.user.email);
      } else {
        // ⚠️ Requiere confirmación de email
        console.log('⚠️ Email de confirmación enviado a:', datos.email);
        return { 
          success: true, 
          userId: data.user.id,
          error: 'Revisa tu email para confirmar tu cuenta'
        };
      }

      return { success: true, userId: data.user.id };
    } catch (error: any) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message || 'Error al registrar' };
    }
  }

  // ============================================
  // ✅ LOGIN
  // ============================================
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error login:', error);
        
        // Mensajes claros
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email o contraseña incorrectos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Debes confirmar tu email antes de iniciar sesión' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const perfil = await this.cargarPerfilUsuario(data.user.id);
        const userData = perfil 
          ? { ...data.user, ...perfil }
          : data.user;
        
        this.currentUserSubject.next(userData);
        console.log('✅ Login exitoso:', data.user.email);
        return { success: true };
      }

      return { success: false, error: 'No se pudo iniciar sesión' };
    } catch (error: any) {
      console.error('Error login:', error);
      return { success: false, error: error.message || 'Error al iniciar sesión' };
    }
  }

  // ============================================
  // ✅ LOGOUT
  // ============================================
  async logout(): Promise<void> {
    try {
      await this.supabase.getClient().auth.signOut();
      this.currentUserSubject.next(null);
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('Error logout:', error);
    }
  }

  // ============================================
  // ✅ OBTENER USUARIO ACTUAL
  // ============================================
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  // ============================================
  // ✅ VERIFICAR SI ESTÁ LOGUEADO
  // ============================================
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // ============================================
  // ✅ ESPERAR A QUE LA SESIÓN SE CARGUE
  // ============================================
  async waitForAuth(): Promise<any> {
    if (this.initialized) {
      return this.currentUserSubject.value;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(this.currentUserSubject.value);
      }, 5000);

      const sub = this.currentUser$.subscribe(user => {
        if (this.initialized) {
          clearTimeout(timeout);
          sub.unsubscribe();
          resolve(user);
        }
      });
    });
  }
}