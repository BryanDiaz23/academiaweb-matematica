// Pruebas de sistema y de aceptación (caja negra) sobre la aplicación completa: navegador + front-end + API + BD.
import { test, expect } from '@playwright/test';

/** Contraseña de prueba que cumple la política (solo existe en el entorno de pruebas). */
const PASSWORD = 'Vr#9kQ!m2Lp@xZ7w';

/** Usuario único por ejecución para no chocar con cuentas creadas antes (el registro rechaza duplicados). */
const usuarioUnico = () => `e2e.${Date.now().toString(36)}${Math.floor(Math.random() * 10_000)}`;

test.describe('Visitante', () => {
  test('E2E-01 La página principal carga los niveles desde la API @movil', async ({ page }) => {
    const respuestaNiveles = page.waitForResponse((r) => r.url().includes('/api/public/niveles') && r.status() === 200);
    await page.goto('/');
    await respuestaNiveles;
    await expect(page).toHaveTitle(/Matemática Sin Estrés/);
    await expect(page.getByText('Secundaria').first()).toBeVisible();
  });

  test('E2E-02 Un login con credenciales inválidas muestra el error y no inicia sesión @movil', async ({ page }) => {
    await page.goto('/login');
    // Se usan etiquetas accesibles (getByLabel): si un campo perdiera su <label>, esta prueba fallaría.
    await page.getByLabel('Usuario o correo electrónico').fill('usuario.inexistente');
    await page.getByLabel('Contraseña', { exact: true }).fill('Cualquiera#2026x');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toContainText('Usuario o contraseña incorrectos');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('E2E-03 Las rutas privadas redirigen al login cuando no hay sesión @movil', async ({ page }) => {
    for (const ruta of ['/admin', '/aula', '/familia']) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test('E2E-04 Una dirección inexistente muestra la página 404 @movil', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe');
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  });

  test('E2E-07 El asistente responde preguntas frecuentes con datos de la API y deriva a WhatsApp lo que no entiende @movil', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir el asistente de preguntas frecuentes' }).click();
    const chat = page.getByRole('dialog', { name: 'Asistente de preguntas frecuentes' });
    await expect(chat).toBeVisible();

    // Pregunta sugerida: la respuesta trae los precios en soles.
    await chat.getByRole('button', { name: '¿Cuánto cuestan los niveles?' }).click();
    await expect(chat.getByRole('log')).toContainText('S/');

    // Pregunta escrita que no entiende: ofrece WhatsApp con la pregunta ya escrita.
    await chat.getByLabel('Escribe tu pregunta').fill('xyzzy qwerty');
    await chat.getByRole('button', { name: 'Enviar pregunta' }).click();
    const whatsapp = chat.getByRole('link', { name: 'Escribir por WhatsApp' });
    await expect(whatsapp).toBeVisible();
    await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+\?text=.*xyzzy/);

    // Escape cierra el asistente.
    await page.keyboard.press('Escape');
    await expect(chat).toBeHidden();
  });
});

test.describe('Registro y aula del alumno', () => {
  test('E2E-05 Con una contraseña débil el botón "Crear cuenta" permanece deshabilitado (protección contra errores de usuario)', async ({ page }) => {
    await page.goto('/register');
    await page.locator('#nombreCompleto').fill('Estudiante Prueba');
    await page.locator('#username').fill(usuarioUnico());
    await page.locator('#email').fill('estudiante.prueba@example.com');
    await page.locator('#password').fill('123456');
    await page.locator('#confirmarPassword').fill('123456');
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled();
  });

  test('E2E-06 Flujo completo: registrarse, iniciar sesión, entrar al aula y salir', async ({ page }) => {
    const usuario = usuarioUnico();

    await page.goto('/register');
    await page.locator('#nombreCompleto').fill('Estudiante Prueba');
    await page.locator('#username').fill(usuario);
    await page.locator('#email').fill(`${usuario}@example.com`);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmarPassword').fill(PASSWORD);
    const crear = page.getByRole('button', { name: 'Crear cuenta' });
    await expect(crear).toBeEnabled();
    await crear.click();

    // El registro lleva al login con el usuario ya escrito y un aviso de éxito.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('¡Cuenta creada!')).toBeVisible();
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/aula/);

    // Un alumno no debe poder entrar al panel de administración.
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/aula/);

    await page.getByRole('button', { name: /salir/i }).first().click();
    await expect(page).not.toHaveURL(/\/aula/);
  });

  test('E2E-08 Un padre se registra como apoderado, entra a su panel de familia y no puede abrir el aula ni el admin', async ({ page }) => {
    const usuario = usuarioUnico();

    await page.goto('/register?tipo=apoderado');
    // El enlace de "Para padres" deja marcada la opción de apoderado.
    await expect(page.getByLabel('Soy padre, madre o apoderado')).toBeChecked();
    await page.locator('#nombreCompleto').fill('Madre Prueba');
    await page.locator('#username').fill(usuario);
    await page.locator('#email').fill(`${usuario}@example.com`);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmarPassword').fill(PASSWORD);
    const crear = page.getByRole('button', { name: 'Crear cuenta' });
    await expect(crear).toBeEnabled();
    await crear.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('pide a la academia que te vincule')).toBeVisible();
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // Su panel es /familia; sin vínculo no hay datos de ningún alumno.
    await expect(page).toHaveURL(/\/familia/);
    await expect(page.getByText('Todavía no tienes hijos vinculados')).toBeVisible();

    // Las rutas de otros roles lo devuelven a su panel (y la API responde 403, ver pruebas de integración APO-03).
    await page.goto('/aula');
    await expect(page).toHaveURL(/\/familia/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/familia/);
  });
});
