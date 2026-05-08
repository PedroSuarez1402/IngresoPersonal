# API (google.script.run)

El frontend invoca funciones del servidor usando `google.script.run` (RPC de Apps Script).

Convenciones:

- Success: se entrega el valor retornado por la función.
- Failure: se dispara cuando la función hace `throw new Error(...)` o falla en ejecución.

## Autenticación

### validarAccesoUsuario(correo, pass)

- Archivo: [Auth_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Auth_DB.js#L1-L38)
- Cliente: [loginJS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/loginJS.html#L70-L83)

Parámetros:

- `correo` (string): se normaliza a lower-case/trim.
- `pass` (string): contraseña en texto plano.

Retorno:

```json
{ "exito": true, "usuario": { "id": "...", "correo": "...", "nombre": "...", "identificacion": "...", "cargo": "...", "rol_id": "...", "estado": "Activo" } }
```

o

```json
{ "exito": false, "mensaje": "Credenciales inválidas o usuario inactivo." }
```

Notas:

- Requiere que el usuario esté `Activo` en `Base_Usuarios`.

## Asistencia (usuario final)

### registrarAsistenciaManual(idUsuario, nombreUsuario, tipoMarcacion)

- Archivo: [Asistencia_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Asistencia_DB.js#L1-L72)
- Cliente: [asistenciaJS.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/asistenciaJS.html#L41-L50)

Parámetros:

- `idUsuario` (string): `USR-###`
- `nombreUsuario` (string): nombre mostrado en reportes
- `tipoMarcacion` (string): etapa (ej. “Ingreso”)

Retorno:

```json
{ "exito": true, "mensaje": "Marcación registrada: Ingreso (A tiempo)." }
```

o

```json
{ "exito": false, "mensaje": "Ya registraste esta marcación hoy." }
```

Efecto:

- Inserta una fila en `Registro_Asistencia`.
- Calcula `Categoría` con base en `Config_Horarios` cuando existe regla aplicable.

## Admin: Asistencia

### obtenerRegistrosAsistenciaAdmin()

- Archivo: [Admin_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_DB.js#L1-L25)
- Cliente: [adminJS_Asistencia.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Asistencia.html#L7-L18)

Retorno:

- Array de objetos `{id, fecha, hora, uid, nombre, tipo, categoria}`.

## Admin: Usuarios

### obtenerUsuariosAdmin()

- Archivo: [Admin_Usuarios_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_Usuarios_DB.js#L1-L21)
- Cliente: [adminJS_Empleados.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Empleados.html#L7-L18)

Retorno:

- Array de objetos `{id, correo, nombre, identificacion, cargo, rol_id, estado}`.
- La contraseña nunca se envía al cliente.

### guardarUsuarioAdmin(datos)

- Archivo: [Admin_Usuarios_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_Usuarios_DB.js#L23-L62)
- Cliente: [adminJS_Empleados.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Empleados.html#L203-L239)

Entrada (`datos`):

```json
{
  "id": "",
  "correo": "usuario@dominio.com",
  "nombre": "Nombre Completo",
  "identificacion": "123",
  "cargo": "Cargo",
  "rol_id": "1"
}
```

Comportamiento:

- Si `id` viene vacío: crea usuario nuevo:
  - genera `USR-###`
  - contraseña = `identificacion`
  - estado = `Activo`
- Si `id` viene con valor: edita usuario existente (no cambia contraseña ni estado).

Retorno:

```json
{ "exito": true, "id": "USR-001" }
```

Errores:

- Hace `throw` si faltan datos, no existe hoja o no encuentra el id al editar.

### cambiarEstadoUsuarioAdmin(idUsuario, nuevoEstado)

- Archivo: [Admin_Usuarios_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_Usuarios_DB.js#L64-L86)
- Cliente: [adminJS_Empleados.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Empleados.html#L167-L201)

Parámetros:

- `idUsuario` (string): `USR-###`
- `nuevoEstado` (string): “Activo” o “Inactivo” (case-insensitive)

Retorno:

```json
{ "exito": true }
```

Errores:

- Hace `throw` si el estado es inválido o el usuario no existe.

## Admin: Configuración de horarios

### obtenerConfiguracionesAdmin()

- Archivo: [Admin_Config_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_Config_DB.js#L1-L22)
- Cliente: [adminJS_Config.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Config.html#L7-L20)

Retorno:

- Array `{id, etapa, hora_inicio, hora_fin, hora_ideal, descripcion}`.

### guardarConfiguracionAdmin(datos)

- Archivo: [Admin_Config_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Admin_Config_DB.js#L24-L68)
- Cliente: [adminJS_Config.html](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/adminJS_Config.html#L136-L184)

Entrada (`datos`):

```json
{
  "id": "",
  "etapa": "Ingreso",
  "hora_inicio": "07:00",
  "hora_fin": "08:00",
  "hora_ideal": "07:15",
  "descripcion": "Ingreso jornada"
}
```

Retorno:

```json
{ "exito": true, "mensaje": "Configuración guardada." }
```

o

```json
{ "exito": false, "mensaje": "Faltan datos obligatorios." }
```

Notas:

- A diferencia de otros endpoints, aquí el servidor captura excepciones y devuelve `{exito:false}` en lugar de lanzar.

