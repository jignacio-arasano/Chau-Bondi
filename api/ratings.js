const supabase = require('./_lib/db');
const { withAuth } = require('./_lib/middleware');

module.exports = withAuth(async (req, res) => {
  const path   = req.url.split('?')[0].replace(/^\/api\/ratings/, '') || '/';
  const method = req.method;

  // ── GET /api/ratings/pending ───────────────────────────────────────────────
  if (path === '/pending' && method === 'GET') {
    try {
      const dosHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const { data: creados } = await supabase.from('viajes')
        .select('id, tipo, zona_comun, barrio, fecha_hora')
        .eq('id_creador', req.user.id)
        .lte('fecha_hora', dosHorasAtras);

      const { data: unido } = await supabase.from('participantes')
        .select('id_viaje, viajes:id_viaje ( id, tipo, zona_comun, barrio, fecha_hora )')
        .eq('id_usuario', req.user.id).eq('estado_pago', true);

      const viajesUnido = (unido || [])
        .map(p => p.viajes)
        .filter(v => v && new Date(v.fecha_hora) <= new Date(dosHorasAtras));

      const todos = [...(creados || []), ...viajesUnido];
      const pendientes = [];

      for (const viaje of todos) {
        const { data: parts } = await supabase.from('participantes')
          .select('id_usuario').eq('id_viaje', viaje.id).eq('estado_pago', true);
        const { data: vData } = await supabase.from('viajes')
          .select('id_creador').eq('id', viaje.id).single();

        const todos_ids = [vData?.id_creador, ...(parts || []).map(p => p.id_usuario)]
          .filter(id => id && id !== req.user.id);

        const { data: yaCalif } = await supabase.from('ratings')
          .select('id_calificado').eq('id_viaje', viaje.id).eq('id_calificador', req.user.id);

        const calificados  = (yaCalif || []).map(r => r.id_calificado);
        const sinCalificar = todos_ids.filter(id => !calificados.includes(id));

        if (sinCalificar.length > 0) {
          const { data: profiles } = await supabase.from('profiles')
            .select('id, nombre, apellido').in('id', sinCalificar);
          pendientes.push({ viaje, sinCalificar: profiles || [] });
        }
      }

      return res.json(pendientes);
    } catch (err) {
      console.error('Pending ratings error:', err);
      return res.status(500).json({ error: 'Error al obtener calificaciones pendientes.' });
    }
  }

  // ── POST /api/ratings ──────────────────────────────────────────────────────
  if (path === '/' && method === 'POST') {
    try {
      const { id_viaje, id_calificado, puntuacion } = req.body || {};

      if (!id_viaje || !id_calificado || !puntuacion)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5)
        return res.status(400).json({ error: 'La puntuación debe ser entre 1 y 5.' });
      if (id_calificado === req.user.id)
        return res.status(400).json({ error: 'No podés calificarte a vos mismo.' });

      const { data: viaje } = await supabase.from('viajes')
        .select('id, fecha_hora, id_creador').eq('id', id_viaje).single();
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado.' });

      const dosPlusHoras = new Date(new Date(viaje.fecha_hora).getTime() + 2 * 60 * 60 * 1000);
      if (new Date() < dosPlusHoras)
        return res.status(400).json({ error: 'Solo podés calificar 2 horas después del horario de salida.' });

      const esCreador = viaje.id_creador === req.user.id;
      let participo = esCreador;
      if (!esCreador) {
        const { data: p } = await supabase.from('participantes').select('id')
          .eq('id_viaje', id_viaje).eq('id_usuario', req.user.id).eq('estado_pago', true).single();
        participo = !!p;
      }
      if (!participo)
        return res.status(403).json({ error: 'Solo pueden calificar quienes participaron del viaje.' });

      const { data: rating, error: rErr } = await supabase.from('ratings')
        .insert({ id_viaje, id_calificador: req.user.id, id_calificado, puntuacion })
        .select().single();

      if (rErr) {
        if (rErr.code === '23505') return res.status(409).json({ error: 'Ya calificaste a este usuario en este viaje.' });
        throw rErr;
      }

      const { data: allRatings } = await supabase.from('ratings')
        .select('puntuacion').eq('id_calificado', id_calificado);
      if (allRatings?.length > 0) {
        const promedio = +(allRatings.reduce((s, r) => s + r.puntuacion, 0) / allRatings.length).toFixed(2);
        await supabase.from('profiles')
          .update({ rating_promedio: promedio, rating_count: allRatings.length }).eq('id', id_calificado);
      }

      return res.status(201).json({ message: '¡Calificación enviada!', rating });
    } catch (err) {
      console.error('Rating error:', err);
      return res.status(500).json({ error: 'Error al enviar la calificación.' });
    }
  }

  return res.status(404).json({ error: 'Ruta no encontrada.' });
});
