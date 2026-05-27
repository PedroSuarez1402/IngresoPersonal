const CACHE_SESION_PREFIX = 'IP_SES_';
const SESION_INACTIVIDAD_MS = 5 * 60 * 1000;
const SESION_TTL_SEG = 21600;

function _sesKey_(token) {
  return CACHE_SESION_PREFIX + String(token || '').trim();
}

function _crearSesion_(usuario) {
  const u = usuario || {};
  const token = Utilities.getUuid();
  const payload = {
    u: {
      id: (u.id == null) ? '' : String(u.id).trim(),
      correo: (u.correo == null) ? '' : String(u.correo).trim(),
      nombre: (u.nombre == null) ? '' : String(u.nombre).trim(),
      rol_id: (u.rol_id == null) ? '' : String(u.rol_id).trim(),
      cargo: (u.cargo == null) ? '' : String(u.cargo).trim(),
      estado: (u.estado == null) ? '' : String(u.estado).trim()
    },
    last: Date.now()
  };

  try {
    CacheService.getScriptCache().put(_sesKey_(token), JSON.stringify(payload), SESION_TTL_SEG);
  } catch (e) {}
  return token;
}

function _obtenerSesionValida_(token, touch) {
  const t = String(token || '').trim();
  if (!t) return null;

  const cache = CacheService.getScriptCache();
  const raw = cache.get(_sesKey_(t));
  if (!raw) return null;

  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    payload = null;
  }
  if (!payload || !payload.u || !payload.last) return null;

  const last = Number(payload.last);
  if (isNaN(last) || (Date.now() - last) > SESION_INACTIVIDAD_MS) {
    try { cache.remove(_sesKey_(t)); } catch (e) {}
    return null;
  }

  if (touch !== false) {
    payload.last = Date.now();
    try { cache.put(_sesKey_(t), JSON.stringify(payload), SESION_TTL_SEG); } catch (e) {}
  }

  return payload.u;
}

function cerrarSesionToken(token) {
  const t = String(token || '').trim();
  if (!t) return { exito: true };
  try { CacheService.getScriptCache().remove(_sesKey_(t)); } catch (e) {}
  return { exito: true };
}

function obtenerSesionActual(token) {
  const u = _obtenerSesionValida_(token, true);
  if (!u) return { exito: false, mensaje: 'Sesión expirada.' };
  return { exito: true, usuario: u };
}

function _requireSesion_(token) {
  const u = _obtenerSesionValida_(token, true);
  if (!u) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  return u;
}

function _requireAdmin_(token) {
  const u = _requireSesion_(token);
  const rol = (u.rol_id == null) ? '' : String(u.rol_id).trim();
  const rolNum = parseInt(rol, 10);
  if (!(rol === '2' || rolNum === 2)) throw new Error('No autorizado.');
  return u;
}

