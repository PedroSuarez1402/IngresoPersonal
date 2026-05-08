# UI / Pantallas

El frontend está hecho con Bootstrap 5 y se compone por parciales HTML + JS incluidos con `include(...)`.

## 1) Login y menú (index)

Vista: [index.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/index.html)

### Login

UI: [pantalla_login.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/pantalla_login.html)  
JS: [loginJS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/loginJS.html)

Elementos/IDs:

- `#seccion_login`: contenedor de login.
- `#login_correo`: input correo.
- `#login_pass`: input contraseña.
- `#btn_toggle_pass` / `#icon_toggle_pass`: alternar visibilidad de contraseña.
- `#login_error`: alerta para mostrar errores.
- `#btn_ingresar`: botón de login (invoca `procesarLogin()`).

Comportamiento:

- Valida campos en cliente (correo/contraseña obligatorios).
- Llama a `validarAccesoUsuario(correo, pass)`.
- Si es correcto, guarda `sesionIngresoPersonal` en `localStorage` y construye el menú según rol.

### Menú principal

UI: [pantalla_menu.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/pantalla_menu.html)  
JS: [loginJS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/loginJS.html)

Elementos/IDs:

- `#seccion_menu_principal`: contenedor del menú (oculto al inicio).
- `#bienvenida_usuario`: texto “Hola, ...”.
- `#card_asistencia`: card para registrar marcación.
- `#card_admin`: card para abrir panel admin (solo rol 2).

Comportamiento:

- `Rol_ID=1`: muestra solo asistencia.
- `Rol_ID=2`: muestra asistencia + acceso a admin.
- “Cerrar Sesión” elimina `localStorage.sesionIngresoPersonal` y vuelve a `APP_URL`.

### Modal Reloj Checador

UI: [pantalla_menu.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/pantalla_menu.html)  
JS: [asistenciaJS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/asistenciaJS.html)

Elementos/IDs:

- `#modalAsistencia`: modal.
- `#select_tipo_marcacion`: selector de tipo de marcación.
- `#btn_registrar_reloj`: botón de envío.

Comportamiento:

- Envía `registrarAsistenciaManual(uid, nombre, tipo)` y muestra resultado con `alert(...)`.

## 2) Panel Talento Humano (admin)

Vista: [admin.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin.html)

### Control de acceso (cliente)

- Lee `localStorage.sesionIngresoPersonal` y exige `rol_id = 2`; si no, redirige a `APP_URL`.

### Navegación / Sidebar

UI: [admin_Sidebar.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_Sidebar.html)

Secciones (IDs):

- `sec_asistencia`
- `sec_empleados`
- `sec_configuracion`

El cambio de secciones se hace con `mostrarSeccionAdmin('sec_...')` definido en [admin.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin.html).

### Sección: Asistencia

UI: [admin_SecAsistencia.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_SecAsistencia.html)  
JS: [adminJS_Asistencia.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Asistencia.html)

Incluye:

- KPIs (Total / A tiempo / Retrasos).
- Filtros (fecha desde/hasta, nombre, tipo, categoría).
- Tabla paginada con el resultado filtrado.

### Sección: Usuarios

UI: [admin_SecEmpleados.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_SecEmpleados.html)  
JS: [adminJS_Empleados.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Empleados.html)

Incluye:

- Buscador por texto.
- Tabla paginada.
- Acciones por fila: editar y activar/desactivar.
- Modal para crear/editar (sin contraseña).

### Sección: Horarios

UI: [admin_SecConfig.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/admin_SecConfig.html)  
JS: [adminJS_Config.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Config.html)

Incluye:

- Tabla paginada de reglas.
- Modal para crear/editar reglas de `Config_Horarios`.

