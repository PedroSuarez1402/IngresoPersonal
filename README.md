# Ingreso Personal (Google Apps Script)

Sistema de control de asistencia basado en Google Sheets + WebApp (HtmlService). Incluye:

- Autenticación por **Correo + Contraseña**.
- Registro de marcaciones (Ingreso / Almuerzo / Reingreso / Salida).
- Panel de **Talento Humano (Rol 2)** con:
  - Reportes de asistencia (filtros y KPIs).
  - Gestión de usuarios (CRUD básico: crear/editar + activar/desactivar).
  - Configuración de horarios (reglas para clasificar “A tiempo” / “Retraso”).

## Roles (RBAC)

- `Rol_ID = 1`: Usuario (puede registrar su marcación).
- `Rol_ID = 2`: Talento Humano / Administrador (puede registrar marcación + acceder al panel admin).

## Base de datos (Google Sheets)

La Spreadsheet asociada al script debe contener **exactamente** estas hojas:

- `Base_Usuarios`
- `Config_Horarios`
- `Registro_Asistencia`

Estructura detallada: [contexto_db.md](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/contexto_db.md)

## Vistas (WebApp)

- `index.html`: login + menú + reloj checador.
- `admin.html`: panel TH con sidebar y secciones (Asistencia / Usuarios / Horarios).

El enrutamiento se hace por querystring:

- `APP_URL` → `index.html`
- `APP_URL?v=admin` → `admin.html`

## Documentación

- [Arquitectura](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/docs/arquitectura.md)
- [Base de datos](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/docs/base_datos.md)
- [API (google.script.run)](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/docs/api.md)
- [UI / Pantallas](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/docs/ui.md)
- [Operación y migración](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/docs/operacion.md)

