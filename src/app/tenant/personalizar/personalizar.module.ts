import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PersonalizarPageRoutingModule } from './personalizar-routing.module';

import { PersonalizarPage } from './personalizar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PersonalizarPageRoutingModule
  ],
  declarations: [PersonalizarPage]
})
export class PersonalizarPageModule {}
