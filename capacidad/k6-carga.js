// Prueba de carga con k6 (https://k6.io), alternativa a capacidad/carga.py.
// Uso: k6 run -e API_URL=https://mse-backend.onrender.com capacidad/k6-carga.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_URL || 'http://localhost:8080';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // carga normal: 10 usuarios concurrentes
    { duration: '1m', target: 25 },   // pico esperado (inicio del turno de la tarde)
    { duration: '30s', target: 50 },  // estrés: doble del pico
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // SLA: p95 < 2 s
    http_req_failed: ['rate<0.01'],    // menos de 1 % de errores
  },
};

const RUTAS = ['/api/public/health', '/api/public/niveles', '/api/public/horarios', '/api/public/clases-recientes', '/api/public/estadisticas'];

export default function () {
  for (const ruta of RUTAS) {
    const r = http.get(`${API}${ruta}`);
    check(r, { 'status 200': (res) => res.status === 200 });
  }
  sleep(1);
}
