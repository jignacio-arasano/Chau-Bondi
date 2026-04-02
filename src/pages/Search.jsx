import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import TripCard from '../components/TripCard';

const ZONAS_POR_BARRIO = {
  'Nueva Córdoba': [
    'Patio Olmos', 'Buen Pastor', 'Plaza España', 
    'Farmacity de la Chacabuco', 'Chacabuco e Illia', 
    'Buenos Aires y Estrada', 'Rondeau y Paraná'
  ],
  'Centro': [
    'Patio Olmos', 'Plaza San Martín', 'Terminal T2'
  ],
  'Alberdi': ['Plaza Colón'],
  'General Paz': ['Plaza Alberdi'],
  'Alta Córdoba': ['Plaza Rivadavia'],
  'Zona Sur (Barrio Jardín)': ['Paseo del Jockey'],
  'Zona Norte (Cerro / Urca)': ['Mujer Urbana / Parque de las Naciones']
};

export default function Search() {
  const [searchParams] = useSearchParams();

  const [tipo,   setTipo]   = useState(searchParams.get('tipo') || '');
  const [barrio, setBarrio] = useState(''); // <-- Ahora el estado es el barrio
  const [fecha,  setFecha]  = useState('');
  const [trips,  setTrips]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchTrips() {
      setLoading(true);
      try {
        // Pedimos los viajes a la API (solo filtrando por tipo y fecha para traer todos los de la ciudad)
        const params = {};
        if (tipo)  params.tipo  = tipo;
        if (fecha) params.fecha = fecha;
        
        const data = await api.trips.list(params);
        
        if (isMounted) {
          // Si hay un barrio seleccionado, filtramos los resultados acá mismo
          if (barrio) {
            const lugaresDelBarrio = ZONAS_POR_BARRIO[barrio] || [];
            const viajesFiltrados = data.filter(t => lugaresDelBarrio.includes(t.zona_comun));
            setTrips(viajesFiltrados);
          } else {
            setTrips(data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTrips();

    return () => { isMounted = false; };
  }, [tipo, barrio, fecha]);

  function handleTipo(t) {
    setTipo(prev => prev === t ? '' : t);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page">
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 24px 20px',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 16, fontSize: '1.2rem', letterSpacing: '0.05em' }}>BUSCAR VIAJES</h2>

          <div className="segment" style={{ marginBottom: 12 }}>
            <button className={`segment-btn ${tipo === 'IDA' ? 'active' : ''}`} onClick={() => handleTipo('IDA')}>🎓 Al Campus</button>
            <button className={`segment-btn ${tipo === '' ? 'active' : ''}`} onClick={() => setTipo('')}>Todos</button>
            <button className={`segment-btn ${tipo === 'VUELTA' ? 'active' : ''}`} onClick={() => handleTipo('VUELTA')}>🏠 A casa</button>
          </div>

          {/* Selector de BARRIO limpio */}
          <select className="input" value={barrio} onChange={e => setBarrio(e.target.value)} style={{ marginBottom: 10, fontSize: '0.9rem' }}>
            <option value="">📍 Todos los barrios</option>
            {Object.keys(ZONAS_POR_BARRIO).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input" type="date" value={fecha} min={today} onChange={e => setFecha(e.target.value)} style={{ width: '100%', fontSize: '0.9rem', colorScheme: 'dark' }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="icon">😔</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>SIN RESULTADOS</h3>
            <p>No hay viajes con esos filtros. ¡Publicá el tuyo!</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 14 }}>
              {trips.length} viaje{trips.length !== 1 ? 's' : ''} encontrado{trips.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trips.map(t => <TripCard key={t.id} trip={t} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}