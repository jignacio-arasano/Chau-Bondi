const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } = require('./_lib/email');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function getUser(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); }
  catch { return null; }
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const qs   = req.url.indexOf('?');
  const path = (qs === -1 ? req.url : req.url.slice(0, qs)).replace(/\/api/, '').replace(/\/$/, '') || '/';
  const M    = req.method;

  // ── POST /auth/register ────────────────────────────────────────────────────
  if (path === '/auth/register' && M === 'POST') {
    try {
      const { email, password, nombre, apellido, whatsapp } = req.body || {};

      if (!email || !password || !nombre || !apellido || !whatsapp)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: 'El correo no es válido.' });
      if (password.length < 6)
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      const waClean = whatsapp.replace(/\D/g, '');
      if (waClean.length < 10)
        return res.status(400).json({ error: 'Número de WhatsApp inválido (mínimo 10 dígitos).' });

      const { data: existing } = await supabase.from('profiles')
        .select('id').eq('email', email.toLowerCase()).single();
      if (existing)
        return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });

      const password_hash        = await bcrypt.hash(password, 12);
      const verification_token   = crypto.randomBytes(32).toString('hex');
      const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: profile, error } = await supabase.from('profiles')
        .insert({
          email:               email.toLowerCase(),
          password_hash,
          nombre:              nombre.trim(),
          apellido:            apellido.trim(),
          whatsapp:            waClean,
          email_verified:      false,
          verification_token,
          verification_expires
        })
        .select('id, email, nombre, apellido').single();

      if (error) throw error;

      const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${verification_token}`;
      await sendEmail({
        to:      profile.email,
        toName:  `${profile.nombre} ${profile.apellido}`,
        subject: '✅ Verificá tu cuenta de ChauBondi',
        html:    verificationEmailHtml({ nombre: profile.nombre, verifyUrl })
      });

      return res.status(201).json({
        message: 'Cuenta creada. Revisá tu correo para verificarla antes de ingresar.'
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Error al crear la cuenta. Intentá de nuevo.' });
    }
  }

  // ── POST /auth/login ───────────────────────────────────────────────────────
  if (path === '/auth/login' && M === 'POST') {
    try {
      const { email, password } = req.body || {};
      if (!email || !password)
        return res.status(400).json({ error: 'Email y contraseña requeridos.' });

      const { data: p } = await supabase.from('profiles')
        .select('id,email,nombre,apellido,whatsapp,rating_promedio,password_hash,activo,email_verified')
        .eq('email', email.toLowerCase()).single();

      if (!p) return res.status(401).json({ error: 'Credenciales incorrectas.' });
      if (!p.activo) return res.status(403).json({ error: 'Tu cuenta está suspendida.' });
      if (p.email_verified === false)
        return res.status(403).json({
          error: 'Verificá tu correo antes de ingresar. Revisá tu bandeja de entrada.',
          code: 'EMAIL_NOT_VERIFIED'
        });

      const ok = await bcrypt.compare(password, p.password_hash);
      if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas.' });

      const token = jwt.sign(
        { id: p.id, email: p.email, nombre: p.nombre, apellido: p.apellido },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      const { password_hash, ...user } = p;
      return res.json({ token, user });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
  }

  // ── GET /auth/verify ───────────────────────────────────────────────────────
  if (path === '/auth/verify' && M === 'GET') {
    try {
      const token = new URL(req.url, 'http://x').searchParams.get('token');
      if (!token) return res.status(400).json({ error: 'Token requerido.' });

      const { data: p } = await supabase.from('profiles')
        .select('id,email_verified,verification_expires')
        .eq('verification_token', token).single();

      if (!p) return res.status(400).json({ error: 'Token inválido o ya utilizado.' });
      if (p.email_verified) return res.json({ message: 'Tu cuenta ya estaba verificada. Podés iniciar sesión.' });
      if (new Date(p.verification_expires) < new Date())
        return res.status(400).json({ error: 'El link de verificación expiró. Registrate de nuevo.' });

      await supabase.from('profiles')
        .update({ email_verified: true, verification_token: null, verification_expires: null })
        .eq('id', p.id);
      return res.json({ message: '✅ ¡Cuenta verificada! Ya podés iniciar sesión en ChauBondi.' });
    } catch (err) {
      console.error('Verify error:', err);
      return res.status(500).json({ error: 'Error al verificar la cuenta.' });
    }
  }

  // ── POST /auth/forgot-password ─────────────────────────────────────────────
  if (path === '/auth/forgot-password' && M === 'POST') {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email requerido.' });

      const { data: p } = await supabase.from('profiles')
        .select('id, nombre, apellido, email').eq('email', email.toLowerCase()).single();

      // Siempre devolvemos 200 para no revelar si el mail existe
      if (!p) return res.json({ message: 'Si ese correo existe, recibirás un link para restablecer tu contraseña.' });

      const reset_token   = crypto.randomBytes(32).toString('hex');
      const reset_expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

      await supabase.from('profiles')
        .update({ reset_token, reset_expires })
        .eq('id', p.id);

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${reset_token}`;
      await sendEmail({
        to:      p.email,
        toName:  `${p.nombre} ${p.apellido}`,
        subject: '🔑 Restablecé tu contraseña de ChauBondi',
        html:    resetPasswordEmailHtml({ nombre: p.nombre, resetUrl })
      });

      return res.json({ message: 'Si ese correo existe, recibirás un link para restablecer tu contraseña.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }
  }

  // ── POST /auth/reset-password ──────────────────────────────────────────────
  if (path === '/auth/reset-password' && M === 'POST') {
    try {
      const { token, password } = req.body || {};
      if (!token || !password)
        return res.status(400).json({ error: 'Token y contraseña requeridos.' });
      if (password.length < 6)
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

      const { data: p } = await supabase.from('profiles')
        .select('id, reset_expires').eq('reset_token', token).single();

      if (!p) return res.status(400).json({ error: 'Token inválido o ya utilizado.' });
      if (new Date(p.reset_expires) < new Date())
        return res.status(400).json({ error: 'El link expiró. Solicitá uno nuevo.' });

      const password_hash = await bcrypt.hash(password, 12);
      await supabase.from('profiles')
        .update({ password_hash, reset_token: null, reset_expires: null })
        .eq('id', p.id);

      return res.json({ message: '✅ Contraseña actualizada. Ya podés iniciar sesión.' });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).json({ error: 'Error al restablecer la contraseña.' });
    }
  }

  // ── Rutas protegidas (requieren auth) ──────────────────────────────────────
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Token requerido.' });

  // ── GET /auth/me ───────────────────────────────────────────────────────────
  if (path === '/auth/me' && M === 'GET') {
    try {
      const { data } = await supabase.from('profiles')
        .select('id,email,nombre,apellido,whatsapp,rating_promedio,rating_count,created_at')
        .eq('id', user.id).single();
      return data ? res.json(data) : res.status(404).json({ error: 'Perfil no encontrado.' });
    } catch { return res.status(500).json({ error: 'Error al obtener el perfil.' }); }
  }

  if (path === '/health') return res.json({ status: 'ok', timestamp: new Date().toISOString() });

  // ── GET /trips/my/created ──────────────────────────────────────────────────
  if (path === '/trips/my/created' && M === 'GET') {
    try {
      const { data, error } = await supabase.from('viajes')
        .select('id,tipo,zona_comun,barrio,fecha_hora,cupos_disponibles,activo,created_at')
        .eq('id_creador', user.id).order('fecha_hora', { ascending: false });
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Error al obtener tus viajes.' }); }
  }

  // ── GET /trips/my/joined ───────────────────────────────────────────────────
  if (path === '/trips/my/joined' && M === 'GET') {
    try {
      const { data, error } = await supabase.from('participantes')
        .select(`id,estado_pago,created_at,
          viajes:id_viaje(id,tipo,zona_comun,barrio,fecha_hora,cupos_disponibles,activo,
            profiles:id_creador(nombre,apellido,rating_promedio))`)
        .eq('id_usuario', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Error al obtener los viajes.' }); }
  }

  // ── GET /trips ─────────────────────────────────────────────────────────────
  if (path === '/trips' && M === 'GET') {
    try {
      const sp   = new URL(req.url, 'http://x').searchParams;
      const tipo = sp.get('tipo'), zona = sp.get('zona'), fecha = sp.get('fecha');
      let q = supabase.from('viajes')
        .select(`id,tipo,zona_comun,barrio,fecha_hora,cupos_disponibles,activo,created_at,
          profiles:id_creador(id,nombre,apellido,rating_promedio)`)
        .eq('activo', true).gt('cupos_disponibles', 0)
        .gt('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true })
        .order('cupos_disponibles', { ascending: true });
      if (tipo)  q = q.eq('tipo', tipo);
      if (zona)  q = q.eq('zona_comun', zona);
      if (fecha) {
        const s = new Date(fecha); s.setHours(0,0,0,0);
        const e = new Date(fecha); e.setHours(23,59,59,999);
        q = q.gte('fecha_hora', s.toISOString()).lte('fecha_hora', e.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Error al obtener los viajes.' }); }
  }

  // ── POST /trips ────────────────────────────────────────────────────────────
  if (path === '/trips' && M === 'POST') {
    try {
      const { tipo, zona_comun, barrio, fecha_hora } = req.body || {};
      if (!tipo || !zona_comun || !barrio || !fecha_hora)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      if (!['IDA','VUELTA'].includes(tipo))
        return res.status(400).json({ error: 'Tipo debe ser IDA o VUELTA.' });

      const fv = new Date(fecha_hora);
      if (isNaN(fv.getTime()) || fv <= new Date())
        return res.status(400).json({ error: 'La fecha debe ser en el futuro.' });

      const dia = fv.toISOString().slice(0, 10);

      const { data: misViajes } = await supabase.from('viajes').select('id,fecha_hora')
        .eq('id_creador', user.id).eq('tipo', tipo).eq('activo', true)
        .gt('cupos_disponibles', 0).gt('fecha_hora', new Date().toISOString());
      if ((misViajes||[]).some(v => v.fecha_hora.slice(0,10) === dia))
        return res.status(409).json({ error: 'Ya tenés un viaje del mismo tipo publicado para ese día.' });

      const { data: vZona } = await supabase.from('viajes').select('id,fecha_hora')
        .eq('tipo', tipo).eq('zona_comun', zona_comun).eq('activo', true)
        .gt('cupos_disponibles', 0).gt('fecha_hora', new Date().toISOString());
      const MINS15 = 15*60*1000;
      if ((vZona||[]).some(v => v.fecha_hora.slice(0,10)===dia && Math.abs(new Date(v.fecha_hora)-fv)<MINS15))
        return res.status(409).json({ error: 'Ya existe un viaje en esa zona en ese horario (menos de 15 min). Buscalo y unite.' });

      const { data: viaje, error } = await supabase.from('viajes')
        .insert({ id_creador: user.id, tipo, zona_comun, barrio: barrio.trim(),
          fecha_hora: fv.toISOString(), cupos_disponibles: 3 })
        .select(`id,tipo,zona_comun,barrio,fecha_hora,cupos_disponibles,activo,created_at,
          profiles:id_creador(id,nombre,apellido,rating_promedio)`).single();
      if (error) throw error;
      return res.status(201).json(viaje);
    } catch (e) { console.error(e); return res.status(500).json({ error: 'Error al crear el viaje.' }); }
  }

  // ── Rutas con :id ──────────────────────────────────────────────────────────
  const mId = path.match(/^\/trips\/([a-f0-9-]{36})(\/join|\/leave)?$/);
  if (mId) {
    const id = mId[1], action = mId[2];

    if (action === '/join' && M === 'POST') {
      try {
        const { data: v } = await supabase.from('viajes')
          .select('id,id_creador,cupos_disponibles,activo,fecha_hora').eq('id', id).single();
        if (!v) return res.status(404).json({ error: 'Viaje no encontrado.' });
        if (v.id_creador === user.id) return res.status(400).json({ error: 'No podés unirte a tu propio viaje.' });
        if (!v.activo) return res.status(400).json({ error: 'Este viaje ya no está activo.' });
        if (v.cupos_disponibles <= 0) return res.status(400).json({ error: 'No hay cupos disponibles.' });
        if (new Date(v.fecha_hora) <= new Date()) return res.status(400).json({ error: 'Este viaje ya pasó.' });

        const { data: ex } = await supabase.from('participantes').select('id,estado_pago')
          .eq('id_viaje', id).eq('id_usuario', user.id).single();
        if (ex?.estado_pago) return res.status(409).json({ error: 'Ya sos parte de este viaje.' });

        if (ex) await supabase.from('participantes').update({ estado_pago: true }).eq('id', ex.id);
        else    await supabase.from('participantes').insert({ id_viaje: id, id_usuario: user.id, estado_pago: true });
        await supabase.from('viajes').update({ cupos_disponibles: v.cupos_disponibles - 1 }).eq('id', id);
        return res.json({ joined: true });
      } catch { return res.status(500).json({ error: 'Error al unirte al viaje.' }); }
    }

    if (action === '/leave' && M === 'DELETE') {
      try {
        const { data: part } = await supabase.from('participantes').select('id,estado_pago')
          .eq('id_viaje', id).eq('id_usuario', user.id).single();
        if (!part) return res.status(404).json({ error: 'No estás en este viaje.' });
        await supabase.from('participantes').delete().eq('id', part.id);
        if (part.estado_pago) await supabase.rpc('increment_cupos', { viaje_id: id });
        return res.json({ message: 'Saliste del viaje.' });
      } catch { return res.status(500).json({ error: 'Error al salir del viaje.' }); }
    }

    if (!action && M === 'GET') {
      try {
        const { data: viaje } = await supabase.from('viajes')
          .select(`id,tipo,zona_comun,barrio,fecha_hora,cupos_disponibles,activo,created_at,
            profiles:id_creador(id,nombre,apellido,rating_promedio)`)
          .eq('id', id).single();
        if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado.' });

        const { data: parts } = await supabase.from('participantes')
          .select(`id,estado_pago,profiles:id_usuario(id,nombre,apellido,rating_promedio,whatsapp)`)
          .eq('id_viaje', id).eq('estado_pago', true);

        const esCreador    = viaje.profiles.id === user.id;
        const yaEsPasajero = (parts||[]).some(p => p.profiles.id === user.id);
        const verWA        = esCreador || yaEsPasajero;

        const participantes = (parts||[]).map(p => ({
          id: p.id, estado_pago: p.estado_pago,
          nombre: p.profiles.nombre, apellido: p.profiles.apellido,
          rating_promedio: p.profiles.rating_promedio,
          whatsapp: verWA ? p.profiles.whatsapp : null,
          id_usuario: p.profiles.id
        }));

        const creador = { id_usuario: viaje.profiles.id, nombre: viaje.profiles.nombre,
          apellido: viaje.profiles.apellido, rating_promedio: viaje.profiles.rating_promedio,
          whatsapp: null, es_creador: true };
        if (verWA) {
          const { data: cd } = await supabase.from('profiles').select('whatsapp').eq('id', viaje.profiles.id).single();
          if (cd) creador.whatsapp = cd.whatsapp;
        }

        return res.json({ ...viaje, participantes, creador_detalle: creador,
          puede_unirse: !esCreador && !yaEsPasajero && viaje.cupos_disponibles > 0 && viaje.activo,
          es_creador: esCreador, ya_es_pasajero: yaEsPasajero });
      } catch { return res.status(500).json({ error: 'Error al obtener el viaje.' }); }
    }

    if (!action && M === 'DELETE') {
      try {
        const { data: v } = await supabase.from('viajes').select('id,id_creador').eq('id', id).single();
        if (!v) return res.status(404).json({ error: 'Viaje no encontrado.' });
        if (v.id_creador !== user.id) return res.status(403).json({ error: 'Solo el creador puede cancelar.' });
        await supabase.from('viajes').update({ activo: false }).eq('id', id);
        return res.json({ message: 'Viaje cancelado.' });
      } catch { return res.status(500).json({ error: 'Error al cancelar el viaje.' }); }
    }
  }

  // ── GET /ratings/pending ───────────────────────────────────────────────────
  if (path === '/ratings/pending' && M === 'GET') {
    try {
      const dosHAtras = new Date(Date.now() - 2*60*60*1000).toISOString();
      const { data: creados } = await supabase.from('viajes')
        .select('id,tipo,zona_comun,barrio,fecha_hora')
        .eq('id_creador', user.id).lte('fecha_hora', dosHAtras);
      const { data: unido } = await supabase.from('participantes')
        .select('id_viaje,viajes:id_viaje(id,tipo,zona_comun,barrio,fecha_hora)')
        .eq('id_usuario', user.id).eq('estado_pago', true);
      const vUnido = (unido||[]).map(p=>p.viajes).filter(v=>v&&new Date(v.fecha_hora)<=new Date(dosHAtras));
      const todos  = [...(creados||[]), ...vUnido];
      const pendientes = [];
      for (const viaje of todos) {
        const { data: pts } = await supabase.from('participantes').select('id_usuario')
          .eq('id_viaje', viaje.id).eq('estado_pago', true);
        const { data: vd } = await supabase.from('viajes').select('id_creador').eq('id', viaje.id).single();
        const ids = [vd?.id_creador, ...(pts||[]).map(p=>p.id_usuario)].filter(x=>x&&x!==user.id);
        const { data: yc } = await supabase.from('ratings').select('id_calificado')
          .eq('id_viaje', viaje.id).eq('id_calificador', user.id);
        const calif = (yc||[]).map(r=>r.id_calificado);
        const sc    = ids.filter(x=>!calif.includes(x));
        if (sc.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('id,nombre,apellido').in('id', sc);
          pendientes.push({ viaje, sinCalificar: profs||[] });
        }
      }
      return res.json(pendientes);
    } catch { return res.status(500).json({ error: 'Error al obtener calificaciones pendientes.' }); }
  }

  // ── POST /ratings ──────────────────────────────────────────────────────────
  if (path === '/ratings' && M === 'POST') {
    try {
      const { id_viaje, id_calificado, puntuacion } = req.body || {};
      if (!id_viaje || !id_calificado || !puntuacion)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5)
        return res.status(400).json({ error: 'La puntuación debe ser entre 1 y 5.' });
      if (id_calificado === user.id)
        return res.status(400).json({ error: 'No podés calificarte a vos mismo.' });

      const { data: viaje } = await supabase.from('viajes')
        .select('id,fecha_hora,id_creador').eq('id', id_viaje).single();
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado.' });
      if (new Date() < new Date(new Date(viaje.fecha_hora).getTime() + 2*60*60*1000))
        return res.status(400).json({ error: 'Solo podés calificar 2 horas después del horario de salida.' });

      if (viaje.id_creador !== user.id) {
        const { data: pt } = await supabase.from('participantes').select('id')
          .eq('id_viaje', id_viaje).eq('id_usuario', user.id).eq('estado_pago', true).single();
        if (!pt) return res.status(403).json({ error: 'Solo pueden calificar quienes participaron.' });
      }

      const { data: rating, error: rErr } = await supabase.from('ratings')
        .insert({ id_viaje, id_calificador: user.id, id_calificado, puntuacion }).select().single();
      if (rErr?.code === '23505') return res.status(409).json({ error: 'Ya calificaste a este usuario en este viaje.' });
      if (rErr) throw rErr;

      const { data: all } = await supabase.from('ratings').select('puntuacion').eq('id_calificado', id_calificado);
      if (all?.length > 0) {
        const prom = +(all.reduce((s,r)=>s+r.puntuacion,0)/all.length).toFixed(2);
        await supabase.from('profiles').update({ rating_promedio: prom, rating_count: all.length }).eq('id', id_calificado);
      }
      return res.status(201).json({ message: '¡Calificación enviada!', rating });
    } catch { return res.status(500).json({ error: 'Error al enviar la calificación.' }); }
  }

  return res.status(404).json({ error: 'Ruta no encontrada.' });
};
