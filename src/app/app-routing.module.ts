import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TenantGuard } from './core/guards/tenant-guard';
import { SuscripcionGuard } from './core/guards/suscripcion.guard';

const routes: Routes = [
  // ✅ LOGIN COMO PÁGINA PRINCIPAL
  {
    path: '',
    loadChildren: () => import('./tenant/login/login.module').then(m => m.LoginPageModule)
  },
  
  // Landing pública (ahora en /landing)
  {
    path: 'landing',
    loadChildren: () => import('./landing/landing.module').then(m => m.LandingPageModule)
  },
  
  // Carrito público
  {
    path: 'carrito',
    loadChildren: () => import('./carrito/carrito.module').then(m => m.CarritoPageModule)
  },
  
  // Tenant auth (sin guard)
  {
    path: 'tenant/login',
    loadChildren: () => import('./tenant/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'tenant/registro',
    loadChildren: () => import('./tenant/registro/registro.module').then(m => m.RegistroPageModule)
  },
  
  // Tenant protegido
  {
    path: 'tenant',
    canActivate: [TenantGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./tenant/dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
      {
        path: 'pedidos',
        canActivate: [SuscripcionGuard],
        loadChildren: () => import('./tenant/pedidos/pedidos.module').then(m => m.PedidosPageModule)
      },
      {
        path: 'productos',
        canActivate: [SuscripcionGuard],
        loadChildren: () => import('./tenant/productos/productos.module').then(m => m.ProductosPageModule)
      },
      {
        path: 'personalizar',
        canActivate: [SuscripcionGuard],
        loadChildren: () => import('./tenant/personalizar/personalizar.module').then(m => m.PersonalizarPageModule)
      },
      {
        path: 'leads',
        canActivate: [SuscripcionGuard],
        loadChildren: () => import('./tenant/leads/leads.module').then(m => m.LeadsPageModule)
      },
      {
        path: 'testimonios',
        canActivate: [SuscripcionGuard],
        loadChildren: () => import('./tenant/testimonios/testimonios.module').then(m => m.TestimoniosPageModule)
      },
      {
        path: 'pagos',
        loadChildren: () => import('./tenant/pagos/pagos.module').then(m => m.PagosPageModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // Admin
  {
    path: 'admin/login',
    loadChildren: () => import('./admin/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'admin',
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./admin/dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
      {
        path: 'clientes',
        loadChildren: () => import('./admin/clientes/clientes.module').then(m => m.ClientesPageModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // Wildcard - SIEMPRE al final
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}