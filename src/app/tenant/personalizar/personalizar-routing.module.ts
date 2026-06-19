import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PersonalizarPage } from './personalizar.page';

const routes: Routes = [
  {
    path: '',
    component: PersonalizarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonalizarPageRoutingModule {}
