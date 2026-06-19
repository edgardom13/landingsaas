import { Component, OnInit } from '@angular/core';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';

@Component({
  selector: 'app-tenant-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  negocioNombre = '';

  constructor(private tenantAuth: TenantAuthService) {}

  ngOnInit() {
    const user = this.tenantAuth.getCurrentUser();
    this.negocioNombre = user?.nombre_negocio || 'Mi Negocio';
  }
}