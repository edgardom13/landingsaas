import { Component, OnInit } from '@angular/core';
import { ProductoService, Producto } from '../../core/services/producto.service';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: false
})
export class ProductosPage implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busqueda = '';
  cargando = true;
  categoria?: string;  // ← AGREGA ESTA LÍNEA

  constructor(
    private productoService: ProductoService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    await this.cargarProductos();
  }

  async cargarProductos() {
    this.cargando = true;
    try {
      this.productos = await this.productoService.getAll();
      this.productosFiltrados = [...this.productos];
    } catch (error) {
      await this.mostrarToast('Error al cargar productos', 'danger');
    }
    this.cargando = false;
  }

  filtrarProductos() {
  if (!this.busqueda.trim()) {
    this.productosFiltrados = [...this.productos];
  } else {
    const termino = this.busqueda.toLowerCase().trim();
    this.productosFiltrados = this.productos.filter(p => 
      p.nombre?.toLowerCase().includes(termino) ||
      p.descripcion?.toLowerCase().includes(termino)
    );
  }
}

  async crearProducto() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo Producto',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre del producto' },
        { name: 'descripcion', type: 'text', placeholder: 'Descripción' },
        { name: 'precio', type: 'number', placeholder: 'Precio' },
        { name: 'imagen_url', type: 'text', placeholder: 'URL de imagen (opcional)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (!data.nombre || !data.precio) {
              await this.mostrarToast('Nombre y precio son obligatorios', 'warning');
              return false;
            }
            try {
              await this.productoService.create({
                nombre: data.nombre,
                descripcion: data.descripcion,
                precio: parseFloat(data.precio),
                imagen_url: data.imagen_url
              });
              await this.cargarProductos();
              await this.mostrarToast('Producto creado', 'success');
              return true;
            } catch (error) {
              await this.mostrarToast('Error al crear', 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editarProducto(producto: Producto) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Producto',
      inputs: [
        { name: 'nombre', type: 'text', value: producto.nombre },
        { name: 'descripcion', type: 'text', value: producto.descripcion },
        { name: 'precio', type: 'number', value: producto.precio },
        { name: 'imagen_url', type: 'text', value: producto.imagen_url }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              await this.productoService.update(producto.id!, {
                nombre: data.nombre,
                descripcion: data.descripcion,
                precio: parseFloat(data.precio),
                imagen_url: data.imagen_url
              });
              await this.cargarProductos();
              await this.mostrarToast('Producto actualizado', 'success');
              return true;
            } catch (error) {
              await this.mostrarToast('Error al actualizar', 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarProducto(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: '¿Eliminar este producto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.productoService.delete(id);
              await this.cargarProductos();
              await this.mostrarToast('Producto eliminado', 'success');
              return true;
            } catch (error) {
              await this.mostrarToast('Error al eliminar', 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async subirImagen(producto: Producto, event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const loading = await this.loadingCtrl.create({ message: 'Subiendo imagen...' });
    await loading.present();

    try {
      const url = await this.productoService.uploadImage(file);
      await this.productoService.update(producto.id!, { imagen_url: url });
      await this.cargarProductos();
      await this.mostrarToast('Imagen subida', 'success');
    } catch (error) {
      await this.mostrarToast('Error al subir imagen', 'danger');
    } finally {
      await loading.dismiss();
    }
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