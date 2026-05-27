function obtenerConfiguracionesAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config_Horarios');
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

  return (values || []).map(function (r) {
    return {
      id: _cfgStr_(r[0]),
      etapa: _cfgStr_(r[1]),
      hora_inicio: _cfgHoraHHMM_(r[2], tz),
      hora_fin: _cfgHoraHHMM_(r[3], tz),
      hora_ideal: _cfgHoraHHMM_(r[4], tz),
      descripcion: _cfgStr_(r[5])
    };
  });
}

function guardarConfiguracionAdmin(datos) {
  try {
    const payload = datos || {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Config_Horarios');
    if (!sheet) return { exito: false, mensaje: 'No existe la hoja Config_Horarios.' };

    const id = (payload.id == null) ? '' : String(payload.id).trim();
    const etapa = (payload.etapa == null) ? '' : String(payload.etapa).trim();
    const horaInicio = _cfgNormalizarHHMM_(payload.hora_inicio);
    const horaFin = _cfgNormalizarHHMM_(payload.hora_fin);
    const horaIdeal = _cfgNormalizarHHMM_(payload.hora_ideal);
    const descripcion = (payload.descripcion == null) ? '' : String(payload.descripcion).trim();

    if (!etapa || !horaInicio || !horaFin || !horaIdeal) {
      return { exito: false, mensaje: 'Completa Etapa y todas las horas.' };
    }

    if (!id) {
      const newId = _cfgGenerarSiguienteId_(sheet);
      sheet.appendRow([newId, etapa, horaInicio, horaFin, horaIdeal, descripcion]);
      const row = sheet.getLastRow();
      sheet.getRange(row, 3, 1, 3).setNumberFormat('HH:mm');
      try { CacheService.getScriptCache().remove('CACHE_CONFIG_HORARIOS'); } catch (e) {}
      return { exito: true, mensaje: 'Regla creada: ' + newId };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { exito: false, mensaje: 'No se encontró la regla para actualizar.' };

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      const current = (ids[i] && ids[i][0] != null) ? String(ids[i][0]).trim() : '';
      if (current !== id) continue;

      const row = i + 2;
      sheet.getRange(row, 2, 1, 5).setValues([[etapa, horaInicio, horaFin, horaIdeal, descripcion]]);
      sheet.getRange(row, 3, 1, 3).setNumberFormat('HH:mm');
      try { CacheService.getScriptCache().remove('CACHE_CONFIG_HORARIOS'); } catch (e) {}
      return { exito: true, mensaje: 'Regla actualizada: ' + id };
    }

    return { exito: false, mensaje: 'No se encontró la regla con ID: ' + id };
  } catch (e) {
    return { exito: false, mensaje: 'Error guardando configuración: ' + e.message };
  }
}

function _cfgGenerarSiguienteId_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 'R-001';

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let max = 0;
  for (let i = 0; i < ids.length; i++) {
    const s = (ids[i] && ids[i][0] != null) ? String(ids[i][0]).trim() : '';
    const m = /^R-(\d+)$/.exec(s);
    if (!m) continue;
    const n = Number(m[1]);
    if (!isNaN(n) && n > max) max = n;
  }
  const next = max + 1;
  return 'R-' + String(next).padStart(3, '0');
}

function _cfgStr_(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.replace(/^'/, '');
}

function _cfgHoraHHMM_(v, tz) {
  if (v === null || v === undefined || v === '') return '';

  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, tz, 'HH:mm');
  }

  const s = _cfgStr_(v);
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return s;
  const hh = String(Number(m[1])).padStart(2, '0');
  const mm = String(Number(m[2])).padStart(2, '0');
  return hh + ':' + mm;
}

function _cfgNormalizarHHMM_(v) {
  const s = (v == null) ? '' : String(v).trim();
  if (!s) return '';
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return '';
  const hh = String(Number(m[1])).padStart(2, '0');
  const mm = String(Number(m[2])).padStart(2, '0');
  return hh + ':' + mm;
}
