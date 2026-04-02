const supabase = require('./_lib/db');
const { withAuth } = require('./_lib/middleware');

module.exports = withAuth(async (req, res) => {
  const fullUrl = req.url.split('?')[0].replace(/\/$/, '');
  const path = fullUrl.replace(/^\/api\/trips/, '') || '/';
  const method = req.method;

  // ── GET /api/trips/my/created ─────────────────────────────────────────────
  if (path === '/my/created' && method === 'GET') {
    try {
      const { data, error } = await supabase.from('viajes')
        .select('id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, activo, created_at, pasajeros_minimos, acompanantes')
        .eq('id_creador', req.user.id)
        .order('fecha_hora', { ascending: false });
      if (error) throw error;
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener tus viajes.' });
    }
  }

  // ── GET /api/trips/my/joined ──────────────────────────────────────────────
  if (path === '/my/joined' && method === 'GET') {
    try {
      const { data, error } = await supabase.from('participantes')
        .select(`id, estado_pago, created_at,
          viajes:id_viaje ( id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, activo, pasajeros_minimos, acompanantes,
            profiles:id_creador ( nombre, apellido, rating_promedio ) )`)
        .eq('id_usuario', req.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener los viajes.' });
    }
  }

  // ── GET /api/trips — listar viajes ────────────────────────────────────────
  if (path === '/' && method === 'GET') {
    try {
      const params = req.query || {};
      const { tipo, zona, fecha } = params;

      let query = supabase
        .from('viajes')
        .select(`id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, activo, created_at, pasajeros_minimos, acompanantes,
          profiles:id_creador ( id, nombre, apellido, rating_promedio )`)
        .eq('activo', true)
        .gt('cupos_disponibles', 0)
        .gt('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true })
        .order('cupos_disponibles', { ascending: true })
        .limit(50);
      if (tipo)  query = query.eq('tipo', tipo);
      if (zona)  query = query.eq('zona_comun', zona);
      if (fecha) {
        const start = new Date(fecha); start.setHours(0, 0, 0, 0);
        const end   = new Date(fecha); end.setHours(23, 59, 59, 999);
        query = query.gte('fecha_hora', start.toISOString()).lte('fecha_hora', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener los viajes.' });
    }
  }

  // ── POST /api/trips — crear viaje ─────────────────────────────────────────
  if (path === '/' && method === 'POST') {
    try {
      const { tipo, zona_comun, barrio, fecha_hora, pasajeros_minimos, acompanantes } = req.body || {};

      if (!tipo || !zona_comun || !barrio || !fecha_hora)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      if (!['IDA', 'VUELTA'].includes(tipo))
        return res.status(400).json({ error: 'Tipo debe ser IDA o VUELTA.' });

      const fechaViaje = new Date(fecha_hora);
      if (isNaN(fechaViaje.getTime()) || fechaViaje <= new Date())
        return res.status(400).json({ error: 'La fecha debe ser en el futuro.' });
        
      const minRequerido = pasajeros_minimos ? parseInt(pasajeros_minimos, 10) : 1;
      const acomps = acompanantes ? parseInt(acompanantes, 10) : 0;
      
      // 👇 ACÁ ESTÁ LA MAGIA MATEMÁTICA
      const cupos_iniciales = 3 - acomps;

      const getDiaArg = (dateObj) => new Date(dateObj.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const fechaDiaArg = getDiaArg(fechaViaje);

      const { data: misViajes } = await supabase.from('viajes')
        .select('id, fecha_hora')
        .eq('id_creador', req.user.id).eq('tipo', tipo).eq('activo', true)
        .gt('cupos_disponibles', 0).gt('fecha_hora', new Date().toISOString());

      if ((misViajes || []).some(v => getDiaArg(new Date(v.fecha_hora)) === fechaDiaArg))
        return res.status(409).json({ error: 'Ya tenés un viaje del mismo tipo publicado para ese día.' });

      const { data: viajesZona } = await supabase.from('viajes')
        .select('id, fecha_hora')
        .eq('tipo', tipo).eq('zona_comun', zona_comun).eq('activo', true)
        .gt('cupos_disponibles', 0).gt('fecha_hora', new Date().toISOString());

      const MINS_15 = 15 * 60 * 1000;
      const hayDuplicado = (viajesZona || []).some(v => {
        if (getDiaArg(new Date(v.fecha_hora)) !== fechaDiaArg) return false;
        return Math.abs(new Date(v.fecha_hora).getTime() - fechaViaje.getTime()) < MINS_15;
      });

      if (hayDuplicado)
        return res.status(409).json({
          error: 'Ya existe un viaje desde/hacia esa zona en ese horario (menos de 15 min). Buscalo en la lista y unite.'
        });

      const { data: viaje, error } = await supabase.from('viajes')
        .insert({ 
          id_creador: req.user.id, 
          tipo, 
          zona_comun, 
          barrio: barrio.trim(),
          fecha_hora: fechaViaje.toISOString(), 
          cupos_disponibles: cupos_iniciales, // Guardamos los lugares reales
          pasajeros_minimos: minRequerido,
          acompanantes: acomps
        })
        .select(`id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, activo, created_at, pasajeros_minimos, acompanantes,
          profiles:id_creador ( id, nombre, apellido, rating_promedio )`)
        .single();

      if (error) throw error;
      return res.status(201).json(viaje);
    } catch (err) {
      console.error('Create trip error:', err);
      return res.status(500).json({ error: 'Error al crear el viaje.' });
    }
  }

  const idMatch = path.match(/^\/([a-f0-9-]{36})(\/join|\/leave)?$/);
  if (!idMatch) return res.status(404).json({ error: 'Ruta no encontrada.' });

  const id     = idMatch[1];
  const action = idMatch[2];

  // ── POST /api/trips/:id/join ──────────────────────────────────────────────
  if (action === '/join' && method === 'POST') {
    try {
      const { data: v } = await supabase.from('viajes').select('id_creador, fecha_hora').eq('id', id).single();
      if (!v) return res.status(404).json({ error: 'Viaje no encontrado.' });
      if (v.id_creador === req.user.id) return res.status(400).json({ error: 'No podés unirte a tu propio viaje.' });
      if (new Date(v.fecha_hora) <= new Date()) return res.status(400).json({ error: 'Este viaje ya pasó.' });

      const { error: rpcError } = await supabase.rpc('join_viaje', { 
        p_id_viaje: id, 
        p_id_usuario: req.user.id 
      });

      if (rpcError) {
        if (rpcError.message.includes('No hay cupos')) {
          return res.status(400).json({ error: 'El viaje ya está lleno o inactivo.' });
        }
        return res.status(409).json({ error: 'Error al unirse. Es probable que ya seas parte del viaje.' });
      }

      return res.json({ joined: true });
    } catch (err) {
      console.error('Join error:', err);
      return res.status(500).json({ error: 'Error al unirte al viaje.' });
    }
  }

  // ── DELETE /api/trips/:id/leave ───────────────────────────────────────────
  if (action === '/leave' && method === 'DELETE') {
    try {
      const { data: participante, error } = await supabase.from('participantes')
        .select('id, estado_pago').eq('id_viaje', id).eq('id_usuario', req.user.id).single();

      if (error || !participante) return res.status(404).json({ error: 'No estás en este viaje.' });

      await supabase.from('participantes').delete().eq('id', participante.id);

      if (participante.estado_pago)
        await supabase.rpc('increment_cupos', { viaje_id: id });

      return res.json({ message: 'Saliste del viaje.' });
    } catch (err) {
      console.error('Leave error:', err);
      return res.status(500).json({ error: 'Error al salir del viaje.' });
    }
  }

  // ── GET /api/trips/:id — detalle ──────────────────────────────────────────
  if (!action && method === 'GET') {
    try {
      const { data: viaje, error } = await supabase.from('viajes')
        .select(`id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, activo, created_at, pasajeros_minimos, acompanantes,
          profiles:id_creador ( id, nombre, apellido, rating_promedio )`)
        .eq('id', id).single();

      if (error || !viaje) return res.status(404).json({ error: 'Viaje no encontrado.' });

      const { data: participantes } = await supabase.from('participantes')
        .select(`id, estado_pago, created_at,
          profiles:id_usuario ( id, nombre, apellido, rating_promedio, whatsapp )`)
        .eq('id_viaje', id).eq('estado_pago', true);

      const esCreador    = viaje.profiles.id === req.user.id;
      const yaEsPasajero = (participantes || []).some(p => p.profiles.id === req.user.id);
      const puedeVerWA   = esCreador || yaEsPasajero;

      const participantesPublicos = (participantes || []).map(p => ({
        id: p.id, estado_pago: p.estado_pago,
        nombre: p.profiles.nombre, apellido: p.profiles.apellido,
        rating_promedio: p.profiles.rating_promedio,
        whatsapp: puedeVerWA ? p.profiles.whatsapp : null,
        id_usuario: p.profiles.id
      }));

      const creadorPublico = {
        id_usuario: viaje.profiles.id, nombre: viaje.profiles.nombre,
        apellido: viaje.profiles.apellido, rating_promedio: viaje.profiles.rating_promedio,
        whatsapp: null, es_creador: true
      };

      if (puedeVerWA) {
        const { data: cd } = await supabase.from('profiles').select('whatsapp').eq('id', viaje.profiles.id).single();
        if (cd) creadorPublico.whatsapp = cd.whatsapp;
      }

      return res.json({
        ...viaje,
        participantes:   participantesPublicos,
        creador_detalle: creadorPublico,
        puede_unirse:    !esCreador && !yaEsPasajero && viaje.cupos_disponibles > 0 && viaje.activo,
        es_creador:      esCreador,
        ya_es_pasajero:  yaEsPasajero
      });
    } catch (err) {
      console.error('Get trip error:', err);
      return res.status(500).json({ error: 'Error al obtener el viaje.' });
    }
  }

  // ── DELETE /api/trips/:id — cancelar viaje ────────────────────────────────
  if (!action && method === 'DELETE') {
    try {
      const { data: viaje, error } = await supabase.from('viajes')
        .select('id, id_creador').eq('id', id).single();

      if (error || !viaje) return res.status(404).json({ error: 'Viaje no encontrado.' });
      if (viaje.id_creador !== req.user.id) return res.status(403).json({ error: 'Solo el creador puede cancelar.' });

      await supabase.from('viajes').update({ activo: false }).eq('id', id);
      return res.json({ message: 'Viaje cancelado.' });
    } catch (err) {
      console.error('Delete trip error:', err);
      return res.status(500).json({ error: 'Error al cancelar el viaje.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido.' });
});