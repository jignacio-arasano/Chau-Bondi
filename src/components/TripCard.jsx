import { Link } from 'react-router-dom';

const ZONAS_EMOJI = {
  'Patio Olmos / Buen Pastor / Plaza España': '🏛️',
  'Plaza San Martín / Terminal T2': '🚌',
  'Plaza Colón': '🌳',
  'Plaza Alberdi': '🌿',
  'Mujer Urbana / Parque de las Naciones': '🏔️',
  'Paseo del Jockey': '🏇',
  'Plaza Rivadavia': '⛪'
};

function Stars({ rating }) {
  const r = Math.round(rating || 5);
  return (
    <span className="stars">
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
    </span>
  );
}

function SlotDots({ disponibles }) {
  const ocupados = 3 - disponibles;
  return (
    <div className="slots">
      {[0,1,2].map(i => (
        <div key={i} className={`slot ${i < ocupados ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

export default function TripCard({ trip }) {
  const { id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, profiles } = trip;

  const fecha    = new Date(fecha_hora);
  const hoy      = new Date();
  const esHoy    = fecha.toDateString() === hoy.toDateString();
  const manana   = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  const esManana = fecha.toDateString() === manana.toDateString();

  const diaLabel = esHoy
    ? 'HOY'
    : esManana
    ? 'MAÑANA'
    : fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();

  const hora = fecha.toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'America/Argentina/Cordoba'
  });

  const emoji = ZONAS_EMOJI[zona_comun] || '📍';

  return (
    <Link to={`/trip/${id}`} className="trip-card fade-up">
      {/* Header: tipo + fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className={`badge ${tipo === 'IDA' ? 'badge-green' : 'badge-orange'}`}>
            {tipo === 'IDA' ? '→ AL CAMPUS' : '← A CASA'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: '1.6rem',
            lineHeight: 1,
            color: 'var(--green)'
          }}>{hora}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text2)', fontWeight: 600, marginTop: 2 }}>
            {diaLabel}
          </div>
        </div>
      </div>

      {/* Zona */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, paddingBottom: 12,
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{zona_comun.split('/')[0].trim()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{barrio}</div>
        </div>
      </div>

      {/* Footer: creador + cupos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {profiles && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
              {profiles.nombre[0]}{profiles.apellido[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                {profiles.nombre} {profiles.apellido[0]}.
              </div>
              <Stars rating={profiles.rating_promedio} />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlotDots disponibles={cupos_disponibles} />
          <span style={{
            fontSize: '0.8rem',
            color: cupos_disponibles === 0 ? 'var(--text3)' : 'var(--green)',
            fontWeight: 600
          }}>
            {cupos_disponibles === 0 ? 'LLENO' : `${cupos_disponibles} libre${cupos_disponibles !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
