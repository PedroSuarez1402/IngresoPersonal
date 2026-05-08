function obtenerRegistrosAsistenciaAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Registro_Asistencia');
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

  return (values || []).map(function (r) {
    const fecha = _toFechaDDMMYYYY_(r[1], tz);
    const hora = _toHoraHHMMSS_(r[2], tz);
    return {
      id: _toStr_(r[0]),
      fecha: fecha,
      hora: hora,
      uid: _toStr_(r[3]),
      nombre: _toStr_(r[4]),
      tipo: _toStr_(r[5]),
      categoria: _toStr_(r[6])
    };
  });
}

function _toStr_(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.replace(/^'/, '');
}

function _toFechaDDMMYYYY_(v, tz) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, tz, 'dd/MM/yyyy');
  }
  return _toStr_(v);
}

function _toHoraHHMMSS_(v, tz) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, tz, 'HH:mm:ss');
  }
  return _toStr_(v);
}
