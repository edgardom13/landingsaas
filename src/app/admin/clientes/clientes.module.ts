import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ClientesPage } from './clientes.page';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: ClientesPage }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ClientesPage]
})
export class ClientesPageModule {}