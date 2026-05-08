function ejecutarMigracionCompleta() {
  const ORIGEN_SPREADSHEET_ID = '1EOnYgqxJ_Av5cLhLYVxUjvt5Zdn3ThgmdPcFV6kgL1g';
  const TABLAS = ['Base_Usuarios', 'Config_Horarios', 'Registro_Asistencia'];

  const HEADERS = {
    Base_Usuarios: ['ID_Usuario', 'Correo', 'Contraseña', 'Nombre Completo', 'Identificación', 'Cargo', 'Rol_ID', 'Estado'],
    Config_Horarios: ['ID_Regla', 'Etapa', 'Hora_Inicio', 'Hora_Fin', 'Hora_Ideal', 'Descripción'],
    Registro_Asistencia: ['ID_Registro', 'Fecha', 'Hora_Exacta', 'ID_Usuario', 'Nombre_Usuario', 'Tipo_Marcación', 'Categoría']
  };

  Logger.log('=== INICIO MIGRACIÓN COMPLETA ===');
  Logger.log('Origen (viejo) Spreadsheet ID: %s', ORIGEN_SPREADSHEET_ID);

  const ssOrigen = SpreadsheetApp.openById(ORIGEN_SPREADSHEET_ID);
  const ssDestino = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('Destino (nuevo) Spreadsheet ID: %s', ssDestino.getId());

  const backupTag = _crearBackupMigracion_(ssDestino, TABLAS);
  Logger.log('Backup creado. Tag: %s', backupTag);
  Logger.log('Rollback disponible con: rollbackMigracion("%s")', backupTag);

  Logger.log('Paso 1/4: Preparando hojas de destino (borrar y recrear)...');
  _resetearHojasDestino_(ssDestino, TABLAS);

  Logger.log('Paso 2/4: Insertando encabezados en hojas de destino...');
  _setHeaders_(ssDestino.getSheetByName('Base_Usuarios'), HEADERS.Base_Usuarios);
  _setHeaders_(ssDestino.getSheetByName('Config_Horarios'), HEADERS.Config_Horarios);
  _setHeaders_(ssDestino.getSheetByName('Registro_Asistencia'), HEADERS.Registro_Asistencia);

  Logger.log('Paso 3/4: Migrando Base_Usuarios...');
  _migrarBaseUsuarios_(ssOrigen, ssDestino);

  Logger.log('Paso 4/4: Migrando Config_Horarios y Registro_Asistencia (copia directa)...');
  _copiarTablaDirecta_(ssOrigen, ssDestino, 'Config_Horarios', HEADERS.Config_Horarios.length);
  _copiarTablaDirecta_(ssOrigen, ssDestino, 'Registro_Asistencia', HEADERS.Registro_Asistencia.length);

  Logger.log('=== FIN MIGRACIÓN COMPLETA ===');
}

function _resetearHojasDestino_(ssDestino, nombresHojas) {
  const hojasActuales = ssDestino.getSheets();
  const sheetCount = hojasActuales.length;
  let tempCreada = false;
  const tempName = 'TMP_MIGRACION_DB';

  let eliminables = 0;
  for (let i = 0; i < hojasActuales.length; i++) {
    if (nombresHojas.indexOf(hojasActuales[i].getName()) !== -1) eliminables++;
  }
  const quedarian = sheetCount - eliminables;
  if (quedarian < 1 && !ssDestino.getSheetByName(tempName)) {
    ssDestino.insertSheet(tempName);
    tempCreada = true;
    Logger.log('Se creó hoja temporal para evitar dejar el archivo sin hojas: %s', tempName);
  }

  nombresHojas.forEach(function (nombre) {
    const hoja = ssDestino.getSheetByName(nombre);
    if (hoja) {
      Logger.log('Eliminando hoja existente: %s', nombre);
      ssDestino.deleteSheet(hoja);
    }
  });

  nombresHojas.forEach(function (nombre) {
    Logger.log('Creando hoja: %s', nombre);
    ssDestino.insertSheet(nombre);
  });

  if (tempCreada) {
    const tmp = ssDestino.getSheetByName(tempName);
    if (tmp && nombresHojas.indexOf(tmp.getName()) === -1) {
      ssDestino.deleteSheet(tmp);
      Logger.log('Eliminando hoja temporal: %s', tempName);
    }
  }
}

function _setHeaders_(sheet, headers) {
  if (!sheet) throw new Error('No se encontró hoja de destino para setear encabezados.');
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  Logger.log('Encabezados insertados en %s (%s columnas).', sheet.getName(), headers.length);
}

function _migrarBaseUsuarios_(ssOrigen, ssDestino) {
  const hojaOrigen = ssOrigen.getSheetByName('Base_Usuarios');
  if (!hojaOrigen) throw new Error('No se encontró la hoja Base_Usuarios en el archivo origen.');

  const hojaDestino = ssDestino.getSheetByName('Base_Usuarios');
  if (!hojaDestino) throw new Error('No se encontró la hoja Base_Usuarios en el archivo destino.');

  const lastRow = hojaOrigen.getLastRow();
  const lastCol = hojaOrigen.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    Logger.log('Base_Usuarios origen sin datos para migrar.');
    return;
  }

  const values = hojaOrigen.getRange(1, 1, lastRow, lastCol).getValues();
  const headerRow = values[0].map(function (h) { return String(h || '').trim(); });
  const idx = _buildHeaderIndex_(headerRow);

  const required = ['ID_Usuario', 'Correo', 'Nombre Completo', 'Identificación', 'Cargo', 'Estado', 'Rol_ID'];
  required.forEach(function (k) {
    if (idx[k] === undefined) throw new Error('No se encontró la columna requerida en Base_Usuarios origen: ' + k);
  });

  const out = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const idUsuario = _cell_(row, idx['ID_Usuario']);
    const correo = _cell_(row, idx['Correo']);
    const nombre = _cell_(row, idx['Nombre Completo']);
    const identificacion = _cell_(row, idx['Identificación']);
    const cargo = _cell_(row, idx['Cargo']);
    const estado = _cell_(row, idx['Estado']);
    const rolViejo = _cell_(row, idx['Rol_ID']);

    if (_isRowEmpty_([idUsuario, correo, nombre, identificacion, cargo, estado, rolViejo])) continue;

    const rolNuevo = _mapearRol_(rolViejo);
    const pass = _passwordInicial_(identificacion);

    out.push([idUsuario, correo, pass, nombre, identificacion, cargo, rolNuevo, estado]);
  }

  if (out.length === 0) {
    Logger.log('No se generaron filas para Base_Usuarios destino (origen vacío o filas vacías).');
    return;
  }

  hojaDestino.getRange(2, 1, out.length, out[0].length).setValues(out);
  Logger.log('Base_Usuarios migrada: %s filas copiadas.', out.length);
}

function _copiarTablaDirecta_(ssOrigen, ssDestino, nombreHoja, columnasEsperadas) {
  const hojaOrigen = ssOrigen.getSheetByName(nombreHoja);
  if (!hojaOrigen) throw new Error('No se encontró la hoja ' + nombreHoja + ' en el archivo origen.');

  const hojaDestino = ssDestino.getSheetByName(nombreHoja);
  if (!hojaDestino) throw new Error('No se encontró la hoja ' + nombreHoja + ' en el archivo destino.');

  const lastRow = hojaOrigen.getLastRow();
  if (lastRow < 2) {
    Logger.log('%s origen sin datos para copiar.', nombreHoja);
    return;
  }

  const lastCol = hojaOrigen.getLastColumn();
  const numCols = Math.max(columnasEsperadas, lastCol);
  const data = hojaOrigen.getRange(2, 1, lastRow - 1, numCols).getValues();

  const normalizado = _normalizarColumnas_(data, columnasEsperadas);
  if (normalizado.length === 0) {
    Logger.log('%s sin filas para copiar luego de normalizar.', nombreHoja);
    return;
  }

  hojaDestino.getRange(2, 1, normalizado.length, columnasEsperadas).setValues(normalizado);
  if (nombreHoja === 'Config_Horarios') {
    hojaDestino.getRange(2, 3, normalizado.length, 3).setNumberFormat('HH:mm');
  }
  if (nombreHoja === 'Registro_Asistencia') {
    hojaDestino.getRange(2, 3, normalizado.length, 1).setNumberFormat('HH:mm:ss');
  }
  Logger.log('%s copiado: %s filas.', nombreHoja, normalizado.length);
}

function _buildHeaderIndex_(headers) {
  const index = {};
  for (let i = 0; i < headers.length; i++) {
    const key = String(headers[i] || '').trim();
    if (key) index[key] = i;
  }
  return index;
}

function _cell_(row, idx) {
  if (idx === undefined) return '';
  const v = row[idx];
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function _isRowEmpty_(cells) {
  for (let i = 0; i < cells.length; i++) {
    if (String(cells[i] || '').trim() !== '') return false;
  }
  return true;
}

function _mapearRol_(rolViejo) {
  const n = Number(String(rolViejo || '').trim());
  if (n === 3) return 2;
  if (n === 1 || n === 2) return 1;
  return 1;
}

function _passwordInicial_(identificacion) {
  const id = String(identificacion || '').trim();
  if (!id) return '123456';
  if (id.toLowerCase() === 'sin registrar') return '123456';
  return id;
}

function _normalizarColumnas_(rows, columnasEsperadas) {
  if (!rows || rows.length === 0) return [];
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const nueva = row.slice(0, columnasEsperadas);
    while (nueva.length < columnasEsperadas) nueva.push('');
    let hasAny = false;
    for (let j = 0; j < nueva.length; j++) {
      if (String(nueva[j] || '').trim() !== '') {
        hasAny = true;
        break;
      }
    }
    if (hasAny) out.push(nueva);
  }
  return out;
}

function _crearBackupMigracion_(ssDestino, nombresHojas) {
  const tag = _generarTagBackup_(ssDestino);
  for (let i = 0; i < nombresHojas.length; i++) {
    const nombre = nombresHojas[i];
    const hoja = ssDestino.getSheetByName(nombre);
    if (!hoja) continue;
    const copia = hoja.copyTo(ssDestino);
    const backupName = 'BK_' + tag + '__' + nombre;
    copia.setName(backupName);
    copia.hideSheet();
  }
  return tag;
}

function _generarTagBackup_(ssDestino) {
  const tz = ssDestino.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmmss');
}

function rollbackMigracion(tag) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const TABLAS = ['Base_Usuarios', 'Config_Horarios', 'Registro_Asistencia'];
  const tagElegido = tag || _obtenerUltimoTagBackup_(ss, TABLAS);
  if (!tagElegido) throw new Error('No se encontraron backups para rollback.');

  Logger.log('=== INICIO ROLLBACK ===');
  Logger.log('Tag rollback: %s', tagElegido);

  const backups = {};
  for (let i = 0; i < TABLAS.length; i++) {
    const nombre = TABLAS[i];
    const hojaBackup = ss.getSheetByName('BK_' + tagElegido + '__' + nombre);
    if (hojaBackup) backups[nombre] = hojaBackup;
  }

  for (let i = 0; i < TABLAS.length; i++) {
    const nombre = TABLAS[i];
    if (!backups[nombre]) throw new Error('Falta backup para la hoja: ' + nombre);
  }

  _resetearHojasDestino_(ss, TABLAS);

  for (let i = 0; i < TABLAS.length; i++) {
    const nombre = TABLAS[i];
    const hojaRestaurada = backups[nombre];
    hojaRestaurada.showSheet();
    hojaRestaurada.setName(nombre);
  }

  Logger.log('=== FIN ROLLBACK ===');
}

function _obtenerUltimoTagBackup_(ss, nombresHojas) {
  const hojas = ss.getSheets();
  let ultimo = '';
  for (let i = 0; i < hojas.length; i++) {
    const name = hojas[i].getName();
    if (name.indexOf('BK_') !== 0) continue;
    const parts = name.split('__');
    if (parts.length !== 2) continue;
    const tag = parts[0].slice(3);
    const hoja = parts[1];
    if (nombresHojas.indexOf(hoja) === -1) continue;
    if (tag > ultimo) ultimo = tag;
  }
  return ultimo || null;
}
