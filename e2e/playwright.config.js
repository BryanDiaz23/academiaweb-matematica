// Pruebas E2E de Matemática Sin Estrés (Playwright).
//
// Sin variables de entorno levanta solo el back-end (perfil dev: H2 en memoria) y el front-end (Vite) y prueba sobre ellos.
// Para probar un despliegue ya publicado:  E2E_BASE_URL=https://mse-frontend.onrender.com npm test
import { defineConfig, devices } from '@playwright/test';

const urlExterna = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: urlExterna || 'http://127.0.0.1:5173',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    // Compatibilidad con dispositivos (RNF): en móvil se ejecutan solo los casos marcados con @movil.
    { name: 'movil', use: { ...devices['Pixel 7'] }, grep: /@movil/ },
  ],
  webServer: urlExterna
    ? undefined
    : [
        {
          command: 'mvn -q -f ../backend/pom.xml spring-boot:run',
          url: 'http://127.0.0.1:8080/api/public/health',
          timeout: 240_000,
          reuseExistingServer: !process.env.CI,
          // El registro está limitado a 5 por minuto y por IP: se desactiva solo para estas pruebas.
          env: { RATE_LIMIT_ENABLED: 'false' },
        },
        {
          command: 'npm --prefix ../frontend run dev -- --host 127.0.0.1 --port 5173 --strictPort',
          url: 'http://127.0.0.1:5173',
          timeout: 60_000,
          reuseExistingServer: !process.env.CI,
        },
      ],
});
