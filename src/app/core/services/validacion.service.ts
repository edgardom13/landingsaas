import { Injectable } from '@angular/core';

export interface ValidationResult {
  valido: boolean;
  errores: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ValidacionService {

  validarEmail(email: string): ValidationResult {
    const errores: string[] = [];
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) {
      errores.push('El email es obligatorio');
    } else if (!regex.test(email)) {
      errores.push('El email no es válido');
    }

    return { valido: errores.length === 0, errores };
  }

  validarPassword(password: string): ValidationResult {
    const errores: string[] = [];

    if (!password) {
      errores.push('La contraseña es obligatoria');
    } else if (password.length < 8) {
      errores.push('La contraseña debe tener al menos 8 caracteres');
    } else if (!/[A-Z]/.test(password)) {
      errores.push('Debe tener al menos una mayúscula');
    } else if (!/[0-9]/.test(password)) {
      errores.push('Debe tener al menos un número');
    }

    return { valido: errores.length === 0, errores };
  }

  validarTelefono(telefono: string): ValidationResult {
    const errores: string[] = [];
    const regex = /^\+?[0-9]{10,15}$/;

    if (!telefono) {
      errores.push('El teléfono es obligatorio');
    } else if (!regex.test(telefono.replace(/\s/g, ''))) {
      errores.push('El teléfono no es válido');
    }

    return { valido: errores.length === 0, errores };
  }

  validarSubdominio(subdominio: string): ValidationResult {
    const errores: string[] = [];
    const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!subdominio) {
      errores.push('El subdominio es obligatorio');
    } else if (subdominio.length < 3) {
      errores.push('Mínimo 3 caracteres');
    } else if (!regex.test(subdominio)) {
      errores.push('Solo letras minúsculas, números y guiones');
    }

    return { valido: errores.length === 0, errores };
  }
}