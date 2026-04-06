import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

function Stars({ rating }) {
  const r = Math.round(rating || 5);
  return <span className="stars">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>;
}

function MemberRow({ member }) {
  if (member.es_amigo) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="avatar" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>👤</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text2)' }}>
            {member.nombre} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{member.apellido}</span>
          </div>
        </div>
      </div>
    );
  }

  // 👇 LÓGICA CORREGIDA PARA EL AVATAR (EVITA EL "Vundefined") 👇
  const inicialNombre = member.nombre ? member.nombre[0].toUpperCase() : '';
  const inicialApellido = (member.apellido && member.apellido.length > 0) ? member.apellido[0].toUpperCase() : '';
  const initials = `${inicialNombre}${inicialApellido}`;

  const waLink   = member.whatsapp
    ? `https://wa.me/54${member.whatsapp}?text=${encodeURIComponent('¡Hola! Te escribo por el viaje de ChauBondi 🚌')}`
    : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)'
    }}>
      <div className="avatar">{initials}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {member.nombre} {member.apellido}
          {member.es_creador && (
            <span className="badge badge-green" style={{ marginLeft: 8, fontSize: '0.65rem' }}>Organizador</span>
          )}
        </div>
        <Stars rating={member.rating_promedio} />
      </div>
      {waLink ? (
        <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-sm">WhatsApp</a>
      ) : (
        <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>🔒 Unite para ver</span>
      )}
    </div>
  );
}

export default function TripDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [viaje,   setViaje]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,   setError]   = useState('');
  const [confirm, setConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    api.trips.get(id)
      .then(setViaje)
      .catch(() => setError('Viaje no encontrado.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleJoin() {
    setJoining(true); setError('');
    try {
      await api.trips.join(id); 
      const viajeActualizado = await api.trips.get(id); 
      setViaje(viajeActualizado); 
    } catch (err) { setError(err.message); } 
    finally { setJoining(false); }
  }

  async function handleLeave() {
    if (!confirm) { setConfirm(true); return; }
    setLeaving(true);
    try {
      await api.trips.leave(id); navigate('/', { replace: true });
    } catch (err) { setError(err.message); setLeaving(false); setConfirm(false); }
  }

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      await api.trips.delete(id); navigate('/', { replace: true });
    } catch (err) { setError(err.message); setDeleting(false); setConfirm(false); }
  }
  
  // 👇 LÓGICA NUEVA PARA EL MENSAJE DE WHATSAPP CON FOMO 👇
  function handleShare() {
    const origen = viaje.tipo === 'IDA' ? viaje.zona_comun.split('/')[0].trim() : 'Campus Siglo 21';
    const destino = viaje.tipo === 'IDA' ? 'Campus Siglo 21' : viaje.zona_comun.split('/')[0].trim();
    const horaStr = new Date(viaje.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Cordoba' });
    
    let cuposTexto = '';
    if (viaje.cupos_disponibles >= 3) {
      cuposTexto = `(Quedan ${viaje.cupos_disponibles} lugares libres)`;
    } else if (viaje.cupos_disponibles === 2) {
      cuposTexto = `(⏳ Últimos 2 lugares)`;
    } else if (viaje.cupos_disponibles === 1) {
      cuposTexto = `(🔥 ¡Último lugar!)`;
    }

    const texto = `¡Sumate a mi viaje en ChauBondi! 🚌\n📍 De: ${origen}\n🏁 A: ${destino}\n🕒 Horario: ${horaStr} hs\n🎫 ${cuposTexto}\n\n👉 Reservá tu lugar acá: ${window.location.href}`;

    if (navigator.share) { navigator.share({ title: 'Viaje en ChauBondi', text: texto }).catch(err => console.log('Error', err)); } 
    else { window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank'); }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  if (error && !viaje) return (
    <div className="page">
      <div className="container" style={{ paddingTop: 60, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚫</div>
        <h2>Viaje no encontrado</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: 20 }}>← Volver</button>
      </div>
    </div>
  );

  const { tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, activo,
          profiles, participantes, creador_detalle, pasajeros_minimos, acompanantes,
          puede_unirse, es_creador, ya_es_pasajero } = viaje;

  const fecha = new Date(fecha_hora);
  const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Cordoba' });
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Cordoba' });
  const yaFue = fecha < new Date();

  // MATEMÁTICA CORREGIDA PARA EL DETALLE
  const totalOcupados = 3 - cupos_disponibles;
  const acomps = acompanantes || 0;
  const minRequerido = pasajeros_minimos || 1;
  const pasajerosDeLaApp = totalOcupados - acomps; 
  
  const viajeConfirmado = pasajerosDeLaApp >= minRequerido;
  const faltan = minRequerido - pasajerosDeLaApp;
  const totalGenteConfirmadaEnAuto = 1 + acomps + pasajerosDeLaApp; // El conductor + sus amigos + la app

  const amigosFantasma = Array.from({ length: acomps }).map(() => ({
    es_amigo: true, nombre: 'Amigo/a', apellido: `de ${creador_detalle?.nombre || ''}`,
  }));

  const miembros = [creador_detalle, ...amigosFantasma, ...participantes].filter(Boolean);

  return (
    <div className="page">
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '48px 24px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.4rem', cursor: 'pointer', padding: 0, marginBottom: 16 }}>←</button>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <span className={`badge ${tipo === 'IDA' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '0.8rem' }}>
              {tipo === 'IDA' ? '→ AL CAMPUS' : '← A CASA'}
            </span>
            {!activo && <span className="badge badge-gray">CANCELADO</span>}
            {yaFue  && activo && <span className="badge badge-gray">FINALIZADO</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '3.5rem', color: 'var(--green)', lineHeight: 1 }}>{horaStr}</div>
          <div style={{ color: 'var(--text2)', marginTop: 4, textTransform: 'capitalize' }}>{fechaStr}</div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <h3 style={{ fontSize: '0.75rem', color: 'var(--text2)', letterSpacing: '0.08em', marginBottom: 14 }}>RUTA</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', marginTop: 2 }}>{tipo === 'IDA' ? '📍' : '🎓'}</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600 }}>ORIGEN</div>
                <div style={{ fontWeight: 600 }}>{tipo === 'IDA' ? zona_comun : 'Campus Siglo 21'}</div>
                {tipo === 'IDA' && <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{barrio}</div>}
              </div>
            </div>
            <div style={{ marginLeft: 14, color: 'var(--border2)' }}>│</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', marginTop: 2 }}>{tipo === 'IDA' ? '🎓' : '📍'}</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600 }}>DESTINO</div>
                <div style={{ fontWeight: 600 }}>{tipo === 'IDA' ? 'Campus Siglo 21' : zona_comun}</div>
                {tipo === 'VUELTA' && <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{barrio}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.75rem', color: 'var(--text2)', letterSpacing: '0.08em', marginBottom: 12 }}>
            GRUPO ({totalOcupados + 1}/4)
          </h3>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= totalOcupados ? 'var(--green)' : 'var(--border2)' }} />
            ))}
          </div>

          {miembros.map((m, i) => <MemberRow key={i} member={m} />)}

          {cupos_disponibles > 0 && Array.from({ length: cupos_disponibles }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', opacity: 0.4 }}>
              <div className="avatar" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>?</div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>Lugar disponible</span>
            </div>
          ))}
        </div>

        {activo && !yaFue && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            <div style={{ marginBottom: '4px' }}>
              {viajeConfirmado ? (
                <div className="alert alert-success" style={{ fontSize: '0.82rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span>✅ <strong>¡Viaje Confirmado!</strong></span>
                  <button onClick={() => setShowInfo(!showInfo)} style={{ background:'none', border:'none', marginLeft:6, cursor:'pointer', fontSize:'1rem' }}>ℹ️</button>
                </div>
              ) : (
                <div className="alert alert-warning" style={{ fontSize: '0.82rem', textAlign: 'center', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span>⏳ <strong>Esperando gente:</strong> Faltan {faltan} persona{faltan > 1 ? 's' : ''} más.</span>
                  <button onClick={() => setShowInfo(!showInfo)} style={{ background:'none', border:'none', marginLeft:6, cursor:'pointer', fontSize:'1rem' }}>ℹ️</button>
                </div>
              )}
              
              {showInfo && (
                <div className="fade-up" style={{ marginTop: '8px', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
                  {viajeConfirmado 
                    ? "✅ Este viaje ya alcanzó el mínimo de pasajeros para salir, ¡pero aún se pueden sumar más! En ChauBondi un auto puede ir lleno con 4 personas, o salir con menos si el conductor así lo decidió."
                    : `⏳ Este viaje está pendiente. Tiene ${totalGenteConfirmadaEnAuto} persona(s) confirmadas en el auto y quedan ${cupos_disponibles} lugares libres. El organizador definió que necesita al menos ${faltan} pasajero(s) más de la app para estar apto para salir.`
                  }
                </div>
              )}
            </div>

            {(es_creador || ya_es_pasajero) && cupos_disponibles > 0 && (
              <button className="btn btn-whatsapp btn-full" onClick={handleShare} style={{ marginBottom: '8px' }}>📲 Invitar compañeros por WhatsApp</button>
            )}

            {puede_unirse && (
              <button className="btn btn-primary btn-full" onClick={handleJoin} disabled={joining}>
                {joining ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Uniéndote al grupo…</> : '🤝 Unirme al viaje'}
              </button>
            )}

            {ya_es_pasajero && (
              confirm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>⚠️ ¿Seguro que querés salir? Dejarás a tu grupo con un lugar vacío.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancelar</button>
                    <button className="btn btn-danger" onClick={handleLeave} disabled={leaving}>{leaving ? 'Saliendo…' : 'Sí, salir'}</button>
                  </div>
                </div>
              ) : <button className="btn btn-danger" onClick={() => setConfirm(true)}>Salir del viaje</button>
            )}

            {es_creador && (
              confirm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>⚠️ ¿Cancelar el viaje? Los pasajeros que ya se unieron quedarán sin grupo.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setConfirm(false)}>No, mantenerlo</button>
                    <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Cancelando…' : 'Sí, cancelar'}</button>
                  </div>
                </div>
              ) : <button className="btn btn-danger" onClick={() => setConfirm(true)}>Cancelar viaje</button>
            )}
          </div>
        )}

        {(!activo || yaFue) && (
          <div className="alert" style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            {!activo ? '❌ Este viaje fue cancelado.' : '✅ Este viaje ya se realizó.'}
          </div>
        )}
      </div>
    </div>
  );
}
