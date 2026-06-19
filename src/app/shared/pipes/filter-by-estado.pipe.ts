import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByEstado',
  standalone: false
})
export class FilterByEstadoPipe implements PipeTransform {
  transform(leads: any[], estado: string): number {
    if (!leads) return 0;
    return leads.filter(l => l.estado === estado).length;
  }
}