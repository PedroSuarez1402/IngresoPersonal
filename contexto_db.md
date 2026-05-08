**CONTEXTO MAESTRO: SISTEMA DE INGRESO PERSONAL (VERSIÓN 2.0)**

Este proyecto es un sistema especializado de control de asistencia. Hemos simplificado la base de datos y modificado los roles respecto a versiones anteriores.

**1. ARQUITECTURA GLOBAL Y REGLAS (RBAC)**
- **Roles Numéricos (`Rol_ID`):**
  - `1` = Usuario (Solo puede registrar su ingreso/salida).
  - `2` = Talento Humano / Administrador (Registra su asistencia y tiene acceso al Panel Admin para ver reportes y configurar).
- **Autenticación:** El sistema ahora usa `Correo` y `Contraseña` para el inicio de sesión.

**2. ESTRUCTURA DE TABLAS (Google Sheets)**
La base de datos "Ingreso Personal" contendrá solo 3 hojas:

**A. Tabla: `Base_Usuarios`**
- [0] `ID_Usuario`: Identificador único (Ej. USR-001).
- [1] `Correo`: Llave primaria de acceso.
- [2] `Contraseña`: Clave de acceso (Por defecto será la Identificación).
- [3] `Nombre Completo`.
- [4] `Identificación`: Cédula.
- [5] `Cargo`.
- [6] `Rol_ID`: 1 (Usuario) o 2 (Talento Humano).
- [7] `Estado`: Activo / Inactivo.

**B. Tabla: `Config_Horarios`**
- [0] `ID_Regla`.
- [1] `Etapa`: (Ingreso, Salida Almuerzo, Reingreso, Salida Final).
- [2] `Hora_Inicio`: Rango inferior.
- [3] `Hora_Fin`: Rango superior.
- [4] `Hora_Ideal`: Hora de corte para calcular si es "A tiempo" o "Retraso".
- [5] `Descripción`.

**C. Tabla: `Registro_Asistencia`**
- [0] `ID_Registro`: (Ej. ASIS-001).
- [1] `Fecha`: DD/MM/YYYY.
- [2] `Hora_Exacta`: Generada por el servidor (HH:mm:ss).
- [3] `ID_Usuario`: FK a Base_Usuarios [0].
- [4] `Nombre_Usuario`.
- [5] `Tipo_Marcación`.
- [6] `Categoría`: (A tiempo, Retraso, Registrado).