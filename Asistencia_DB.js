function registrarAsistenciaManual(tokenInput, tipoMarcacionInput) {
  const token = (tokenInput == null) ? '' : String(tokenInput).trim();
  const tipoMarcacion = (tipoMarcacionInput == null) ? '' : String(tipoMarcacionInput).trim();
  if (!token || !tipoMarcacion) return { exito: false, mensaje: 'Datos incompletos para registrar.' };

  const ses = _requireSesion_(token);
  const idUsuario = (ses.id == null) ? '' : String(ses.id).trim();
  const nombreUsuario = (ses.nombre == null) ? '' : String(ses.nombre).trim();
  if (!idUsuario || !nombreUsuario) return { exito: false, mensaje: 'Sesión inválida.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shAsis = ss.getSheetByName('Registro_Asistencia');
  if (!shAsis) return { exito: false, mensaje: 'No existe la hoja Registro_Asistencia.' };

  const now = new Date();
  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  const fecha = Utilities.formatDate(now, tz, 'dd/MM/yyyy');
  const horaExactaStr = Utilities.formatDate(now, 'America/Bogota', 'HH:mm:ss');
  const minutosAhora = _minutesBogota_(now);

  const estadoObj = _obtenerEstadoUsuarioHoyPorId_(idUsuario, shAsis, tz, fecha);
  const estado = (estadoObj && estadoObj.estado) ? String(estadoObj.estado) : 'Ninguno';
  const esSalida = tipoMarcacion.indexOf('Salida') === 0;

  if (estado === 'Terminado') {
    return { exito: false, mensaje: 'Error: Ya registraste tu "Salida Final" hoy.' };
  }
  if (tipoMarcacion === 'Ingreso') {
    if (estado !== 'Ninguno') return { exito: false, mensaje: 'Error: Ya registraste tu Ingreso hoy.' };
  } else if (tipoMarcacion === 'Reingreso') {
    if (estado === 'Ninguno') return { exito: false, mensaje: 'Error: Debes registrar tu Ingreso primero.' };
    if (estado === 'Adentro') return { exito: false, mensaje: 'Error: Ya te encuentras dentro de las instalaciones.' };
    if (estado !== 'Afuera') return { exito: false, mensaje: 'Error: No es posible registrar "Reingreso" en este momento.' };
  } else if (esSalida) {
    if (estado === 'Ninguno') return { exito: false, mensaje: 'Error: Debes registrar tu Ingreso primero.' };
    if (estado === 'Afuera') return { exito: false, mensaje: 'Error: Para registrar una salida primero debes registrar tu "Reingreso".' };
  }

  if (tipoMarcacion === 'Salida Final' && minutosAhora !== null && minutosAhora < (17 * 60 + 30)) {
    return { exito: false, mensaje: 'Antes de las 5:30 PM no puedes registrar "Salida Final". Si necesitas salir, selecciona "Salida por Permiso".' };
  }

  if (tipoMarcacion === 'Salida Almuerzo') {
    const reglaAlm = _getReglaConfigHorarios_(ss, 'Salida Almuerzo');
    const idealAlm = reglaAlm ? reglaAlm.ideal : null;
    const finAlm = reglaAlm ? reglaAlm.fin : null;
    if (idealAlm !== null && finAlm !== null && minutosAhora !== null) {
      if (minutosAhora < idealAlm || minutosAhora > finAlm) {
        return { exito: false, mensaje: 'No puedes registrar "Salida Almuerzo" a esta hora según el horario laboral. Por favor selecciona "Salida por Permiso".' };
      }
    }
  }

  const categoria = _calcularCategoriaMarcacion_(ss, now, tipoMarcacion);
  const idRegistro = _generarIdRegistroAsistencia_(shAsis);

  shAsis.appendRow([idRegistro, fecha, "'" + horaExactaStr, idUsuario, nombreUsuario, tipoMarcacion, categoria]);
  return { exito: true, mensaje: 'Marcación registrada: ' + tipoMarcacion + ' (' + categoria + ').' };
}

function obtenerEstadoUsuarioHoy(tokenInput) {
  const token = (tokenInput == null) ? '' : String(tokenInput).trim();
  if (!token) return { estado: 'Ninguno' };

  const ses = _requireSesion_(token);
  const idUsuario = (ses.id == null) ? '' : String(ses.id).trim();
  if (!idUsuario) return { estado: 'Ninguno' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Registro_Asistencia');
  if (!sheet) return { estado: 'Ninguno' };

  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  const hoy = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');
  return _obtenerEstadoUsuarioHoyPorId_(idUsuario, sheet, tz, hoy);
}

function _obtenerEstadoUsuarioHoyPorId_(idUsuario, sheet, tz, hoy) {
  const uidBuscado = (idUsuario == null) ? '' : String(idUsuario).trim();
  if (!uidBuscado || !sheet) return { estado: 'Ninguno' };

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { estado: 'Ninguno' };

  const numRows = Math.min(lastRow - 1, 300);
  const startRow = lastRow - numRows + 1;
  const data = sheet.getRange(startRow, 1, numRows, 6).getValues();

  for (let i = data.length - 1; i >= 0; i--) {
    const r = data[i] || [];
    const f = _normalizarFechaDDMMYYYY_(r[1], tz);
    if (f !== hoy) break;

    const uid = (r[3] == null) ? '' : String(r[3]).trim();
    if (uid !== uidBuscado) continue;

    const tipo = (r[5] == null) ? '' : String(r[5]).trim().toLowerCase();
    if (tipo === 'ingreso' || tipo === 'reingreso') return { estado: 'Adentro' };
    if (tipo === 'salida almuerzo' || tipo === 'salida por permiso') return { estado: 'Afuera' };
    if (tipo === 'salida final') return { estado: 'Terminado' };
    return { estado: 'Ninguno' };
  }

  return { estado: 'Ninguno' };
}

function _existeMarcacionHoy_(sheet, fechaDDMMYYYY, idUsuario, tipoMarcacion, tz) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const numRows = Math.min(lastRow - 1, 300);
  const startRow = lastRow - numRows + 1;
  const data = sheet.getRange(startRow, 1, numRows, 6).getValues();
  const tipoBuscado = (tipoMarcacion == null) ? '' : String(tipoMarcacion).trim().toLowerCase();
  const tzUse = tz || Session.getScriptTimeZone();
  for (let i = data.length - 1; i >= 0; i--) {
    const r = data[i] || [];
    const fecha = _normalizarFechaDDMMYYYY_(r[1], tzUse);
    if (fecha !== fechaDDMMYYYY) break;
    const uid = (r[3] == null) ? '' : String(r[3]).trim();
    const tipo = (r[5] == null) ? '' : String(r[5]).trim().toLowerCase();
    if (fecha === fechaDDMMYYYY && uid === idUsuario && tipo === tipoBuscado) return true;
  }
  return false;
}

function _puedeRegistrarReingresoHoy_(sheet, fechaDDMMYYYY, idUsuario, tz) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const numRows = Math.min(lastRow - 1, 300);
  const startRow = lastRow - numRows + 1;
  const data = sheet.getRange(startRow, 1, numRows, 6).getValues();
  const tzUse = tz || Session.getScriptTimeZone();

  for (let i = data.length - 1; i >= 0; i--) {
    const r = data[i] || [];
    const fecha = _normalizarFechaDDMMYYYY_(r[1], tzUse);
    if (fecha !== fechaDDMMYYYY) break;

    const uid = (r[3] == null) ? '' : String(r[3]).trim();
    if (uid !== idUsuario) continue;

    const tipo = (r[5] == null) ? '' : String(r[5]).trim().toLowerCase();
    if (tipo === 'salida almuerzo' || tipo === 'salida por permiso') return true;
    return false;
  }

  return false;
}

function _normalizarFechaDDMMYYYY_(v, tz) {
  if (v == null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, tz, 'dd/MM/yyyy');
  }
  return String(v).trim();
}

function _calcularCategoriaMarcacion_(ss, now, etapa) {
  const etapaRaw = (etapa == null) ? '' : String(etapa).trim();
  const etapaNorm = etapaRaw.toLowerCase();
  if (etapaNorm === 'salida por permiso') return 'Registrado';

  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'America/Bogota';
  const regla = _getReglaConfigHorarios_(ss, etapaRaw);
  if (!regla) return 'Registrado';

  const inicio = regla.inicio;
  const fin = regla.fin;
  const ideal = regla.ideal;
  const actual = _timeToMinutes_(now, tz);

  if (inicio == null || fin == null || ideal == null || actual == null) return 'Registrado';

  if (etapaNorm === 'ingreso') {
    if (actual < inicio || actual > fin) return 'Registrado';
    return actual <= ideal ? 'A tiempo' : 'Retraso';
  }

  if (etapaNorm === 'salida almuerzo') {
    if (actual < ideal) return 'Registrado';
    if (actual <= fin) return 'A tiempo';
    return 'Retraso';
  }

  if (etapaNorm === 'reingreso') {
    if (actual < inicio) return 'Registrado';
    return actual <= ideal ? 'A tiempo' : 'Retraso';
  }

  if (etapaNorm === 'salida final') {
    if (actual < ideal) return 'Registrado';
    if (actual <= fin) return 'A tiempo';
    return 'Registrado';
  }

  if (actual < inicio || actual > fin) return 'Registrado';
  return actual <= ideal ? 'A tiempo' : 'Retraso';
}

function _timeToMinutes_(v, tz) {
  if (v == null || v === '') return null;

  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    const tzUse = tz || Session.getScriptTimeZone() || 'America/Bogota';
    const s = Utilities.formatDate(v, tzUse, 'HH:mm');
    const m = /^(\d{2}):(\d{2})$/.exec(s);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  const s = String(v).trim().replace(/^'/, '');
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (isNaN(hh) || isNaN(mm)) return null;
  return hh * 60 + mm;
}

const CACHE_CONFIG_HORARIOS = 'CACHE_CONFIG_HORARIOS';

function _getConfigHorariosCached_(ss) {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(CACHE_CONFIG_HORARIOS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }

  const shCfg = ss.getSheetByName('Config_Horarios');
  if (!shCfg) return [];
  const lastRow = shCfg.getLastRow();
  if (lastRow < 2) return [];
  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'America/Bogota';
  const rows = shCfg.getRange(2, 1, lastRow - 1, 6).getValues();
  const reglas = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    const etapa = (r[1] == null) ? '' : String(r[1]).trim();
    if (!etapa) continue;
    reglas.push({
      etapa: etapa,
      inicio: _timeToMinutes_(r[2], tz),
      fin: _timeToMinutes_(r[3], tz),
      ideal: _timeToMinutes_(r[4], tz)
    });
  }
  try {
    cache.put(CACHE_CONFIG_HORARIOS, JSON.stringify(reglas), 21600);
  } catch (e) {}
  return reglas;
}

function _getReglaConfigHorarios_(ss, etapa) {
  const reglas = _getConfigHorariosCached_(ss);
  const etapaBuscada = (etapa == null) ? '' : String(etapa).trim().toLowerCase();
  for (let i = 0; i < reglas.length; i++) {
    const r = reglas[i] || {};
    const e = (r.etapa == null) ? '' : String(r.etapa).trim().toLowerCase();
    if (e === etapaBuscada) {
      return {
        etapa: (r.etapa == null) ? '' : String(r.etapa).trim(),
        inicio: (r.inicio == null ? null : Number(r.inicio)),
        fin: (r.fin == null ? null : Number(r.fin)),
        ideal: (r.ideal == null ? null : Number(r.ideal))
      };
    }
  }
  return null;
}

function _fmtHHMM_(minutos) {
  if (minutos == null || isNaN(minutos)) return '';
  const hh = Math.floor(minutos / 60);
  const mm = minutos % 60;
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function obtenerConfigHorariosPublico() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reglas = _getConfigHorariosCached_(ss);
  const out = {};
  for (let i = 0; i < reglas.length; i++) {
    const r = reglas[i] || {};
    const etapa = (r.etapa == null) ? '' : String(r.etapa).trim();
    if (!etapa) continue;
    out[etapa] = {
      inicio: _fmtHHMM_(r.inicio),
      fin: _fmtHHMM_(r.fin),
      ideal: _fmtHHMM_(r.ideal)
    };
  }
  return out;
}

function _minutesBogota_(dateObj) {
  try {
    const s = Utilities.formatDate(dateObj, 'America/Bogota', 'HH:mm');
    const m = /^(\d{2}):(\d{2})$/.exec(s);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  } catch (e) {
    return null;
  }
}

function _generarIdRegistroAsistencia_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'ASIS-001';

  const lastVal = sheet.getRange(lastRow, 1).getValue();
  const s = (lastVal == null) ? '' : String(lastVal).trim();
  const m = /^ASIS-(\d+)$/.exec(s);
  const next = m ? (Number(m[1]) + 1) : (lastRow);
  const num = String(next).padStart(3, '0');
  return 'ASIS-' + num;
}
