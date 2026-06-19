import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../core/services/cart.service';
import { SupabaseService } from '../core/services/supabase.service';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.page.html',
  styleUrls: ['./carrito.page.scss'],
  standalone: false
})
export class CarritoPage implements OnInit {
  items: CartItem[] = [];
  cliente: any = null;
  
  datosCliente = {
    nombre: '',
    telefono: '',
    direccion: '',
    notas: ''
  };

  // 🆕 Propiedades para cupones
  cupon = '';
  cuponAplicado = false;
  descuento = 0;
  cuponesValidos: any = {
    'BIENVENIDO10': 10,    // 10% de descuento
    'PRIMERACOMPRA': 15,   // 15% de descuento
    'VIP20': 20            // 20% de descuento
  };

  constructor(
    private cartService: CartService,
    private router: Router,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.items = items;
    });
    
    await this.cargarCliente();
  }

  async cargarCliente() {
    const params = new URLSearchParams(window.location.search);
    const subdominio = params.get('subdominio') || 'minegocio';
    
    try {
      const { data } = await this.supabase.getClient()
        .from('perfiles_clientes')
        .select('*')
        .eq('subdominio', subdominio)
        .single();
      
      this.cliente = data;
    } catch (error) {
      console.error('Error cargando cliente:', error);
    }
  }

  cambiarCantidad(productId: string, cantidad: number) {
    this.cartService.updateQuantity(productId, cantidad);
  }

  eliminarItem(productId: string) {
    this.cartService.removeItem(productId);
  }

  limpiarCarrito() {
    if (confirm('¿Estás seguro de que deseas limpiar todo el carrito?')) {
      this.cartService.clearCart();
      this.cupon = '';
      this.cuponAplicado = false;
      this.descuento = 0;
    }
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }

  volver() {
    window.history.back();
  }

  // ============================================
  // 🆕 MÉTODOS DE CUPONES
  // ============================================

  aplicarCupon() {
    if (!this.cupon.trim()) {
      alert('Por favor ingresa un código de cupón');
      return;
    }

    const codigo = this.cupon.trim().toUpperCase();
    
    if (this.cuponesValidos[codigo]) {
      const porcentaje = this.cuponesValidos[codigo];
      this.descuento = Math.round(this.getTotal() * (porcentaje / 100));
      this.cuponAplicado = true;
      
      alert(`✅ Cupón aplicado: ${porcentaje}% de descuento (-$${this.descuento})`);
    } else {
      alert('❌ Cupón no válido. Intenta con: BIENVENIDO10, PRIMERACOMPRA o VIP20');
    }
  }

  removerCupon() {
    this.cupon = '';
    this.cuponAplicado = false;
    this.descuento = 0;
  }

  // ============================================
  // ENVIAR PEDIDO
  // ============================================

  async enviarPedido() {
  if (!this.cliente) {
    alert('No se encontró el negocio');
    return;
  }

  if (!this.datosCliente.nombre || !this.datosCliente.telefono) {
    alert('Por favor completa tu nombre y teléfono');
    return;
  }

  const totalFinal = this.getTotal() - this.descuento;

  try {
    // 🔑 GUARDAR PEDIDO EN SUPABASE
    const { data, error } = await this.supabase.getClient()
      .from('pedidos')
      .insert({
        cliente_id: this.cliente.id,
        nombre_cliente: this.datosCliente.nombre,
        telefono_cliente: this.datosCliente.telefono,
        direccion_entrega: this.datosCliente.direccion || null,
        notas: this.datosCliente.notas || null,
        items: this.items, // Array de productos
        subtotal: this.getTotal(),
        descuento: this.descuento,
        total: totalFinal,
        estado: 'pendiente',
        cupon_aplicado: this.cuponAplicado ? this.cupon : null
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Pedido guardado:', data);

    // Construir mensaje para WhatsApp
    let mensaje = `🛒 *NUEVO PEDIDO #${data.id.slice(0, 8)}*\n\n`;
    mensaje += `👤 *Cliente:* ${this.datosCliente.nombre}\n`;
    mensaje += `📞 *Teléfono:* ${this.datosCliente.telefono}\n`;
    
    if (this.datosCliente.direccion) {
      mensaje += `📍 *Dirección:* ${this.datosCliente.direccion}\n`;
    }
    
    mensaje += `\n━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `📦 *PRODUCTOS:*\n\n`;
    
    this.items.forEach((item, index) => {
      mensaje += `${index + 1}. *${item.nombre}*\n`;
      mensaje += `   Cantidad: ${item.cantidad}\n`;
      mensaje += `   Precio: $${item.precio.toLocaleString()} COP\n`;
      mensaje += `   Subtotal: $${(item.precio * item.cantidad).toLocaleString()} COP\n\n`;
    });
    
    mensaje += `━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `💰 *Subtotal:* $${this.getTotal().toLocaleString()} COP\n`;
    
    if (this.descuento > 0) {
      mensaje += `🎟️ *Descuento (${this.cupon}):* -$${this.descuento.toLocaleString()} COP\n`;
    }
    
    mensaje += `\n💵 *TOTAL: $${totalFinal.toLocaleString()} COP*\n\n`;
    
    if (this.datosCliente.notas) {
      mensaje += `📝 *Notas:* ${this.datosCliente.notas}\n\n`;
    }
    
    mensaje += `¡Gracias por tu compra! 🎉`;

    // Abrir WhatsApp
    const telefono = this.cliente.telefono_whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
    
    // Mostrar confirmación
    alert('✅ Pedido registrado correctamente\n\nSe abrirá WhatsApp para confirmar.');
    
    // Limpiar carrito
    setTimeout(() => {
      this.cartService.clearCart();
      this.cupon = '';
      this.cuponAplicado = false;
      this.descuento = 0;
    }, 1000);
    
  } catch (error) {
    console.error('Error guardando pedido:', error);
    alert('❌ Error al registrar el pedido. Por favor intenta nuevamente.');
  }
}
}