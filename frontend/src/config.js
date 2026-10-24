// En desarrollo (npm run dev) se usa el proxy de Vite: las peticiones van a /api del mismo origen.
// En producción (npm run build) se usa la URL pública del back-end definida en VITE_API_URL.
export const API_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '51987654321';

export function enlaceWhatsApp(motivo) {
  const texto = `¡Hola! Quisiera información sobre *${motivo}* en *Matemática Sin Estrés*.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

/** Enlace de WhatsApp a la academia con un mensaje ya escrito. */
export function enlaceWhatsAppTexto(texto) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}
