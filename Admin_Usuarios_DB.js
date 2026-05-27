function obtenerUsuariosAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Base_Usuarios');
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  return (values || []).map(function (r) {
    return {
      id: _usrAdmin_toStr_(r[0]),
      correo: _usrAdmin_toStr_(r[1]),
      nombre: _usrAdmin_toStr_(r[3]),
      identificacion: _usrAdmin_toStr_(r[4]),
      cargo: _usrAdmin_toStr_(r[5]),
      rol_id: _usrAdmin_toStr_(r[6]),
      estado: _usrAdmin_toStr_(r[7])
    };
  });
}

function guardarUsuarioAdmin(datos) {
  const d = datos || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Base_Usuarios');
  if (!sheet) throw new Error('No existe la hoja Base_Usuarios.');

  const id = _usrAdmin_toStr_(d.id);
  const correo = _usrAdmin_toStr_(d.correo);
  const nombre = _usrAdmin_toStr_(d.nombre);
  const identificacion = _usrAdmin_toStr_(d.identificacion);
  const passwordIn = _usrAdmin_toStr_(d.password);
  const cargo = _usrAdmin_toStr_(d.cargo);
  const rolId = _usrAdmin_toStr_(d.rol_id);

  if (!correo || !nombre || !identificacion || !cargo || !rolId) {
    throw new Error('Faltan datos obligatorios para guardar el usuario.');
  }

  const lastRow = sheet.getLastRow();
  const rows = (lastRow >= 2) ? sheet.getRange(2, 1, lastRow - 1, 8).getValues() : [];

  if (!id) {
    const newId = _usrAdmin_nextId_(rows);
    const estado = 'Activo';
    const password = passwordIn || identificacion;
    sheet.appendRow([newId, correo, password, nombre, identificacion, cargo, rolId, estado]);
    try { CacheService.getScriptCache().remove('CACHE_USUARIOS'); } catch (e) {}
    return { exito: true, id: newId };
  }

  const rowIndex = _usrAdmin_findRowById_(rows, id);
  if (rowIndex === -1) throw new Error('No se encontró el usuario para editar.');

  const absRow = rowIndex + 2;
  sheet.getRange(absRow, 2).setValue(correo);
  if (passwordIn) sheet.getRange(absRow, 3).setValue(passwordIn);
  sheet.getRange(absRow, 4).setValue(nombre);
  sheet.getRange(absRow, 5).setValue(identificacion);
  sheet.getRange(absRow, 6).setValue(cargo);
  sheet.getRange(absRow, 7).setValue(rolId);

  try { CacheService.getScriptCache().remove('CACHE_USUARIOS'); } catch (e) {}
  return { exito: true, id: id };
}

function cambiarEstadoUsuarioAdmin(idUsuario, nuevoEstado) {
  const id = _usrAdmin_toStr_(idUsuario);
  const estadoIn = _usrAdmin_toStr_(nuevoEstado);
  if (!id) throw new Error('ID de usuario inválido.');

  const estadoNorm = estadoIn.toLowerCase().trim();
  let estadoOut = '';
  if (estadoNorm === 'activo') estadoOut = 'Activo';
  if (estadoNorm === 'inactivo') estadoOut = 'Inactivo';
  if (!estadoOut) throw new Error('Estado inválido. Usa Activo o Inactivo.');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Base_Usuarios');
  if (!sheet) throw new Error('No existe la hoja Base_Usuarios.');

  const lastRow = sheet.getLastRow();
  const rows = (lastRow >= 2) ? sheet.getRange(2, 1, lastRow - 1, 8).getValues() : [];
  const rowIndex = _usrAdmin_findRowById_(rows, id);
  if (rowIndex === -1) throw new Error('No se encontró el usuario.');

  sheet.getRange(rowIndex + 2, 8).setValue(estadoOut);
  try { CacheService.getScriptCache().remove('CACHE_USUARIOS'); } catch (e) {}
  return { exito: true };
}

function _usrAdmin_toStr_(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim().replace(/^'/, '');
}

function _usrAdmin_findRowById_(rows, id) {
  const idBuscado = _usrAdmin_toStr_(id);
  for (let i = 0; i < (rows || []).length; i++) {
    const r = rows[i] || [];
    const rid = _usrAdmin_toStr_(r[0]);
    if (rid === idBuscado) return i;
  }
  return -1;
}

function _usrAdmin_nextId_(rows) {
  let maxNum = 0;
  for (let i = 0; i < (rows || []).length; i++) {
    const r = rows[i] || [];
    const id = _usrAdmin_toStr_(r[0]);
    const m = /^USR-(\d+)$/i.exec(id);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
  const next = maxNum + 1;
  const numStr = String(next).padStart(3, '0');
  return 'USR-' + numStr;
}
