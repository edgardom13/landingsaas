import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartItems.asObservable();

  constructor() {
    this.loadCart();
  }

  addItem(producto: any) {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(item => item.id === producto.id);

    if (existingItem) {
      existingItem.cantidad += 1;
      this.cartItems.next([...currentItems]);
    } else {
      const newItem: CartItem = {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio,
        cantidad: 1,
        imagen: producto.imagen_url
      };
      this.cartItems.next([...currentItems, newItem]);
    }

    this.saveCart();
  }

  removeItem(productId: string) {
    const currentItems = this.cartItems.value;
    const updatedItems = currentItems.filter(item => item.id !== productId);
    this.cartItems.next(updatedItems);
    this.saveCart();
  }

  updateQuantity(productId: string, cantidad: number) {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(item => item.id === productId);
    
    if (item) {
      if (cantidad <= 0) {
        this.removeItem(productId);
      } else {
        item.cantidad = cantidad;
        this.cartItems.next([...currentItems]);
        this.saveCart();
      }
    }
  }

  clearCart() {
    this.cartItems.next([]);
    this.saveCart();
  }

  getTotal(): number {
    return this.cartItems.value.reduce(
      (total, item) => total + (item.precio * item.cantidad), 
      0
    );
  }

  getItemCount(): number {
    return this.cartItems.value.reduce(
      (count, item) => count + item.cantidad, 
      0
    );
  }

  getItems(): CartItem[] {
    return this.cartItems.value;
  }

  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
  }

  private loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems.next(JSON.parse(savedCart));
    }
  }
}