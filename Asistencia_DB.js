function registrarAsistenciaManual(idUsuarioInput, nombreUsuarioInput, tipoMarcacionInput) {
  const idUsuario = (idUsuarioInput == null) ? '' : String(idUsuarioInput).trim();
  const nombreUsuario = (nombreUsuarioInput == null) ? '' : String(nombreUsuarioInput).trim();
  const tipoMarcacion = (tipoMarcacionInput == null) ? '' : String(tipoMarcacionInput).trim();

  if (!idUsuario || !nombreUsuario || !tipoMarcacion) {
    return { exito: false, mensaje: 'Datos incompletos para registrar.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shAsis = ss.getSheetByName('Registro_Asistencia');
  if (!shAsis) return { exito: false, mensaje: 'No existe la hoja Registro_Asistencia.' };

  const now = new Date();
  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  const fecha = Utilities.formatDate(now, tz, 'dd/MM/yyyy');
  const horaExactaStr = Utilities.formatDate(now, 'America/Bogota', 'HH:mm:ss');
  const minutosAhora = _minutesBogota_(now);

  if (tipoMarcacion === 'Salida Final' && minutosAhora !== null && minutosAhora < (17 * 60 + 30)) {
    return { exito: false, mensaje: 'Antes de las 5:30 PM no puedes registrar "Salida Final". Si necesitas salir, selecciona "Salida por Permiso".' };
  }

  if (tipoMarcacion === 'Salida Almuerzo') {
    const reglaAlm = _buscarReglaConfigHorarios_(ss, 'Salida Almuerzo');
    const idealAlm = reglaAlm ? _timeToMinutes_(reglaAlm[4], tz) : null;
    const finAlm = reglaAlm ? _timeToMinutes_(reglaAlm[3], tz) : null;
    if (idealAlm !== null && finAlm !== null && minutosAhora !== null) {
      if (minutosAhora < idealAlm || minutosAhora > finAlm) {
        return { exito: false, mensaje: 'No puedes registrar "Salida Almuerzo" a esta hora según el horario laboral. Por favor selecciona "Salida por Permiso".' };
      }
    }
  }

  if (_existeMarcacionHoy_(shAsis, fecha, idUsuario, tipoMarcacion, tz)) {
    if (tipoMarcacion === 'Ingreso') return { exito: false, mensaje: 'Ya registraste tu ingreso hoy.' };
    return { exito: false, mensaje: 'Ya existe una marcación para hoy con ese tipo.' };
  }

  const categoria = _calcularCategoriaMarcacion_(ss, now, tipoMarcacion);
  const idRegistro = _generarIdRegistroAsistencia_(shAsis);

  shAsis.appendRow([idRegistro, fecha, "'" + horaExactaStr, idUsuario, nombreUsuario, tipoMarcacion, categoria]);
  return { exito: true, mensaje: 'Marcación registrada: ' + tipoMarcacion + ' (' + categoria + ').' };
}

function _existeMarcacionHoy_(sheet, fechaDDMMYYYY, idUsuario, tipoMarcacion, tz) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const tipoBuscado = (tipoMarcacion == null) ? '' : String(tipoMarcacion).trim().toLowerCase();
  const tzUse = tz || Session.getScriptTimeZone();
  for (let i = 0; i < data.length; i++) {
    const r = data[i] || [];
    const fecha = _normalizarFechaDDMMYYYY_(r[1], tzUse);
    const uid = (r[3] == null) ? '' : String(r[3]).trim();
    const tipo = (r[5] == null) ? '' : String(r[5]).trim().toLowerCase();
    if (fecha === fechaDDMMYYYY && uid === idUsuario && tipo === tipoBuscado) return true;
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

  const shCfg = ss.getSheetByName('Config_Horarios');
  if (!shCfg) return 'Registrado';

  const lastRow = shCfg.getLastRow();
  if (lastRow < 2) return 'Registrado';

  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'America/Bogota';
  const regla = _buscarReglaConfigHorarios_(ss, etapaRaw);
  if (!regla) return 'Registrado';

  const inicio = _timeToMinutes_(regla[2], tz);
  const fin = _timeToMinutes_(regla[3], tz);
  const ideal = _timeToMinutes_(regla[4], tz);
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

function _buscarReglaConfigHorarios_(ss, etapa) {
  const shCfg = ss.getSheetByName('Config_Horarios');
  if (!shCfg) return null;
  const lastRow = shCfg.getLastRow();
  if (lastRow < 2) return null;
  const rows = shCfg.getRange(2, 1, lastRow - 1, 6).getValues();
  const etapaBuscada = (etapa == null) ? '' : String(etapa).trim().toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    const e = (r[1] == null) ? '' : String(r[1]).trim().toLowerCase();
    if (e === etapaBuscada) return r;
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
  const shCfg = ss.getSheetByName('Config_Horarios');
  if (!shCfg) return {};
  const lastRow = shCfg.getLastRow();
  if (lastRow < 2) return {};
  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'America/Bogota';
  const rows = shCfg.getRange(2, 1, lastRow - 1, 6).getValues();
  const out = {};
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    const etapa = (r[1] == null) ? '' : String(r[1]).trim();
    if (!etapa) continue;
    const ini = _timeToMinutes_(r[2], tz);
    const fin = _timeToMinutes_(r[3], tz);
    const ideal = _timeToMinutes_(r[4], tz);
    out[etapa] = {
      inicio: _fmtHHMM_(ini),
      fin: _fmtHHMM_(fin),
      ideal: _fmtHHMM_(ideal)
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
