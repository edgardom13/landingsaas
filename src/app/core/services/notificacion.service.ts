import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  constructor() {}

  async enviarEmail(destinatario: string, asunto: string, mensaje: string) {
    console.log(`📧 Email a ${destinatario}: ${asunto}`);
    // Aquí integrarías EmailJS o similar
    return true;
  }

  async enviarWhatsApp(telefono: string, mensaje: string) {
    console.log(`📱 WhatsApp a ${telefono}: ${mensaje}`);
    // Aquí integrarías Twilio o similar
    return true;
  }
}