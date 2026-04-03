import { Link } from 'react-router-dom';

const ZONAS_EMOJI = {
  'Patio Olmos': '🛍️',
  'Buen Pastor': '⛪',
  'Plaza España': '🏛️',
  'Plaza San Martín': '🗽',
  'Terminal T2': '🚌',
  'Plaza Colón': '🌳',
  'Plaza Alberdi': '🌿',
  'Mujer Urbana': '🏔️',
  'Paseo del Jockey': '🏇',
  'Plaza Rivadavia': '⛪',
  'Farmacity de la Chacabuco': '💊',
  'Chacabuco e Illia': '📍',
  'Buenos Aires y Estrada': '📍',
  'Rondeau y Paraná': '📍'
};

// 👇 NUEVO COMPONENTE DE ESTRELLAS: Mucho más compacto y moderno (estilo Uber)
function CompactStars({ rating }) {
  const r = Number(rating || 5).toFixed(1);
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFB800', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
      ★ <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{r}</span>
    </span>
  );
}

export default function TripCard({ trip }) {
  const { id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, profiles, pasajeros_minimos, acompanantes } = trip;
  
  const fecha = new Date(fecha_hora);
  const diaNum = fecha.getDate();
  const mesAbr = fecha.toLocaleDateString('es-AR', { month: 'short', timeZone: 'America/Argentina/Cordoba' });
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Cordoba' });
  
  const esIda = tipo === 'IDA';
  const zonaLimpia = zona_comun.split('/')[0].trim();
  const icon = ZONAS_EMOJI[zonaLimpia] || (esIda ? '📍' : '🎓');

  // Matemática de confirmación
  const acomps = acompanantes || 0;
  const minRequerido = pasajeros_minimos || 1;
  const pasajerosDeLaApp = (3 - cupos_disponibles) - acomps; 
  
  const viajeConfirmado = pasajerosDeLaApp >= minRequerido;
  const totalNecesarios = 1 + acomps + minRequerido;

  // 👇 UI DE CUPOS: Ajustada para la esquina superior derecha
  let cuposUI;
  if (cupos_disponibles >= 3) {
    cuposUI = (
      <div style={{ textAlign: 'right', lineHeight: 1 }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{cupos_disponibles} </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>libres</span>
      </div>
    );
  } else if (cupos_disponibles === 2) {
    cuposUI = (
      <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--orange)' }}>⏳ ÚLTIMOS 2</span>
      </div>
    );
  } else if (cupos_disponibles === 1) {
    cuposUI = (
      <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--red)' }}>🔥 ¡ÚLTIMO!</span>
      </div>
    );
  }

  // Agregamos padding: 0 y overflow: hidden para que la tarjeta se arme desde los bordes
  return (
    <Link to={`/trip/${id}`} className="card trip-card" style={{ display: 'flex', padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
      
      {/* ── COLUMNA IZQUIERDA: Fecha y Hora ── */}
      <div style={{
        minWidth: 72, padding: '16px 8px', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg3)'
      }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1 }}>{diaNum}</div>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 8, marginTop: 2 }}>{mesAbr}</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--green)' }}>{horaStr}</div>
      </div>

      {/* ── COLUMNA DERECHA: Contenido Principal ── */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* PARTE SUPERIOR: Ruta + Cupos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          
          {/* Ruta */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ fontSize: '1.4rem', marginTop: 2 }}>{icon}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className={`badge ${esIda ? 'badge-green' : 'badge-orange'}`} style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                  {esIda ? 'IDA' : 'VUELTA'}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.2 }}>{zona_comun}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 4, lineHeight: 1.3 }}>
                {barrio}
              </div>
            </div>
          </div>

          {/* Cupos (Esquina sup. derecha) */}
          <div style={{ marginLeft: 8, flexShrink: 0 }}>
            {cuposUI}
          </div>

        </div>

        {/* PARTE INFERIOR: Creador + Condición (Separados por una línea sutil) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          
          {/* Creador y Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', border: '1px solid var(--border2)' }}>
              {profiles?.nombre?.[0]}{profiles?.apellido?.[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1 }}>{profiles?.nombre}</div>
              <CompactStars rating={profiles?.rating_promedio} />
            </div>
          </div>

          {/* Condición de Salida (Alineada a la derecha, con espacio para respirar) */}
          <div style={{ textAlign: 'right', maxWidth: '55%' }}>
            {viajeConfirmado ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, color: 'var(--green)' }}>
                <span style={{ fontSize: '0.8rem' }}>✓</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Confirmado</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                {totalNecesarios >= 4 ? 'Sale si se llena' : `Puede salir con ${totalNecesarios}`}
              </span>
            )}
          </div>
          
        </div>
      </div>
    </Link>
  );
}