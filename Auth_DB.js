function validarAccesoUsuario(correoInput, passwordInput) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Base_Usuarios');
  const mensaje = 'Credenciales inválidas o usuario inactivo.';
  if (!sheet) return { exito: false, mensaje: mensaje };

  const correoBuscado = (correoInput == null) ? '' : String(correoInput).trim().toLowerCase();
  const passwordBuscada = (passwordInput == null) ? '' : String(passwordInput);
  if (!correoBuscado || !passwordBuscada) return { exito: false, mensaje: mensaje };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const correo = (r[1] == null) ? '' : String(r[1]).trim().toLowerCase();
    if (correo !== correoBuscado) continue;

    const estado = (r[7] == null) ? '' : String(r[7]).trim();
    if (estado !== 'Activo' && estado !== 'activo') return { exito: false, mensaje: mensaje };

    const passwordReal = (r[2] == null) ? '' : String(r[2]);
    if (passwordReal !== passwordBuscada) return { exito: false, mensaje: mensaje };

    return {
      exito: true,
      usuario: {
        id: (r[0] == null) ? '' : String(r[0]).trim(),
        correo: (r[1] == null) ? '' : String(r[1]).trim(),
        nombre: (r[3] == null) ? '' : String(r[3]).trim(),
        identificacion: (r[4] == null) ? '' : String(r[4]).trim(),
        cargo: (r[5] == null) ? '' : String(r[5]).trim(),
        rol_id: (r[6] == null) ? '' : String(r[6]).trim(),
        estado: (r[7] == null) ? '' : String(r[7]).trim()
      }
    };
  }

  return { exito: false, mensaje: mensaje };
}
