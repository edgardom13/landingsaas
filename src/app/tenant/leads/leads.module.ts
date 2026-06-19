import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterByEstadoPipe } from '../../shared/pipes/filter-by-estado.pipe';
import { IonicModule } from '@ionic/angular';

import { LeadsPageRoutingModule } from './leads-routing.module';

import { LeadsPage } from './leads.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LeadsPageRoutingModule
  ],
  declarations: [LeadsPage, FilterByEstadoPipe]
})
export class LeadsPageModule {}
