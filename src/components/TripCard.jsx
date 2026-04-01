import { Link } from 'react-router-dom';

const ZONAS_EMOJI = {
  'Patio Olmos': '🛍️',
  'Buen Pastor': '⛪',
  'Plaza España': '🏛️',
  'Plaza San Martín': '🗽',
  'Terminal T2': '🚌',
  'Plaza Colón': '🌳',
  'Plaza Alberdi': '🌿',
  'Mujer Urbana / Parque de las Naciones': '🏔️',
  'Paseo del Jockey': '🏇',
  'Plaza Rivadavia': '⛪'
};

function Stars({ rating }) {
  const r = Math.round(rating || 5);
  return <span className="stars">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>;
}

export default function TripCard({ trip }) {
  const { id, tipo, zona_comun, barrio, fecha_hora, cupos_disponibles, profiles, pasajeros_minimos } = trip;
  
  const fecha = new Date(fecha_hora);
  
  // Extraemos solo el número de día (ej: "26") y el mes abreviado (ej: "mar")
  const diaNum = fecha.getDate();
  const mesAbr = fecha.toLocaleDateString('es-AR', { month: 'short', timeZone: 'America/Argentina/Cordoba' });
  
  const horaStr = fecha.toLocaleTimeString('es-AR', { 
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Cordoba' 
  });
  
  const esIda = tipo === 'IDA';
  
  // Emoji según zona (fallback al genérico si no lo encuentra)
  const zonaLimpia = zona_comun.split('/')[0].trim();
  const icon = ZONAS_EMOJI[zonaLimpia] || (esIda ? '📍' : '🎓');

  // Lógica del mínimo de pasajeros
  const totalOcupados = 3 - cupos_disponibles;
  const minRequerido = pasajeros_minimos || 1;
  const viajeConfirmado = totalOcupados >= minRequerido;

  return (
    <Link to={`/trip/${id}`} className="card trip-card" style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}>
      
      {/* Columna Izquierda: Fecha y Hora */}
      <div style={{
        minWidth: 70, padding: '16px 12px',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg3)', borderTopLeftRadius: 14, borderBottomLeftRadius: 14
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1 }}>{diaNum}</div>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 8 }}>{mesAbr}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--green)' }}>{horaStr}</div>
      </div>

      {/* Columna Derecha: Detalles */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* Origen/Destino */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: '1.4rem', marginTop: 2 }}>{icon}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${esIda ? 'badge-green' : 'badge-orange'}`} style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                {esIda ? 'IDA' : 'VUELTA'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{zona_comun}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: 4 }}>
              {barrio}
            </div>
          </div>
        </div>

        {/* Creador y Cupos */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 12, borderTop: '1px solid var(--border)'
        }}>
          {/* Creador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar avatar-sm">
              {profiles?.nombre?.[0]}{profiles?.apellido?.[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{profiles?.nombre}</div>
              <Stars rating={profiles?.rating_promedio} />
            </div>
          </div>

          {/* Cupos y Condición */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                {cupos_disponibles}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>libres</span>
            </div>
            
            {/* 👇 LA NUEVA ETIQUETA 👇 */}
            <div style={{ marginTop: '2px' }}>
              {viajeConfirmado ? (
                <span style={{ fontSize: '0.65rem', color: 'var(--green)', fontWeight: 600 }}>
                  ✓ Confirmado
                </span>
              ) : (
                <span style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 600 }}>
                  Sale con {minRequerido + 1}
                </span>
              )}
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
}