# Operación (despliegue, configuración y migración)

## Configuración del proyecto (Apps Script)

Manifiesto: [appsscript.json](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/appsscript.json)

- Runtime: `V8`
- Zona horaria: `America/Bogota`
- WebApp:
  - `executeAs: USER_DEPLOYING`
  - `access: DOMAIN`

## Configuración de la Spreadsheet (base de datos)

Requisito mínimo:

- Crear/usar una Spreadsheet asociada al proyecto.
- Tener las hojas: `Base_Usuarios`, `Config_Horarios`, `Registro_Asistencia`.
- Asegurar que la primera fila contenga los encabezados esperados (ver [contexto_db.md](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/contexto_db.md)).

Recomendaciones:

- `Config_Horarios`: aplicar formato `HH:mm` a `Hora_Inicio/Hora_Fin/Hora_Ideal`.
- `Registro_Asistencia`: aplicar formato `HH:mm:ss` a `Hora_Exacta` si se usan Date; el sistema normalmente guarda esta columna como texto para evitar autoformato.

## Despliegue como WebApp

El enrutamiento depende de la URL del WebApp:

- `APP_URL` (raíz) sirve `index.html`
- `APP_URL?v=admin` sirve `admin.html`

Notas:

- El acceso al panel admin se controla en frontend verificando `rol_id=2` en `localStorage`.
- Si se necesita endurecer acceso, conviene validar rol/estado en servidor en cada endpoint admin.

## Migración / reset de base de datos

Archivo: [Migracion_DB.js](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/Migracion_DB.js)

Incluye utilidades para:

- Crear backups ocultos (`BK_<tag>__<tabla>`) antes de una migración.
- Resetear hojas destino (elimina y recrea hojas `Base_Usuarios/Config_Horarios/Registro_Asistencia`).
- Insertar encabezados oficiales.
- Migrar `Base_Usuarios` desde un origen, mapeando roles y setendo contraseña inicial.
- Copiar directo `Config_Horarios` y `Registro_Asistencia`, normalizando columnas y aplicando formatos.

Puntos críticos:

- `ejecutarMigracionCompleta()` usa un `ORIGEN_SPREADSHEET_ID` fijo (se debe revisar antes de ejecutar).
- Se crea una hoja temporal (`TMP_MIGRACION_DB`) si es necesario para no dejar la Spreadsheet sin hojas durante el proceso.

## Troubleshooting

### “Credenciales inválidas o usuario inactivo”

Verificar en `Base_Usuarios`:

- `Correo` coincide exactamente (se compara en lower-case).
- `Contraseña` coincide.
- `Estado` es `Activo` (también acepta `activo`).

### El admin redirige al menú

- La sesión en `localStorage.sesionIngresoPersonal` debe existir y tener `rol_id = 2`.
- Si hay cambios de rol/estado en la hoja, el navegador puede conservar una sesión vieja; cerrar sesión y volver a iniciar.

### Categoría siempre “Registrado”

- Revisar que `Config_Horarios.Etapa` coincida exactamente con el tipo de marcación enviado (“Ingreso”, etc.).
- Revisar que las horas estén en `HH:mm` (o Date válido).

