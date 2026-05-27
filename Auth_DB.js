function validarAccesoUsuario(correoInput, passwordInput) {
  const mensaje = 'Credenciales inválidas o usuario inactivo.';
  const correoBuscado = (correoInput == null) ? '' : String(correoInput).trim().toLowerCase();
  const passwordBuscada = (passwordInput == null) ? '' : String(passwordInput);
  if (!correoBuscado || !passwordBuscada) return { exito: false, mensaje: mensaje };

  if (correoBuscado.indexOf('@anscomunicaciones.com.co') === -1 || !/@anscomunicaciones\.com\.co$/.test(correoBuscado)) {
    return { exito: false, mensaje: 'Debes ingresar con tu correo corporativo.' };
  }

  const usuarios = _auth_getUsuariosCached_();
  for (let i = 0; i < usuarios.length; i++) {
    const u = usuarios[i] || {};
    const correo = (u.correo == null) ? '' : String(u.correo).trim().toLowerCase();
    if (correo !== correoBuscado) continue;

    const estado = (u.estado == null) ? '' : String(u.estado).trim();
    if (estado !== 'Activo' && estado !== 'activo') return { exito: false, mensaje: mensaje };

    const passwordReal = (u.password == null) ? '' : String(u.password);
    if (passwordReal !== passwordBuscada) return { exito: false, mensaje: mensaje };

    const usuario = {
      id: (u.id == null) ? '' : String(u.id).trim(),
      correo: (u.correo == null) ? '' : String(u.correo).trim(),
      nombre: (u.nombre == null) ? '' : String(u.nombre).trim(),
      cargo: (u.cargo == null) ? '' : String(u.cargo).trim(),
      rol_id: (u.rol_id == null) ? '' : String(u.rol_id).trim(),
      estado: (u.estado == null) ? '' : String(u.estado).trim()
    };
    const token = _crearSesion_(usuario);
    return { exito: true, token: token, usuario: usuario };
  }

  return { exito: false, mensaje: mensaje };
}

const CACHE_USUARIOS = 'CACHE_USUARIOS';

function _auth_getUsuariosCached_() {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(CACHE_USUARIOS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Base_Usuarios');
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  const usuarios = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i] || [];
    usuarios.push({
      id: (r[0] == null) ? '' : String(r[0]).trim(),
      correo: (r[1] == null) ? '' : String(r[1]).trim(),
      password: (r[2] == null) ? '' : String(r[2]),
      nombre: (r[3] == null) ? '' : String(r[3]).trim(),
      identificacion: (r[4] == null) ? '' : String(r[4]).trim(),
      cargo: (r[5] == null) ? '' : String(r[5]).trim(),
      rol_id: (r[6] == null) ? '' : String(r[6]).trim(),
      estado: (r[7] == null) ? '' : String(r[7]).trim()
    });
  }
  try {
    cache.put(CACHE_USUARIOS, JSON.stringify(usuarios), 3600);
  } catch (e) {}
  return usuarios;
}
