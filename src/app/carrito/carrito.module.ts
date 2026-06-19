import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CarritoPage } from './carrito.page';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: CarritoPage }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CarritoPage]
})
export class CarritoPageModule {}