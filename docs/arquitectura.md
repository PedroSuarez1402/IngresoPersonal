# Arquitectura

## Resumen

El proyecto está construido como una **WebApp de Google Apps Script** que sirve vistas HTML (HtmlService) y usa Google Sheets como base de datos.

- Frontend: HTML + Bootstrap 5 + JavaScript (en archivos `.html` incluidos como parciales).
- Backend: funciones Apps Script (`.js`) invocadas desde el frontend con `google.script.run`.
- Persistencia: Google Sheets con 3 tablas (hojas).

## Entrypoint y enrutamiento

- Servidor:
  - [doGet(e)](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Router.js#L1-L15) decide qué vista renderizar:
    - `?v=admin` → [admin.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin.html)
    - default → [index.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/index.html)
  - [include(filename)](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Router.js#L17-L19) permite componer HTML por parciales.

## Composición de vistas (HtmlService)

### Vista pública (`index.html`)

Incluye estas partes:

- UI login: [pantalla_login.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/pantalla_login.html)
- UI menú + modal asistencia: [pantalla_menu.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/pantalla_menu.html)
- Lógica login: [loginJS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/loginJS.html)
- Lógica asistencia: [asistenciaJS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/asistenciaJS.html)

### Panel admin (`admin.html`)

Incluye:

- CSS del panel: [adminCSS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminCSS.html)
- Navegación: [admin_Sidebar.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_Sidebar.html)
- Secciones:
  - Asistencia: [admin_SecAsistencia.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_SecAsistencia.html)
  - Usuarios: [admin_SecEmpleados.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_SecEmpleados.html)
  - Horarios: [admin_SecConfig.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_SecConfig.html)
- JS:
  - Core (tooltips): [adminJS_Core.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Core.html)
  - Asistencia: [adminJS_Asistencia.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Asistencia.html)
  - Usuarios: [adminJS_Empleados.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Empleados.html)
  - Config: [adminJS_Config.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Config.html)

## Módulos de backend (Apps Script)

- Routing/templating: [Router.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Router.js)
- Autenticación: [Auth_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Auth_DB.js)
- Registro de marcaciones: [Asistencia_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Asistencia_DB.js)
- Reporte admin (asistencia): [Admin_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_DB.js)
- Gestión admin (usuarios): [Admin_Usuarios_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_Usuarios_DB.js)
- Gestión admin (horarios): [Admin_Config_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_Config_DB.js)
- Migración/rollback: [Migracion_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Migracion_DB.js)

## Flujo de datos (alto nivel)

1. Login (`index`) → `validarAccesoUsuario()` → guarda sesión en `localStorage`.
2. Usuario registra marcación → `registrarAsistenciaManual()` → `Registro_Asistencia.appendRow(...)`.
3. Admin (rol 2) entra a `?v=admin` → se valida rol desde `localStorage` → secciones llaman al backend:
   - Asistencia: `obtenerRegistrosAsistenciaAdmin()`
   - Usuarios: `obtenerUsuariosAdmin() / guardarUsuarioAdmin() / cambiarEstadoUsuarioAdmin()`
   - Horarios: `obtenerConfiguracionesAdmin() / guardarConfiguracionAdmin()`

## Seguridad (modelo actual)

- La “sesión” del lado cliente está en `localStorage` (`sesionIngresoPersonal`).
- El panel admin hace un check de rol (rol 2) en el frontend y redirige si no cumple.
- El backend no valida rol por cada endpoint; se asume que el acceso está controlado por el frontend y por el despliegue del WebApp (ver `appsscript.json`).

Recomendación: si se requiere endurecer seguridad, añadir verificación de rol/estado en servidor en las funciones admin usando `Session.getActiveUser().getEmail()` o un token de sesión.

