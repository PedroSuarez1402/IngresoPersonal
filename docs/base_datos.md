# Base de datos (Google Sheets)

Este proyecto usa una sola Spreadsheet como base de datos. Las “tablas” son hojas.

Hojas esperadas:

- `Base_Usuarios`
- `Config_Horarios`
- `Registro_Asistencia`

Referencia de contexto: [contexto_db.md](file:///c:/laragon/www/GAS-Apps-Script/IngresoPersonal/contexto_db.md)

## 1) Base_Usuarios

Ubicación: hoja `Base_Usuarios`.

Columnas (0-based en `getValues()`):

| Índice | Columna | Descripción |
|---:|---|---|
| 0 | ID_Usuario | `USR-###` |
| 1 | Correo | Llave de login (se compara en lower-case) |
| 2 | Contraseña | Texto plano (por defecto = Identificación) |
| 3 | Nombre Completo | Nombre del empleado |
| 4 | Identificación | Cédula / documento |
| 5 | Cargo | Cargo actual |
| 6 | Rol_ID | `1` Usuario, `2` Talento Humano |
| 7 | Estado | `Activo` / `Inactivo` |

Reglas usadas por el sistema:

- Login solo permite `Estado = Activo` (también acepta `activo` por compatibilidad).
- El CRUD de usuarios del panel admin:
  - Crea con `Estado = Activo` y `Contraseña = Identificación`.
  - Edita sin modificar contraseña ni estado.
  - Cambia estado con `Activo/Inactivo` normalizado.

## 2) Config_Horarios

Ubicación: hoja `Config_Horarios`.

Columnas:

| Índice | Columna | Descripción |
|---:|---|---|
| 0 | ID_Regla | `R-###` |
| 1 | Etapa | Debe coincidir con el “Tipo Marcación” (texto) |
| 2 | Hora_Inicio | `HH:mm` (o Date) |
| 3 | Hora_Fin | `HH:mm` (o Date) |
| 4 | Hora_Ideal | `HH:mm` (o Date) |
| 5 | Descripción | Texto libre |

Uso:

- Cuando se registra una marcación, el sistema busca una regla cuya `Etapa` sea igual al tipo de marcación y clasifica:
  - Dentro de ventana (`Inicio`..`Fin`) y antes de `Ideal` → “A tiempo”
  - Dentro de ventana y después de `Ideal` → “Retraso”
  - Si no aplica regla/parseo → “Registrado”

Formato recomendado en la hoja:

- `Hora_Inicio`, `Hora_Fin`, `Hora_Ideal` con formato de celda `HH:mm`.

## 3) Registro_Asistencia

Ubicación: hoja `Registro_Asistencia`.

Columnas:

| Índice | Columna | Descripción |
|---:|---|---|
| 0 | ID_Registro | `ASIS-###` |
| 1 | Fecha | `DD/MM/YYYY` |
| 2 | Hora_Exacta | `HH:mm:ss` (guardada como texto para evitar autoformato) |
| 3 | ID_Usuario | FK a `Base_Usuarios[0]` |
| 4 | Nombre_Usuario | Denormalizado para reportes |
| 5 | Tipo_Marcación | “Ingreso”, “Salida Almuerzo”, “Reingreso”, “Salida Final” |
| 6 | Categoría | “A tiempo”, “Retraso”, “Registrado” |

Reglas:

- Antiduplicado: no permite más de una marcación por (Fecha, ID_Usuario, Tipo_Marcación).
- El panel admin lista y aplica filtros por fecha/nombre/tipo/categoría.

